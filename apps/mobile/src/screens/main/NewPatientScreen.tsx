import React, { useState, useRef } from 'react';
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
  Image,
  Modal
} from 'react-native';
import { ArrowLeft, Baby, User, Shield, CheckCircle2, XCircle, Camera, X, UserCircle, Save } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { api } from '../../services/api';
import { theme } from '../../theme/theme';
import { useTranslation } from '../../i18n';
import { AVAILABLE_AVATAR_OPTIONS, getChildAvatarSource } from '../../utils/patientAvatarHelper';

interface NewPatientScreenProps {
  onBack: () => void;
  onSuccess: () => void;
  adminPsicologoId?: string;
}

export const NewPatientScreen: React.FC<NewPatientScreenProps> = ({ onBack, onSuccess, adminPsicologoId }) => {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [showAvatarModal, setShowAvatarModal] = useState(false);
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
  const [loading, setLoading] = useState(false);

  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const slideAnim = useRef(new Animated.Value(-100)).current;

  const [showErrorToast, setShowErrorToast] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const errorSlideAnim = useRef(new Animated.Value(-100)).current;

  const showToast = () => {
    setShowSuccessToast(true);
    Animated.timing(slideAnim, {
      toValue: Platform.OS === 'ios' ? 70 : 50,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5)),
    }).start();
  };

  const showError = (msg: string) => {
    setErrorMessage(msg);
    setShowErrorToast(true);
    
    Animated.timing(errorSlideAnim, {
      toValue: Platform.OS === 'ios' ? 70 : 50,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5)),
    }).start();

    setTimeout(() => {
      Animated.timing(errorSlideAnim, {
        toValue: -150,
        duration: 500,
        useNativeDriver: true,
        easing: Easing.in(Easing.ease),
      }).start(() => {
        setShowErrorToast(false);
      });
    }, 4000);
  };

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

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.age || !formData.gender || !formData.guardianName.trim() || !formData.guardianEmail.trim() || !formData.guardianPhone) {
      showError(t.newPatient.fillAllRequired);
      return;
    }

    if (!formData.avatarUrl) {
      showError('Por favor, selecione uma das 4 ilustrações de avatar para a criança.');
      return;
    }

    if (!formData.guardianEmail.includes('@')) {
      showError(t.newPatient.invalidEmail);
      return;
    }

    if (formData.guardianPhone.replace(/\D/g, "").length < 10) {
      showError(t.newPatient.invalidPhone);
      return;
    }

    try {
      setLoading(true);
      const dataToSubmit = adminPsicologoId ? { ...formData, psicologoId: adminPsicologoId } : formData;
      const response = await api.post('/api/patients', dataToSubmit);
      if (response.data.success) {
        setLoading(false);
        showToast();
        setTimeout(() => {
          onSuccess();
        }, 2500);
      }
    } catch (error: any) {
      setLoading(false);
      const errorMsg = error.response?.data?.error || t.common.error;
      showError(errorMsg);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {/* Header Fixo */}
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <ArrowLeft color={theme.colors.textDark} size={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>{t.newPatient.title}</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom + 100, 120) }]} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        
        {/* Seção Criança */}
        <View style={styles.card}>
          <View style={styles.cardBgIcon}>
            <Baby color={theme.colors.primary} size={120} />
          </View>
          
          {/* Avatar Hero Widget (Com Ícone SVG Neutro Inicial) */}
          <View style={styles.avatarHeroContainer}>
            <TouchableOpacity 
              style={styles.avatarHeroWrapper}
              onPress={() => setShowAvatarModal(true)}
              activeOpacity={0.85}
            >
              <View style={styles.avatarHeroCircle}>
                {Boolean(formData.avatarUrl) ? (
                  <Image 
                    source={getChildAvatarSource(formData.avatarUrl, formData.gender)} 
                    style={styles.avatarHeroImage} 
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.avatarHeroPlaceholder}>
                    <UserCircle size={54} color={theme.colors.primary} />
                  </View>
                )}
              </View>
              <View style={styles.avatarHeroBadge}>
                <Camera size={16} color="#FFFFFF" strokeWidth={2.4} />
              </View>
            </TouchableOpacity>
            <Text style={styles.sectionTitleCentered}>{t.newPatient.childSectionTitle}</Text>
            <Text style={styles.sectionSubtitleCentered}>
              {formData.avatarUrl ? t.newPatient.avatarSelectedHint : t.newPatient.avatarNeutralHint}
            </Text>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelSection}>{t.newPatient.nameLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.newPatient.namePlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              value={formData.name}
              onChangeText={(text) => setFormData(prev => ({ ...prev, name: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelSection}>{t.newPatient.ageLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.newPatient.agePlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              value={formData.age}
              onChangeText={(text) => setFormData(prev => ({ ...prev, age: text.replace(/\D/g, '') }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelSection}>{t.newPatient.genderLabel}</Text>
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
                    onPress={() => setFormData(prev => ({ 
                      ...prev, 
                      gender: genItem.key,
                    }))}
                  >
                    <Text style={[styles.pillText, isSelected && styles.pillTextSelected]} numberOfLines={1} adjustsFontSizeToFit>{genItem.label}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelSection}>{t.newPatient.tdahQuestion}</Text>
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
        </View>

        {/* Seção Responsável */}
        <View style={styles.card}>
          <View style={styles.cardBgIcon}>
            <Shield color={theme.colors.badgePurpleText} size={120} />
          </View>
          
          <View style={styles.cardHeader}>
            <View style={styles.iconCirclePurple}>
              <Shield color={theme.colors.badgePurpleText} size={28} />
            </View>
            <View style={styles.headerTexts}>
              <Text style={styles.sectionTitle}>{t.newPatient.guardianSectionTitle}</Text>
              <Text style={styles.sectionSubtitle}>{t.newPatient.guardianSectionSubtitle}</Text>
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelSection}>{t.newPatient.guardianNameLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.newPatient.guardianNamePlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              value={formData.guardianName}
              onChangeText={(text) => setFormData(prev => ({ ...prev, guardianName: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelSection}>{t.newPatient.emailLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.newPatient.emailPlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={formData.guardianEmail}
              onChangeText={(text) => setFormData(prev => ({ ...prev, guardianEmail: text }))}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.labelSection}>{t.newPatient.phoneLabel}</Text>
            <TextInput
              style={styles.input}
              placeholder={t.newPatient.phonePlaceholder}
              placeholderTextColor={theme.colors.textMuted}
              keyboardType="numeric"
              value={formData.guardianPhone}
              onChangeText={handlePhoneChange}
            />
          </View>

        </View>

        {/* Botão Salvar */}
        <Pressable 
          style={({ pressed }) => [
            styles.saveButton,
            pressed && { backgroundColor: theme.colors.primaryDark }
          ]} 
          onPress={handleSave}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Save color="#FFFFFF" size={20} />
              <Text style={styles.saveButtonText}>{t.newPatient.saveBtn}</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {/* Popup de Sucesso */}
      {showSuccessToast && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.toastIconBg}>
            <CheckCircle2 color={theme.colors.primary} size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>{t.newPatient.successTitle}</Text>
            <Text style={styles.toastMessage}>{t.newPatient.successMsg}</Text>
          </View>
        </Animated.View>
      )}

      {/* Popup de Erro */}
      {showErrorToast && (
        <Animated.View style={[styles.errorToastContainer, { transform: [{ translateY: errorSlideAnim }] }]}>
          <View style={styles.errorToastIconBg}>
            <XCircle color="#DC2626" size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.errorToastTitle}>{t.newPatient.errorTitle}</Text>
            <Text style={styles.toastMessage}>{errorMessage}</Text>
          </View>
        </Animated.View>
      )}

      {/* Modal de Seleção de Avatar do Paciente */}
      <Modal visible={showAvatarModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.avatarModalContent, { paddingBottom: Math.max(insets.bottom + 16, 24) }]}>
            <View style={styles.avatarModalHeader}>
              <Text style={styles.avatarModalTitle}>{t.newPatient.modalAvatarTitle}</Text>
              <TouchableOpacity onPress={() => setShowAvatarModal(false)} style={styles.avatarCloseBtn}>
                <X size={22} color={theme.colors.textDark} />
              </TouchableOpacity>
            </View>
            <Text style={styles.avatarModalSubtitle}>
              {t.newPatient.modalAvatarSubtitle}
            </Text>

            {/* Grade dos 4 Avatares Nativos */}
            <View style={styles.avatarGridContainerModal}>
              {AVAILABLE_AVATAR_OPTIONS.map((opt) => {
                const isSelected = formData.avatarUrl === opt.id;
                return (
                  <TouchableOpacity
                    key={opt.id}
                    style={[
                      styles.avatarOptionCardModal,
                      isSelected && styles.avatarOptionCardSelectedModal
                    ]}
                    onPress={() => {
                      setFormData(prev => ({ ...prev, avatarUrl: opt.id }));
                      setShowAvatarModal(false);
                    }}
                    activeOpacity={0.8}
                  >
                    <Image source={opt.source} style={styles.avatarOptionImageModal} resizeMode="cover" />
                    <Text style={[styles.avatarOptionLabelModal, isSelected && styles.avatarOptionLabelSelectedModal]}>
                      {opt.defaultLabel}
                    </Text>
                    {isSelected && (
                      <View style={styles.avatarSelectedBadgeModal}>
                        <CheckCircle2 size={16} color="#FFFFFF" />
                      </View>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </View>
      </Modal>

    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
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
    padding: 8,
    marginLeft: -8,
  },
  topBarTitle: {
    color: theme.colors.textDark,
    fontSize: 20,
    fontWeight: '800',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 120,
    gap: 20,
  },
  card: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    padding: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    position: 'relative',
    overflow: 'hidden',
    ...theme.shadows.subtle,
  },
  cardBgIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    opacity: 0.12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
    gap: 14,
  },
  iconCircleTeal: {
    width: 48,
    height: 48,
    borderRadius: theme.radii.md,
    backgroundColor: theme.colors.tealSoft,
    borderWidth: 1,
    borderColor: theme.colors.tealMint,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCirclePurple: {
    width: 48,
    height: 48,
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
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 2,
  },
  sectionSubtitle: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  formGroup: {
    marginBottom: 16,
  },
  labelSection: {
    color: theme.colors.textDark,
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    paddingHorizontal: 16,
    height: 48,
    color: theme.colors.textDark,
    fontSize: 15,
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flex: 1,
    height: 44,
    borderRadius: theme.radii.md,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  pillSelected: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
  },
  pillText: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '600',
  },
  pillTextSelected: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  saveButton: {
    backgroundColor: theme.colors.primary,
    height: 52,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginTop: 10,
    ...theme.shadows.subtle,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    right: 16,
    left: 16,
    backgroundColor: theme.colors.cardBg, 
    borderLeftWidth: 6,
    borderLeftColor: theme.colors.primary,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    ...theme.shadows.floating,
    zIndex: 9999,
  },
  toastIconBg: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: theme.colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  toastTitle: {
    color: theme.colors.primary, 
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  errorToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    right: 16,
    left: 16,
    backgroundColor: theme.colors.cardBg, 
    borderLeftWidth: 6,
    borderLeftColor: '#DC2626',
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    ...theme.shadows.floating,
    zIndex: 9999,
  },
  errorToastIconBg: {
    width: 44, 
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(220, 38, 38, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  toastTextContainer: {
    flex: 1,
  },
  errorToastTitle: {
    color: '#DC2626', 
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  toastMessage: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '500',
  },
  subLabelSection: {
    color: theme.colors.textMuted,
    fontSize: 12,
    marginTop: -4,
    marginBottom: 10,
  },
  avatarGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-between',
  },
  avatarCardOption: {
    width: '48%',
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radii.md,
    borderWidth: 2,
    borderColor: theme.colors.cardBorder,
    padding: 10,
    alignItems: 'center',
    position: 'relative',
  },
  avatarCardOptionSelected: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.tealSoft,
  },
  avatarCardImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    marginBottom: 6,
  },
  avatarCardText: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  avatarCardTextSelected: {
    fontWeight: '800',
    color: theme.colors.primary,
  },
  avatarCardBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  /* Avatar Hero Widget (Estilo Perfil Profissional) */
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
    backgroundColor: theme.colors.tealSoft,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.card,
  },
  avatarHeroImage: {
    width: '100%',
    height: '100%',
  },
  avatarHeroPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: theme.colors.tealSoft,
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

  /* Modal de Avatar */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
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
  avatarGridContainerModal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  avatarOptionCardModal: {
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
  avatarOptionCardSelectedModal: {
    borderColor: theme.colors.primary,
    backgroundColor: theme.colors.tealSoft,
  },
  avatarOptionImageModal: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 8,
  },
  avatarOptionLabelModal: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.textDark,
  },
  avatarOptionLabelSelectedModal: {
    fontWeight: '800',
    color: theme.colors.primary,
  },
  avatarSelectedBadgeModal: {
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
  resetAvatarBtn: {
    alignItems: 'center',
    paddingVertical: 10,
    marginTop: 4,
  },
  resetAvatarText: {
    fontSize: 13,
    fontWeight: '600',
    color: theme.colors.primary,
    textDecorationLine: 'underline',
  },
});
