import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  SafeAreaView, 
  KeyboardAvoidingView, 
  Platform, 
  ActivityIndicator, 
  Image, 
  ScrollView, 
  Animated, 
  Easing, 
  Pressable,
  Modal
} from 'react-native';
import { 
  Eye, 
  EyeOff, 
  XCircle, 
  CheckCircle2, 
  User, 
  Mail, 
  Lock, 
  Building, 
  ArrowLeft, 
  ArrowRight, 
  ShieldCheck, 
  FileText, 
  CheckSquare, 
  Square, 
  X, 
  ChevronRight,
  Sparkles
} from 'lucide-react-native';
import { api } from '../../services/api';
import { theme } from '../../theme/theme';
import { useTranslation } from '../../i18n';
import { LanguageSelector } from '../../components/LanguageSelector';
import { TERMS_SECTIONS_PT, TERMS_SECTIONS_EN } from './termsData';

interface RegisterScreenProps {
  onRegisterSuccess: (token: string, user: any) => void;
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const { t, language } = useTranslation();
  
  // Etapa Atual: 1 = Dados Pessoais/Profissionais | 2 = Termos de Consentimento
  const [currentStep, setCurrentStep] = useState<1 | 2>(1);

  // Form Fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [crp, setCrp] = useState('');
  const [clinicName, setClinicName] = useState('');

  // 13 Caixas do Termo de Consentimento
  const [checkedItems, setCheckedItems] = useState<boolean[]>(Array(13).fill(false));
  
  // Modal de Leitura Integral do Termo
  const [showFullTermsModal, setShowFullTermsModal] = useState(false);

  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Toasts
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

  const handleProceedToTerms = () => {
    if (!name.trim() || !email.trim() || !password.trim() || !confirmPassword.trim()) {
      showError(t.auth.fillRequiredFields);
      return;
    }

    if (password !== confirmPassword) {
      showError(t.auth.passwordsDoNotMatch);
      return;
    }

    if (password.length < 6) {
      showError(t.auth.passwordMinLength);
      return;
    }

    setCurrentStep(2);
  };

  const handleToggleCheck = (index: number) => {
    setCheckedItems(prev => {
      const next = [...prev];
      next[index] = !next[index];
      return next;
    });
  };

  const handleSelectAll = () => {
    const allChecked = checkedItems.every(Boolean);
    setCheckedItems(Array(13).fill(!allChecked));
  };

  const allTermsChecked = checkedItems.length === 13 && checkedItems.every(Boolean);
  const checkedCount = checkedItems.filter(Boolean).length;

  const handleRegister = async () => {
    if (!allTermsChecked) {
      showError(t.auth.mustAcceptAllTerms);
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/auth/register', { 
        name: name.trim(), 
        email: email.trim(), 
        password, 
        confirmPassword, 
        crp: crp.trim(), 
        clinicName: clinicName.trim(),
        lang: language === 'en' ? 'en' : 'pt',
        termsAccepted: true,
        termsItems: checkedItems,
      });
      
      if (response.data.success && response.data.token) {
        setLoading(false);
        showToast();
        setTimeout(() => {
          onRegisterSuccess(response.data.token, response.data.user);
        }, 1800);
      }
    } catch (error: any) {
      setLoading(false);
      const errorMsg = error.response?.data?.error || t.auth.registerServerError;
      showError(errorMsg);
    }
  };

  const checklistTexts: string[] = t.auth.termsChecklist || [];
  const fullDocumentSections = language === 'en' ? TERMS_SECTIONS_EN : TERMS_SECTIONS_PT;

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.cardContainer}>
            {/* Top Bar com Seletor de Idioma */}
            <View style={styles.topSelectorRow}>
              <LanguageSelector />
            </View>

            {/* Logo Oficial Teko */}
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../../assets/elementos_visuais/teko_logo_logo_transparente.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Indicador Elegante de Etapas */}
            <View style={styles.stepTrackerContainer}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepBadgeText}>
                  {t('auth.stepIndicator', { current: currentStep, total: 2 })}
                </Text>
              </View>
              <Text style={styles.stepTitle}>
                {currentStep === 1 ? t.auth.step1Title : t.auth.step2Title}
              </Text>
            </View>

            {/* ETAPA 1: DADOS CADASTRAIS */}
            {currentStep === 1 && (
              <View>
                <View style={styles.headerContainer}>
                  <Text style={styles.title}>{t.auth.registerTitle}</Text>
                  <Text style={styles.subtitle}>{t.auth.registerSubtitle}</Text>
                </View>

                {/* Campos */}
                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.auth.nameLabel} *</Text>
                  <View style={styles.inputWrapper}>
                    <User size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t.auth.namePlaceholder}
                      placeholderTextColor={theme.colors.textMuted}
                      value={name}
                      onChangeText={setName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.auth.emailLabel} *</Text>
                  <View style={styles.inputWrapper}>
                    <Mail size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t.auth.emailPlaceholder}
                      placeholderTextColor={theme.colors.textMuted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.auth.crpLabel} ({t.common.optional})</Text>
                  <View style={styles.inputWrapper}>
                    <Building size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t.auth.crpPlaceholder}
                      placeholderTextColor={theme.colors.textMuted}
                      value={crp}
                      onChangeText={setCrp}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.auth.clinicLabel} ({t.common.optional})</Text>
                  <View style={styles.inputWrapper}>
                    <Building size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t.auth.clinicPlaceholder}
                      placeholderTextColor={theme.colors.textMuted}
                      value={clinicName}
                      onChangeText={setClinicName}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.auth.passwordLabel} *</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={[styles.input, { paddingRight: 44 }]}
                      placeholder={t.auth.passwordPlaceholder}
                      placeholderTextColor={theme.colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={password}
                      onChangeText={setPassword}
                    />
                    <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                      {showPassword ? <Eye color={theme.colors.textMuted} size={18} /> : <EyeOff color={theme.colors.textMuted} size={18} />}
                    </TouchableOpacity>
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>{t.auth.confirmPasswordLabel} *</Text>
                  <View style={styles.inputWrapper}>
                    <Lock size={18} color={theme.colors.textMuted} style={styles.inputIcon} />
                    <TextInput
                      style={styles.input}
                      placeholder={t.auth.confirmPasswordPlaceholder}
                      placeholderTextColor={theme.colors.textMuted}
                      secureTextEntry={!showPassword}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                    />
                  </View>
                </View>

                {/* Botão Próxima Etapa */}
                <Pressable 
                  style={({ pressed }) => [
                    styles.button, 
                    pressed && { backgroundColor: theme.colors.primaryDark, transform: [{ scale: 0.98 }] }
                  ]} 
                  onPress={handleProceedToTerms}
                >
                  <Text style={styles.buttonText}>{t.auth.proceedToTerms}</Text>
                  <ArrowRight size={18} color="#FFF" style={{ marginLeft: 8 }} />
                </Pressable>
              </View>
            )}

            {/* ETAPA 2: TERMO DE CONSENTIMENTO E CIÊNCIA */}
            {currentStep === 2 && (
              <View>
                {/* Botão de Retorno à Etapa 1 */}
                <TouchableOpacity 
                  style={styles.backStepButton} 
                  onPress={() => setCurrentStep(1)}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={16} color={theme.colors.primary} />
                  <Text style={styles.backStepText}>{t.common.back}</Text>
                </TouchableOpacity>

                <View style={styles.termsHeaderCard}>
                  <View style={styles.termsBadge}>
                    <ShieldCheck size={14} color={theme.colors.primary} />
                    <Text style={styles.termsBadgeText}>{t.auth.termsBadge}</Text>
                  </View>
                  <Text style={styles.termsCardTitle}>{t.auth.termsHeadline}</Text>
                  <Text style={styles.termsCardDesc}>{t.auth.termsSubheadline}</Text>

                  {/* Botão para Ler Termo Completo */}
                  <TouchableOpacity 
                    style={styles.viewFullTermsBtn} 
                    onPress={() => setShowFullTermsModal(true)}
                    activeOpacity={0.8}
                  >
                    <FileText size={16} color="#084D48" />
                    <Text style={styles.viewFullTermsText}>{t.auth.viewFullTerms}</Text>
                    <ChevronRight size={16} color="#084D48" />
                  </TouchableOpacity>
                </View>

                {/* Barra de Indicador de Progresso das Declarações (Centralizada e Destacada) */}
                <View style={styles.checklistControlRow}>
                  <View style={[styles.counterBox, checkedCount === 13 && styles.counterBoxCompleted]}>
                    <ShieldCheck size={18} color={checkedCount === 13 ? '#084D48' : theme.colors.primary} style={{ marginRight: 6 }} />
                    <Text style={[styles.counterText, checkedCount === 13 && styles.counterTextCompleted]}>
                      {t('auth.itemsCheckedCounter', { checked: checkedCount, total: 13 })}
                    </Text>
                  </View>
                </View>

                {/* Lista das 13 Caixas Isoladas */}
                <View style={styles.checklistWrapper}>
                  {checklistTexts.map((text, idx) => {
                    const isChecked = checkedItems[idx] || false;
                    return (
                      <Pressable 
                        key={idx}
                        style={({ pressed }) => [
                          styles.checkItemCard,
                          isChecked && styles.checkItemCardActive,
                          pressed && { opacity: 0.85 }
                        ]}
                        onPress={() => handleToggleCheck(idx)}
                      >
                        <View style={[styles.checkboxBox, isChecked && styles.checkboxBoxActive]}>
                          {isChecked ? (
                            <CheckSquare size={20} color="#084D48" strokeWidth={2.5} />
                          ) : (
                            <Square size={20} color={theme.colors.cardBorder} strokeWidth={2} />
                          )}
                        </View>
                        <Text style={[styles.checkItemText, isChecked && styles.checkItemTextActive]}>
                          {text}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>

                {/* Botão Finalizar Cadastro */}
                <Pressable 
                  style={({ pressed }) => [
                    styles.button,
                    !allTermsChecked && styles.buttonDisabled,
                    allTermsChecked && pressed && !loading && { backgroundColor: theme.colors.primaryDark, transform: [{ scale: 0.98 }] }
                  ]} 
                  onPress={handleRegister}
                  disabled={loading || !allTermsChecked}
                >
                  {loading ? (
                    <ActivityIndicator color="#FFF" />
                  ) : (
                    <>
                      <Sparkles size={18} color="#FFF" style={{ marginRight: 6 }} />
                      <Text style={styles.buttonText}>{t.auth.finishRegisterBtn}</Text>
                    </>
                  )}
                </Pressable>
              </View>
            )}

            {/* Footer Link para Login */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t.auth.hasAccountText}</Text>
              <TouchableOpacity onPress={onNavigateToLogin} activeOpacity={0.7}>
                <View style={styles.badgeLogin}>
                  <Text style={styles.footerLink}>{t.auth.loginLink}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* MODAL DE LEITURA INTEGRAL DO TERMO (16 SEÇÕES) */}
      <Modal
        visible={showFullTermsModal}
        transparent={true}
        animationType="slide"
        statusBarTranslucent={true}
        onRequestClose={() => setShowFullTermsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Header do Modal */}
            <View style={styles.modalHeader}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalHeaderTitle}>{t.auth.termsHeadline}</Text>
                <Text style={styles.modalHeaderSubtitle}>{t.auth.termsVersionDate}</Text>
              </View>
              <TouchableOpacity 
                style={styles.closeModalBtn} 
                onPress={() => setShowFullTermsModal(false)}
              >
                <X size={20} color="#FFF" />
              </TouchableOpacity>
            </View>

            {/* Conteúdo com Scroll */}
            <ScrollView 
              style={styles.modalScrollView} 
              contentContainerStyle={styles.modalScrollBody}
              showsVerticalScrollIndicator={true}
            >
              {fullDocumentSections.map((sec, idx) => (
                <View key={idx} style={styles.sectionBlock}>
                  <Text style={styles.sectionTitle}>{sec.title}</Text>
                  <Text style={styles.sectionContent}>{sec.content}</Text>
                </View>
              ))}

              <View style={styles.legalNoticeBox}>
                <Text style={styles.legalNoticeText}>
                  {t.auth.termsNormativeNotice}
                </Text>
              </View>
            </ScrollView>

            {/* Footer do Modal */}
            <View style={styles.modalFooter}>
              <TouchableOpacity 
                style={styles.modalCloseButtonAction} 
                onPress={() => setShowFullTermsModal(false)}
              >
                <Text style={styles.modalCloseButtonText}>{t.auth.closeTermsModal}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Toasts */}
      {showSuccessToast && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.toastIconBg}>
            <CheckCircle2 color={theme.colors.primary} size={24} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>{t.common.success}</Text>
            <Text style={styles.toastMessage}>{t.auth.registerSuccess}</Text>
          </View>
        </Animated.View>
      )}

      {showErrorToast && (
        <Animated.View style={[styles.errorToastContainer, { transform: [{ translateY: errorSlideAnim }] }]}>
          <View style={styles.errorToastIconBg}>
            <XCircle color={theme.colors.accentOrange} size={24} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.errorToastTitle}>{t.common.error}</Text>
            <Text style={styles.toastMessage}>{errorMessage}</Text>
          </View>
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: theme.colors.bg,
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.lg,
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    ...theme.shadows.card,
  },
  topSelectorRow: {
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  logoWrapper: {
    alignSelf: 'center',
    marginBottom: 16,
    width: 240,
    height: 95,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  stepTrackerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.tealSoft,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: theme.radii.md,
    marginBottom: 18,
    borderWidth: 1,
    borderColor: 'rgba(8, 77, 72, 0.15)',
  },
  stepBadge: {
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  stepBadgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  stepTitle: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '800',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textDark,
    letterSpacing: -0.4,
    marginBottom: 4,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 13,
  },
  label: {
    color: theme.colors.textDark,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 6,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.bg,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    paddingHorizontal: 12,
    height: 48,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: theme.colors.textDark,
    fontSize: 14,
    height: '100%',
  },
  eyeIcon: {
    position: 'absolute',
    right: 12,
    padding: 4,
  },
  button: {
    backgroundColor: theme.colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 50,
    borderRadius: theme.radii.md,
    marginTop: 12,
    ...theme.shadows.subtle,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '800',
  },
  footer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.cardBorder,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 13,
  },
  badgeLogin: {
    backgroundColor: theme.colors.badgePurple,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: theme.radii.full,
  },
  footerLink: {
    color: theme.colors.badgePurpleText,
    fontSize: 12,
    fontWeight: '700',
  },

  /* Etapa 2: Termos */
  backStepButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    marginBottom: 14,
    paddingVertical: 4,
  },
  backStepText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  termsHeaderCard: {
    backgroundColor: 'rgba(8, 77, 72, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(8, 77, 72, 0.15)',
    borderRadius: theme.radii.md,
    padding: 16,
    marginBottom: 16,
  },
  termsBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    backgroundColor: '#FFF',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(8, 77, 72, 0.2)',
  },
  termsBadgeText: {
    color: theme.colors.primary,
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  termsCardTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: theme.colors.textDark,
    marginBottom: 6,
  },
  termsCardDesc: {
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 18,
    marginBottom: 12,
  },
  viewFullTermsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFC857',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: theme.radii.md,
    borderWidth: 1,
    borderColor: '#E6A902',
  },
  viewFullTermsText: {
    color: '#084D48',
    fontSize: 12,
    fontWeight: '800',
    flex: 1,
    marginLeft: 8,
  },
  checklistControlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 14,
  },
  counterBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F0F9F8',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 99,
    borderWidth: 1.5,
    borderColor: 'rgba(8, 77, 72, 0.25)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  counterBoxCompleted: {
    backgroundColor: '#E6F4EA',
    borderColor: '#084D48',
  },
  counterText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#084D48',
    letterSpacing: 0.2,
  },
  counterTextCompleted: {
    color: '#084D48',
  },
  checklistWrapper: {
    gap: 10,
    marginBottom: 8,
  },
  checkItemCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: theme.colors.bg,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    padding: 12,
    gap: 10,
  },
  checkItemCardActive: {
    borderColor: theme.colors.primary,
    backgroundColor: '#F3FBFB',
  },
  checkboxBox: {
    marginTop: 1,
  },
  checkboxBoxActive: {
    transform: [{ scale: 1.05 }],
  },
  checkItemText: {
    flex: 1,
    fontSize: 12,
    color: theme.colors.textMuted,
    lineHeight: 18,
  },
  checkItemTextActive: {
    color: theme.colors.textDark,
    fontWeight: '600',
  },

  /* Modal de Leitura Integral */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalContent: {
    width: '100%',
    maxWidth: 620,
    maxHeight: '88%',
    backgroundColor: '#FFF',
    borderRadius: theme.radii.lg,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalHeaderTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFF',
  },
  modalHeaderSubtitle: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  closeModalBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalScrollView: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalScrollBody: {
    paddingBottom: 24,
    gap: 16,
  },
  sectionBlock: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEE',
    paddingBottom: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: theme.colors.primary,
    marginBottom: 6,
  },
  sectionContent: {
    fontSize: 12,
    lineHeight: 19,
    color: '#333',
  },
  legalNoticeBox: {
    backgroundColor: '#F9FAFB',
    padding: 12,
    borderRadius: theme.radii.sm,
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.primary,
    marginTop: 8,
  },
  legalNoticeText: {
    fontSize: 11,
    color: theme.colors.textMuted,
    lineHeight: 16,
    fontStyle: 'italic',
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    backgroundColor: '#FFF',
  },
  modalCloseButtonAction: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 12,
    borderRadius: theme.radii.md,
    alignItems: 'center',
  },
  modalCloseButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
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
    zIndex: 999,
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
  errorToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    right: 16,
    left: 16,
    backgroundColor: theme.colors.cardBg, 
    borderLeftWidth: 5,
    borderLeftColor: theme.colors.accentOrange,
    borderWidth: 1,
    borderColor: theme.colors.cardBorder,
    borderRadius: theme.radii.md,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16, 
    ...theme.shadows.floating,
    zIndex: 999,
  },
  errorToastIconBg: {
    width: 40, 
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FDF0ED',
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
    color: theme.colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
});
