import { Colors } from '../../constants/theme';

// Calendar dot / icon colours per entry category (Stitch palette plus a few warm accents).
export const CATEGORY_COLORS = {
  appointment: Colors.primary,
  test: Colors.tertiary,
  medication: Colors.secondary,
  symptom: Colors.primaryFixedDim,
  food: '#d08b4a',
  journal: '#7b8fb0',
  photo: Colors.outline,
  milestone: '#d9a400',
  task: '#a3b37a',
};

export const categoryColor = (key) => CATEGORY_COLORS[key] || Colors.outline;

// Icons sit on light tints, so the paler dot colours get a darker stand-in.
const ICON_OVERRIDES = { task: Colors.secondary, symptom: Colors.primaryContainer };
export const categoryIconColor = (key) => ICON_OVERRIDES[key] || categoryColor(key);
