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
import { theme } from '../../theme/theme';

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
            <Search color={theme.colors.textMuted} size={18} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Buscar profissional..."
              placeholderTextColor={theme.colors.textMuted}
              value={searchTerm}
              onChangeText={setSearchTerm}
            />
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.newButton,
              pressed && { backgroundColor: theme.colors.primaryDark }
            ]}
            onPress={onNavigateToNewPsychologist}
          >
            <Plus color="#FFF" size={18} />
            <Text style={styles.newButtonText}>Novo Profissional</Text>
          </Pressable>
        </View>

        {/* List of Psychologists */}
        <View style={styles.listSection}>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginTop: 60 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Users color={theme.colors.textMuted} size={42} />
              <Text style={styles.emptyStateText}>Nenhum profissional encontrado.</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filtered.map((psi) => (
                <View key={psi.id} style={styles.card}>
                  <View style={styles.cardHeader}>
                    <View style={styles.avatar}>
                      <UserCircle color={theme.colors.primary} size={24} />
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
                      <Users color={theme.colors.primary} size={14} />
                      <Text style={styles.metricText}>Crianças: {psi.childrenCount || 0}</Text>
                    </View>
                    <View style={styles.metricBadge}>
                      <FileText color={theme.colors.badgePurpleText} size={14} />
                      <Text style={styles.metricText}>Relatórios: {psi.reportsCount || 0}</Text>
                    </View>
                  </View>

                  <Pressable 
                    style={({ pressed }) => [
                      styles.profileButton,
                      pressed && { backgroundColor: theme.colors.tealSoft }
                    ]}
                    onPress={() => setSelectedActionPsi(psi)}
                  >
                    <Text style={styles.profileButtonText}>Acessar Perfil</Text>
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
              <X color={theme.colors.textDark} size={22} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Acessar Perfil</Text>
              <Text style={styles.modalSubtitle}>O que você deseja gerenciar em <Text style={{ fontWeight: '800', color: theme.colors.primary }}>{selectedActionPsi?.name}</Text>?</Text>
            </View>

            <View style={styles.modalCardsContainer}>
              
              {/* Card Credenciais */}
              <Pressable 
                style={({ pressed }) => [
                  styles.actionCard,
                  pressed && { borderColor: theme.colors.primary, backgroundColor: theme.colors.tealSoft }
                ]}
                onPress={() => {
                  setSelectedActionPsi(null);
                  if (onNavigateToAdminPsychologistProfile && selectedActionPsi) {
                    onNavigateToAdminPsychologistProfile(selectedActionPsi.id, selectedActionPsi.name);
                  }
                }}
              >
                <View style={[styles.actionCardIcon, { backgroundColor: theme.colors.tealSoft }]}>
                  <Key color={theme.colors.primary} size={26} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionCardTitle}>Credenciais do Profissional</Text>
                  <Text style={styles.actionCardDesc}>Gerencie e-mail, senha e dados cadastrais.</Text>
                </View>
              </Pressable>

              {/* Card Pacientes */}
              <Pressable 
                style={({ pressed }) => [
                  styles.actionCard,
                  pressed && { borderColor: theme.colors.badgePurpleText, backgroundColor: theme.colors.badgePurple }
                ]}
                onPress={() => {
                  setSelectedActionPsi(null);
                  if (onNavigateToAdminPatients && selectedActionPsi) {
                    onNavigateToAdminPatients(selectedActionPsi.id, selectedActionPsi.name);
                  }
                }}
              >
                <View style={[styles.actionCardIcon, { backgroundColor: theme.colors.badgePurple }]}>
                  <Baby color={theme.colors.badgePurpleText} size={26} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionCardTitle}>Pacientes do Profissional</Text>
                  <Text style={styles.actionCardDesc}>Visualize e gerencie a lista de crianças vinculadas.</Text>
                </View>
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
  title: {
    color: theme.colors.textDark,
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: -0.4,
  },
  subtitle: {
    color: theme.colors.textMuted,
    fontSize: 14,
    marginTop: 2,
  },
  actionsContainer: {
    gap: 10,
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.full,
    paddingHorizontal: 16,
    height: 46,
    ...theme.shadows.subtle,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textDark,
    fontSize: 14,
  },
  newButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    height: 46,
    borderRadius: theme.radii.lg,
    gap: 8,
    ...theme.shadows.subtle,
  },
  newButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listSection: {
    flex: 1,
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
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.card,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
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
    marginTop: 1,
  },
  cardDetails: {
    gap: 4,
    marginBottom: 12,
  },
  itemMeta: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  metaValue: {
    color: theme.colors.textDark,
    fontWeight: '600',
  },
  metricsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  metricBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    gap: 6,
  },
  metricText: {
    color: theme.colors.textDark,
    fontSize: 12,
    fontWeight: '600',
  },
  profileButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.subtle,
  },
  profileButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.xl,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.floating,
    position: 'relative',
  },
  modalCloseButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  modalHeader: {
    marginBottom: 16,
    paddingRight: 32,
  },
  modalTitle: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 4,
    lineHeight: 18,
  },
  modalCardsContainer: {
    gap: 12,
  },
  actionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderRadius: theme.radii.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    backgroundColor: theme.colors.bg,
  },
  actionCardIcon: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionCardTitle: {
    color: theme.colors.textDark,
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  actionCardDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
  },
});

