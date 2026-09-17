import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Svg, { Rect, Path, Circle, Polygon, G, ClipPath, Defs } from 'react-native-svg';
import { useTranslation, Language } from '../i18n';
import { theme } from '../theme/theme';

// Bandeira rústica/elegante do Brasil (SVG)
const BrazilFlagSvg: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <Svg width={size} height={size * 0.7} viewBox="0 0 20 14" fill="none">
    <Rect width="20" height="14" rx="2" fill="#009B3A" />
    <Polygon points="10,2 18,7 10,12 2,7" fill="#FEDF00" />
    <Circle cx="10" cy="7" r="3" fill="#002776" />
    <Path d="M7.5 7.5 C9 6.5, 11 6.5, 12.5 7.5" stroke="#FFFFFF" strokeWidth="0.6" fill="none" />
  </Svg>
);

// Bandeira rústica/elegante dos EUA (SVG)
const UsaFlagSvg: React.FC<{ size?: number }> = ({ size = 18 }) => (
  <Svg width={size} height={size * 0.7} viewBox="0 0 20 14" fill="none">
    <Rect width="20" height="14" rx="2" fill="#B22234" />
    <Path d="M0 2.15H20M0 4.3H20M0 6.45H20M0 8.6H20M0 10.75H20M0 12.9H20" stroke="#FFFFFF" strokeWidth="1.07" />
    <Rect width="8" height="7.53" fill="#3C3B6E" rx="1" />
    <Circle cx="2.5" cy="2.2" r="0.6" fill="#FFFFFF" />
    <Circle cx="5.5" cy="2.2" r="0.6" fill="#FFFFFF" />
    <Circle cx="4" cy="3.8" r="0.6" fill="#FFFFFF" />
    <Circle cx="2.5" cy="5.4" r="0.6" fill="#FFFFFF" />
    <Circle cx="5.5" cy="5.4" r="0.6" fill="#FFFFFF" />
  </Svg>
);

export const LanguageSelector: React.FC = () => {
  const { language, setLanguage } = useTranslation();

  const handleToggle = (targetLang: Language) => {
    if (language !== targetLang) {
      setLanguage(targetLang);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.flagButton,
          language === 'pt' && styles.activeFlag,
        ]}
        onPress={() => handleToggle('pt')}
        activeOpacity={0.7}
      >
        <BrazilFlagSvg size={18} />
        <Text style={[styles.langText, language === 'pt' && styles.activeLangText]}>PT</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[
          styles.flagButton,
          language === 'en' && styles.activeFlag,
        ]}
        onPress={() => handleToggle('en')}
        activeOpacity={0.7}
      >
        <UsaFlagSvg size={18} />
        <Text style={[styles.langText, language === 'en' && styles.activeLangText]}>EN</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.full,
    padding: 3,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.subtle,
  },
  flagButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    gap: 5,
  },
  activeFlag: {
    backgroundColor: theme.colors.badgePurple,
  },
  langText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.textMuted,
  },
  activeLangText: {
    color: theme.colors.badgePurpleText,
  },
});
