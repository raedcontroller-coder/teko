import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Pressable, Image, ActivityIndicator } from 'react-native';
import { UserPlus, Users, Gamepad2, ChevronRight, Calendar, Clock, CheckCircle2, AlertCircle, Plus } from 'lucide-react-native';
import { api } from '../../services/api';
import { NewPatientScreen } from './NewPatientScreen';
import { theme } from '../../theme/theme';
import { useTranslation } from '../../i18n';

interface DashboardScreenProps {
  onNavigateToPatients?: () => void;
  onNavigateToAgenda?: () => void;
  onOpenCreateAppointment?: () => void;
}

type AppointmentTopic = 'hoje' | 'amanha' | 'semana';

const formatDateToYYYYMMDD = (d: Date) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateToPatients, onNavigateToAgenda, onOpenCreateAppointment }) => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const [activeTopic, setActiveTopic] = useState<AppointmentTopic>('hoje');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [patientsRes, appointmentsRes] = await Promise.all([
        api.get('/api/patients').catch(() => ({ data: { success: false, data: [] } })),
        api.get('/api/appointments').catch(() => ({ data: { success: false, data: [] } }))
      ]);

      if (patientsRes.data.success) {
        setPatients(patientsRes.data.data);
      }
      if (appointmentsRes.data.success) {
        setAppointments(appointmentsRes.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar dados no dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (isCreatingPatient) {
    return (
      <NewPatientScreen
        onBack={() => setIsCreatingPatient(false)}
        onSuccess={() => {
          setIsCreatingPatient(false);
          fetchData();
        }}
      />
    );
  }

  const totalSessions = patients.reduce((acc, p) => acc + (p.sessionCount || 0), 0);

  // Datas para Filtragem
  const now = new Date();
  const todayStr = formatDateToYYYYMMDD(now);
  
  const tomorrowDate = new Date(now);
  tomorrowDate.setDate(now.getDate() + 1);
  const tomorrowStr = formatDateToYYYYMMDD(tomorrowDate);

  // Calcula o domingo do início da semana corrente e o domingo do fim da semana (8 dias)
  const currentDayOfWeek = now.getDay(); // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  
  const startOfWeekDate = new Date(now);
  startOfWeekDate.setDate(now.getDate() - currentDayOfWeek);
  const startOfWeekStr = formatDateToYYYYMMDD(startOfWeekDate);

  const endOfWeekDate = new Date(startOfWeekDate);
  endOfWeekDate.setDate(startOfWeekDate.getDate() + 7); // Domingo seguinte
  const endOfWeekStr = formatDateToYYYYMMDD(endOfWeekDate);

  // Categorização dos Agendamentos
  const todayAppointments = appointments.filter(a => a.date === todayStr);
  const tomorrowAppointments = appointments.filter(a => a.date === tomorrowStr);
  // "Essa semana" engloba de domingo a domingo da semana em específico
  const thisWeekAppointments = appointments.filter(a => a.date >= startOfWeekStr && a.date <= endOfWeekStr);

  const getAppointmentsForActiveTopic = () => {
    switch (activeTopic) {
      case 'hoje':
        return todayAppointments;
      case 'amanha':
        return tomorrowAppointments;
      case 'semana':
        return thisWeekAppointments;
      default:
        return todayAppointments;
    }
  };

  const activeAppointmentsList = getAppointmentsForActiveTopic();

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

        {/* Cards de Métricas Estáticos */}
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

        {/* Seção Próximos Agendamentos */}
        <View style={styles.recentSection}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>{t.dashboard.upcomingAppointments}</Text>
              <Text style={styles.sectionSubtitle}>{t.dashboard.upcomingAppointmentsSub}</Text>
            </View>
            
            {/* Botão Agenda Completa */}
            <TouchableOpacity 
              style={styles.seeAllButton}
              onPress={onNavigateToAgenda} 
              activeOpacity={0.7}
            >
              <Text style={styles.seeAllText}>{t.dashboard.fullAgenda}</Text>
              <ChevronRight size={14} color={theme.colors.primary} strokeWidth={2.4} />
            </TouchableOpacity>
          </View>

          {/* Pílulas de Tópicos (Hoje, Amanhã, Essa semana) */}
          <View style={styles.topicTabsContainer}>
            <TouchableOpacity
              style={[styles.topicTabPill, activeTopic === 'hoje' && styles.topicTabPillActive]}
              onPress={() => setActiveTopic('hoje')}
              activeOpacity={0.8}
            >
              <Text style={[styles.topicTabText, activeTopic === 'hoje' && styles.topicTabTextActive]}>
                {t.dashboard.topicToday}
              </Text>
              <View style={[styles.topicBadge, activeTopic === 'hoje' && styles.topicBadgeActive]}>
                <Text style={[styles.topicBadgeText, activeTopic === 'hoje' && styles.topicBadgeTextActive]}>
                  {todayAppointments.length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topicTabPill, activeTopic === 'amanha' && styles.topicTabPillActive]}
              onPress={() => setActiveTopic('amanha')}
              activeOpacity={0.8}
            >
              <Text style={[styles.topicTabText, activeTopic === 'amanha' && styles.topicTabTextActive]}>
                {t.dashboard.topicTomorrow}
              </Text>
              <View style={[styles.topicBadge, activeTopic === 'amanha' && styles.topicBadgeActive]}>
                <Text style={[styles.topicBadgeText, activeTopic === 'amanha' && styles.topicBadgeTextActive]}>
                  {tomorrowAppointments.length}
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.topicTabPill, activeTopic === 'semana' && styles.topicTabPillActive]}
              onPress={() => setActiveTopic('semana')}
              activeOpacity={0.8}
            >
              <Text style={[styles.topicTabText, activeTopic === 'semana' && styles.topicTabTextActive]}>
                {t.dashboard.topicThisWeek}
              </Text>
              <View style={[styles.topicBadge, activeTopic === 'semana' && styles.topicBadgeActive]}>
                <Text style={[styles.topicBadgeText, activeTopic === 'semana' && styles.topicBadgeTextActive]}>
                  {thisWeekAppointments.length}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Container da Lista de Agendamentos com o botão + no canto inferior direito */}
          <View style={styles.appointmentsWrapper}>
            <View style={styles.appointmentListContainer}>
              {loading ? (
                <View style={styles.loadingListContainer}>
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                  <Text style={styles.loadingListText}>{t.dashboard.loadingAppointments}</Text>
                </View>
              ) : activeAppointmentsList.length > 0 ? (
                activeAppointmentsList.map((item) => {
                  const colorAccent = item.color || theme.colors.primary;
                  const isConfirmed = item.status === 'confirmado';

                  return (
                    <TouchableOpacity 
                      key={item.id} 
                      style={[styles.appointmentRowCard, { borderLeftColor: colorAccent }]}
                      onPress={onNavigateToAgenda}
                      activeOpacity={0.8}
                    >
                      <View style={styles.appointmentMainInfo}>
                        <Text style={styles.appointmentPatientName}>{item.name}</Text>
                        <Text style={styles.appointmentTitle}>{`${item.title} • ${item.type}`}</Text>
                        {activeTopic === 'semana' && (
                          <Text style={styles.appointmentDateSub}>
                            {`📅 ${new Date(item.date + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}`}
                          </Text>
                        )}
                      </View>

                      <View style={styles.appointmentRightContainer}>
                        <View style={styles.appointmentTimePill}>
                          <Clock size={15} color={theme.colors.primary} strokeWidth={2.4} />
                          <Text style={styles.appointmentTimeText}>{`${item.startTime} - ${item.endTime}`}</Text>
                        </View>
                        {(!item.status || item.status === 'a_confirmar') && (
                          <View style={[styles.appointmentStatusBadge, { backgroundColor: '#FEF3C7', borderColor: '#FCD34D', borderWidth: 1 }]}>
                            <Clock size={11} color="#F59E0B" />
                            <Text style={[styles.appointmentStatusText, { color: '#F59E0B' }]}>
                              {t.agenda.statusAConfirmar}
                            </Text>
                          </View>
                        )}
                        {item.status === 'confirmado' && (
                          <View style={[styles.appointmentStatusBadge, { backgroundColor: '#D1FAE5', borderColor: '#6EE7B7', borderWidth: 1 }]}>
                            <CheckCircle2 size={11} color="#10B981" />
                            <Text style={[styles.appointmentStatusText, { color: '#10B981' }]}>
                              {t.agenda.statusConfirmado}
                            </Text>
                          </View>
                        )}
                        {item.status === 'concluido' && (
                          <View style={[styles.appointmentStatusBadge, { backgroundColor: '#E0F2FE', borderColor: '#7DD3FC', borderWidth: 1 }]}>
                            <CheckCircle2 size={11} color="#0284C7" />
                            <Text style={[styles.appointmentStatusText, { color: '#0284C7' }]}>
                              {t.agenda.statusConcluido}
                            </Text>
                          </View>
                        )}
                        {item.status === 'cancelado' && (
                          <View style={[styles.appointmentStatusBadge, { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', borderWidth: 1 }]}>
                            <AlertCircle size={11} color="#EF4444" />
                            <Text style={[styles.appointmentStatusText, { color: '#EF4444' }]}>
                              {t.agenda.statusCancelado}
                            </Text>
                          </View>
                        )}
                        {item.status === 'falta' && (
                          <View style={[styles.appointmentStatusBadge, { backgroundColor: '#F3F4F6', borderColor: '#D1D5DB', borderWidth: 1 }]}>
                            <AlertCircle size={11} color="#6B7280" />
                            <Text style={[styles.appointmentStatusText, { color: '#6B7280' }]}>
                              {t.agenda.statusFalta}
                            </Text>
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyContainer}>
                  <TouchableOpacity 
                    style={styles.centerAddButton}
                    onPress={onOpenCreateAppointment || onNavigateToAgenda}
                    activeOpacity={0.8}
                  >
                    <Plus size={24} color={theme.colors.primary} strokeWidth={2.4} />
                  </TouchableOpacity>
                  <Text style={styles.emptyText}>
                    {activeTopic === 'hoje' && t.dashboard.noAppointmentsToday}
                    {activeTopic === 'amanha' && t.dashboard.noAppointmentsTomorrow}
                    {activeTopic === 'semana' && t.dashboard.noAppointmentsWeek}
                  </Text>
                </View>
              )}
            </View>
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
  appointmentsWrapper: {
    position: 'relative',
  },
  centerAddButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
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
  /* Tópicos de Agendamento (Hoje, Amanhã, Essa semana) */
  topicTabsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
    marginTop: 4,
    marginBottom: 16,
    width: '100%',
  },
  topicTabPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 6,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1.5,
    borderColor: theme.colors.cardBorder,
    gap: 5,
    ...theme.shadows.subtle,
  },
  topicTabPillActive: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primaryDark,
    ...theme.shadows.card,
    elevation: 4,
  },
  topicTabText: {
    fontSize: 13,
    fontWeight: '700',
    color: theme.colors.textDark,
  },
  topicTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  topicBadge: {
    backgroundColor: theme.colors.tealSoft,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 999,
  },
  topicBadgeActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.28)',
  },
  topicBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: theme.colors.primary,
  },
  topicBadgeTextActive: {
    color: '#FFFFFF',
  },

  /* Agendamentos List */
  appointmentListContainer: {
    gap: 10,
  },
  appointmentRowCard: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.md,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderLeftWidth: 5,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
    ...theme.shadows.subtle,
  },
  appointmentMainInfo: {
    flex: 1,
    gap: 2,
  },
  appointmentRightContainer: {
    alignItems: 'flex-end',
    gap: 6,
  },
  appointmentTimePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: theme.colors.tealSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
  },
  appointmentTimeText: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: -0.2,
  },
  appointmentPatientName: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textDark,
  },
  appointmentTitle: {
    fontSize: 13,
    fontWeight: '500',
    color: theme.colors.textMuted,
  },
  appointmentDateSub: {
    fontSize: 11,
    color: theme.colors.textMuted,
    marginTop: 2,
  },
  appointmentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-end',
    gap: 4,
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  statusConfirmedBg: {
    backgroundColor: '#E6F7F0',
  },
  statusPendingBg: {
    backgroundColor: '#FEF3F0',
  },
  appointmentStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusConfirmedText: {
    color: theme.colors.accentGreen,
  },
  statusPendingText: {
    color: theme.colors.accentOrange,
  },
  loadingContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 28,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    minHeight: 125,
    position: 'relative',
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 13,
    textAlign: 'center',
  },
  valueSpinnerWrapper: {
    height: 36,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  loadingListContainer: {
    minHeight: 125,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 10,
    paddingVertical: 28,
    position: 'relative',
    ...theme.shadows.subtle,
  },
  loadingListText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textMuted,
  },
});
