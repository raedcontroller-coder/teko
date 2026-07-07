import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
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
  
  // Contexto Admin
  const [adminSelectedPsicologo, setAdminSelectedPsicologo] = useState<{ id: string, name: string } | null>(null);

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
  if (activeGame) {
    return (
      <View style={{ flex: 1 }}>
        <StatusBar style="auto" />
        {activeGame === 'Goleiro' && <GoleiroGame onBack={() => setActiveGame(null)} />}
        {activeGame === 'GoNoGo' && <GoNoGoGame onBack={() => setActiveGame(null)} />}
        {activeGame === 'Puzzle' && <FotografoGame onBack={() => setActiveGame(null)} />}
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
        return <GamesScreen onSelectGame={(gameId) => setActiveGame(gameId)} />;
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
    </View>
  );
}
