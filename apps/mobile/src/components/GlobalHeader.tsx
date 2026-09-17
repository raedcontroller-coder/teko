import React from 'react';
import { View, Text, StyleSheet, Image, Platform, StatusBar, TouchableOpacity } from 'react-native';
import { Bell } from 'lucide-react-native';
import { theme } from '../theme/theme';
import { useTranslation } from '../i18n';
import { LanguageSelector } from './LanguageSelector';

interface GlobalHeaderProps {
  user: any;
  onProfilePress?: () => void;
  onNotificationPress?: () => void;
}

export const GlobalHeader: React.FC<GlobalHeaderProps> = ({ user, onProfilePress }) => {
  const { t } = useTranslation();

  const roleDisplay = user?.role === 'GLOBAL_ADMIN' ? t.roles.GLOBAL_ADMIN :
                      user?.role === 'PSICOLOGO' ? t.roles.PSICOLOGO :
                      user?.role === 'FAMILIAR' ? t.roles.FAMILIAR : t.roles.USER;

  const userName = user?.name ? user.name.split(' ')[0] : 'Maria';

  return (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        {/* Lado Esquerdo: Saudações e Avatar/Perfil do Usuário */}
        <TouchableOpacity 
          style={styles.profileSection} 
          onPress={onProfilePress} 
          activeOpacity={0.8}
          disabled={!onProfilePress}
        >
          <View style={styles.avatarContainer}>
            <Image 
              source={user?.avatarUrl ? { uri: user.avatarUrl } : require('../../assets/icon.jpg')} 
              style={styles.avatarImage} 
              resizeMode="cover" 
            />
          </View>
          <View style={styles.userInfo}>
            <Text style={styles.userName}>{t.common.hello}, {userName}</Text>
            <View style={styles.roleBadge}>
              <Text style={styles.roleText}>{roleDisplay}</Text>
            </View>
          </View>
        </TouchableOpacity>

        {/* Lado Direito: Seletor de Idioma (Bandeiras SVG) */}
        <View style={styles.rightSection}>
          <LanguageSelector />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'android' ? (StatusBar.currentHeight || 24) + 12 : 52,
    paddingBottom: 14,
    backgroundColor: theme.colors.bg,
    zIndex: 40,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLogoImage: {
    width: 90,
    height: 32,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  notificationBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: theme.colors.cardBg,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.subtle,
  },
  notificationAura: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.badgePurpleText,
  },
  profileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userInfo: {
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  userName: {
    color: theme.colors.textDark,
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  roleBadge: {
    backgroundColor: theme.colors.badgePurple,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 999,
    marginTop: 3,
  },
  roleText: {
    color: theme.colors.badgePurpleText,
    fontSize: 10,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: theme.colors.tealSoft,
    overflow: 'hidden',
    backgroundColor: theme.colors.cardBg,
    ...theme.shadows.subtle,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
});
