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
  Easing
} from 'react-native';
import { Search, UserPlus, FileText, CheckCircle2, ArrowLeft } from 'lucide-react-native';
import { api } from '../../services/api';
import { NewPatientScreen } from './NewPatientScreen';
import { PatientProfileScreen } from './PatientProfileScreen';

interface PatientsScreenProps {
  adminPsicologoId?: string;
  adminPsicologoName?: string;
  onGoBack?: () => void;
}

export const PatientsScreen: React.FC<PatientsScreenProps> = ({ adminPsicologoId, adminPsicologoName, onGoBack }) => {
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

  const renderPatientCard = ({ item }: { item: any }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.patientName}>{item.name}</Text>
          <Text style={styles.patientAge}>{item.age} anos</Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>
            {item.lastSessionDate 
              ? new Date(item.lastSessionDate).toLocaleDateString('pt-BR') 
              : 'Nenhuma'
            }
          </Text>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <TouchableOpacity 
          style={styles.profileButton} 
          activeOpacity={0.7}
          onPress={() => {
            setSelectedPatientId(item.id);
            setCurrentView('Profile');
          }}
        >
          <Text style={styles.profileButtonText}>Acessar Perfil</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

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
          showToast('Paciente excluído com sucesso.');
        }}
      />
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Info */}
      <View style={styles.header}>
        <Text style={styles.title}>{adminPsicologoName ? `Pacientes de ${adminPsicologoName}` : 'Meus Pacientes'}</Text>
        <Text style={styles.subtitle}>Pesquise e acesse os relatórios e perfis de todos {adminPsicologoName ? 'estes pacientes' : 'os seus pacientes'}.</Text>
      </View>

      {onGoBack && (
        <Pressable 
          style={styles.backButton}
          onPress={onGoBack}
        >
          {({ pressed }) => (
            <>
              <ArrowLeft color={pressed ? "#FFC857" : "#FFF"} size={24} />
              <Text style={[styles.backButtonText, pressed && { color: '#FFC857' }]}>Voltar para Meus Profissionais</Text>
            </>
          )}
        </Pressable>
      )}

      {/* Search & Actions */}
      <View style={styles.actionsContainer}>
        <View style={styles.searchBox}>
          <Search color="rgba(255,255,255,0.5)" size={18} style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar paciente..."
            placeholderTextColor="rgba(255,255,255,0.4)"
            value={searchTerm}
            onChangeText={setSearchTerm}
          />
        </View>
          <Pressable 
            style={({ pressed }) => [
              styles.newPatientButton,
              pressed && { backgroundColor: '#7B61FF' }
            ]}
            onPress={() => setCurrentView('New')}
          >
            {({ pressed }) => (
              <>
                <UserPlus color={pressed ? "#FFF" : "#181c1c"} size={20} />
                <Text style={[styles.newPatientText, pressed && { color: '#FFF' }]}>Novo Paciente</Text>
              </>
            )}
          </Pressable>
      </View>

      {/* Patient List */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#E6A800" />
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
              <FileText color="rgba(255,255,255,0.2)" size={48} style={{ marginBottom: 16 }} />
              <Text style={styles.emptyText}>Nenhum paciente encontrado.</Text>
            </View>
          }
        />
      )}

      {/* Popup de Sucesso (Topo, grande e escuro) */}
      {showSuccessToast && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.toastIconBg}>
            <CheckCircle2 color="#FFC857" size={28} />
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
    backgroundColor: '#064b46', // body bg
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
    lineHeight: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 24,
  },
  backButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  actionsContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 999,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: '#FFF',
    fontSize: 14,
    height: '100%',
  },
  newPatientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFC857',
    borderRadius: 12,
    height: 48,
    gap: 8,
  },
  newPatientText: {
    color: '#181c1c',
    fontSize: 14,
    fontWeight: 'bold',
  },
  listContent: {
    paddingHorizontal: 24,
    paddingBottom: 100, // padding extra pro bottom tab bar
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16,
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  patientName: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  patientAge: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  badge: {
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingTop: 16,
    alignItems: 'flex-end',
  },
  profileButton: {
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  profileButtonText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: '600',
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
  },
  emptyText: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 14,
  },

  /* Toasts */
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    right: 16,
    left: 16,
    backgroundColor: '#181c1c', 
    borderLeftWidth: 6,
    borderLeftColor: '#FFC857',
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20, 
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20, 
  },
  toastIconBg: {
    width: 50, 
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,200,87,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  toastTitle: {
    color: '#FFC857', 
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '500',
  }
});
