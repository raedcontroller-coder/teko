import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, ActivityIndicator, Platform, StatusBar, Pressable } from 'react-native';
import { UserPlus, Users, FileText, Gamepad2, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { api } from '../../services/api';
import { NewPatientScreen } from './NewPatientScreen';

interface DashboardScreenProps {
  onNavigateToPatients?: () => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({ onNavigateToPatients }) => {
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scrollX, setScrollX] = useState(0);
  const [isCreatingPatient, setIsCreatingPatient] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

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

  const recentPatients = patients.slice(0, 3);

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

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header Actions */}
        <View style={styles.header}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Resumo Clínico</Text>
            <Text style={styles.subtitle}>Acompanhe o progresso dos seus pacientes em tempo real.</Text>
          </View>
        </View>

        <Pressable 
          style={({ pressed }) => [
            styles.newPatientButton,
            pressed && { backgroundColor: '#7B61FF' }
          ]}
          onPress={() => setIsCreatingPatient(true)}
        >
          {({ pressed }) => (
            <>
              <UserPlus color={pressed ? "#FFF" : "#181c1c"} size={20} />
              <Text style={[styles.newPatientButtonText, pressed && { color: '#FFF' }]}>Novo Paciente</Text>
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
          {/* Pacientes Ativos */}
          <View style={[styles.card, styles.interactiveCard]}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Users color="#FFC857" size={24} />
            </View>
            <View>
              {loading ? (
                <ActivityIndicator color="#FFF" style={{ alignSelf: 'flex-start' }} />
              ) : (
                <Text style={styles.cardNumber}>{patients.length}</Text>
              )}
              <Text style={styles.cardLabel}>Pacientes Ativos</Text>
            </View>
          </View>

          {/* Relatórios Prontos */}
          <View style={[styles.card, { opacity: 0.5 }]}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <FileText color="rgba(255,255,255,0.4)" size={24} />
            </View>
            <View>
              <Text style={[styles.cardNumber, { color: 'rgba(255,255,255,0.5)' }]}>0</Text>
              <Text style={[styles.cardLabel, { color: 'rgba(255,255,255,0.5)' }]}>Relatórios Prontos</Text>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>EM BREVE...</Text>
              </View>
            </View>
          </View>

          {/* Sessões Concluídas */}
          <View style={[styles.card, styles.interactiveCard]}>
            <View style={[styles.iconWrapper, { backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Gamepad2 color="#FFC857" size={24} />
            </View>
            <View>
              {loading ? (
                <ActivityIndicator color="#FFF" style={{ alignSelf: 'flex-start' }} />
              ) : (
                <Text style={styles.cardNumber}>{patients.reduce((acc, p) => acc + (p.sessionCount || 0), 0)}</Text>
              )}
              <Text style={styles.cardLabel}>Sessões Concluídas</Text>
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

        {/* Recent Patients Section */}
        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>Pacientes Recentes</Text>
          
          <View style={styles.tableContainer}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableHeaderText, { flex: 2 }]}>Nome do Paciente</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'center' }]}>Idade</Text>
              <Text style={[styles.tableHeaderText, { flex: 1, textAlign: 'right' }]}>Última Sessão</Text>
            </View>

            {loading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator color="#E6A800" size="large" />
              </View>
            ) : recentPatients.length > 0 ? (
              recentPatients.map((patient) => (
                <View key={patient.id} style={styles.tableRow}>
                  <Text style={[styles.tableCellText, { flex: 2, fontWeight: 'bold' }]}>{patient.name}</Text>
                  <Text style={[styles.tableCellText, { flex: 1, textAlign: 'center' }]}>{patient.age}</Text>
                  <View style={{ flex: 1, alignItems: 'flex-end' }}>
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>
                        {patient.lastSessionDate 
                          ? new Date(patient.lastSessionDate).toLocaleDateString('pt-BR') 
                          : 'NENHUMA'
                        }
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>Nenhum paciente cadastrado ainda.</Text>
              </View>
            )}
          </View>
          
          {/* Botão Ver Todos os Pacientes */}
          <Pressable 
            style={({ pressed }) => [
              styles.viewAllButton,
              pressed && { backgroundColor: '#7B61FF', borderColor: '#7B61FF' }
            ]}
            onPress={onNavigateToPatients}
          >
            {({ pressed }) => (
              <Text style={[styles.viewAllButtonText, pressed && { color: '#FFF' }]}>Ver todos os pacientes</Text>
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
    backgroundColor: '#084D48',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 100, // Margem inferior gigantesca para não colar no BottomBar
  },
  header: {
    marginBottom: 20,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
  },
  newPatientButton: {
    backgroundColor: '#FFC857',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 24,
  },
  newPatientButtonText: {
    color: '#181c1c',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  carouselWrapper: {
    position: 'relative',
    justifyContent: 'center',
    marginBottom: 16,
  },
  arrowContainer: {
    position: 'absolute',
    top: '50%',
    marginTop: -24, // Metade da altura (supondo 48px)
    width: 40,
    height: 48,
    backgroundColor: 'rgba(0,0,0,0.4)', // Fundo translúcido para contraste
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    borderRadius: 8,
  },
  arrowLeft: {
    left: 0,
  },
  arrowRight: {
    right: 0,
  },
  carouselContainer: {
    paddingBottom: 16,
  },
  card: {
    width: 200,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    padding: 20,
    marginRight: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'column',
    justifyContent: 'space-between',
    minHeight: 160,
  },
  interactiveCard: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderColor: 'rgba(255,255,255,0.2)',
  },
  iconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  cardNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  cardLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
    letterSpacing: 1,
  },
  recentSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 16,
  },
  tableContainer: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  tableHeader: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
  },
  tableHeaderText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center',
  },
  tableCellText: {
    fontSize: 14,
    color: '#FFF',
  },
  loadingContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 32,
    alignItems: 'center',
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  viewAllButton: {
    backgroundColor: '#FFC857',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  viewAllButtonText: {
    color: '#181c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
