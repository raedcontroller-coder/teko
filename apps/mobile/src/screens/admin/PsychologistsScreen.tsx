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
  Modal,
  Image
} from 'react-native';
import { Search, Plus, UserCircle, Users, FileText, X, Key, Baby, Calendar } from 'lucide-react-native';
import { api } from '../../services/api';
import { theme } from '../../theme/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from '../../i18n';

interface PsychologistsScreenProps {
  onNavigateToNewPsychologist?: () => void;
  onNavigateToAdminPatients?: (psiId: string, psiName: string) => void;
  onNavigateToAdminPsychologistProfile?: (psiId: string, psiName: string) => void;
  onNavigateToAdminAgenda?: (psiId: string, psiName: string) => void;
  initialSelectedPsi?: { id: string, name: string } | null;
}


export const PsychologistsScreen: React.FC<PsychologistsScreenProps> = ({ 
  onNavigateToNewPsychologist, 
  onNavigateToAdminPatients, 
  onNavigateToAdminPsychologistProfile,
  onNavigateToAdminAgenda,
  initialSelectedPsi
}) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [psychologists, setPsychologists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedActionPsi, setSelectedActionPsi] = useState<any>(initialSelectedPsi || null);

  useEffect(() => {
    if (initialSelectedPsi) {
      setSelectedActionPsi(initialSelectedPsi);
    }
  }, [initialSelectedPsi]);

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
          <Text style={styles.title}>{t.admin.psychologistsTitle}</Text>
          <Text style={styles.subtitle}>{t.admin.psychologistsSubtitle}</Text>
        </View>

        {/* Top Actions: Search and New Button */}
        <View style={styles.actionsContainer}>
          <View style={styles.searchContainer}>
            <Search color={theme.colors.textMuted} size={18} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder={t.admin.searchProfessionalPlaceholder}
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
            <Text style={styles.newButtonText}>{t.admin.newProfessional}</Text>
          </Pressable>
        </View>

        {/* List of Psychologists */}
        <View style={styles.listSection}>
          {loading ? (
            <ActivityIndicator color={theme.colors.primary} size="large" style={{ marginTop: 60 }} />
          ) : filtered.length === 0 ? (
            <View style={styles.emptyState}>
              <Users color={theme.colors.textMuted} size={42} />
              <Text style={styles.emptyStateText}>{t.admin.noProfessionals}</Text>
            </View>
          ) : (
            <View style={styles.listContainer}>
              {filtered.map((psi) => (
                <Pressable 
                  key={psi.id} 
                  style={({ pressed }) => [
                    styles.card,
                    pressed && { transform: [{ scale: 0.99 }], opacity: 0.9 }
                  ]}
                  onPress={() => setSelectedActionPsi(psi)}
                >
                  <View style={styles.cardHeader}>
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

                  <View style={styles.cardDetails}>
                    <Text style={styles.itemMeta}>CRP: <Text style={styles.metaValue}>{psi.crp || "-"}</Text></Text>
                    <Text style={styles.itemMeta}>{t.admin.clinicLabel.split(':')[0]}: <Text style={styles.metaValue}>{psi.clinicName || "-"}</Text></Text>
                  </View>

                  <View style={styles.metricsContainer}>
                    <View style={styles.metricBadge}>
                      <Users color={theme.colors.primary} size={14} />
                      <Text style={styles.metricText}>{t('admin.childrenCountLabel', { count: psi.childrenCount || 0 })}</Text>
                    </View>
                    <View style={styles.metricBadge}>
                      <FileText color={theme.colors.badgePurpleText} size={14} />
                      <Text style={styles.metricText}>{t('admin.reportsCountLabel', { count: psi.reportsCount || 0 })}</Text>
                    </View>
                  </View>

                  <View style={styles.profileButton}>
                    <Text style={styles.profileButtonText}>{t.admin.accessProfileBtn}</Text>
                  </View>
                </Pressable>
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
          <View style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            
            <TouchableOpacity style={styles.modalCloseButton} onPress={() => setSelectedActionPsi(null)}>
              <X color={theme.colors.textDark} size={22} />
            </TouchableOpacity>

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{t.admin.accessProfileModalTitle}</Text>
              <Text style={styles.modalSubtitle}>{t('admin.accessProfileModalSub', { name: selectedActionPsi?.name || '' })}</Text>
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
                  <Text style={styles.actionCardTitle}>{t.admin.profCredentialsCardTitle}</Text>
                  <Text style={styles.actionCardDesc}>{t.admin.profCredentialsCardDesc}</Text>
                </View>
              </Pressable>

              {/* Card Agenda */}
              <Pressable 
                style={({ pressed }) => [
                  styles.actionCard,
                  pressed && { borderColor: theme.colors.primary, backgroundColor: theme.colors.tealSoft }
                ]}
                onPress={() => {
                  setSelectedActionPsi(null);
                  if (onNavigateToAdminAgenda && selectedActionPsi) {
                    onNavigateToAdminAgenda(selectedActionPsi.id, selectedActionPsi.name);
                  }
                }}
              >
                <View style={[styles.actionCardIcon, { backgroundColor: theme.colors.tealSoft }]}>
                  <Calendar color={theme.colors.primary} size={26} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.actionCardTitle}>{t.admin.viewAgendaCardTitle}</Text>
                  <Text style={styles.actionCardDesc}>{t.admin.viewAgendaCardDesc}</Text>
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
                  <Text style={styles.actionCardTitle}>{t.admin.profPatientsCardTitle}</Text>
                  <Text style={styles.actionCardDesc}>{t.admin.profPatientsCardDesc}</Text>
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

