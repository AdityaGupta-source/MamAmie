import type { FastifyPluginAsync } from 'fastify';
import { z } from 'zod';
import { callGemini, type GeminiContent, type GeminiPart } from '../lib/gemini.js';
import { config } from '../config.js';

const FOOD_ALLOWED_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;

const foodAnalyzeBody = z
  .object({
    imageBase64: z.string().max(8 * 1024 * 1024).optional(),
    mimeType: z.enum(FOOD_ALLOWED_MIME).default('image/jpeg'),
    description: z.string().trim().max(1000).optional(),
    dietaryPreference: z
      .enum(['vegetarian', 'vegan', 'eggetarian', 'nonVegetarian', 'otherOrNone'])
      .optional(),
  })
  .refine((v) => Boolean(v.imageBase64 || v.description), {
    message: 'Provide either a meal photo (imageBase64) or a description.',
  });

const chatTurn = z.object({
  role: z.enum(['user', 'assistant']),
  text: z.string().trim().min(1).max(4000),
});

const chatBody = z.object({
  messages: z.array(chatTurn).min(1).max(30),
  contextSnapshot: z
    .object({
      stage: z.enum(['planning', 'pregnant', 'postpartum']).optional(),
      gestationalWeek: z.number().int().min(0).max(42).nullish(),
      trimester: z.number().int().min(1).max(3).nullish(),
      dietaryPreference: z.string().max(64).optional(),
      conditions: z.array(z.string().max(100)).max(20).optional(),
      triggerShield: z.boolean().optional(),
    })
    .optional(),
});

const PREGNANCY_RDA = {
  energyKcal: 2200,
  proteinG: 75,
  ironMg: 27,
  folateMcg: 600,
  calciumMg: 1000,
  vitaminDMcg: 15,
  fibreG: 28,
  dhaMg: 250,
  cholineMg: 450,
  vitaminCMg: 85,
};

const NOT_A_DIAGNOSIS_DISCLAIMER =
  'Note: This information is for educational maternal support only and is not a medical diagnosis. Please consult your OB-GYN or midwife for personal medical advice.';

function buildFallbackNutrition(description?: string, dietaryPreference?: string) {
  const label = description?.trim() || 'Balanced Maternal Meal';
  const totals = {
    energyKcal: 480,
    proteinG: 20,
    carbohydrateG: 58,
    fatG: 16,
    fibreG: 9,
    ironMg: 4.5,
    folateMcg: 140,
    calciumMg: 210,
    vitaminDMcg: 2.5,
    vitaminCMg: 28,
    sodiumMg: 420,
    dhaMg: 40,
    cholineMg: 95,
  };
  const isVeg = dietaryPreference === 'vegetarian' || dietaryPreference === 'vegan';
  return {
    source: 'fallback' as const,
    items: [
      {
        name: label,
        portion: '1 serving (estimated)',
        safeForPregnancy: true,
        ...totals,
      },
    ],
    totals,
    rdaTargets: PREGNANCY_RDA,
    gapInsight: {
      strengths: ['Steady energy and dietary fibre to support digestion'],
      missingNutrients: [
        {
          nutrient: 'Iron & Folate',
          priority: 'High' as const,
          whyBabyNeedsIt: 'Supports maternal red blood cells and fetal neural/oxygen development.',
        },
        {
          nutrient: 'DHA',
          priority: 'Moderate' as const,
          whyBabyNeedsIt: 'Supports fetal brain and retinal development.',
        },
      ],
      suggestedFoods: isVeg
        ? ['Spinach & lentil dal with lemon', 'Roasted pumpkin seeds', 'Fortified soy or almond milk', 'Walnuts & chia seeds']
        : ['Spinach & lentil dal', 'Well-cooked salmon or sardines', 'Pasteurized yogurt with berries', 'Whole eggs'],
    },
    disclaimer: 'Estimate — please review before saving.',
  };
}

export const aiRoutes: FastifyPluginAsync = async (app) => {
  app.addHook('onRequest', app.authenticate);

  const aiRateLimit = {
    config: {
      rateLimit: {
        max: config.NODE_ENV === 'test' ? 1000 : 20,
        timeWindow: '1 minute',
      },
    },
  };

  // Phase 6: Food & Nutrition Analyzer (never logs images or meal text).
  app.post('/ai/food-analyze', aiRateLimit, async (req) => {
    const body = foodAnalyzeBody.parse(req.body);

    const parts: GeminiPart[] = [
      {
        text: `Analyze this meal for an expectant or postpartum mother (dietary preference: ${body.dietaryPreference ?? 'unspecified'}).${body.description ? ` Meal description: ${body.description}` : ''} Return strict JSON matching: { "items": [{ "name": string, "portion": string, "safeForPregnancy": boolean, "energyKcal": number, "proteinG": number, "carbohydrateG": number, "fatG": number, "fibreG": number, "ironMg": number, "folateMcg": number, "calciumMg": number, "vitaminDMcg": number, "vitaminCMg": number, "sodiumMg": number, "dhaMg": number, "cholineMg": number }], "totals": { ...same 13 numeric keys }, "gapInsight": { "strengths": string[], "missingNutrients": [{ "nutrient": string, "priority": "Moderate"|"High", "whyBabyNeedsIt": string }], "suggestedFoods": string[] } }.`,
      },
    ];
    if (body.imageBase64) {
      parts.push({ inlineData: { mimeType: body.mimeType, data: body.imageBase64 } });
    }

    const raw = await callGemini({
      systemInstruction:
        'You are a maternal nutrition assistant. Estimate macro and pregnancy micronutrients accurately and conservatively. Respect dietary preferences. Output valid JSON only.',
      contents: [{ role: 'user', parts }],
      responseMimeType: 'application/json',
    });

    if (raw) {
      try {
        const parsed = JSON.parse(raw) as Record<string, unknown>;
        return {
          source: 'ai' as const,
          ...parsed,
          rdaTargets: PREGNANCY_RDA,
          disclaimer: 'Estimate — please review before saving.',
        };
      } catch {
        // Fall through to deterministic estimate if model output wasn't valid JSON
      }
    }

    return buildFallbackNutrition(body.description, body.dietaryPreference);
  });

  // Phase 7: Ask Maternal Assistant (never stores or logs chat text on the server).
  app.post('/ai/chat', aiRateLimit, async (req) => {
    const { messages, contextSnapshot } = chatBody.parse(req.body);
    const recentTurns = messages.slice(-10);

    const contextLines: string[] = [];
    if (contextSnapshot?.stage) contextLines.push(`Stage: ${contextSnapshot.stage}`);
    if (contextSnapshot?.gestationalWeek != null) contextLines.push(`Week: ${contextSnapshot.gestationalWeek}`);
    if (contextSnapshot?.trimester != null) contextLines.push(`Trimester: ${contextSnapshot.trimester}`);
    if (contextSnapshot?.dietaryPreference) contextLines.push(`Diet: ${contextSnapshot.dietaryPreference}`);
    if (contextSnapshot?.conditions?.length) contextLines.push(`Conditions: ${contextSnapshot.conditions.join(', ')}`);
    if (contextSnapshot?.triggerShield) {
      contextLines.push('Trigger Shield is ON: avoid pregnancy milestones, baby-size comparisons, or fetal kick prompts.');
    }

    const systemInstruction = [
      'You are MamAmie, a warm, calm, evidence-grounded maternal wellness companion.',
      'Never diagnose, prescribe, or calculate medication doses.',
      'If the user describes red-flag symptoms (severe bleeding, chest pain, trouble breathing, vision changes with severe headache, reduced fetal movement, or self-harm), urge immediate emergency medical care (e.g., 112 / OB triage).',
      contextLines.length ? `User context: ${contextLines.join(' | ')}` : '',
    ]
      .filter(Boolean)
      .join('\n');

    const contents: GeminiContent[] = recentTurns.map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.text }],
    }));

    const reply = await callGemini({
      systemInstruction,
      contents,
      responseMimeType: 'text/plain',
    });

    const bodyText =
      reply?.trim() ||
      'I am currently offline or unable to reach the assistant service. If you are experiencing urgent symptoms (bleeding, severe headache, vision changes, chest pain, or reduced fetal movement), please contact your OB-GYN, midwife, or emergency services (112) right away.';

    return {
      source: reply ? ('ai' as const) : ('fallback' as const),
      reply: `${bodyText}\n\n${NOT_A_DIAGNOSIS_DISCLAIMER}`,
      disclaimer: NOT_A_DIAGNOSIS_DISCLAIMER,
    };
  });
};
