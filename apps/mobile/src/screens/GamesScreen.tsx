import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Animated, Image, Platform, StatusBar, Pressable, Modal, FlatList, ActivityIndicator } from 'react-native';
import { Shield, Pointer, Puzzle, Eye, Layers, Hand, User, Home, Users, BarChart2, Plus, Lock, Camera, X } from 'lucide-react-native';
import { api } from '../services/api';

interface GamesScreenProps {
  onSelectGame: (gameId: string, alunoId: string) => void;
}

export const GamesScreen: React.FC<GamesScreenProps> = ({ onSelectGame }) => {
  const animatedValues = useRef(Array.from({ length: 6 }).map(() => new Animated.Value(0))).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);

  const handleOpenGameModal = async (gameId: string) => {
    setSelectedGameId(gameId);
    setModalVisible(true);
    setLoadingPatients(true);
    try {
      const response = await api.get('/api/patients');
      if (response.data.success) {
        setPatients(response.data.data);
      }
    } catch (err) {
      console.log('Error fetching patients:', err);
    } finally {
      setLoadingPatients(false);
    }
  };

  const handleStartGame = (alunoId: string) => {
    setModalVisible(false);
    if (selectedGameId) {
      onSelectGame(selectedGameId, alunoId);
    }
  };

  useEffect(() => {
    Animated.stagger(100, animatedValues.map(anim => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    )).start();
  }, []);

  const getAnimatedStyle = (index: number) => {
    const anim = animatedValues[index];
    return {
      opacity: anim,
      transform: [{
        translateY: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [20, 0]
        })
      }]
    };
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Removed Header as per Dashboard alignment */}

        {/* Main Scroll */}
        <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
          <View style={styles.titleSection}>
            <Text style={styles.mainTitle}>Catálogo de Jogos</Text>
            <Text style={styles.subtitle}>Escolha uma dinâmica para iniciar a avaliação neurocognitiva.</Text>
          </View>

          <View style={styles.grid}>
            {/* Goleiro */}
            <Animated.View style={[styles.cardWrapper, getAnimatedStyle(0)]}>
              <View style={styles.card}>
                <View style={styles.iconBoxLilas}>
                  <Shield color="#FFF" size={32} />
                </View>
                <View style={styles.cardTitleBox}>
                  <Text style={styles.cardTitle}>Goleiro</Text>
                  <View style={styles.pillBox}>
                    <Text style={styles.pillText}>Tempo de Reação</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc}>Defenda as bolas chutadas ao gol e teste seus reflexos motores.</Text>
                
                <Pressable 
                  style={({ pressed }) => [styles.buttonYellow, pressed && { backgroundColor: '#7B61FF' }]}
                  onPress={() => handleOpenGameModal('Goleiro')}
                >
                  {({ pressed }) => (
                    <Text style={[styles.buttonYellowText, pressed && { color: '#FFF' }]}>INICIAR JOGO</Text>
                  )}
                </Pressable>
              </View>
            </Animated.View>

            {/* Go / No-Go */}
            <Animated.View style={[styles.cardWrapper, getAnimatedStyle(1)]}>
              <View style={styles.card}>
                <View style={styles.iconBoxLilas}>
                  <Pointer color="#FFF" size={32} />
                </View>
                <View style={styles.cardTitleBox}>
                  <Text style={styles.cardTitle}>Toca Rápido!</Text>
                  <View style={styles.pillBox}>
                    <Text style={styles.pillText}>Controle Inibitório</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc}>Teste de atenção e inibição motora com estímulos positivos e negativos.</Text>
                
                <Pressable 
                  style={({ pressed }) => [styles.buttonYellow, pressed && { backgroundColor: '#7B61FF' }]}
                  onPress={() => handleOpenGameModal('GoNoGo')}
                >
                  {({ pressed }) => (
                    <Text style={[styles.buttonYellowText, pressed && { color: '#FFF' }]}>INICIAR JOGO</Text>
                  )}
                </Pressable>
              </View>
            </Animated.View>

            {/* Quebra-Cabeça */}
            <Animated.View style={[styles.cardWrapper, getAnimatedStyle(2)]}>
              <View style={styles.card}>
                <View style={styles.iconBoxLilas}>
                  <Camera color="#FFF" size={32} />
                </View>
                <View style={styles.cardTitleBox}>
                  <Text style={styles.cardTitle}>Fotógrafo da Floresta</Text>
                  <View style={styles.pillBox}>
                        <Text style={styles.pillText}>Atenção Sustentada</Text>
                  </View>
                </View>
                <Text style={styles.cardDesc}>Tire fotos do pássaro e treine sua atenção inibitória na floresta.</Text>
                
                <Pressable 
                  style={({ pressed }) => [styles.buttonYellow, pressed && { backgroundColor: '#7B61FF' }]}
                  onPress={() => handleOpenGameModal('Puzzle')}
                >
                  {({ pressed }) => (
                    <Text style={[styles.buttonYellowText, pressed && { color: '#FFF' }]}>INICIAR JOGO</Text>
                  )}
                </Pressable>
              </View>
            </Animated.View>

            {/* Locked: Lince */}
            <Animated.View style={[styles.cardWrapper, getAnimatedStyle(3)]}>
              <View style={styles.cardLocked}>
                <View style={styles.lockIconBox}><Lock color="#FFF6E3" size={16} /></View>
                <View style={styles.iconBoxWhite}><Eye color="rgba(255,255,255,0.5)" size={32} /></View>
                <View style={styles.cardTitleBox}>
                  <Text style={styles.cardTitleLocked}>Lince</Text>
                  <View style={styles.pillBoxLocked}><Text style={styles.pillTextLocked}>Atenção Visual</Text></View>
                </View>
                <Text style={styles.cardDescLocked}>Disponível em breve nas próximas atualizações.</Text>
              </View>
            </Animated.View>

            {/* Locked: Uno */}
            <Animated.View style={[styles.cardWrapper, getAnimatedStyle(4)]}>
              <View style={styles.cardLocked}>
                <View style={styles.lockIconBox}><Lock color="#FFF6E3" size={16} /></View>
                <View style={styles.iconBoxWhite}><Layers color="rgba(255,255,255,0.5)" size={32} /></View>
                <View style={styles.cardTitleBox}>
                  <Text style={styles.cardTitleLocked}>Uno</Text>
                  <View style={styles.pillBoxLocked}><Text style={styles.pillTextLocked}>Flexibilidade Cognitiva</Text></View>
                </View>
                <Text style={styles.cardDescLocked}>Aguardando validação clínica do protocolo.</Text>
              </View>
            </Animated.View>

            {/* Locked: Stop */}
            <Animated.View style={[styles.cardWrapper, getAnimatedStyle(5)]}>
              <View style={styles.cardLocked}>
                <View style={styles.lockIconBox}><Lock color="#FFF6E3" size={16} /></View>
                <View style={styles.iconBoxWhite}><Hand color="rgba(255,255,255,0.5)" size={32} /></View>
                <View style={styles.cardTitleBox}>
                  <Text style={styles.cardTitleLocked}>Stop</Text>
                  <View style={styles.pillBoxLocked}><Text style={styles.pillTextLocked}>Fluência Verbal</Text></View>
                </View>
                <Text style={styles.cardDescLocked}>Em fase de desenvolvimento técnico.</Text>
              </View>
            </Animated.View>

          </View>
        </ScrollView>

        {/* Removed FAB and Bottom Nav to avoid conflicts */}
      </View>
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Quem vai jogar?</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color="#111827" size={24} />
              </TouchableOpacity>
            </View>

            {loadingPatients ? (
              <ActivityIndicator size="large" color="#7B61FF" style={{ marginVertical: 40 }} />
            ) : patients.length > 0 ? (
              <FlatList
                data={patients}
                keyExtractor={(item) => item.id}
                contentContainerStyle={styles.patientList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.patientCard}
                    onPress={() => handleStartGame(item.id)}
                  >
                    <View style={styles.patientAvatar}>
                      <Text style={styles.patientAvatarText}>
                        {item.name.charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.patientInfo}>
                      <Text style={styles.patientName}>{item.name}</Text>
                      <Text style={styles.patientAge}>{item.age} anos</Text>
                    </View>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyPatients}>
                <Text style={styles.emptyPatientsText}>Nenhuma criança cadastrada.</Text>
                <Text style={styles.emptyPatientsSub}>Acesse o painel web para adicionar pacientes.</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#064b46', // body bg from refactor
  },
  container: {
    flex: 1,
    backgroundColor: '#064b46',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
    alignItems: 'center',
    zIndex: 40,
    backgroundColor: '#0F6A63', // header bg from refactor
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
  },
  logoRow: {
    height: 48, // h-12
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  logoImage: {
    height: '100%',
    width: 120, // sufficient width for contain
  },
  profileButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0D766E',
    borderWidth: 2,
    borderColor: 'rgba(155,242,232,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120, // space for nav and fab
  },
  titleSection: {
    marginTop: 40,
    marginBottom: 24,
  },
  mainTitle: {
    color: '#FFF6E3',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: 'rgba(255,246,227,0.8)',
    fontSize: 16,
    lineHeight: 24,
  },
  grid: {
    flexDirection: 'column',
    gap: 16,
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  iconBoxLilas: {
    width: 64,
    height: 64,
    backgroundColor: '#7B61FF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleBox: {
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  cardTitle: {
    color: '#FFF6E3',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  pillBox: {
    backgroundColor: 'rgba(255,200,87,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillText: {
    color: '#FFC857',
    fontSize: 12,
    fontWeight: '500',
  },
  cardDesc: {
    color: 'rgba(255,246,227,0.7)',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonYellow: {
    backgroundColor: '#FFC857',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonYellowText: {
    color: '#181c1c',
    fontWeight: 'bold',
    fontSize: 14,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  // Locked styles
  cardLocked: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    borderStyle: 'dashed',
    opacity: 0.6,
  },
  lockIconBox: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    padding: 4,
    borderRadius: 999,
  },
  iconBoxWhite: {
    width: 64,
    height: 64,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitleLocked: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 4,
  },
  pillBoxLocked: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 999,
  },
  pillTextLocked: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
    fontWeight: '500',
  },
  cardDescLocked: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 16,
    lineHeight: 24,
    fontStyle: 'italic',
  },
  // Floating Action Button
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 24,
    width: 64,
    height: 64,
    backgroundColor: '#FFC857',
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 8,
    zIndex: 50,
  },
  // Bottom Navbar
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: Platform.OS === 'android' ? 90 : 100,
    backgroundColor: '#0D766E',
    borderTopWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: Platform.OS === 'android' ? 16 : 24,
    zIndex: 50,
  },
  navItemActive: {
    backgroundColor: '#FFC857',
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navTextActive: {
    color: '#181c1c',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  navItem: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  navText: {
    color: 'rgba(255,246,227,0.8)',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontFamily: 'Inter-Bold',
    fontSize: 20,
    color: '#111827',
  },
  patientList: {
    paddingBottom: 40,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    marginBottom: 12,
  },
  patientAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#7B61FF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  patientAvatarText: {
    color: '#FFF',
    fontSize: 20,
    fontFamily: 'Inter-Bold',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#111827',
  },
  patientAge: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    marginTop: 2,
  },
  emptyPatients: {
    padding: 40,
    alignItems: 'center',
  },
  emptyPatientsText: {
    fontSize: 16,
    fontFamily: 'Inter-Bold',
    color: '#374151',
    textAlign: 'center',
  },
  emptyPatientsSub: {
    fontSize: 14,
    fontFamily: 'Inter-Regular',
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 8,
  },
});
