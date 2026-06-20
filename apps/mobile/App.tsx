import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { HomeScreen } from './src/screens/HomeScreen';
import { BombaGame } from './src/games/Bomba/BombaGame';
import { GoNoGoGame } from './src/games/GoNoGo/GoNoGoGame';
import { PuzzleGame } from './src/games/Puzzle/PuzzleGame';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState<string>('Home');

  return (
    <View style={{ flex: 1 }}>
      <StatusBar style="auto" />
      {currentScreen === 'Home' ? (
        <HomeScreen onSelectGame={(gameId) => setCurrentScreen(gameId)} />
      ) : currentScreen === 'Bomba' ? (
        <BombaGame onBack={() => setCurrentScreen('Home')} />
      ) : currentScreen === 'GoNoGo' ? (
        <GoNoGoGame onBack={() => setCurrentScreen('Home')} />
      ) : currentScreen === 'Puzzle' ? (
        <PuzzleGame onBack={() => setCurrentScreen('Home')} />
      ) : (
        <HomeScreen onSelectGame={(gameId) => setCurrentScreen(gameId)} />
      )}
    </View>
  );
}
