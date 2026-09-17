import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ScrollView, 
  ActivityIndicator, 
  Pressable 
} from 'react-native';
import { Plus, Users, FileText, Baby, ChevronLeft, ChevronRight, UserCircle } from 'lucide-react-native';
import { api } from '../../services/api';
import { theme } from '../../theme/theme';

interface AdminDashboardScreenProps {
  onNavigateToPsychologists?: () => void;
  onNavigateToNewPsychologist?: () => void;
}

export const AdminDashboardScreen: React.FC<AdminDashboardScreenProps> = ({ onNavigateToPsychologists, onNavigateToNewPsychologist }) => {
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
            <Text style={styles.title}>Administração</Text>
            <Text style={styles.subtitle}>Gerencie os profissionais cadastrados na plataforma Teko.</Text>
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
          <Text style={styles.newButtonText}>Novo profissional</Text>
        </Pressable>

        {/* Horizontal Carousel for Metrics with Arrows */}
        <View style={styles.carouselWrapper}>
          
          {/* Left Arrow */}
          {scrollX > 20 && (
            <TouchableOpacity 
              style={[styles.arrowContainer, styles.arrowLeft]}
              onPress={() => scrollViewRef.current?.scrollTo({ x: 0, animated: true })}
            >
              <ChevronLeft color={theme.colors.textDark} size={28} />
            </TouchableOpacity>
          )}

          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            contentContainerStyle={styles.carouselContainer}
            onScroll={(e) => setScrollX(e.nativeEvent.contentOffset.x)}
            scrollEventThrottle={16}
          >
            {/* Profissionais Ativos */}
            <View style={styles.card}>
              <View style={[styles.iconWrapper, { backgroundColor: theme.colors.tealSoft }]}>
                <Users color={theme.colors.primary} size={24} />
              </View>
              <View>
                {loading ? (
                  <ActivityIndicator color={theme.colors.primary} style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text style={styles.cardNumber}>{stats.profissionais}</Text>
                )}
                <Text style={styles.cardLabel}>Profissionais ativos</Text>
              </View>
            </View>

            {/* Relatórios Gerados */}
            <View style={styles.card}>
              <View style={[styles.iconWrapper, { backgroundColor: theme.colors.badgePurple }]}>
                <FileText color={theme.colors.badgePurpleText} size={24} />
              </View>
              <View>
                {loading ? (
                  <ActivityIndicator color={theme.colors.primary} style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text style={styles.cardNumber}>{stats.relatorios}</Text>
                )}
                <Text style={styles.cardLabel}>Relatórios gerados</Text>
              </View>
            </View>

            {/* Crianças na plataforma */}
            <View style={styles.card}>
              <View style={[styles.iconWrapper, { backgroundColor: theme.colors.tealSoft }]}>
                <Baby color={theme.colors.primary} size={24} />
              </View>
              <View>
                {loading ? (
                  <ActivityIndicator color={theme.colors.primary} style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text style={styles.cardNumber}>{stats.criancas}</Text>
                )}
                <Text style={styles.cardLabel}>Crianças na plataforma</Text>
              </View>
            </View>
          </ScrollView>

          {/* Right Arrow */}
          {scrollX < 180 && (
            <TouchableOpacity 
              style={[styles.arrowContainer, styles.arrowRight]}
              onPress={() => scrollViewRef.current?.scrollTo({ x: 300, animated: true })}
            >
              <ChevronRight color={theme.colors.textDark} size={28} />
            </TouchableOpacity>
          )}
        </View>

        {/* Profissionais Cadastrados Section */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Profissionais Cadastrados</Text>
          
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} style={{ marginTop: 40 }} />
          ) : recentPsychologists.length === 0 ? (
            <View style={styles.emptyState}>
              <UserCircle color={theme.colors.textMuted} size={48} />
              <Text style={styles.emptyStateText}>Nenhum profissional cadastrado ainda.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {recentPsychologists.map((psi) => (
                <View key={psi.id} style={styles.listItem}>
                  <View style={styles.listHeader}>
                    <View style={styles.avatar}>
                      <UserCircle color={theme.colors.primary} size={24} />
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
                </View>
              ))}
            </View>
          )}

          <Pressable 
            style={({ pressed }) => [
              styles.seeAllButton,
              pressed && { backgroundColor: theme.colors.primaryDark }
            ]}
            onPress={onNavigateToPsychologists}
          >
            <Text style={styles.seeAllButtonText}>Ver todos os profissionais</Text>
          </Pressable>
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
  carouselWrapper: {
    position: 'relative',
    marginHorizontal: -20,
    marginBottom: 32,
  },
  carouselContainer: {
    paddingHorizontal: 20,
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    width: 200,
    height: 160,
    justifyContent: 'space-between',
    ...theme.shadows.card,
  },
  iconWrapper: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNumber: {
    color: theme.colors.textDark,
    fontSize: 28,
    fontWeight: '900',
    marginBottom: 2,
  },
  cardLabel: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '600',
  },
  arrowContainer: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    ...theme.shadows.subtle,
  },
  arrowLeft: {
    left: 8,
  },
  arrowRight: {
    right: 8,
  },
  listSection: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 16,
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
  seeAllButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  seeAllButtonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

