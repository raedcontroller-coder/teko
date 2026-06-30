import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, SafeAreaView, ScrollView } from 'react-native';
import { Home, Users, Gamepad2, User, BarChart2 } from 'lucide-react-native';

export type TabName = 'Dashboard' | 'Patients' | 'Games' | 'Profile' | 'AdminDashboard' | 'Psychologists' | 'AdminReports' | 'NewPsychologist' | 'AdminPatients' | 'AdminPsychologistProfile';

interface BottomTabBarProps {
  currentTab: TabName;
  onTabPress: (tab: TabName) => void;
  userRole?: string;
}

export const BottomTabBar: React.FC<BottomTabBarProps> = ({ currentTab, onTabPress, userRole }) => {
  const isGlobalAdmin = userRole === 'GLOBAL_ADMIN';

  const psychTabs: { name: TabName; label: string; Icon: any }[] = [
    { name: 'Dashboard', label: 'Início', Icon: Home },
    { name: 'Patients', label: 'Pacientes', Icon: Users },
    { name: 'Games', label: 'Jogos', Icon: Gamepad2 },
    { name: 'Profile', label: 'Perfil', Icon: User },
  ];

  const adminTabs: { name: TabName; label: string; Icon: any }[] = [
    { name: 'AdminDashboard', label: 'Início', Icon: Home },
    { name: 'Psychologists', label: 'Profissionais', Icon: Users },
    { name: 'AdminReports', label: 'Dados', Icon: BarChart2 },
    { name: 'Games', label: 'Jogos', Icon: Gamepad2 },
    { name: 'Profile', label: 'Perfil', Icon: User },
  ];

  const tabs = isGlobalAdmin ? adminTabs : psychTabs;

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ScrollView 
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.scrollContent, !isGlobalAdmin && { flex: 1, justifyContent: 'space-around' }]}
        >
          {tabs.map((tab) => {
            const isActive = currentTab === tab.name;
            const iconColor = isActive ? '#181c1c' : 'rgba(255,246,227,0.8)';
            const textColor = isActive ? '#181c1c' : 'rgba(255,246,227,0.8)';

            return (
              <TouchableOpacity
                key={tab.name}
                style={styles.tab}
                onPress={() => onTabPress(tab.name)}
                activeOpacity={0.7}
              >
                <View style={[styles.pill, isActive && styles.pillActive]}>
                  <tab.Icon color={iconColor} size={24} strokeWidth={isActive ? 2.5 : 2} />
                  <Text style={[styles.label, { color: textColor, fontWeight: isActive ? 'bold' : '500' }]}>
                    {tab.label}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: 'transparent',
  },
  container: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#0D766E',
    paddingBottom: Platform.OS === 'android' ? 24 : 24,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  scrollContent: {
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 8,
  },
  tab: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pill: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    paddingVertical: 6,
    borderRadius: 100,
    overflow: 'hidden',
  },
  pillActive: {
    backgroundColor: '#FFC857', // Apenas a cor muda, as dimensões são estáticas
  },
  label: {
    fontSize: 12,
    marginTop: 2,
  },
});
