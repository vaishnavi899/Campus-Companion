import { useEffect, useMemo } from "react";
import { useThemeStore } from "../stores/theme-store";
import { extractFontFamily, loadGoogleFont, DEFAULT_FONT_WEIGHTS } from "../utils/fonts";

export function DynamicFontLoader() {
  const { themeState } = useThemeStore();

  const fontSans = themeState.styles.light["font-sans"];
  const fontSerif = themeState.styles.light["font-serif"];
  const fontMono = themeState.styles.light["font-mono"];

  const currentFonts = useMemo(() => {
    return {
      sans: fontSans,
      serif: fontSerif,
      mono: fontMono,
    } as const;
  }, [fontSans, fontSerif, fontMono]);

  useEffect(() => {
    try {
      Object.entries(currentFonts).forEach(([_type, fontValue]) => {
        const fontFamily = extractFontFamily(fontValue);
        if (fontFamily) {
          loadGoogleFont(fontFamily, DEFAULT_FONT_WEIGHTS);
        }
      });
    } catch (e) {
      console.warn("DynamicFontLoader: Failed to load Google fonts:", e);
    }
  }, [currentFonts]);

  return null;
}