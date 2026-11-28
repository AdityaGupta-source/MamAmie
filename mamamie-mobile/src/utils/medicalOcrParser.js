/**
 * Method A: Smart Medical OCR Parser
 * Extracts structured maternal vitals from raw OCR text blocks using
 * keyword-aware regexes and clinical range validation (filtering out dates & reference ranges).
 */

export const SAMPLE_LAB_REPORT_TEXT = `MATERNAL SANCTUARY CLINIC
Prenatal Lab & Vitals Summary
Patient: Sophia M. (Week 24)
BP: 122 / 78 mmHg
Maternal Pulse: 76 bpm
Fasting Blood Glucose: 94 mg/dL (Ref: 70-99 mg/dL)
Hemoglobin (Hb): 11.8 g/dL (Ref: 11.0-14.0 g/dL)`;

function isRangeNumber(text, matchIndex, matchLength) {
  const after = text.slice(matchIndex + matchLength, matchIndex + matchLength + 6);
  const before = text.slice(Math.max(0, matchIndex - 6), matchIndex);
  // Ignore numbers that are part of a reference range like "70-99" or "70 to 99"
  return /^\s*(?:-|–|to\b)/i.test(after) || /(?:-|–|to)\s*$/i.test(before);
}

export function parseMedicalOcrText(rawText) {
  const text = (rawText || '').replace(/\r/g, '\n');
  const result = {
    systolic: null,
    diastolic: null,
    heartRate: null,
    bloodSugar: null,
    hemoglobin: null,
    detectedFields: [],
  };

  if (!text.trim()) {
    return result;
  }

  // 1. Blood Pressure (e.g., "BP: 118/76 mmHg", "Blood Pressure 122 / 78")
  const bpPatterns = [
    /(?:blood\s*pressure|b\.?\s*p\.?|sys\s*\/\s*dia)[:\s-]*(\d{2,3})\s*[/\\]\s*(\d{2,3})/i,
    /(\d{2,3})\s*[/\\]\s*(\d{2,3})\s*mm\s*hg/i,
    /\b(\d{2,3})\s*[/\\]\s*(\d{2,3})\b/g,
  ];

  for (const pattern of bpPatterns) {
    if (pattern.global) {
      let m;
      while ((m = pattern.exec(text)) !== null) {
        const sys = parseInt(m[1], 10);
        const dia = parseInt(m[2], 10);
        if (sys >= 70 && sys <= 220 && dia >= 40 && dia <= 140 && sys > dia) {
          result.systolic = String(sys);
          result.diastolic = String(dia);
          break;
        }
      }
    } else {
      const m = text.match(pattern);
      if (m) {
        const sys = parseInt(m[1], 10);
        const dia = parseInt(m[2], 10);
        if (sys >= 70 && sys <= 220 && dia >= 40 && dia <= 140 && sys > dia) {
          result.systolic = String(sys);
          result.diastolic = String(dia);
        }
      }
    }
    if (result.systolic && result.diastolic) {
      result.detectedFields.push('bloodPressure');
      break;
    }
  }

  // 2. Heart Rate / Maternal Pulse (e.g., "Pulse: 74 bpm", "HR 78")
  const hrPatterns = [
    /(?:maternal\s*pulse|heart\s*rate|pulse|h\.?\s*r\.?|p\.?\s*r\.?)[:\s-]*(\d{2,3})\b/i,
    /\b(\d{2,3})\s*(?:bpm|beats\s*\/\s*min)\b/i,
  ];
  for (const pattern of hrPatterns) {
    const m = text.match(pattern);
    if (m) {
      const hr = parseInt(m[1], 10);
      if (hr >= 40 && hr <= 200) {
        result.heartRate = String(hr);
        result.detectedFields.push('heartRate');
        break;
      }
    }
  }

  // 3. Fasting Glucose / Blood Sugar (e.g., "Fasting Blood Glucose: 92 mg/dL")
  const glucosePattern = /(?:fasting\s*(?:blood\s*)?(?:glucose|sugar)|f\.?\s*b\.?\s*s\.?|blood\s*glucose|blood\s*sugar|glucose|sugar)[:\s-]*(\d{2,3})(?:\.\d+)?\b/gi;
  let gm;
  while ((gm = glucosePattern.exec(text)) !== null) {
    if (isRangeNumber(text, gm.index, gm[0].length)) continue;
    const val = parseInt(gm[1], 10);
    if (val >= 40 && val <= 450) {
      result.bloodSugar = String(val);
      result.detectedFields.push('bloodSugar');
      break;
    }
  }
  if (!result.bloodSugar) {
    const mgdlMatch = text.match(/\b(\d{2,3})\s*mg\s*\/\s*dl\b/i);
    if (mgdlMatch && !isRangeNumber(text, mgdlMatch.index, mgdlMatch[0].length)) {
      const val = parseInt(mgdlMatch[1], 10);
      if (val >= 40 && val <= 450) {
        result.bloodSugar = String(val);
        result.detectedFields.push('bloodSugar');
      }
    }
  }

  // 4. Hemoglobin (e.g., "Hemoglobin (Hb): 11.8 g/dL")
  const hbPattern = /(?:ha?emoglobin|hgb|hb)(?:\s*\([^)]*\))?[:\s-]*(\d{1,2}(?:\.\d{1,2})?)\b/gi;
  let hm;
  while ((hm = hbPattern.exec(text)) !== null) {
    if (isRangeNumber(text, hm.index, hm[0].length)) continue;
    const val = parseFloat(hm[1]);
    if (val >= 5.0 && val <= 20.0) {
      result.hemoglobin = String(val);
      result.detectedFields.push('hemoglobin');
      break;
    }
  }

  return result;
}
