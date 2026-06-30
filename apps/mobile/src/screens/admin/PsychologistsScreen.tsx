import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  ScrollView,
  Pressable,
  Modal
} from 'react-native';
import { Search, Plus, UserCircle, Users, FileText, X, Key, Baby } from 'lucide-react-native';
import { api } from '../../services/api';

interface PsychologistsScreenProps {
  onNavigateToNewPsychologist?: () => void;
  onNavigateToAdminPatients?: (psiId: string, psiName: string) => void;
  onNavigateToAdminPsychologistProfile?: (psiId: string, psiName: string) => void;
}

export const PsychologistsScreen: React.FC<PsychologistsScreenProps> = ({ onNavigateToNewPsychologist, onNavigateToAdminPatients, onNavigateToAdminPsychologistProfile }) => {
  const [psychologists, setPsychologists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionPsi, setSelectedActionPsi] = useState<any>(null);

  const fetchPsychologists = async () => {
    try {
      setLoading(true);
      const response = await api.get('/api/admin/psychologists');
      if (response.data.success) {
        setPsychologists(response.data.data);
      }
    } catch (error) {
      console.error('Erro ao buscar psicólogos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPsychologists();
  }, []);

  const filtered = psychologists.filter((psi) =>
    psi.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    psi.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Meus Profissionais</Text>
          <Text style={styles.subtitle}>Gerencie a lista completa de psicólogos da plataforma Teko.</Text>
        </View>

        {/* Top Actions: Search and New Button */}
        <View style={styles.actionsContainer}>
          <View style={styles.searchContainer}>
            <Search color="rgba(255,255,255,0.5)" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar profissional..."
              placeholderTextColor="rgba(255,255,255,0.4)"
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
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
                <Plus color={pressed ? "#FFF" : "#084D48"} size={20} />
                <Text style={[styles.newButtonText, pressed && { color: '#FFF' }]}>Novo Profissional</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* List of Psychologists */}
        <View style={styles.listSection}>
          {loading ? (
            <ActivityIndicator color="#FFC857" size="large" style={{ marginTop: 60 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Users color="rgba(255,255,255,0.2)" size={48} />
              <Text style={styles.emptyStateText}>Nenhum profissional encontrado.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filtered.map((psi) => (
                <View key={psi.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <UserCircle color="#FFF" size={24} />
                    </View>
                    <View style={styles.infoContainer}>
                      <Text style={styles.itemName}>{psi.name}</Text>
                      <Text style={styles.itemEmail}>{psi.email}</Text>
                    </View>
                  </View>

                  <View style={styles.cardDetails}>
                    <Text style={styles.itemMeta}>CRP: <Text style={styles.metaValue}>{psi.crp || "-"}</Text></Text>
                    <Text style={styles.itemMeta}>Clínica: <Text style={styles.metaValue}>{psi.clinicName || "-"}</Text></Text>
                  </View>

                  <View style={styles.metricsContainer}>
                    <View style={styles.metricBadge}>
                      <Users color="#FFC857" size={14} />
                      <Text style={styles.metricText}>Crianças: {psi.childrenCount || 0}</Text>
                    </View>
                    <View style={styles.metricBadge}>
                      <FileText color="#7B61FF" size={14} />
                      <Text style={styles.metricText}>Relatórios: {psi.reportsCount || 0}</Text>
                    </View>
                  </View>

                  <Pressable 
                    style={({ pressed }) => [
                      styles.profileButton,
                      pressed && { backgroundColor: 'rgba(255,255,255,0.2)' }
                    ]}
                    onPress={() => setSelectedActionPsi(psi)}
                  >
                    {({ pressed }) => (
                      <Text style={[styles.profileButtonText, pressed && { color: '#FFC857' }]}>Acessar Perfil</Text>
                    )}
                  </Pressable>
                </View>
              ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* Modal Central de Ações */}
      <Modal
        visible={!!selectedActionPsi}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSelectedActionPsi(null)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedActionPsi(null)}>
              <X color="#FFF" size={24} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Acessar Perfil</Text>
              <Text style={styles.modalSubtitle}>O que você deseja gerenciar em <Text style={{ fontWeight: 'bold', color: '#FFF' }}>{selectedActionPsi?.name}</Text>?</Text>
            </View>

            <View style={styles.modalCardsContainer}>
              
              {/* Card Credenciais (Amarelo) */}
              <Pressable 
                style={({ pressed }) => [
                  styles.actionCard,
                  styles.actionCardYellow,
                  pressed && styles.actionCardYellowPressed
                ]}
                onPress={() => {
                  setSelectedActionPsi(null);
                  if (onNavigateToAdminPsychologistProfile && selectedActionPsi) {
                    onNavigateToAdminPsychologistProfile(selectedActionPsi.id, selectedActionPsi.name);
                  }
                }}
              >
                <View style={styles.actionCardWatermark}>
                  <Key color="rgba(255, 200, 87, 0.1)" size={120} />
                </View>
                <View style={styles.actionCardIconYellow}>
                  <Key color="#FFC857" size={32} />
                </View>
                <Text style={styles.actionCardTitleYellow}>Credenciais do Profissional</Text>
              </Pressable>

              {/* Card Pacientes (Roxo) */}
              <Pressable 
                style={({ pressed }) => [
                  styles.actionCard,
                  styles.actionCardPurple,
                  pressed && styles.actionCardPurplePressed
                ]}
                onPress={() => {
                  setSelectedActionPsi(null);
                  if (onNavigateToAdminPatients && selectedActionPsi) {
                    onNavigateToAdminPatients(selectedActionPsi.id, selectedActionPsi.name);
                  }
                }}
              >
                <View style={styles.actionCardWatermark}>
                  <Baby color="rgba(123, 97, 255, 0.1)" size={120} />
                </View>
                <View style={styles.actionCardIconPurple}>
                  <Baby color="#7B61FF" size={32} />
                </View>
                <Text style={styles.actionCardTitlePurple}>Pacientes do Profissional</Text>
              </Pressable>

            </View>

          </View>
        </View>
      </Modal>

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
  actionsContainer: {
    gap: 16,
    marginBottom: 32,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 100,
    paddingHorizontal: 16,
    height: 50,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC857',
    height: 50,
    borderRadius: 100,
    gap: 8,
  },
  newButtonText: {
    color: '#084D48',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listSection: {
    flex: 1,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyStateText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 16,
    fontStyle: 'italic',
  },
  listContainer: {
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 16,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContainer: {
    flex: 1,
  },
  itemName: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  itemEmail: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
    marginTop: 2,
  },
  cardDetails: {
    gap: 8,
    marginBottom: 16,
  },
  itemMeta: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },
  metaValue: {
    color: '#FFF',
    fontWeight: '500',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
    gap: 6,
  },
  metricText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    backgroundColor: '#064b46',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalHeader: {
    marginBottom: 24,
    marginTop: 8,
  },
  modalTitle: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    marginTop: 8,
    lineHeight: 22,
  },
  modalCardsContainer: {
    gap: 16,
  },
  actionCard: {
    borderRadius: 20,
    padding: 24,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  actionCardWatermark: {
    position: 'absolute',
    top: -20,
    right: -20,
    pointerEvents: 'none',
  },
  actionCardYellow: {
    backgroundColor: 'rgba(255, 200, 87, 0.05)',
    borderColor: 'rgba(255, 200, 87, 0.3)',
  },
  actionCardYellowPressed: {
    backgroundColor: 'rgba(255, 200, 87, 0.15)',
    borderColor: '#FFC857',
  },
  actionCardIconYellow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 200, 87, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 200, 87, 0.5)',
  },
  actionCardTitleYellow: {
    color: '#FFC857',
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionCardPurple: {
    backgroundColor: 'rgba(123, 97, 255, 0.05)',
    borderColor: 'rgba(123, 97, 255, 0.3)',
  },
  actionCardPurplePressed: {
    backgroundColor: 'rgba(123, 97, 255, 0.15)',
    borderColor: '#7B61FF',
  },
  actionCardIconPurple: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(123, 97, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(123, 97, 255, 0.5)',
  },
  actionCardTitlePurple: {
    color: '#7B61FF',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
