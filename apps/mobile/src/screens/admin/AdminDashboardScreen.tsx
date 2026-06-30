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
            pressed && { backgroundColor: '#7B61FF' }
          ]}
          onPress={onNavigateToNewPsychologist}
        >
          {({ pressed }) => (
            <>
              <Plus color={pressed ? "#FFF" : "#181c1c"} size={20} />
              <Text style={[styles.newButtonText, pressed && { color: '#FFF' }]}>Novo profissional</Text>
            </>
          )}
        </Pressable>

        {/* Horizontal Carousel for Metrics with Arrows */}
        <View style={styles.carouselWrapper}>
          
          {/* Left Arrow */}
          {scrollX > 20 && (
            <TouchableOpacity 
              style={[styles.arrowContainer, styles.arrowLeft]}
              onPress={() => scrollViewRef.current?.scrollTo({ x: 0, animated: true })}
            >
              <ChevronLeft color="rgba(255,255,255,0.7)" size={28} />
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
            <View style={[styles.card, styles.interactiveCard]}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Users color="#FFC857" size={24} />
              </View>
              <View>
                {loading ? (
                  <ActivityIndicator color="#FFF" style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text style={styles.cardNumber}>{stats.profissionais}</Text>
                )}
                <Text style={styles.cardLabel}>Profissionais ativos</Text>
              </View>
            </View>

            {/* Relatórios Gerados */}
            <View style={[styles.card, styles.interactiveCard]}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <FileText color="#7B61FF" size={24} />
              </View>
              <View>
                {loading ? (
                  <ActivityIndicator color="#FFF" style={{ alignSelf: 'flex-start' }} />
                ) : (
                  <Text style={styles.cardNumber}>{stats.relatorios}</Text>
                )}
                <Text style={styles.cardLabel}>Relatórios gerados</Text>
              </View>
            </View>

            {/* Crianças na plataforma */}
            <View style={[styles.card, styles.interactiveCard]}>
              <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
                <Baby color="#D8E6CC" size={24} />
              </View>
              <View>
                {loading ? (
                  <ActivityIndicator color="#FFF" style={{ alignSelf: 'flex-start' }} />
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
              <ChevronRight color="rgba(255,255,255,0.7)" size={28} />
            </TouchableOpacity>
          )}
        </View>

        {/* Profissionais Cadastrados Section */}
        <View style={styles.listSection}>
          <Text style={styles.sectionTitle}>Profissionais Cadastrados</Text>
          
          {loading ? (
            <ActivityIndicator color="#FFC857" style={{ marginTop: 40 }} />
          ) : recentPsychologists.length === 0 ? (
            <View style={styles.emptyState}>
              <UserCircle color="rgba(255,255,255,0.2)" size={48} />
              <Text style={styles.emptyStateText}>Nenhum profissional cadastrado ainda.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {recentPsychologists.map((psi) => (
                <View key={psi.id} style={styles.listItem}>
                  <View style={styles.listHeader}>
                    <View style={styles.avatar}>
                      <UserCircle color="#FFF" size={24} />
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
              pressed && { backgroundColor: '#7B61FF' }
            ]}
            onPress={onNavigateToPsychologists}
          >
            {({ pressed }) => (
              <Text style={[styles.seeAllButtonText, pressed && { color: '#FFF' }]}>Ver todos os profissionais</Text>
            )}
          </Pressable>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#064b46',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
  },
  header: {
    marginBottom: 24,
  },
  headerTextContainer: {},
  title: {
    color: '#FFF',
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 4,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC857',
    paddingVertical: 16,
    borderRadius: 16,
    marginBottom: 32,
    gap: 8,
  },
  newButtonText: {
    color: '#181c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  carouselWrapper: {
    position: 'relative',
    marginHorizontal: -24, // Extends full width for scrolling
    marginBottom: 40,
  },
  carouselContainer: {
    paddingHorizontal: 24,
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    width: 200,
    height: 180,
    justifyContent: 'space-between',
  },
  interactiveCard: {
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardNumber: {
    color: '#FFF',
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardLabel: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    fontWeight: '500',
  },
  arrowContainer: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
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
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 12,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontStyle: 'italic',
  },
  listContainer: {
    gap: 12,
    marginBottom: 24,
  },
  listItem: {
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
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
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  itemName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  itemEmail: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  listFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  itemMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 12,
  },
  seeAllButton: {
    backgroundColor: '#FFC857',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  seeAllButtonText: {
    color: '#181c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
