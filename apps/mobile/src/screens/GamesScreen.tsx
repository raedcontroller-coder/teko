import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Animated, Pressable, Modal, FlatList, ActivityIndicator, TextInput, Image } from 'react-native';
import { Shield, Pointer, Camera, Eye, User, X, Search, Sparkles, ChevronRight } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../services/api';
import { theme } from '../theme/theme';
import { useTranslation } from '../i18n';
import { SkeletonLoader } from '../components/ui/SkeletonLoader';

interface GamesScreenProps {
  userRole?: string;
  onSelectGame: (gameId: string, alunoId: string) => void;
}

export const GamesScreen: React.FC<GamesScreenProps> = ({ userRole, onSelectGame }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const animatedValues = useRef(Array.from({ length: 3 }).map(() => new Animated.Value(0))).current;
  const [modalVisible, setModalVisible] = useState(false);
  const [modalStep, setModalStep] = useState<'OPTIONS' | 'SELECT_PSI' | 'SELECT_CHILD'>('SELECT_CHILD');
  const [selectedGameId, setSelectedGameId] = useState<string | null>(null);
  
  const [psychologists, setPsychologists] = useState<any[]>([]);
  const [loadingPsi, setLoadingPsi] = useState(false);
  
  const [patients, setPatients] = useState<any[]>([]);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const handleOpenGameModal = async (gameId: string) => {
    setSelectedGameId(gameId);
    setSearchQuery('');
    
    if (userRole === 'GLOBAL_ADMIN') {
      setModalStep('OPTIONS');
      setModalVisible(true);
    } else {
      setModalStep('SELECT_CHILD');
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
    }
  };

  const handlePlayAnonymous = () => {
    setModalVisible(false);
    if (selectedGameId) {
      onSelectGame(selectedGameId, "anonymous");
    }
  };

  const handleSelectPsiForChild = async () => {
    setModalStep('SELECT_PSI');
    setLoadingPsi(true);
    try {
      const response = await api.get('/api/admin/psychologists');
      if (response.data.success) {
        setPsychologists(response.data.data);
      }
    } catch (err) {
      console.log('Error fetching psychologists:', err);
    } finally {
      setLoadingPsi(false);
    }
  };

  const handlePsiSelected = async (psiId: string) => {
    setModalStep('SELECT_CHILD');
    setLoadingPatients(true);
    setSearchQuery('');
    try {
      const response = await api.get(`/api/patients?psicologoId=${psiId}`);
      if (response.data.success) {
        setPatients(response.data.data);
      }
    } catch (err) {
      console.log('Error fetching patients for psi:', err);
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

  const filteredPatients = patients.filter(p => {
    const query = searchQuery.toLowerCase();
    const matchName = p.name?.toLowerCase().includes(query);
    const matchGuardian = p.guardianName?.toLowerCase().includes(query);
    return matchName || matchGuardian;
  });

  useEffect(() => {
    Animated.stagger(100, animatedValues.map(anim => 
      Animated.timing(anim, {
        toValue: 1,
        duration: 450,
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
          outputRange: [16, 0]
        })
      }]
    };
  };

  return (
    <>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.container}>
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
            <View style={styles.titleSection}>
              <Text style={styles.mainTitle}>{t.games.title}</Text>
              <Text style={styles.subtitle}>{t.games.subtitle}</Text>
            </View>

            <View style={styles.grid}>
              {/* Game 1: Goleiro */}
              <Animated.View style={[styles.cardWrapper, getAnimatedStyle(0)]}>
                <View style={styles.card}>
                  <View style={styles.bannerWrapper}>
                    <Image 
                      source={require('../../assets/elementos_visuais/jogo_do_goleiro.png')} 
                      style={styles.gameBannerImage}
                      resizeMode="cover"
                    />
                    <View style={styles.badgePurpleOverlay}>
                      <Sparkles size={12} color={theme.colors.badgePurpleText} />
                      <Text style={styles.badgePurpleText}>Tempo de Reação</Text>
                    </View>
                  </View>

                  <View style={styles.cardBodyPadding}>
                    <Text style={styles.cardTitle}>{t.games.goleiro}</Text>
                    <Text style={styles.cardDesc}>{t.games.goleiroDesc}</Text>
                    
                    <Pressable 
                      style={({ pressed }) => [
                        styles.playButton, 
                        pressed && { backgroundColor: theme.colors.primaryDark, transform: [{ scale: 0.98 }] }
                      ]}
                      onPress={() => handleOpenGameModal('Goleiro')}
                    >
                      <Text style={styles.playButtonText}>{t.games.startGame}</Text>
                      <ChevronRight size={18} color="#FFF" />
                    </Pressable>
                  </View>
                </View>
              </Animated.View>

              {/* Game 2: Go / No-Go */}
              <Animated.View style={[styles.cardWrapper, getAnimatedStyle(1)]}>
                <View style={styles.card}>
                  <View style={styles.bannerWrapper}>
                    <Image 
                      source={require('../../assets/elementos_visuais/toca_rapido.png')} 
                      style={styles.gameBannerImage}
                      resizeMode="cover"
                    />
                    <View style={styles.badgePurpleOverlay}>
                      <Sparkles size={12} color={theme.colors.badgePurpleText} />
                      <Text style={styles.badgePurpleText}>Controle Inibitório</Text>
                    </View>
                  </View>

                  <View style={styles.cardBodyPadding}>
                    <Text style={styles.cardTitle}>{t.games.goNoGo}</Text>
                    <Text style={styles.cardDesc}>{t.games.goNoGoDesc}</Text>
                    
                    <Pressable 
                      style={({ pressed }) => [
                        styles.playButton, 
                        pressed && { backgroundColor: theme.colors.primaryDark, transform: [{ scale: 0.98 }] }
                      ]}
                      onPress={() => handleOpenGameModal('GoNoGo')}
                    >
                      <Text style={styles.playButtonText}>{t.games.startGame}</Text>
                      <ChevronRight size={18} color="#FFF" />
                    </Pressable>
                  </View>
                </View>
              </Animated.View>

              {/* Game 3: Fotógrafo */}
              <Animated.View style={[styles.cardWrapper, getAnimatedStyle(2)]}>
                <View style={styles.card}>
                  <View style={styles.bannerWrapper}>
                    <Image 
                      source={require('../../assets/elementos_visuais/fotografo_floresta.png')} 
                      style={styles.gameBannerImage}
                      resizeMode="cover"
                    />
                    <View style={styles.badgePurpleOverlay}>
                      <Sparkles size={12} color={theme.colors.badgePurpleText} />
                      <Text style={styles.badgePurpleText}>{t.games.sustainedAttention}</Text>
                    </View>
                  </View>

                  <View style={styles.cardBodyPadding}>
                    <Text style={styles.cardTitle}>{t.games.puzzle}</Text>
                    <Text style={styles.cardDesc}>{t.games.puzzleDesc}</Text>
                    
                    <Pressable 
                      style={({ pressed }) => [
                        styles.playButton, 
                        pressed && { backgroundColor: theme.colors.primaryDark, transform: [{ scale: 0.98 }] }
                      ]}
                      onPress={() => handleOpenGameModal('Puzzle')}
                    >
                      <Text style={styles.playButtonText}>{t.games.startGame}</Text>
                      <ChevronRight size={18} color="#FFF" />
                    </Pressable>
                  </View>
                </View>
              </Animated.View>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>

      {/* Modal de Seleção de Paciente */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 16) }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {modalStep === 'OPTIONS' ? (t.games.howToPlay || 'Como deseja jogar?') : 
                 modalStep === 'SELECT_PSI' ? (t.games.selectPsychologist || 'Selecione o Psicólogo') : 
                 (t.games.selectChild || 'Selecione a Criança')}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <X color={theme.colors.textDark} size={22} />
              </TouchableOpacity>
            </View>

            {modalStep === 'OPTIONS' && (
              <View style={styles.optionsContainer}>
                <Pressable 
                  style={({ pressed }) => [styles.optionCard, pressed && { borderColor: theme.colors.primary }]} 
                  onPress={handlePlayAnonymous}
                >
                  <View style={[styles.iconBox, { backgroundColor: theme.colors.tealSoft, marginRight: 12 }]}>
                    <Eye color={theme.colors.primary} size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>{t.games.demoModeTitle || 'Modo Demonstração'}</Text>
                    <Text style={styles.optionDesc}>{t.games.demoModeDesc || 'Partida anônima para testes sem registrar telemétricas.'}</Text>
                  </View>
                </Pressable>

                <Pressable 
                  style={({ pressed }) => [styles.optionCard, pressed && { borderColor: theme.colors.primary }]} 
                  onPress={handleSelectPsiForChild}
                >
                  <View style={[styles.iconBox, { backgroundColor: theme.colors.badgePurple, marginRight: 12 }]}>
                    <User color={theme.colors.badgePurpleText} size={22} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.optionTitle}>{t.games.linkPatientTitle || 'Vincular a um Paciente'}</Text>
                    <Text style={styles.optionDesc}>{t.games.linkPatientDesc || 'Selecione o paciente para persistir o relatório de telemetria.'}</Text>
                  </View>
                </Pressable>
              </View>
            )}

            {modalStep === 'SELECT_PSI' && (
              loadingPsi ? (
                <View style={{ paddingVertical: 10 }}>
                  <SkeletonLoader variant="card" />
                  <SkeletonLoader variant="card" />
                  <SkeletonLoader variant="card" />
                </View>
              ) : (
                <FlatList
                  data={psychologists.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.patientList}
                  ListHeaderComponent={
                    <View style={styles.searchContainer}>
                      <Search color={theme.colors.textMuted} size={18} />
                      <TextInput
                        style={styles.searchInput}
                        placeholder={t.games.searchPsychologistPlaceholder || 'Buscar por psicólogo...'}
                        placeholderTextColor={theme.colors.textMuted}
                        value={searchQuery}
                        onChangeText={setSearchQuery}
                      />
                    </View>
                  }
                  renderItem={({ item }) => (
                    <TouchableOpacity style={styles.patientCard} onPress={() => handlePsiSelected(item.id)}>
                      <View style={styles.patientAvatar}>
                        <Text style={styles.patientAvatarText}>{item.name.charAt(0).toUpperCase()}</Text>
                      </View>
                      <View style={styles.patientInfo}>
                        <Text style={styles.patientName}>{item.name}</Text>
                        <Text style={styles.patientAge}>{item.clinicName || 'Sem clínica'} • {item.crp || 'Sem CRP'}</Text>
                      </View>
                    </TouchableOpacity>
                  )}
                />
              )
            )}

            {modalStep === 'SELECT_CHILD' && (
              loadingPatients ? (
                <View style={{ paddingVertical: 10 }}>
                  <SkeletonLoader variant="card" />
                  <SkeletonLoader variant="card" />
                  <SkeletonLoader variant="card" />
                </View>
              ) : (
                <>
                  <View style={styles.searchContainer}>
                    <Search color={theme.colors.textMuted} size={18} />
                    <TextInput
                      style={styles.searchInput}
                      placeholder={t.games.searchChildPlaceholder || 'Buscar por criança ou responsável...'}
                      placeholderTextColor={theme.colors.textMuted}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                    />
                  </View>
                  {filteredPatients.length > 0 ? (
                    <FlatList
                      data={filteredPatients}
                      keyExtractor={(item) => item.id}
                      contentContainerStyle={styles.patientList}
                      renderItem={({ item }) => {
                        const isGirl = item.gender?.toLowerCase().includes('fem') || item.name?.endsWith('a');
                        const avatarSource = isGirl 
                          ? require('../../assets/elementos_visuais/menina_crianca.png')
                          : require('../../assets/elementos_visuais/menino_crianca.png');

                        return (
                          <TouchableOpacity
                            style={styles.patientCard}
                            onPress={() => handleStartGame(item.id)}
                          >
                            <View style={styles.avatarImageContainer}>
                              <Image source={avatarSource} style={styles.avatarImage} resizeMode="cover" />
                            </View>
                            <View style={styles.patientInfo}>
                              <Text style={styles.patientName}>{item.name}</Text>
                              <Text style={styles.patientAge}>
                                {t('common.ageAndSessions', { age: item.age, count: item.sessionCount || 0 })} • {item.guardianName || t.patients.guardianPlaceholder}
                              </Text>
                            </View>
                            <ChevronRight size={18} color={theme.colors.primary} />
                          </TouchableOpacity>
                        );
                      }}
                    />
                  ) : (
                    <View style={styles.emptyPatients}>
                      <Text style={styles.emptyPatientsText}>{t.games.noChildrenFound || 'Nenhuma criança cadastrada encontrada.'}</Text>
                    </View>
                  )}
                </>
              )
            )}
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110,
  },
  titleSection: {
    marginBottom: 20,
  },
  mainTitle: {
    color: theme.colors.textDark,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    lineHeight: 18,
  },
  grid: {
    gap: 16,
  },
  cardWrapper: {
    width: '100%',
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    overflow: 'hidden',
    ...theme.shadows.card,
  },
  bannerWrapper: {
    width: '100%',
    height: 124,
    position: 'relative',
    backgroundColor: theme.colors.tealSoft,
  },
  gameBannerImage: {
    width: '100%',
    height: '100%',
  },
  badgePurpleOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    ...theme.shadows.subtle,
  },
  cardBodyPadding: {
    padding: 18,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  badgePurple: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: theme.colors.badgePurple,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  badgePurpleText: {
    color: theme.colors.badgePurpleText,
    fontSize: 11,
    fontWeight: '700',
  },
  cardTitle: {
    color: theme.colors.textDark,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
    letterSpacing: -0.3,
  },
  cardDesc: {
    color: theme.colors.textMuted,
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 18,
  },
  playButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    ...theme.shadows.subtle,
  },
  playButtonText: {
    color: '#FFF',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: -0.1,
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: theme.colors.bg,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    paddingTop: 20,
    paddingHorizontal: 20,
    maxHeight: '82%',
    ...theme.shadows.floating,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textDark,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.full,
    paddingHorizontal: 14,
    marginBottom: 16,
    height: 44,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    color: theme.colors.textDark,
    fontSize: 14,
  },
  patientList: {
    paddingBottom: 20,
  },
  patientCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    marginBottom: 10,
    gap: 12,
  },
  patientAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.tealSoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patientAvatarText: {
    color: theme.colors.primary,
    fontSize: 16,
    fontWeight: '800',
  },
  avatarImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.tealSoft,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  patientAge: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  emptyPatients: {
    padding: 30,
    alignItems: 'center',
  },
  emptyPatientsText: {
    fontSize: 14,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  optionsContainer: {
    paddingBottom: 20,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    padding: 14,
  },
  optionTitle: {
    color: theme.colors.textDark,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
});
