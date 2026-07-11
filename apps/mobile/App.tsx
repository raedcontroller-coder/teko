import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View, BackHandler, Modal, Text, Image, Pressable, StyleSheet } from 'react-native';
import { setAuthToken } from './src/services/api';
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

// Telas do Admin
import { AdminDashboardScreen } from './src/screens/admin/AdminDashboardScreen';
import { PsychologistsScreen } from './src/screens/admin/PsychologistsScreen';
import { AdminReportsScreen } from './src/screens/admin/AdminReportsScreen';
import { NewPsychologistScreen } from './src/screens/admin/NewPsychologistScreen';
import { PsychologistProfileScreen } from './src/screens/admin/PsychologistProfileScreen';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authScreen, setAuthScreen] = useState<'Login' | 'Register'>('Login');
  
  // Roteamento
  const [currentTab, setCurrentTab] = useState<TabName>('Dashboard');
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [activeAlunoId, setActiveAlunoId] = useState<string | null>(null);
  
  // Contexto Admin
  const [adminSelectedPsicologo, setAdminSelectedPsicologo] = useState<{ id: string, name: string } | null>(null);

  const [showExitModal, setShowExitModal] = useState<boolean>(false);

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

  const handleLogout = (dest: 'Login' | 'Register') => {
    setAuthToken(null);
    setCurrentUser(null);
    setIsAuthenticated(false);
    setAuthScreen(dest);
    setCurrentTab('Dashboard'); // reset state
  };

  if (!isAuthenticated) {
    if (authScreen === 'Login') {
      return (
        <View style={{ flex: 1 }}>
          <StatusBar style="light" />
          <LoginScreen 
            onLoginSuccess={(token, user) => {
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
      <View style={{ flex: 1 }}>
        <StatusBar style="light" />
        <RegisterScreen 
          onRegisterSuccess={(token, user) => {
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

  // Se houver um jogo ativo, renderiza o jogo em tela cheia (sem TabBar)
  if (activeGame && activeAlunoId) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
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
    <View style={{ flex: 1, backgroundColor: '#084D48' }}>
      <StatusBar style="light" />
      <GlobalHeader user={currentUser} />
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
            <Text style={styles.modalTitle}>Sair do Aplicativo?</Text>
            <Text style={styles.modalSubtitle}>Tem certeza que deseja encerrar o aplicativo?</Text>
            
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
                  <Text style={[styles.btnSairText, pressed && styles.btnSairTextHover]}>Sair</Text>
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
                  <Text style={[styles.btnFicarText, pressed && styles.btnTextHover]}>Ficar</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    borderRadius: 32,
    paddingVertical: 48,
    paddingHorizontal: 32,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: '#0F6A63', // Teko Green
  },
  modalLogoWrapper: {
    alignSelf: 'center',
    marginBottom: 32,
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#2e2a1e',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  modalLogo: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 32,
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    gap: 16,
  },
  btnSair: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#FFC857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnSairHover: {
    borderColor: '#7B61FF',
    backgroundColor: 'transparent',
  },
  btnSairText: {
    color: '#FFC857',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnSairTextHover: {
    color: '#7B61FF',
  },
  btnFicar: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#FFC857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnFicarHover: {
    backgroundColor: '#7B61FF',
  },
  btnFicarText: {
    color: '#181c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  btnTextHover: {
    color: '#FFF',
  }
});
