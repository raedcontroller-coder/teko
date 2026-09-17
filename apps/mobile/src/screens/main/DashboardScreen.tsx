import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { UserPlus, Users, FileText, Gamepad2, ChevronRight, Sparkles } from 'lucide-react-native';
import { api } from '../../services/api';
import { NewPatientScreen } from './NewPatientScreen';
import { theme } from '../../theme/theme';
import { useTranslation } from '../../i18n';

interface DashboardScreenProps {
  onNavigateToPatients?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateToPatients }) => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/patients');
      if (response.data.success) {
        setPatients(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar pacientes no dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  const recentPatients = patients.slice(0, 4);

  if (isCreatingPatient) {
    return (
      <NewPatientScreen
        onBack={() => setIsCreatingPatient(false)}
        onSuccess={() => {
          setIsCreatingPatient(false);
          fetchPatients();
        }}
      />
    );
  }

  const totalSessions = patients.reduce((acc, p) => acc + (p.sessionCount || 0), 0);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Título & Subtítulo */}
        <View style={styles.header}>
          <Text style={styles.title}>{t.dashboard.title}</Text>
          <Text style={styles.subtitle}>{t.dashboard.subtitle}</Text>
        </View>

        {/* Botão Novo Paciente em Deep Emerald */}
        <Pressable 
          style={({ pressed }) => [
            styles.newPatientButton,
            pressed && { backgroundColor: theme.colors.primaryDark, transform: [{ scale: 0.98 }] }
          ]}
          onPress={() => setIsCreatingPatient(true)}
        >
          <UserPlus color="#FFF" size={19} strokeWidth={2.2} />
          <Text style={styles.newPatientButtonText}>{t.dashboard.addPatient}</Text>
        </Pressable>

        {/* Cards de Métricas Estáticos com Spinner nas Informações */}
        <View style={styles.metricsGrid}>
          {/* Card: Pacientes Ativos */}
          <View style={[styles.metricCard, styles.metricCardPrimary]}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.tealSoft }]}>
              <Users color={theme.colors.primary} size={22} strokeWidth={2.2} />
            </View>
            <View style={styles.metricCompactContent}>
              {loading ? (
                <View style={styles.valueSpinnerWrapper}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                </View>
              ) : (
                <Text style={styles.metricValue}>{patients.length}</Text>
              )}
              <Text style={styles.metricLabel}>{t.dashboard.activePatientsCount}</Text>
            </View>
          </View>

          {/* Card: Sessões Concluídas */}
          <View style={styles.metricCard}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.badgePurple }]}>
              <Gamepad2 color={theme.colors.badgePurpleText} size={22} strokeWidth={2.2} />
            </View>
            <View style={styles.metricCompactContent}>
              {loading ? (
                <View style={styles.valueSpinnerWrapper}>
                  <ActivityIndicator size="small" color={theme.colors.badgePurpleText} />
                </View>
              ) : (
                <Text style={styles.metricValue}>{totalSessions}</Text>
              )}
              <Text style={styles.metricLabel}>{t.patientProfile.totalSessions}</Text>
            </View>
          </View>

          {/* Card: Relatórios Emitidos */}
          <View style={[styles.metricCard, styles.metricCardFull]}>
            <View style={styles.reportCardRow}>
              <View style={styles.reportIllustrationWrapper}>
                <Image 
                  source={require('../../../assets/elementos_visuais/relatorio.png')} 
                  style={styles.reportIllustration}
                  resizeMode="contain"
                />
              </View>
              <View style={styles.reportRightContent}>
                {loading ? (
                  <View style={styles.valueSpinnerWrapper}>
                    <ActivityIndicator size="small" color={theme.colors.primary} />
                  </View>
                ) : (
                  <Text style={styles.metricValue}>0</Text>
                )}
                <Text style={styles.metricLabel}>{t.dashboard.totalReports}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Seção Pacientes Recentes */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t.dashboard.myPatients}</Text>
              <Text style={styles.sectionSubtitle}>{t.dashboard.recentActivity}</Text>
            </View>
            
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={onNavigateToPatients} 
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>{t.dashboard.viewAll}</Text>
              <ChevronRight size={14} color={theme.colors.primary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          <View style={styles.patientListContainer}>
            {loading ? (
              <View style={styles.loadingListContainer}>
                <ActivityIndicator size="small" color={theme.colors.primary} />
                <Text style={styles.loadingListText}>{t.dashboard.loadingPatientsData}</Text>
              </View>
            ) : recentPatients.length > 0 ? (
              recentPatients.map((patient, index) => {
                const isGirl = patient.gender?.toLowerCase().includes('fem') || patient.name?.endsWith('a') || index % 2 === 1;
                const avatarSource = isGirl 
                  ? require('../../../assets/elementos_visuais/menina_crianca.png')
                  : require('../../../assets/elementos_visuais/menino_crianca.png');

                return (
                  <TouchableOpacity 
                    key={patient.id} 
                    style={styles.patientRowCard}
                    onPress={onNavigateToPatients}
                    activeOpacity={0.75}
                  >
                    <View style={styles.patientAvatarContainer}>
                      <Image source={avatarSource} style={styles.patientAvatarImage} resizeMode="cover" />
                    </View>
                    <View style={styles.patientMainInfo}>
                      <Text style={styles.patientName}>{patient.name}</Text>
                      <Text style={styles.patientSubText}>{t('common.ageAndSessions', { age: patient.age, count: patient.sessionCount || 0 })}</Text>
                    </View>
                    <View style={styles.patientStatusBadge}>
                      <Text style={styles.patientStatusText}>
                        {patient.lastSessionDate 
                          ? new Date(patient.lastSessionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) 
                          : t.common.new
                        }
                      </Text>
                    </View>
                    <ChevronRight size={18} color={theme.colors.textMuted} />
                  </TouchableOpacity>
                );
              })
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>{t.dashboard.noPatientsFound}</Text>
              </View>
            )}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 110, // Espaço seguro para o BottomTabBar flutuante
  },
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.textDark,
    letterSpacing: -0.4,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  newPatientButton: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.radii.lg,
    marginBottom: 20,
    gap: 8,
    ...theme.shadows.card,
  },
  newPatientButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  metricCard: {
    flex: 1,
    minWidth: '46%',
    aspectRatio: 1,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    ...theme.shadows.subtle,
  },
  metricCardPrimary: {
    borderColor: theme.colors.tealMint,
  },
  metricCardFull: {
    minWidth: '100%',
    aspectRatio: undefined,
    flexDirection: 'column',
    alignItems: 'stretch',
    padding: 16,
    borderRadius: theme.radii.lg,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricCompactContent: {
    width: '100%',
    gap: 4,
  },
  metricValue: {
    fontSize: 32,
    fontWeight: '800',
    color: theme.colors.textDark,
    letterSpacing: -0.6,
    lineHeight: 36,
  },
  metricLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
    lineHeight: 16,
  },
  reportCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  reportIllustrationWrapper: {
    width: 68,
    height: 68,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.purpleSoft,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 6,
  },
  reportIllustration: {
    width: '100%',
    height: '100%',
  },
  reportRightContent: {
    flex: 1,
  },
  reportBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: theme.colors.badgePurple,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
    marginBottom: 6,
  },
  reportBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: theme.colors.badgePurpleText,
  },
  recentSection: {
    marginTop: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: theme.colors.textDark,
    letterSpacing: -0.3,
  },
  sectionSubtitle: {
    fontSize: 12,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.tealSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    gap: 2,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  patientListContainer: {
    gap: 10,
  },
  patientRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.md,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 12,
    ...theme.shadows.subtle,
  },
  patientAvatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1.5,
    borderColor: theme.colors.tealMint,
  },
  patientAvatarImage: {
    width: '100%',
    height: '100%',
  },
  patientMainInfo: {
    flex: 1,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.textDark,
    marginBottom: 2,
  },
  patientSubText: {
    fontSize: 12,
    color: theme.colors.textMuted,
  },
  patientStatusBadge: {
    backgroundColor: theme.colors.tealSoft,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: theme.radii.full,
  },
  patientStatusText: {
    fontSize: 11,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  valueSpinnerWrapper: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  loadingListContainer: {
    minHeight: 110,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 10,
    paddingVertical: 24,
    ...theme.shadows.subtle,
  },
  loadingListText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
});
