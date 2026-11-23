// Design tokens taken from the Stitch project "MamAmie Maternal Wellness App".
export const Colors = {
  primary: '#8b4850',
  onPrimary: '#ffffff',
  primaryContainer: '#a86068',
  primaryFixed: '#ffdadc',
  primaryFixedDim: '#ffb2b9',
  onPrimaryFixed: '#3a0812',

  secondary: '#57633e',
  onSecondary: '#ffffff',
  secondaryContainer: '#d8e5b7',
  onSecondaryContainer: '#5b6742',
  secondaryFixed: '#dbe8ba',
  onSecondaryFixed: '#151f03',

  tertiary: '#76525c',
  onTertiary: '#ffffff',
  tertiaryFixed: '#ffd9e1',
  tertiaryFixedDim: '#e9bbc5',
  onTertiaryFixed: '#2e131b',
  onTertiaryFixedVariant: '#5f3d46',

  error: '#ba1a1a',
  errorContainer: '#ffdad6',
  onErrorContainer: '#93000a',

  surface: '#f7f9ff',
  surfaceTint: '#8d4a52',
  surfaceVariant: '#d6e4f5',
  surfaceContainerLowest: '#ffffff',
  surfaceContainerLow: '#edf4ff',
  surfaceContainer: '#e3efff',
  surfaceContainerHigh: '#dceafb',
  surfaceContainerHighest: '#d6e4f5',
  onSurface: '#0f1d29',
  onSurfaceVariant: '#534344',
  outline: '#857374',
  outlineVariant: '#d7c1c2',
  inverseSurface: '#25323e',
  inverseOnSurface: '#e8f2ff',

  logoCream: '#fff7e6',
};

export const Fonts = {
  regular: 'PlusJakartaSans_400Regular',
  medium: 'PlusJakartaSans_500Medium',
  semibold: 'PlusJakartaSans_600SemiBold',
  bold: 'PlusJakartaSans_700Bold',
  italic: 'PlusJakartaSans_600SemiBold_Italic',
};

// Type scale from the Stitch design system.
export const Type = {
  display: { fontFamily: Fonts.bold, fontSize: 34, lineHeight: 41, letterSpacing: -0.7 },
  headlineLg: { fontFamily: Fonts.bold, fontSize: 24, lineHeight: 30, letterSpacing: -0.24 },
  headlineMd: { fontFamily: Fonts.semibold, fontSize: 20, lineHeight: 25, letterSpacing: -0.2 },
  headlineSm: { fontFamily: Fonts.semibold, fontSize: 17, lineHeight: 22, letterSpacing: -0.1 },
  bodyLg: { fontFamily: Fonts.regular, fontSize: 17, lineHeight: 24 },
  bodyMd: { fontFamily: Fonts.regular, fontSize: 15, lineHeight: 21 },
  bodySm: { fontFamily: Fonts.regular, fontSize: 13, lineHeight: 18 },
  labelLg: { fontFamily: Fonts.semibold, fontSize: 14, lineHeight: 18, letterSpacing: 0.14 },
  labelMd: { fontFamily: Fonts.semibold, fontSize: 12, lineHeight: 16, letterSpacing: 0.24 },
  labelSm: { fontFamily: Fonts.medium, fontSize: 11, lineHeight: 13, letterSpacing: 0.33 },
};

export const Space = { xs: 4, sm: 8, md: 16, lg: 24, xl: 32, margin: 20 };

export const Radius = { sm: 16, md: 20, lg: 32, full: 9999 };

export const Shadow = {
  card: {
    shadowColor: '#2d3a47',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 20,
    elevation: 2,
  },
  sm: {
    shadowColor: '#0f1d29',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  primary: {
    shadowColor: '#8b4850',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 18,
    elevation: 6,
  },
};
