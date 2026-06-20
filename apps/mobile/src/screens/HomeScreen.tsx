import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Bomb, Lock, Puzzle, Gamepad2, Sparkles } from 'lucide-react-native';

interface HomeScreenProps {
  onSelectGame: (gameId: string) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectGame }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.header}>
          <View style={styles.sparkleContainer}>
            <Sparkles color="#6366F1" size={32} />
          </View>
          <Text style={styles.headerTitle}>TekoPorã</Text>
          <Text style={styles.headerSubtitle}>Escolha seu Minigame</Text>
        </View>

        <View style={styles.grid}>
          {/* Bomba Game - Unlocked */}
          <TouchableOpacity 
            style={[styles.card, styles.cardUnlocked]} 
            activeOpacity={0.8}
            onPress={() => onSelectGame('Bomba')}
          >
            <View style={styles.iconContainer}>
              <Bomb color="#EF4444" size={48} />
            </View>
            <Text style={styles.cardTitle}>Jogo da Bomba</Text>
            <Text style={styles.cardDescription}>Fale palavras da categoria sorteada antes que o tempo estoure!</Text>
          </TouchableOpacity>

          {/* Go/No-Go Game - Unlocked */}
          <TouchableOpacity 
            style={[styles.card, styles.cardUnlocked]} 
            activeOpacity={0.8}
            onPress={() => onSelectGame('GoNoGo')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#DBEAFE' }]}>
              <Puzzle color="#3B82F6" size={48} />
            </View>
            <Text style={styles.cardTitle}>Go / No-Go</Text>
            <Text style={styles.cardDescription}>Toque rápido no alvo e segure a emoção nos outros!</Text>
          </TouchableOpacity>

          {/* Puzzle Game - Unlocked */}
          <TouchableOpacity 
            style={[styles.card, styles.cardUnlocked]} 
            activeOpacity={0.8}
            onPress={() => onSelectGame('Puzzle')}
          >
            <View style={[styles.iconContainer, { backgroundColor: '#FCE7F3' }]}>
              <Puzzle color="#DB2777" size={48} />
            </View>
            <Text style={styles.cardTitle}>Quebra-Cabeça</Text>
            <Text style={styles.cardDescription}>Monte a imagem perfeitamente!</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: {
    padding: 24,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 40,
    marginTop: 20,
    alignItems: 'center',
  },
  sparkleContainer: {
    width: 64,
    height: 64,
    borderRadius: 20,
    backgroundColor: '#E0E7FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 40,
    fontWeight: '900',
    color: '#1E293B',
    marginTop: 12,
    letterSpacing: -1,
  },
  headerSubtitle: {
    fontSize: 18,
    color: '#64748B',
    marginTop: 8,
    fontWeight: '500',
  },
  grid: {
    gap: 24,
  },
  card: {
    borderRadius: 28,
    padding: 24,
    backgroundColor: '#FFF',
    alignItems: 'center',
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.15,
    shadowRadius: 24,
    elevation: 8,
  },
  cardUnlocked: {
    borderWidth: 2,
    borderColor: '#E0E7FF',
  },
  cardLocked: {
    backgroundColor: '#F1F5F9',
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  iconContainer: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconLocked: {
    backgroundColor: '#E2E8F0',
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 8,
  },
  cardTitleLocked: {
    fontSize: 24,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 15,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 10,
  },
  lockBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E2E8F0',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 14,
    gap: 6,
    marginTop: 12,
  },
  lockText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#4B5563',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  }
});
