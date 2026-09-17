export const theme = {
  colors: {
    bg: '#F3EDE0',             // Fundo Bege Acolhedor / Warm Beige
    primary: '#084D48',        // Deep Emerald
    primaryLight: '#0D766E',   // Teal intermediário
    primaryDark: '#04322E',    // Emerald escuro
    tealSoft: '#E2F0EC',       // Fundo de card mint/teal suave
    tealMint: '#CDECE3',       // Destaque mint claro
    badgePurple: '#EFE7FC',    // Fundo de pílula lilás (Psicólogo / Papéis)
    badgePurpleText: '#7C3AED',// Texto da pílula lilás
    purpleSoft: '#F3EEFF',     // Lilás sutil
    cardBg: '#FCFAF6',         // Card bege claro contrastante
    cardBorder: '#E5DEC9',     // Borda bege suave neutra
    textDark: '#1C2942',       // Texto principal de alto contraste
    textMuted: '#5A6E85',      // Texto secundário/subtítulos
    textLight: '#F3EDE0',      // Texto claro sobre escuro
    accentOrange: '#E07A5F',   // Alerta / Atenção
    accentGreen: '#2A9D8F',    // Sucesso / Concluído
    shadowColor: '#1A2E2B',    // Cor de sombra suave e natural
  },
  typography: {
    fontFamily: 'System',      // Fallback nativo
    fontSize: {
      xs: 11,
      sm: 13,
      md: 15,
      lg: 18,
      xl: 22,
      xxl: 26,
    },
    fontWeight: {
      regular: '400' as const,
      medium: '500' as const,
      semibold: '600' as const,
      bold: '700' as const,
      heavy: '800' as const,
    },
  },
  radii: {
    xs: 6,
    sm: 10,
    md: 16,
    lg: 24,
    xl: 32,
    full: 9999,
  },
  shadows: {
    subtle: {
      shadowColor: '#1A2E2B',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 8,
      elevation: 2,
    },
    card: {
      shadowColor: '#084D48',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.07,
      shadowRadius: 14,
      elevation: 4,
    },
    floating: {
      shadowColor: '#04322E',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.12,
      shadowRadius: 20,
      elevation: 10,
    },
  },
};
