import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, ScrollView, Animated, Easing, Pressable } from 'react-native';
import { Eye, EyeOff, XCircle, CheckCircle2, Lock, Mail } from 'lucide-react-native';
import { api } from '../../services/api';
import { theme } from '../../theme/theme';
import { useTranslation } from '../../i18n';
import { LanguageSelector } from '../../components/LanguageSelector';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: any) => void;
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

  const handleLogin = async () => {
    if (!email || !password) {
      showError(t.auth.fillRequiredFields);
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/auth/login', { email, password });
      
      if (response.data.success && response.data.token) {
        setLoading(false);
        showToast();
        setTimeout(() => {
          onLoginSuccess(response.data.token, response.data.user);
        }, 2000);
      }
    } catch (error: any) {
      setLoading(false);
      const errorMsg = error.response?.data?.error || t.auth.serverError;
      showError(errorMsg);
    }
  };

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
          <View style={{ flex: 1 }} />
          
          <View style={styles.cardContainer}>
            {/* Top Bar com Botão de Idioma */}
            <View style={styles.topSelectorRow}>
              <LanguageSelector />
            </View>

            {/* Logo Oficial Teko Transparente */}
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../../assets/elementos_visuais/teko_logo_logo_transparente.png')} 
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>

            {/* Cabeçalho */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>{t.auth.welcomeTitle}</Text>
              <Text style={styles.subtitle}>{t.auth.welcomeSubtitle}</Text>
            </View>

            {/* Formulário */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t.auth.emailLabel}</Text>
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
              <Text style={styles.label}>{t.auth.passwordLabel}</Text>
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
                  {showPassword ? <EyeOff color={theme.colors.textMuted} size={18} /> : <Eye color={theme.colors.textMuted} size={18} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão de Entrar em Deep Emerald */}
            <Pressable 
              style={({ pressed }) => [
                styles.button, 
                loading && styles.buttonDisabled,
                pressed && !loading && { backgroundColor: theme.colors.primaryDark, transform: [{ scale: 0.98 }] }
              ]} 
              onPress={handleLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={styles.buttonText}>{t.auth.loginButton}</Text>
              )}
            </Pressable>

            {/* Footer Link */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t.auth.noAccountText}</Text>
              <TouchableOpacity onPress={onNavigateToRegister} activeOpacity={0.7}>
                <View style={styles.badgeRegister}>
                  <Text style={styles.footerLink}>{t.auth.createAccountLink}</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ flex: 1 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Popup de Sucesso */}
      {showSuccessToast && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.toastIconBg}>
            <CheckCircle2 color={theme.colors.primary} size={24} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>{t.common.success}</Text>
            <Text style={styles.toastMessage}>{t.auth.loginSuccess}</Text>
          </View>
        </Animated.View>
      )}

      {/* Popup de Erro */}
      {showErrorToast && (
        <Animated.View style={[styles.errorToastContainer, { transform: [{ translateY: errorSlideAnim }] }]}>
          <View style={styles.errorToastIconBg}>
            <XCircle color={theme.colors.accentOrange} size={24} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.errorToastTitle}>{t.common.attention}</Text>
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
    paddingHorizontal: 20,
    paddingVertical: 24,
    justifyContent: 'center',
  },
  cardContainer: {
    backgroundColor: theme.colors.cardBg,
    borderRadius: theme.radii.xl,
    padding: 24,
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
    marginBottom: 20,
    width: 250,
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  brandTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: theme.colors.primary,
    letterSpacing: 1.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.textDark,
    letterSpacing: -0.4,
    marginBottom: 6,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: theme.colors.textMuted,
    textAlign: 'center',
    lineHeight: 18,
  },
  inputGroup: {
    marginBottom: 16,
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
    height: 48,
    borderRadius: theme.radii.md,
    marginTop: 8,
    ...theme.shadows.subtle,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
  footer: {
    marginTop: 24,
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
  badgeRegister: {
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
