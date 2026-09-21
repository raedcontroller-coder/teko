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
  Alert,
  Image
} from 'react-native';
import { ArrowLeft, Baby, User, Shield, Target, Camera, Bomb, Save, Trash2, CheckCircle2, XCircle, AlertTriangle, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { api } from '../../services/api';
import { theme } from '../../theme/theme';
import { AnamneseTab } from './patient-tabs/AnamneseTab';
import { NotasTab } from './patient-tabs/NotasTab';
import { EvolucaoTab } from './patient-tabs/EvolucaoTab';
import { useTranslation } from '../../i18n';
import { getChildAvatarSource, AVAILABLE_AVATAR_OPTIONS } from '../../utils/patientAvatarHelper';

interface PatientProfileScreenProps {
  patientId: string;
  onBack: () => void;
  onDeleteSuccess: () => void;
  adminPsicologoId?: string;
}

export const PatientProfileScreen: React.FC<PatientProfileScreenProps> = ({ patientId, onBack, onDeleteSuccess, adminPsicologoId }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [savingPatient, setSavingPatient] = useState(false);
  const [savingGuardian, setSavingGuardian] = useState(false);
  const [activeTab, setActiveTab] = useState<'Dados' | 'Anamnese' | 'Notas' | 'Evolução'>('Dados');
  
  const [guardianId, setGuardianId] = useState('');
  const [sessions, setSessions] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    name: '',
    age: '',
    gender: '',
    hasTdah: false,
    avatarUrl: '',
    guardianName: '',
    guardianEmail: '',
    guardianPhone: '',
  });

  const [showAvatarModal, setShowAvatarModal] = useState(false);

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
      toValue: Platform.OS === 'ios' ? 12 : 8,
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
      toValue: Platform.OS === 'ios' ? 12 : 8,
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
            hasTdah: !!patient.hasTdah,
            avatarUrl: patient.avatarUrl || '',
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
        hasTdah: formData.hasTdah,
        avatarUrl: formData.avatarUrl,
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
        <ActivityIndicator size="large" color={theme.colors.primary} />
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
          <ArrowLeft color={theme.colors.textDark} size={22} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{t.patientProfile.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.topTabsContainer}>
        <View style={styles.topTabsWrapper}>
          {([
            { key: 'Dados', label: t.patientProfile.infoTab },
            { key: 'Anamnese', label: t.patientProfile.anamneseTab },
            { key: 'Notas', label: t.patientProfile.notasTab },
            { key: 'Evolução', label: t.patientProfile.evolucaoTab },
          ] as const).map((tabItem) => (
            <TouchableOpacity 
              key={tabItem.key} 
              style={[styles.topTabBtn, activeTab === tabItem.key && styles.topTabBtnActive]}
              onPress={() => setActiveTab(tabItem.key)}
              activeOpacity={0.75}
            >
              <Text style={[styles.topTabText, activeTab === tabItem.key && styles.topTabTextActive]}>{tabItem.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {activeTab === 'Dados' && (
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Seção Criança (Amarelo) */}
        <View style={styles.card}>
          <View style={styles.cardBgIcon}>
            <Baby color={theme.colors.primary} size={110} />
          </View>
          
          {/* Avatar Hero Centralizado e Maior (Mesmo padrão do Perfil do Profissional) */}
          <View style={styles.avatarHeroContainer}>
            <TouchableOpacity 
              style={styles.avatarHeroWrapper}
              onPress={() => setShowAvatarModal(true)}
              activeOpacity={0.85}
            >
              <View style={styles.avatarHeroCircle}>
                <Image 
                  source={getChildAvatarSource(formData.avatarUrl, formData.gender)} 
                  style={styles.avatarHeroImage} 
                  resizeMode="cover"
                />
              </View>
              <View style={styles.avatarHeroBadge}>
                <Camera size={16} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </TouchableOpacity>
            <Text style={styles.sectionTitleCentered}>{t.patientProfile.childCardTitle}</Text>
            <Text style={styles.sectionSubtitleCentered}>{t.patientProfile.avatarHeroSub}</Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>{t.patients.nameLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: João"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>{t.newPatient.ageLabel}</Text>
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
            <Text style={styles.labelYellow}>{t.patientProfile.genderLabel}</Text>
            <View style={styles.pillsContainer}>
              {[
                { key: 'Masculino', label: t.newPatient.genderMale },
                { key: 'Feminino', label: t.newPatient.genderFemale },
                { key: 'Prefiro não dizer', label: t.newPatient.genderOther }
              ].map((genItem) => {
                const isSelected = formData.gender === genItem.key;
                return (
                  <TouchableOpacity
                    key={genItem.key}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => setFormData(prev => ({ ...prev, gender: genItem.key }))}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]} numberOfLines={1} adjustsFontSizeToFit>{genItem.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelYellow}>{t.newPatient.tdahQuestion}</Text>
            <View style={styles.pillsContainer}>
              {[true, false].map((val) => {
                const isSelected = formData.hasTdah === val;
                return (
                  <TouchableOpacity
                    key={val ? 'Sim' : 'Não'}
                    style={[styles.pill, isSelected && styles.pillSelected]}
                    onPress={() => setFormData(prev => ({ ...prev, hasTdah: val }))}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]}>{val ? t.common.yes : t.common.no}</Text>
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
              <Text style={styles.deleteButtonText}>{t.patientProfile.deleteBtn || t.common.delete}</Text>
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
                  <Save color="#FFFFFF" size={20} />
                  <Text style={styles.saveButtonTextYellow}>{t.patientProfile.savePatientBtn}</Text>
                </>
              )}
            </Pressable>
          </View>
        </View>

        {/* Avaliações Clínicas (Carrossel Horizontal) */}
        <View style={styles.carouselSection}>
          <View style={styles.carouselHeader}>
            <Text style={styles.carouselTitle}>{t.patientProfile.clinicalEvaluations}</Text>
            <View style={styles.carouselBadge}>
              <Text style={styles.carouselBadgeText}>{t('patientProfile.activitiesCount', { count: 3 })}</Text>
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
                  <Text style={styles.gameTitle}>{t.games.goNoGo}</Text>
                  <Text style={styles.gameDesc}>{t.games.goNoGoDesc}</Text>
                  <View style={[styles.gameBadge, played && { backgroundColor: 'rgba(52,211,153,0.2)', borderColor: 'rgba(52,211,153,0.3)' }]}>
                    <Text style={[styles.gameBadgeText, played && { color: '#34D399' }]}>
                      {played ? (score || t.patientProfile.completed) : t.patientProfile.notPlayedYet}
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
                  <Text style={styles.gameTitle}>{t.games.puzzle}</Text>
                  <Text style={styles.gameDesc}>{t.games.puzzleDesc}</Text>
                  <View style={[styles.gameBadge, played && { backgroundColor: 'rgba(52,211,153,0.2)', borderColor: 'rgba(52,211,153,0.3)' }]}>
                    <Text style={[styles.gameBadgeText, played && { color: '#34D399' }]}>
                      {played ? (score || t.patientProfile.completed) : t.patientProfile.notPlayedYet}
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
                  <Text style={styles.gameTitle}>{t.games.goleiro}</Text>
                  <Text style={styles.gameDesc}>{t.games.goleiroDesc}</Text>
                  <View style={[styles.gameBadge, played && { backgroundColor: 'rgba(52,211,153,0.2)', borderColor: 'rgba(52,211,153,0.3)' }]}>
                    <Text style={[styles.gameBadgeText, played && { color: '#34D399' }]}>
                      {played ? (score || t.patientProfile.completed) : t.patientProfile.notPlayedYet}
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
            <Shield color={theme.colors.badgePurpleText} size={110} />
          </View>
          
          <View style={styles.cardHeader}>
            <View style={styles.iconCirclePurple}>
              <Shield color="#7B61FF" size={32} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.sectionTitle}>{t.patientProfile.guardianCardTitle}</Text>
              <Text style={styles.sectionSubtitle}>{t.patientProfile.guardianCardSubtitle}</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>{t.newPatient.guardianNameLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Maria Silva"
              placeholderTextColor="rgba(255,255,255,0.3)"
              value={formData.guardianName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, guardianName: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelPurple}>{t.newPatient.emailLabel}</Text>
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
            <Text style={styles.labelPurple}>{t.newPatient.phoneLabel}</Text>
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
              pressed && { backgroundColor: '#FFC857' }
            ]} 
            onPress={handleSaveGuardian}
            disabled={savingGuardian}
          >
            {({ pressed }) => savingGuardian ? <ActivityIndicator color="#FFF" /> : (
              <>
                <Save color={pressed ? "#181c1c" : "#FFF"} size={20} />
                <Text style={[styles.saveButtonTextPurple, pressed && { color: '#181c1c' }]}>{t.patientProfile.saveGuardianBtn}</Text>
              </>
            )}
          </Pressable>
        </View>

      </ScrollView>
      )}

      {activeTab === 'Anamnese' && <AnamneseTab patientId={patientId} adminPsicologoId={adminPsicologoId} />}
      {activeTab === 'Notas' && <NotasTab patientId={patientId} adminPsicologoId={adminPsicologoId} />}
      {activeTab === 'Evolução' && <EvolucaoTab patientId={patientId} adminPsicologoId={adminPsicologoId} />}

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
            <Text style={styles.modalTitle}>{t.patientProfile.confirmGuardianEditTitle}</Text>
            <Text style={styles.modalMessage}>
              {t.patientProfile.confirmGuardianEditMessage}
            </Text>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={({ pressed }) => [styles.modalCancelButton, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setShowGuardianConfirmModal(false)}
              >
                {({ pressed }) => (
                  <Text style={[styles.modalCancelText, pressed && { color: '#FFF' }]}>{t.common.cancel}</Text>
                )}
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [styles.modalConfirmButton, pressed && { backgroundColor: '#7B61FF' }]}
                onPress={confirmSaveGuardian}
              >
                {({ pressed }) => (
                  <Text style={[styles.modalConfirmText, pressed && { color: '#FFF' }]}>{t.patientProfile.confirmGuardianEditBtn}</Text>
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
            <Text style={styles.modalTitleRed}>{t.patientProfile.confirmDeletePatientTitle}</Text>
            <Text style={styles.modalMessage}>
              {t('patientProfile.confirmDeletePatientMessage', { name: formData.name })}
            </Text>
            
            <View style={styles.modalActions}>
              <Pressable 
                style={({ pressed }) => [styles.modalCancelButton, pressed && { backgroundColor: 'rgba(255,255,255,0.1)' }]}
                onPress={() => setShowDeleteConfirmModal(false)}
                disabled={deletingPatient}
              >
                {({ pressed }) => (
                  <Text style={[styles.modalCancelText, pressed && { color: '#FFF' }]}>{t.common.cancel}</Text>
                )}
              </Pressable>
              
              <Pressable 
                style={({ pressed }) => [styles.modalConfirmButtonRed, pressed && { backgroundColor: '#E03131' }]}
                onPress={confirmDeletePatient}
                disabled={deletingPatient}
              >
                {({ pressed }) => deletingPatient ? <ActivityIndicator color="#FFF" /> : (
                  <Text style={[styles.modalConfirmTextRed, pressed && { color: '#FFF' }]}>{t.common.delete}</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Seleção de Avatar do Paciente */}
      <Modal visible={showAvatarModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.avatarModalContent, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.avatarModalHeader}>
              <Text style={styles.avatarModalTitle}>{t.patientProfile.modalAvatarTitle}</Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)} style={styles.avatarCloseBtn}>
                <X size={22} color={theme.colors.textDark} />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarModalSubtitle}>
              {t.patientProfile.modalAvatarSubtitle}
            </Text>

            {/* Grade dos 4 Avatares Nativos */}
            <View style={styles.avatarGridContainer}>
              {AVAILABLE_AVATAR_OPTIONS.map((opt) => {
                const isSelected = formData.avatarUrl === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.avatarOptionCard,
                      isSelected && styles.avatarOptionCardSelected
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, avatarUrl: opt.id }));
                      setShowAvatarModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Image source={opt.source} style={styles.avatarOptionImage} resizeMode="cover" />
                    <Text style={[styles.avatarOptionLabel, isSelected && styles.avatarOptionLabelSelected]}>
                      {opt.defaultLabel}
                    </Text>
                    {isSelected && (
                      <View style={styles.avatarSelectedBadge}>
                        <CheckCircle2 size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Botão de Restaurar foto padrão */}
            {Boolean(formData.avatarUrl) && (
              <TouchableOpacity
                style={styles.resetAvatarBtn}
                onPress={() => {
                  setFormData(prev => ({ ...prev, avatarUrl: '' }));
                  setShowAvatarModal(false);
                }}
              >
                <Text style={styles.resetAvatarText}>Restaurar foto padrão do gênero</Text>
              </TouchableOpacity>
            )}
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
    backgroundColor: theme.colors.bg,
  },
  container: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
  },
  backButton: {
    padding: 6,
    marginLeft: -6,
    backgroundColor: theme.colors.tealSoft,
    borderRadius: theme.radii.md,
  },
  topBarTitle: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: '800',
  },
  topTabsContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  topTabsWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.full,
    padding: 4,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.subtle,
  },
  topTabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: theme.radii.full,
    backgroundColor: 'transparent',
  },
  topTabBtnActive: {
    backgroundColor: theme.colors.primary,
    ...theme.shadows.subtle,
  },
  topTabText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  topTabTextActive: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 110,
    gap: 16,
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    overflow: 'hidden',
    position: 'relative',
    ...theme.shadows.subtle,
  },
  cardPurple: {
    borderColor: theme.colors.cardBorder,
  },
  cardBgIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    opacity: 0.12,
    pointerEvents: 'none',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconCircleYellow: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePurple: {
    width: 44,
    height: 44,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.purpleSoft,
    borderWidth: 1,
    borderColor: theme.colors.badgePurple,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  sectionTitle: {
    color: theme.colors.textDark,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 12,
  },
  formGroup: {
    marginBottom: 14,
  },
  labelYellow: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  labelPurple: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    paddingHorizontal: 14,
    height: 46,
    color: theme.colors.textDark,
    fontSize: 14,
  },
  pillsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    gap: 8,
  },
  pill: {
    flex: 1,
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    height: 42,
    borderRadius: theme.radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  pillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillText: {
    color: theme.colors.textMuted,
    fontSize: 12,
    fontWeight: '700',
  },
  pillTextSelected: {
    color: '#FFFFFF',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(224, 122, 95, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.3)',
    height: 48,
    paddingHorizontal: 16,
    borderRadius: theme.radii.md,
    gap: 6,
  },
  deleteButtonText: {
    color: theme.colors.accentOrange,
    fontWeight: '700',
    fontSize: 14,
  },
  saveButtonYellow: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: 48,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    ...theme.shadows.subtle,
  },
  saveButtonTextYellow: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  saveButtonPurple: {
    flexDirection: 'row',
    backgroundColor: theme.colors.primary,
    height: 48,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 6,
    ...theme.shadows.subtle,
  },
  saveButtonTextPurple: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },

  /* Carousel */
  carouselSection: {
    marginTop: 6,
    marginBottom: 6,
  },
  carouselHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  carouselTitle: {
    color: theme.colors.textDark,
    fontSize: 18,
    fontWeight: '800',
  },
  carouselBadge: {
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  carouselBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  carouselContent: {
    paddingRight: 20,
    gap: 12,
  },
  gameCard: {
    width: 190,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 16,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.subtle,
  },
  gameIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  gameTitle: {
    color: theme.colors.textDark,
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 4,
  },
  gameDesc: {
    color: theme.colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    marginBottom: 12,
    flex: 1,
  },
  gameBadge: {
    alignSelf: 'flex-start',
    backgroundColor: theme.colors.tealSoft,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: theme.radii.xs,
  },
  gameBadgeText: {
    color: theme.colors.primary,
    fontSize: 10,
    fontWeight: '700',
    textTransform: 'uppercase',
  },

  /* Toasts */
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    right: 16,
    left: 16,
    backgroundColor: theme.colors.cardBg, 
    borderLeftWidth: 6,
    borderLeftColor: theme.colors.primary,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    ...theme.shadows.floating,
  },
  toastIconBg: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastTitle: {
    color: theme.colors.primary, 
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  errorToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 40 : 20,
    right: 16,
    left: 16,
    backgroundColor: theme.colors.cardBg, 
    borderLeftWidth: 6,
    borderLeftColor: theme.colors.accentOrange,
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    ...theme.shadows.floating,
  },
  errorToastIconBg: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(224, 122, 95, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  toastTextContainer: {
    flex: 1,
  },
  errorToastTitle: {
    color: theme.colors.accentOrange, 
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  toastMessage: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '500',
  },

  /* Modal de Confirmação */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 24,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    ...theme.shadows.floating,
  },
  modalIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
  },
  modalTitle: {
    color: theme.colors.textDark,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalMessage: {
    color: theme.colors.textMuted,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: theme.colors.textDark,
    fontSize: 15,
    fontWeight: '700',
  },
  modalConfirmButton: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Modal de Exclusão (Vermelho) */
  modalContainerRed: {
    borderColor: theme.colors.accentOrange,
  },
  modalIconBgRed: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(224, 122, 95, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: 'rgba(224, 122, 95, 0.3)',
  },
  modalTitleRed: {
    color: theme.colors.accentOrange,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 8,
  },
  modalConfirmButtonRed: {
    flex: 1,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.accentOrange,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmTextRed: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Avatar Hero Centralizado (Ficha do Paciente - Mesmo padrão do Profissional) */
  avatarHeroContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    marginBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.cardBorder,
  },
  avatarHeroWrapper: {
    position: 'relative',
    marginBottom: 10,
  },
  avatarHeroCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 3,
    borderColor: '#FFC857',
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    ...theme.shadows.card,
  },
  avatarHeroImage: {
    width: '100%',
    height: '100%',
  },
  avatarHeroBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...theme.shadows.subtle,
  },
  sectionTitleCentered: {
    color: theme.colors.textDark,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'center',
  },
  sectionSubtitleCentered: {
    color: theme.colors.textMuted,
    fontSize: 13,
    marginTop: 3,
    textAlign: 'center',
  },
  avatarModalContent: {
    backgroundColor: theme.colors.cardBg,
    borderTopLeftRadius: theme.radii.xl,
    borderTopRightRadius: theme.radii.xl,
    width: '100%',
    paddingHorizontal: 20,
    paddingTop: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
  },
  avatarModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  avatarModalTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: theme.colors.textDark,
  },
  avatarCloseBtn: {
    padding: 4,
  },
  avatarModalSubtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: 20,
  },
  avatarGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  avatarOptionCard: {
    width: '47%',
    backgroundColor: '#FFFFFF',
    borderRadius: theme.radii.md,
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
    padding: 12,
    alignItems: 'center',
    position: 'relative',
    ...theme.shadows.subtle,
  },
  avatarOptionCardSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.tealSoft,
  },
  avatarOptionImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
  },
  avatarOptionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  avatarOptionLabelSelected: {
    fontWeight: '800',
    color: theme.colors.primary,
  },
  avatarSelectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uploadGalleryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    borderRadius: theme.radii.md,
    paddingVertical: 14,
    marginBottom: 10,
  },
  uploadGalleryText: {
    fontSize: 14,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  resetAvatarBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  resetAvatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.accentOrange,
  }
});
