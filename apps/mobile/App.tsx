import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, BackHandler, Modal, Text, Image, Pressable, StyleSheet, ActivityIndicator } from 'react-native';
import { setAuthToken, setupInterceptors } from './src/services/api';
import { GlobalHeader } from './src/components/GlobalHeader';
import { BottomTabBar, TabName } from './src/components/BottomTabBar';
import { DashboardScreen } from './src/screens/main/DashboardScreen';
import { GamesScreen } from './src/screens/GamesScreen';
import { PatientsScreen } from './src/screens/main/PatientsScreen';
import { ProfileScreen } from './src/screens/main/ProfileScreen';
import { GoleiroGame } from './src/games/Goleiro/GoleiroGame';
import { GoNoGoGame } from './src/games/GoNoGo/GoNoGoGame';
import { FotografoGame } from './src/games/Fotografo/FotografoGame';
import { LoginScreen } from './src/screens/auth/LoginScreen';
import { RegisterScreen } from './src/screens/auth/RegisterScreen';
import { AgendaScreen } from './src/screens/main/AgendaScreen';

// Telas do Admin
import { AdminDashboardScreen } from './src/screens/admin/AdminDashboardScreen';
import { PsychologistsScreen } from './src/screens/admin/PsychologistsScreen';
import { AdminReportsScreen } from './src/screens/admin/AdminReportsScreen';
import { NewPsychologistScreen } from './src/screens/admin/NewPsychologistScreen';
import { PsychologistProfileScreen } from './src/screens/admin/PsychologistProfileScreen';

import { SafeAreaProvider } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from './src/theme/theme';
import { LanguageProvider, useTranslation } from './src/i18n';

function MainApp() {
  const { t } = useTranslation();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authScreen, setAuthScreen] = useState<'Login' | 'Register'>('Login');
  const [isRestoringAuth, setIsRestoringAuth] = useState<boolean>(true);
  
  // Roteamento
  const [currentTab, setCurrentTab] = useState<TabName>('Dashboard');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [activeAlunoId, setActiveAlunoId] = useState<string | null>(null);
  
  // Contexto Admin
  const [adminSelectedPsicologo, setAdminSelectedPsicologo] = useState<{ id: string, name: string } | null>(null);

  const [showExitModal, setShowExitModal] = useState<boolean>(false);

  React.useEffect(() => {
    setupInterceptors(() => {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setAuthScreen('Login');
      setCurrentTab('Dashboard');
    });
  }, []);

  React.useEffect(() => {
    const restoreAuth = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('userToken');
        const storedUser = await AsyncStorage.getItem('userData');
        if (storedToken && storedUser) {
          const user = JSON.parse(storedUser);
          setAuthToken(storedToken);
          setCurrentUser(user);
          setCurrentTab(user?.role === 'GLOBAL_ADMIN' ? 'AdminDashboard' : 'Dashboard');
          setIsAuthenticated(true);
        }
      } catch (e) {
        console.error('Failed to restore auth', e);
      } finally {
        setIsRestoringAuth(false);
      }
    };
    restoreAuth();
  }, []);

  React.useEffect(() => {
    const backAction = () => {
      if (isAuthenticated && !activeGame) {
        setShowExitModal(true);
        return true; 
      }
      return false; 
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction,
    );

    return () => backHandler.remove();
  }, [isAuthenticated, activeGame]);

  const handleLogout = async (dest: 'Login' | 'Register') => {
    await AsyncStorage.removeItem('userToken');
    await AsyncStorage.removeItem('userData');
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthScreen(dest);
    setCurrentTab('Dashboard');
  };

  if (isRestoringAuth) {
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center' }}>
        <StatusBar style="dark" />
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  if (!isAuthenticated) {
    if (authScreen === 'Login') {
      return (
        <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
          <StatusBar style="dark" />
          <LoginScreen 
            onLoginSuccess={async (token, user) => {
              await AsyncStorage.setItem('userToken', token);
              await AsyncStorage.setItem('userData', JSON.stringify(user));
              setAuthToken(token);
              setCurrentUser(user);
              setCurrentTab(user?.role === 'GLOBAL_ADMIN' ? 'AdminDashboard' : 'Dashboard');
              setIsAuthenticated(true);
            }} 
            onNavigateToRegister={() => setAuthScreen('Register')} 
          />
        </View>
      );
    }
    return (
      <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
        <StatusBar style="dark" />
        <RegisterScreen 
          onRegisterSuccess={async (token, user) => {
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userData', JSON.stringify(user));
            setAuthToken(token);
            setCurrentUser(user);
            setCurrentTab(user?.role === 'GLOBAL_ADMIN' ? 'AdminDashboard' : 'Dashboard');
            setIsAuthenticated(true);
          }} 
          onNavigateToLogin={() => setAuthScreen('Login')} 
        />
      </View>
    );
  }

  // Se houver um jogo ativo, renderiza o jogo em tela cheia imersiva (sem TabBar e sem alterar gameplay)
  if (activeGame && activeAlunoId) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        {activeGame === 'Goleiro' && <GoleiroGame alunoId={activeAlunoId} onBack={() => { setActiveGame(null); setActiveAlunoId(null); }} />}
        {activeGame === 'GoNoGo' && <GoNoGoGame alunoId={activeAlunoId} onBack={() => { setActiveGame(null); setActiveAlunoId(null); }} />}
        {activeGame === 'Puzzle' && <FotografoGame alunoId={activeAlunoId} onBack={() => { setActiveGame(null); setActiveAlunoId(null); }} />}
      </View>
    );
  }

  // Main Layout com TabBar
  const renderTabContent = () => {
    switch (currentTab) {
      case 'Dashboard':
        return <DashboardScreen onNavigateToPatients={() => setCurrentTab('Patients')} />;
      case 'Patients':
        return <PatientsScreen />;
      case 'Agenda':
        return <AgendaScreen />;
      
      // Admin Tabs
      case 'AdminDashboard':
        return <AdminDashboardScreen 
                 onNavigateToPsychologists={() => setCurrentTab('Psychologists')} 
                 onNavigateToNewPsychologist={() => setCurrentTab('NewPsychologist')}
               />;
      case 'Psychologists':
        return <PsychologistsScreen 
                 onNavigateToNewPsychologist={() => setCurrentTab('NewPsychologist')} 
                 onNavigateToAdminPatients={(psiId, psiName) => {
                   setAdminSelectedPsicologo({ id: psiId, name: psiName });
                   setCurrentTab('AdminPatients');
                 }}
                 onNavigateToAdminPsychologistProfile={(psiId, psiName) => {
                   setAdminSelectedPsicologo({ id: psiId, name: psiName });
                   setCurrentTab('AdminPsychologistProfile');
                 }}
               />;
      case 'NewPsychologist':
        return <NewPsychologistScreen onGoBack={() => setCurrentTab('Psychologists')} />;
      case 'AdminReports':
        return <AdminReportsScreen />;
      case 'AdminPatients':
        return <PatientsScreen 
                 adminPsicologoId={adminSelectedPsicologo?.id} 
                 adminPsicologoName={adminSelectedPsicologo?.name}
                 onGoBack={() => {
                   setAdminSelectedPsicologo(null);
                   setCurrentTab('Psychologists');
                 }}
               />;
      case 'AdminPsychologistProfile':
        if (!adminSelectedPsicologo) return <PsychologistsScreen />;
        return <PsychologistProfileScreen 
                 psicologoId={adminSelectedPsicologo.id}
                 onGoBack={() => {
                   setAdminSelectedPsicologo(null);
                   setCurrentTab('Psychologists');
                 }}
               />;

      // Common Tabs
      case 'Games':
        return <GamesScreen userRole={currentUser?.role} onSelectGame={(gameId, alunoId) => { setActiveGame(gameId); setActiveAlunoId(alunoId); }} />;
      case 'Profile':
        return <ProfileScreen 
                 onLogout={handleLogout} 
                 onUserUpdate={(newUserData) => setCurrentUser((prev: any) => ({ ...prev, ...newUserData }))} 
               />;
      default:
        return currentUser?.role === 'GLOBAL_ADMIN' 
          ? <AdminDashboardScreen 
              onNavigateToPsychologists={() => setCurrentTab('Psychologists')} 
              onNavigateToNewPsychologist={() => setCurrentTab('NewPsychologist')}
            /> 
          : <DashboardScreen onNavigateToPatients={() => setCurrentTab('Patients')} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>
      <StatusBar style="dark" />
      <GlobalHeader user={currentUser} onProfilePress={() => setCurrentTab('Profile')} />
      <View style={{ flex: 1 }}>
        {renderTabContent()}
      </View>
      <BottomTabBar currentTab={currentTab} onTabPress={setCurrentTab} userRole={currentUser?.role} />

      <Modal
        visible={showExitModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowExitModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalLogoWrapper}>
              <Image source={require('./assets/icon.jpg')} style={styles.modalLogo} />
            </View>
            <Text style={styles.modalTitle}>{t.common.exitTitle}</Text>
            <Text style={styles.modalSubtitle}>{t.common.exitSubtitle}</Text>
            
            <View style={styles.modalButtons}>
              <Pressable 
                style={({ pressed }) => [
                  styles.btnSair,
                  pressed && styles.btnSairHover
                ]}
                onPress={() => {
                  handleLogout('Login');
                  setShowExitModal(false);
                  BackHandler.exitApp();
                }}
              >
                {({ pressed }) => (
                  <Text style={[styles.btnSairText, pressed && styles.btnSairTextHover]}>{t.common.exitConfirm}</Text>
                )}
              </Pressable>

              <Pressable 
                style={({ pressed }) => [
                  styles.btnFicar,
                  pressed && styles.btnFicarHover
                ]}
                onPress={() => setShowExitModal(false)}
              >
                {({ pressed }) => (
                  <Text style={[styles.btnFicarText, pressed && styles.btnTextHover]}>{t.common.exitCancel}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <LanguageProvider>
        <MainApp />
      </LanguageProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: theme.radii.xl,
    paddingVertical: 36,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.cardBg,
    ...theme.shadows.floating,
  },
  modalLogoWrapper: {
    alignSelf: 'center',
    marginBottom: 20,
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 2,
    borderColor: theme.colors.tealSoft,
    backgroundColor: theme.colors.cardBg,
    ...theme.shadows.subtle,
    overflow: 'hidden',
  },
  modalLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalTitle: {
    color: theme.colors.textDark,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 12,
  },
  btnSair: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.tealSoft,
  },
  btnSairHover: {
    backgroundColor: theme.colors.badgePurple,
  },
  btnSairText: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '700',
  },
  btnSairTextHover: {
    color: theme.colors.badgePurpleText,
  },
  btnFicar: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  btnFicarHover: {
    backgroundColor: theme.colors.primaryDark,
  },
  btnFicarText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  btnTextHover: {
    color: '#FFF',
  }
});
