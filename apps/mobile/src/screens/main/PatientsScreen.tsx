import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  FlatList, 
  ActivityIndicator,
  Platform,
  Pressable,
  Animated,
  Easing,
  Image
} from 'react-native';
import { Search, UserPlus, FileText, CheckCircle2, ArrowLeft, ChevronRight } from 'lucide-react-native';
import { api } from '../../services/api';
import { NewPatientScreen } from './NewPatientScreen';
import { PatientProfileScreen } from './PatientProfileScreen';
import { theme } from '../../theme/theme';
import { SkeletonLoader } from '../../components/ui/SkeletonLoader';

import { useTranslation } from '../../i18n';
import { getChildAvatarSource } from '../../utils/patientAvatarHelper';

interface PatientsScreenProps {
  adminPsicologoId?: string;
  adminPsicologoName?: string;
  onGoBack?: () => void;
}

export const PatientsScreen: React.FC<PatientsScreenProps> = ({ adminPsicologoId, adminPsicologoName, onGoBack }) => {
  const { t } = useTranslation();
  const [currentView, setCurrentView] = useState<'List' | 'New' | 'Profile'>('List');
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    Animated.timing(slideAnim, {
      toValue: Platform.OS === 'ios' ? 70 : 50,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5)),
    }).start();

    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -150,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start(() => {
        setShowSuccessToast(false);
      });
    }, 3000);
  };

  useEffect(() => {
    const fetchPatients = async () => {
      try {
        setLoading(true);
        const url = adminPsicologoId ? `/api/patients?psicologoId=${adminPsicologoId}` : '/api/patients';
        const response = await api.get(url);
        if (response.data.success && response.data.data) {
          setPatients(response.data.data);
        }
      } catch (error) {
        console.error('Erro ao buscar pacientes:', error);
      } finally {
        setLoading(false);
      }
    };
    if (currentView === 'List') {
      fetchPatients();
    }
  }, [currentView, adminPsicologoId]);

  const filteredPatients = patients.filter((patient) =>
    patient.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const renderPatientCard = ({ item }: { item: any }) => {
    const avatarSource = getChildAvatarSource(item.avatarUrl, item.gender);

    return (
      <TouchableOpacity 
        style={styles.card}
        activeOpacity={0.8}
        onPress={() => {
          setSelectedPatientId(item.id);
          setCurrentView('Profile');
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.avatarImageContainer}>
            <Image source={avatarSource} style={styles.avatarImage} resizeMode="cover" />
          </View>
          <View style={styles.patientInfo}>
            <Text style={styles.patientName}>{item.name}</Text>
            <Text style={styles.patientAge}>{t('common.ageAndSessions', { age: item.age, count: item.sessionCount || 0 })}</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>
              {item.lastSessionDate 
                ? new Date(item.lastSessionDate).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }) 
                : t.common.new
              }
            </Text>
          </View>
        </View>
        
        <View style={styles.cardFooter}>
          <Text style={styles.profileActionText}>{t.patients.viewRecord}</Text>
          <ChevronRight size={16} color={theme.colors.primary} />
        </View>
      </TouchableOpacity>
    );
  };

  if (currentView === 'New') {
    return (
      <NewPatientScreen 
        adminPsicologoId={adminPsicologoId}
        onBack={() => setCurrentView('List')}
        onSuccess={() => {
          setCurrentView('List');
        }} 
      />
    );
  }

  if (currentView === 'Profile' && selectedPatientId) {
    return (
      <PatientProfileScreen
        patientId={selectedPatientId}
        adminPsicologoId={adminPsicologoId}
        onBack={() => {
          setSelectedPatientId(null);
          setCurrentView('List');
        }}
        onDeleteSuccess={() => {
          setSelectedPatientId(null);
          setCurrentView('List');
          showToast(t.patients.deleteSuccess);
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.title}>{adminPsicologoName ? t('patients.adminTitle', { name: adminPsicologoName }) : t.patients.title}</Text>
        <Text style={styles.subtitle}>{t.patients.subtitle}</Text>
      </View>

      {onGoBack && (
        <Pressable 
          style={styles.backButton}
          onPress={onGoBack}
        >
          <ArrowLeft color={theme.colors.primary} size={20} />
          <Text style={styles.backButtonText}>{t.patients.backToPsychologists}</Text>
        </Pressable>
      )}

      {/* Search & Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.searchBox}>
          <Search color={theme.colors.textMuted} size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={t.patients.searchPlaceholder}
            placeholderTextColor={theme.colors.textMuted}
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
        <Pressable 
          style={({ pressed }) => [
            styles.newPatientButton,
            pressed && { backgroundColor: theme.colors.primaryDark }
          ]}
          onPress={() => setCurrentView('New')}
        >
          <UserPlus color="#FFF" size={18} />
          <Text style={styles.newPatientText}>{t.patients.newPatientBtn}</Text>
        </Pressable>
      </View>

      {/* Patient List */}
      {loading ? (
        <View style={styles.listContent}>
          <SkeletonLoader variant="card" />
          <SkeletonLoader variant="card" />
          <SkeletonLoader variant="card" />
          <SkeletonLoader variant="card" />
          <SkeletonLoader variant="card" />
        </View>
      ) : (
        <FlatList
          data={filteredPatients}
          keyExtractor={(item) => item.id}
          renderItem={renderPatientCard}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <FileText color={theme.colors.textMuted} size={42} style={{ marginBottom: 12, opacity: 0.6 }} />
              <Text style={styles.emptyText}>Nenhum paciente encontrado.</Text>
            </View>
          }
        />
      )}

      {/* Popup de Sucesso */}
      {showSuccessToast && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.toastIconBg}>
            <CheckCircle2 color={theme.colors.primary} size={24} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>Sucesso!</Text>
            <Text style={styles.toastMessage}>{successMessage}</Text>
          </View>
        </Animated.View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,
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
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
    gap: 8,
  },
  backButtonText: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    gap: 10,
  },
  searchBox: {
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
    height: '100%',
  },
  newPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.primary,
    borderRadius: theme.radii.lg,
    height: 46,
    gap: 8,
    ...theme.shadows.subtle,
  },
  newPatientText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 12,
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.lg,
    padding: 16,
    ...theme.shadows.subtle,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  avatarImageContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    overflow: 'hidden',
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1.5,
    borderColor: theme.colors.tealMint,
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  patientInfo: {
    flex: 1,
  },
  patientName: {
    color: theme.colors.textDark,
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  patientAge: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  badge: {
    backgroundColor: theme.colors.badgePurple,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  badgeText: {
    color: theme.colors.badgePurpleText,
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 4,
  },
  profileActionText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  emptyText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },

  /* Toasts */
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    right: 16,
    left: 16,
    backgroundColor: theme.colors.cardBg, 
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    ...theme.shadows.floating,
  },
  toastIconBg: {
    width: 40, 
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastTitle: {
    color: theme.colors.textDark, 
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastMessage: {
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  }
});
