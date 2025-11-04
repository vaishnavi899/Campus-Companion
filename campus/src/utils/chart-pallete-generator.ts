import { oklch, interpolate, formatHex, wcagContrast } from 'culori';

/**
 * Generates an equidistant color palette by interpolating between two colors in OKLCH color space.
 *
 * This function creates a smooth gradient of colors between two specified endpoints,
 * ensuring perceptually uniform color transitions by using the OKLCH color space,
 * which is designed to better match human color perception.
 *
 * @param {string} color0 - The starting color in hex format (e.g., '#ff0000' for red)
 * @param {string} color1 - The ending color in hex format (e.g., '#0000ff' for blue)
 * @param {number} n - The number of colors to generate in the palette (must be >= 2)
 *
 * @returns {string[]} An array of n colors in hex format, including the start and end colors
 *
 * @example
 * // Generate a 5-color palette from red to blue
 * const palette = generateEquidistantPalette('#ff0000', '#0000ff', 5);
 * // Returns: ['#ff0000', '#d43aff', '#a64eff', '#6d5cff', '#0000ff']
 *
 * @example
 * // Generate a 3-color palette from yellow to green
 * const palette = generateEquidistantPalette('#ffff00', '#00ff00', 3);
 * // Returns: ['#ffff00', '#80ff00', '#00ff00']
 */
export function generateEquidistantPaletteFrom2Colors(color0: string, color1: string, n: number): string[] {
  // Create an interpolator in OKLCH space
  const interp = interpolate([color0, color1], 'oklch');

  let palette: string[] = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    palette.push(formatHex(interp(t)));
  }
  return palette;
}

/**
 * Generates an equidistant color palette from a single base color by rotating hue in OKLCH color space.
 *
 * This function creates a harmonious color palette by keeping the lightness and chroma of the base
 * color constant while rotating through different hues. It ensures all generated colors meet a
 * minimum contrast ratio against the specified background, making the palette accessible according
 * to WCAG (Web Content Accessibility Guidelines) standards.
 *
 * The function automatically adjusts lightness values if a color doesn't meet the minimum contrast
 * requirement, incrementally increasing lightness until the contrast threshold is satisfied or
 * a maximum number of attempts is reached.
 *
 * @param {string} baseColor - The starting color in hex format (e.g., '#3b82f6')
 * @param {string} background - The background color to test contrast against (e.g., '#ffffff')
 * @param {number} n - The number of colors to generate in the palette
 * @param {number} [minContrast=4.5] - Minimum contrast ratio to maintain (default: 4.5 for WCAG AA normal text)
 *
 * @returns {string[]} An array of n colors in hex format with adequate contrast against the background
 *
 * @example
 * // Generate a 5-color palette from blue, ensuring contrast against white background
 * const palette = generateEquidistantPaletteFrom1Color('#3b82f6', '#ffffff', 5);
 * // Returns 5 colors with evenly distributed hues, all readable on white
 *
 * @example
 * // Generate a 3-color palette with stricter AAA contrast (7:1)
 * const palette = generateEquidistantPaletteFrom1Color('#ff5733', '#000000', 3, 7);
 * // Returns 3 colors meeting AAA contrast standards
 *
 * @remarks
 * WCAG Contrast Requirements:
 * - AA Level: ≥ 4.5:1 for normal text, ≥ 3:1 for large text
 * - AAA Level: ≥ 7:1 for normal text, ≥ 4.5:1 for large text
 *
 * The function makes up to 10 attempts to adjust lightness for contrast compliance.
 * Colors that cannot meet the minimum contrast will be returned at their maximum adjusted lightness.
 */
export function generateEquidistantPaletteWithContrast(baseColor: string, background: string, n: number, minContrast = 4.5): string[] {
  const base = oklch(baseColor);

  let palette = [formatHex(base)];

  const step = 360 / n; // hue shift step

  for (let i = 1; i < n; i++) {
    let c = {
      mode: 'oklch',
      l: base.l,
      c: base.c,
      h: (base.h + i * step) % 360
    };

    let hex = formatHex(c);

    // Loop to boost lightness until minimum contrast is met
    let attempts = 0;
    while (wcagContrast(hex, background) < minContrast && attempts < 10) {
      c.l = Math.min(1, c.l + 0.05); // increment lightness
      hex = formatHex(c);
      attempts++;
    }

    palette.push(hex);
  }

  return palette;
}
