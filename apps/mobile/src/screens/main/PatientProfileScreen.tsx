import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  ActivityIndicator,
  Animated,
  Easing,
  Pressable,
  Modal,
  Alert
} from 'react-native';
import { ArrowLeft, Baby, User, Shield, Target, Camera, Bomb, Save, Trash2, CheckCircle2, XCircle, AlertTriangle } from 'lucide-react-native';
import { api } from '../../services/api';

interface PatientProfileScreenProps {
  patientId: string;
  onBack: () => void;
  onDeleteSuccess: () => void;
  adminPsicologoId?: string;
}

export const PatientProfileScreen: React.FC<PatientProfileScreenProps> = ({ patientId, onBack, onDeleteSuccess, adminPsicologoId }) => {
  const [loading, setLoading] = useState(true);
  const [savingPatient, setSavingPatient] = useState(false);
  const [savingGuardian, setSavingGuardian] = useState(false);
  
  const [guardianId, setGuardianId] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
  });

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const errorSlideAnim = useRef(new Animated.Value(-100)).current;

  const [showGuardianConfirmModal, setShowGuardianConfirmModal] = useState(false);
  const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);
  const [deletingPatient, setDeletingPatient] = useState(false);

  const showToast = (msg: string) => {
    setSuccessMessage(msg);
    setShowSuccessToast(true);
    Animated.timing(slideAnim, {
      toValue: Platform.OS === 'ios' ? 70 : 50,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();

    setTimeout(() => {
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowSuccessToast(false));
    }, 3000);
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setShowErrorToast(true);
    Animated.timing(errorSlideAnim, {
      toValue: Platform.OS === 'ios' ? 70 : 50,
      duration: 300,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();

    setTimeout(() => {
      Animated.timing(errorSlideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowErrorToast(false));
    }, 4000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const url = adminPsicologoId ? `/api/patients/${patientId}?psicologoId=${adminPsicologoId}` : `/api/patients/${patientId}`;
        const response = await api.get(url);
        if (response.data.success && response.data.data) {
          const { patient, guardian, sessions: patientSessions } = response.data.data;
          setFormData({
            name: patient.name || '',
            age: patient.age ? String(patient.age) : '',
            gender: patient.gender || '',
            guardianName: guardian?.name || '',
            guardianEmail: guardian?.email || '',
            guardianPhone: guardian?.phone || '',
          });
          if (guardian) {
            setGuardianId(guardian.id);
          }
          if (patientSessions) {
            setSessions(patientSessions);
          }
        }
      } catch (error) {
        showError('Não foi possível carregar o perfil do paciente.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [patientId]);

  const formatPhone = (text: string) => {
    let onlyNums = text.replace(/\D/g, "");
    if (onlyNums.length > 11) {
      onlyNums = onlyNums.substring(0, 11);
    }
    
    let formatted = onlyNums;
    if (onlyNums.length > 2) {
      formatted = `(${onlyNums.substring(0, 2)}) `;
      if (onlyNums.length > 7) {
        formatted += `${onlyNums.substring(2, 7)}-${onlyNums.substring(7, 11)}`;
      } else {
        formatted += onlyNums.substring(2);
      }
    }
    return formatted;
  };

  const handlePhoneChange = (text: string) => {
    setFormData(prev => ({ ...prev, guardianPhone: formatPhone(text) }));
  };

  const handleSavePatient = async () => {
    if (!formData.name.trim() || !formData.age || !formData.gender) {
      showError('Nome, idade e gênero são obrigatórios.');
      return;
    }
    try {
      setSavingPatient(true);
      const url = adminPsicologoId ? `/api/patients/${patientId}?type=patient&psicologoId=${adminPsicologoId}` : `/api/patients/${patientId}?type=patient`;
      const response = await api.put(url, {
        name: formData.name,
        age: formData.age,
        gender: formData.gender,
      });
      if (response.data.success) {
        showToast('Dados do paciente salvos com sucesso!');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erro ao salvar paciente.';
      showError(errorMsg);
    } finally {
      setSavingPatient(false);
    }
  };

  const handleSaveGuardian = () => {
    if (!guardianId) {
      showError('Nenhum responsável vinculado a este paciente.');
      return;
    }
    if (!formData.guardianName.trim() || !formData.guardianEmail.trim() || formData.guardianPhone.replace(/\D/g, "").length < 10) {
      showError('Dados do responsável estão incompletos ou inválidos.');
      return;
    }
    // Mostra o popup de confirmação antes de salvar
    setShowGuardianConfirmModal(true);
  };

  const confirmSaveGuardian = async () => {
    setShowGuardianConfirmModal(false);
    try {
      setSavingGuardian(true);
      const url = adminPsicologoId ? `/api/patients/${guardianId}?type=guardian&psicologoId=${adminPsicologoId}` : `/api/patients/${guardianId}?type=guardian`;
      const response = await api.put(url, {
        name: formData.guardianName,
        email: formData.guardianEmail,
        phone: formData.guardianPhone,
      });
      if (response.data.success) {
        showToast('Ficha do responsável atualizada com sucesso!');
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Erro ao salvar responsável.';
      showError(errorMsg);
    } finally {
      setSavingGuardian(false);
    }
  };

  const handleDeletePatient = () => {
    setShowDeleteConfirmModal(true);
  };

  const confirmDeletePatient = async () => {
    try {
      setDeletingPatient(true);
      const url = adminPsicologoId ? `/api/patients/${patientId}?psicologoId=${adminPsicologoId}` : `/api/patients/${patientId}`;
      const response = await api.delete(url);
      if (response.data.success) {
        setShowDeleteConfirmModal(false);
        onDeleteSuccess();
      }
    } catch (error: any) {
      setShowDeleteConfirmModal(false);
      const errorMsg = error.response?.data?.error || 'Erro ao excluir paciente.';
      showError(errorMsg);
    } finally {
      setDeletingPatient(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#FFC857" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.container}
    >
      {/* Header Fixo */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft color="#FFF" size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Perfil do Paciente</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Seção Criança (Amarelo) */}
        <View style={styles.card}>
          <View style={styles.cardBgIcon}>
            <Baby color="rgba(255, 255, 255, 0.05)" size={120} />
          </View>
          
          <View style={styles.cardHeader}>
            <View style={styles.iconCircleYellow}>
              <User color="#FFC857" size={32} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.sectionTitle}>Ficha do Paciente</Text>
              <Text style={styles.sectionSubtitle}>Informações básicas do paciente.</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>Nome do Paciente</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: João"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>Idade</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: 7"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              value={formData.age}
              onChangeText={(text) => setFormData(prev => ({ ...prev, age: text.replace(/\D/g, '') }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>Gênero</Text>
            <View style={styles.pillsContainer}>
              {['Masculino', 'Feminino', 'Prefiro não dizer'].map((gen) => {
                const isSelected = formData.gender === gen;
                return (
                  <TouchableOpacity
                    key={gen}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => setFormData(prev => ({ ...prev, gender: gen }))}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]} numberOfLines={1} adjustsFontSizeToFit>{gen}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.cardActions}>
            <TouchableOpacity 
              style={styles.deleteButton} 
              activeOpacity={0.7}
              onPress={handleDeletePatient}
            >
              <Trash2 color="#F87171" size={20} />
              <Text style={styles.deleteButtonText}>Excluir</Text>
            </TouchableOpacity>

            <Pressable 
              style={({ pressed }) => [
                styles.saveButtonYellow,
                pressed && { backgroundColor: '#7B61FF' }
              ]} 
              onPress={handleSavePatient}
              disabled={savingPatient}
            >
              {({ pressed }) => savingPatient ? <ActivityIndicator color="#181c1c" /> : (
                <>
                  <Save color={pressed ? "#FFF" : "#181c1c"} size={20} />
                  <Text style={[styles.saveButtonTextYellow, pressed && { color: '#FFF' }]}>Salvar Paciente</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Avaliações Clínicas (Carrossel Horizontal) */}
        <View style={styles.carouselSection}>
          <View style={styles.carouselHeader}>
            <Text style={styles.carouselTitle}>Avaliações Clínicas</Text>
            <View style={styles.carouselBadge}>
              <Text style={styles.carouselBadgeText}>3 Atividades</Text>
            </View>
          </View>

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carouselContent}
          >
            {/* Card Toca Rápido */}
            {(() => {
              const session = sessions.find((s: any) => s.gameName === 'GoNoGo' || s.gameName === 'Toca Rápido');
              const played = !!session;
              const score = session?.behaviorData?.erro_nogo !== undefined ? `${session.behaviorData.erro_nogo} erro(s)` : null;
              return (
                <View style={styles.gameCard}>
                  <View style={[styles.gameIconWrapper, { backgroundColor: 'rgba(123,97,255,0.1)' }]}>
                    <Target color="#7B61FF" size={32} />
                  </View>
                  <Text style={styles.gameTitle}>Toca Rápido!</Text>
                  <Text style={styles.gameDesc}>Controle inibitório e impulsividade.</Text>
                  <View style={[styles.gameBadge, played && { backgroundColor: 'rgba(52,211,153,0.2)', borderColor: 'rgba(52,211,153,0.3)' }]}>
                    <Text style={[styles.gameBadgeText, played && { color: '#34D399' }]}>
                      {played ? (score || 'Concluído') : 'Ainda não jogou'}
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* Card Fotógrafo */}
            {(() => {
              const session = sessions.find((s: any) => s.gameName === 'Fotografo' || s.gameName === 'Fotógrafo');
              const played = !!session;
              const score = session?.behaviorData?.variacao !== undefined ? `Variação: ${session.behaviorData.variacao.toFixed(2)} ms` : null;
              return (
                <View style={styles.gameCard}>
                  <View style={[styles.gameIconWrapper, { backgroundColor: 'rgba(230,168,0,0.1)' }]}>
                    <Camera color="#FFC857" size={32} />
                  </View>
                  <Text style={styles.gameTitle}>Fotógrafo da Floresta</Text>
                  <Text style={styles.gameDesc}>Atenção e velocidade motora.</Text>
                  <View style={[styles.gameBadge, played && { backgroundColor: 'rgba(52,211,153,0.2)', borderColor: 'rgba(52,211,153,0.3)' }]}>
                    <Text style={[styles.gameBadgeText, played && { color: '#34D399' }]}>
                      {played ? (score || 'Concluído') : 'Ainda não jogou'}
                    </Text>
                  </View>
                </View>
              );
            })()}

            {/* Card Goleiro */}
            {(() => {
              const session = sessions.find((s: any) => s.gameName === 'Goleiro');
              const played = !!session;
              const score = session?.behaviorData?.vtr_ms !== undefined ? `VTR: ${session.behaviorData.vtr_ms.toFixed(2)} ms` : null;
              return (
                <View style={styles.gameCard}>
                  <View style={[styles.gameIconWrapper, { backgroundColor: 'rgba(96,165,250,0.1)' }]}>
                    <Shield color="#60A5FA" size={32} />
                  </View>
                  <Text style={styles.gameTitle}>Jogo do Goleiro</Text>
                  <Text style={styles.gameDesc}>Tempo de Reação Visual (VTR).</Text>
                  <View style={[styles.gameBadge, played && { backgroundColor: 'rgba(52,211,153,0.2)', borderColor: 'rgba(52,211,153,0.3)' }]}>
                    <Text style={[styles.gameBadgeText, played && { color: '#34D399' }]}>
                      {played ? (score || 'Concluído') : 'Ainda não jogou'}
                    </Text>
                  </View>
                </View>
              );
            })()}
          </ScrollView>
        </View>

        {/* Seção Responsável (Roxo) */}
        <View style={[styles.card, styles.cardPurple]}>
          <View style={styles.cardBgIcon}>
            <Shield color="rgba(255, 255, 255, 0.05)" size={120} />
          </View>
          
          <View style={styles.cardHeader}>
            <View style={styles.iconCirclePurple}>
              <Shield color="#7B61FF" size={32} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.sectionTitle}>Ficha do Responsável</Text>
              <Text style={styles.sectionSubtitle}>Contato para vínculo do app.</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>Nome do Responsável</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Maria Silva"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={formData.guardianName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, guardianName: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="maria@email.com"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.guardianEmail}
              onChangeText={(text) => setFormData(prev => ({ ...prev, guardianEmail: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>Telefone (WhatsApp)</Text>
            <TextInput
              style={styles.input}
              placeholder="(11) 99999-9999"
              placeholderTextColor="rgba(255,255,255,0.3)"
              keyboardType="numeric"
              value={formData.guardianPhone}
              onChangeText={handlePhoneChange}
            />
          </View>

          <Pressable 
            style={({ pressed }) => [
              styles.saveButtonPurple,
              pressed && { backgroundColor: '#FFC857' } // Inverte pra amarelo ao pressionar o botão roxo
            ]} 
            onPress={handleSaveGuardian}
            disabled={savingGuardian}
          >
            {({ pressed }) => savingGuardian ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Save color={pressed ? "#181c1c" : "#FFF"} size={20} />
                <Text style={[styles.saveButtonTextPurple, pressed && { color: '#181c1c' }]}>Salvar Responsável</Text>
              </>
            )}
          </Pressable>
        </View>

      </ScrollView>

      {/* Modal de Confirmação de Edição do Responsável */}
      <Modal
        visible={showGuardianConfirmModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconBg}>
              <AlertTriangle color="#FFC857" size={32} />
            </View>
            <Text style={styles.modalTitle}>Atenção!</Text>
            <Text style={styles.modalMessage}>
              Você está alterando as informações do responsável. Essa modificação se aplicará automaticamente a <Text style={{fontWeight: 'bold', color: '#FFF'}}>todos os pacientes</Text> vinculados a ele. Deseja prosseguir?
            </Text>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={({ pressed }) => [styles.modalCancelButton, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setShowGuardianConfirmModal(false)}
              >
                {({ pressed }) => (
                  <Text style={[styles.modalCancelText, pressed && { color: '#FFF' }]}>Cancelar</Text>
                )}
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [styles.modalConfirmButton, pressed && { backgroundColor: '#7B61FF' }]}
                onPress={confirmSaveGuardian}
              >
                {({ pressed }) => (
                  <Text style={[styles.modalConfirmText, pressed && { color: '#FFF' }]}>Confirmar Edição</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Confirmação de Exclusão do Paciente */}
      <Modal
        visible={showDeleteConfirmModal}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.modalContainerRed]}>
            <View style={styles.modalIconBgRed}>
              <Trash2 color="#FF4B4B" size={32} />
            </View>
            <Text style={styles.modalTitleRed}>Excluir Paciente</Text>
            <Text style={styles.modalMessage}>
              Tem certeza que deseja excluir o paciente <Text style={{fontWeight: 'bold', color: '#FFF'}}>{formData.name}</Text>? Esta ação apagará todo o histórico de jogos e relatórios permanentemente.
            </Text>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={({ pressed }) => [styles.modalCancelButton, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setShowDeleteConfirmModal(false)}
                disabled={deletingPatient}
              >
                {({ pressed }) => (
                  <Text style={[styles.modalCancelText, pressed && { color: '#FFF' }]}>Cancelar</Text>
                )}
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [styles.modalConfirmButtonRed, pressed && { backgroundColor: '#E03131' }]}
                onPress={confirmDeletePatient}
                disabled={deletingPatient}
              >
                {({ pressed }) => deletingPatient ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={[styles.modalConfirmTextRed, pressed && { color: '#FFF' }]}>Excluir</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

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

      {/* Popup de Erro (Topo, vermelho) */}
      {showErrorToast && (
        <Animated.View style={[styles.errorToastContainer, { transform: [{ translateY: errorSlideAnim }] }]}>
          <View style={styles.errorToastIconBg}>
            <XCircle color="#FF4B4B" size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.errorToastTitle}>Ops, algo deu errado!</Text>
            <Text style={styles.toastMessage}>{errorMessage}</Text>
          </View>
        </Animated.View>
      )}

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#064b46',
  },
  container: {
    flex: 1,
    backgroundColor: '#064b46',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 16,
  },
  backButton: {
    padding: 8,
    marginLeft: -8,
  },
  topBarTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 120,
    gap: 24,
  },
  card: {
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  cardPurple: {
    borderColor: 'rgba(123,97,255,0.2)',
  },
  cardBgIcon: {
    position: 'absolute',
    top: -20,
    right: -20,
    opacity: 0.8,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  iconCircleYellow: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderWidth: 2,
    borderColor: '#FFC857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePurple: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderWidth: 2,
    borderColor: '#7B61FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  sectionTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sectionSubtitle: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
  formGroup: {
    marginBottom: 20,
  },
  labelYellow: {
    color: '#FFC857',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  labelPurple: {
    color: '#7B61FF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    color: '#FFF',
    fontSize: 16,
  },
  pillsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  pill: {
    flex: 1,
    backgroundColor: 'rgba(255,246,227,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    height: 48,
    borderRadius: 999,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pillSelected: {
    backgroundColor: '#FFC857',
    borderColor: '#FFC857',
  },
  pillText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: '#181c1c',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 16,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(248,113,113,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(248,113,113,0.3)',
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    gap: 8,
  },
  deleteButtonText: {
    color: '#F87171',
    fontWeight: 'bold',
  },
  saveButtonYellow: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#FFC857',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  saveButtonTextYellow: {
    color: '#181c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },
  saveButtonPurple: {
    flexDirection: 'row',
    backgroundColor: '#7B61FF',
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 8,
  },
  saveButtonTextPurple: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* Carousel */
  carouselSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  carouselHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  carouselTitle: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  carouselBadge: {
    backgroundColor: 'rgba(123,97,255,0.1)',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  carouselBadgeText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    fontWeight: 'bold',
  },
  carouselContent: {
    paddingRight: 24,
    gap: 16,
  },
  gameCard: {
    width: 200,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  gameIconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  gameTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gameDesc: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
    flex: 1,
  },
  gameBadge: {
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  gameBadgeText: {
    color: 'rgba(255,255,255,0.4)',
    fontSize: 11,
    fontWeight: 'bold',
    textTransform: 'uppercase',
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
  errorToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    right: 16,
    left: 16,
    backgroundColor: '#181c1c', 
    borderLeftWidth: 6,
    borderLeftColor: '#FF4B4B',
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
  errorToastIconBg: {
    width: 50, 
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 75, 75, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  toastTextContainer: {
    flex: 1,
  },
  errorToastTitle: {
    color: '#FF4B4B', 
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '500',
  },

  /* Modal de Confirmação */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: '#181c1c',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.2)',
    alignItems: 'center',
  },
  modalIconBg: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,200,87,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.3)',
  },
  modalTitle: {
    color: '#FFC857',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
  },
  modalMessage: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalConfirmButton: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FFC857',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#181c1c',
    fontSize: 16,
    fontWeight: 'bold',
  },

  /* Modal de Exclusão (Vermelho) */
  modalContainerRed: {
    borderColor: 'rgba(255, 75, 75, 0.2)',
  },
  modalIconBgRed: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 75, 75, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 75, 75, 0.3)',
  },
  modalTitleRed: {
    color: '#FF4B4B',
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 12,
  },
  modalConfirmButtonRed: {
    flex: 1,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#FF4B4B',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmTextRed: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  }
});
