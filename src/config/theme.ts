/**
 * Canvas-side mirror of the design tokens in src/styles/tokens.css.
 * PixiJS cannot read CSS variables cheaply every frame, so the few colours
 * the renderer needs are duplicated here (keep both files in sync).
 */
export const THEME = {
  color: {
    gold400: 0xd4af37,
    ink950: 0x0a0907,
    white: 0xffffff,
  },
  /**
   * Random shape colours: hue is fully random (task requirement),
   * saturation / lightness are constrained so every colour reads well
   * on the dark stage and sits nicely next to the gold UI.
   */
  shapeColor: {
    saturation: [55, 85] as const,
    lightness: [52, 68] as const,
  },
} as const;
