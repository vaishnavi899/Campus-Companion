export const DEFAULT_FONT_WEIGHTS = ["400", "500", "600", "700"];

export function extractFontFamily(fontFamilyValue: string | undefined): string | null {
  if (!fontFamilyValue) return null;
  const firstFont = fontFamilyValue.split(",")[0].trim();
  const cleanFont = firstFont.replace(/['"]/g, "");
  const systemFonts = [
    "ui-sans-serif", "ui-serif", "ui-monospace", "system-ui",
    "sans-serif", "serif", "monospace", "cursive", "fantasy",
    "-apple-system", "BlinkMacSystemFont"
  ];
  if (systemFonts.includes(cleanFont.toLowerCase())) {
    return null;
  }
  return cleanFont;
}

export function buildFontCssUrl(family: string, weights: string[] = DEFAULT_FONT_WEIGHTS): string {
  const encodedFamily = encodeURIComponent(family);
  const weightsParam = weights.join(";");
  return `https://fonts.googleapis.com/css2?family=${encodedFamily}:wght@${weightsParam}&display=swap`;
}

export function loadGoogleFont(family: string, weights: string[] = DEFAULT_FONT_WEIGHTS): void {
  if (typeof document === "undefined") return;

  const href = buildFontCssUrl(family, weights);
  const existing = document.querySelector(`link[href="${href}"]`);
  if (existing) return;

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = href;
  document.head.appendChild(link);
}