import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Home, Users, Gamepad2, User, BarChart2, Calendar } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { theme } from '../theme/theme';
import { useTranslation } from '../i18n';

export type TabName = 'Dashboard' | 'Patients' | 'Agenda' | 'Games' | 'Profile' | 'AdminDashboard' | 'Psychologists' | 'AdminReports' | 'NewPsychologist' | 'AdminPatients' | 'AdminPsychologistProfile' | 'AdminAgenda';

interface BottomTabBarProps {
  currentTab: TabName;
  onTabPress: (tab: TabName) => void;
  userRole?: string;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ currentTab, onTabPress, userRole }) => {
  const { t } = useTranslation();
  const isGlobalAdmin = userRole === 'GLOBAL_ADMIN';
  const insets = useSafeAreaInsets();

  const psychTabs: { name: TabName; label: string; Icon: any }[] = [
    { name: 'Dashboard', label: t.tabs.dashboard, Icon: Home },
    { name: 'Patients', label: t.tabs.patients, Icon: Users },
    { name: 'Agenda', label: t.tabs.agenda, Icon: Calendar },
    { name: 'Games', label: t.tabs.games, Icon: Gamepad2 },
    { name: 'Profile', label: t.tabs.profile, Icon: User },
  ];

  const adminTabs: { name: TabName; label: string; Icon: any }[] = [
    { name: 'AdminDashboard', label: t.tabs.dashboard, Icon: Home },
    { name: 'Psychologists', label: t.tabs.psychologists, Icon: Users },
    { name: 'AdminReports', label: t.tabs.reports, Icon: BarChart2 },
    { name: 'Games', label: t.tabs.games, Icon: Gamepad2 },
    { name: 'Profile', label: t.tabs.profile, Icon: User },
  ];

  const tabs = isGlobalAdmin ? adminTabs : psychTabs;

  return (
    <View style={[styles.outerContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
      <View style={styles.floatingBar}>
        {tabs.map((tab) => {
          const isActive = currentTab === tab.name;
          const iconColor = isActive ? theme.colors.primary : theme.colors.textMuted;
          const textColor = isActive ? theme.colors.primary : theme.colors.textMuted;

          return (
            <TouchableOpacity
              key={tab.name}
              style={styles.tabItem}
              onPress={() => onTabPress(tab.name)}
              activeOpacity={0.75}
            >
              <View style={[styles.pill, isActive && styles.pillActive]}>
                <tab.Icon color={iconColor} size={20} strokeWidth={isActive ? 2.4 : 1.8} />
                <Text 
                  numberOfLines={1} 
                  adjustsFontSizeToFit 
                  minimumFontScale={0.8}
                  style={[styles.label, { color: textColor, fontWeight: isActive ? '700' : '500' }]}
                >
                  {tab.label}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    zIndex: 50,
  },
  floatingBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.full,
    paddingHorizontal: 8,
    paddingVertical: 6,
    width: '100%',
    maxWidth: 420,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.floating,
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    paddingVertical: 7,
    borderRadius: theme.radii.lg,
    width: '100%',
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillActive: {
    backgroundColor: theme.colors.tealSoft,
    borderColor: theme.colors.tealMint,
    ...theme.shadows.subtle,
  },
  label: {
    fontSize: 10,
    marginTop: 2,
    letterSpacing: -0.1,
  },
});
