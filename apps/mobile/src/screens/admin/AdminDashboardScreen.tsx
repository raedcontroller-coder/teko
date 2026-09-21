import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Pressable,
  Image
} from 'react-native';
import { Plus, Users, FileText, Baby, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react-native';
import { api } from '../../services/api';
import { theme } from '../../theme/theme';
import { useTranslation } from '../../i18n';

interface AdminDashboardScreenProps {
  onNavigateToPsychologists?: () => void;
  onNavigateToNewPsychologist?: () => void;
  onSelectPsychologist?: (psi: { id: string, name: string }) => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ 
  onNavigateToPsychologists, 
  onNavigateToNewPsychologist,
  onSelectPsychologist
}) => {
  const { t } = useTranslation();
  const [stats, setStats] = useState({ profissionais: 0, relatorios: 0, criancas: 0 });
  const [recentPsychologists, setRecentPsychologists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollX, setScrollX] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/dashboard');
      if (response.data.success) {
        setStats(response.data.data.stats);
        setRecentPsychologists(response.data.data.recentPsychologists);
      }
    } catch (error) {
      console.error('Erro ao buscar dados do dashboard admin:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Actions */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>{t.admin.dashboardTitle}</Text>
            <Text style={styles.subtitle}>{t.admin.dashboardSubtitle}</Text>
          </View>
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.newButton,
            pressed && { backgroundColor: theme.colors.primaryDark }
          ]}
          onPress={onNavigateToNewPsychologist}
        >
          <Plus color="#FFF" size={20} />
          <Text style={styles.newButtonText}>{t.admin.newProfessional}</Text>
        </Pressable>

        {/* Metrics Grid */}
        <View style={styles.metricsGrid}>
          {/* Card: Profissionais Ativos */}
          <View style={[styles.metricCard, styles.metricCardPrimary]}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.tealSoft }]}>
              <Users color={theme.colors.primary} size={22} strokeWidth={2.2} />
            </View>
            <View style={styles.metricCompactContent}>
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              ) : (
                <Text style={styles.metricValue}>{stats.profissionais}</Text>
              )}
              <Text style={styles.metricLabel}>{t.admin.activeProfessionals}</Text>
            </View>
          </View>

          {/* Card: Relatórios Gerados */}
          <View style={styles.metricCard}>
            <View style={[styles.iconWrapper, { backgroundColor: theme.colors.badgePurple }]}>
              <FileText color={theme.colors.badgePurpleText} size={22} strokeWidth={2.2} />
            </View>
            <View style={styles.metricCompactContent}>
              {loading ? (
                <ActivityIndicator size="small" color={theme.colors.badgePurpleText} />
              ) : (
                <Text style={styles.metricValue}>{stats.relatorios}</Text>
              )}
              <Text style={styles.metricLabel}>{t.admin.generatedReports}</Text>
            </View>
          </View>

          {/* Card: Crianças na plataforma (Full Width) */}
          <View style={[styles.metricCard, styles.metricCardFull]}>
            <View style={styles.childrenCardRow}>
              <View style={[styles.iconWrapper, { backgroundColor: theme.colors.tealSoft, width: 44, height: 44, borderRadius: 22 }]}>
                <Baby color={theme.colors.primary} size={24} strokeWidth={2.2} />
              </View>
              <View style={styles.childrenRightContent}>
                {loading ? (
                  <ActivityIndicator size="small" color={theme.colors.primary} />
                ) : (
                  <Text style={styles.metricValue}>{stats.criancas}</Text>
                )}
                <Text style={styles.metricLabel}>{t.admin.childrenOnPlatform}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Profissionais Cadastrados Section */}
        <View style={styles.listSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>{t.admin.registeredProfessionals}</Text>
            <Pressable onPress={onNavigateToPsychologists}>
              <Text style={styles.seeAllText}>{t.admin.viewAll}</Text>
            </Pressable>
          </View>
          
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : recentPsychologists.length === 0 ? (
            <View style={styles.emptyState}>
              <UserCircle color={theme.colors.textMuted} size={48} />
              <Text style={styles.emptyStateText}>{t.admin.noProfessionals}</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {recentPsychologists.slice(0, 4).map((psi) => (
                <Pressable 
                  key={psi.id} 
                  style={({ pressed }) => [
                    styles.listItem,
                    pressed && { opacity: 0.85, transform: [{ scale: 0.99 }] }
                  ]}
                  onPress={() => {
                    if (onSelectPsychologist) {
                      onSelectPsychologist({ id: psi.id, name: psi.name });
                    } else if (onNavigateToPsychologists) {
                      onNavigateToPsychologists();
                    }
                  }}
                >
                  <View style={styles.listHeader}>
                    <View style={styles.avatar}>
                      {psi.avatarUrl ? (
                        <Image source={{ uri: psi.avatarUrl }} style={{ width: 40, height: 40, borderRadius: 20 }} resizeMode="cover" />
                      ) : (
                        <UserCircle color={theme.colors.primary} size={24} />
                      )}
                    </View>
                    <View style={styles.infoContainer}>
                      <Text style={styles.itemName}>{psi.name}</Text>
                      <Text style={styles.itemEmail}>{psi.email}</Text>
                    </View>
                  </View>
                  <View style={styles.listFooter}>
                    <Text style={styles.itemMeta}>CRP: {psi.crp || "-"}</Text>
                    <Text style={styles.itemMeta}>Clínica: {psi.clinicName || "-"}</Text>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
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
    paddingBottom: 110,
  },
  header: {
    marginBottom: 20,
  },
  headerTextContainer: {},
  title: {
    color: theme.colors.textDark,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 4,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radii.md,
    marginBottom: 24,
    gap: 8,
    ...theme.shadows.subtle,
  },
  newButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
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
  childrenCardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  childrenRightContent: {
    flex: 1,
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
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listSection: {
    flex: 1,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  seeAllText: {
    fontSize: 12,
    fontWeight: '700',
    color: theme.colors.primary,
    backgroundColor: theme.colors.tealSoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  emptyStateText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  listContainer: {
    gap: 12,
    marginBottom: 20,
  },
  listItem: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.subtle,
  },
  listHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  itemName: {
    color: theme.colors.textDark,
    fontSize: 16,
    fontWeight: '700',
  },
  itemEmail: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
  },
  itemMeta: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
});

