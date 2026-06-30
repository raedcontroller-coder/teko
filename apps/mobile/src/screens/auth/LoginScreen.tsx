import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ActivityIndicator, Image, ScrollView, Animated, Easing, Pressable } from 'react-native';
import { Eye, EyeOff, XCircle, CheckCircle2 } from 'lucide-react-native';
import { api } from '../../services/api';

interface LoginScreenProps {
  onLoginSuccess: (token: string, user: any) => void;
  onNavigateToRegister: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess, onNavigateToRegister }) => {
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
    
    // Anima a entrada
    Animated.timing(errorSlideAnim, {
      toValue: Platform.OS === 'ios' ? 70 : 50,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.back(1.5)),
    }).start();

    // Aguarda um tempo maior (ex: 4 segundos) e anima a saída
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
      showError('Por favor, preencha todos os campos.');
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
        }, 2500);
      }
    } catch (error: any) {
      setLoading(false);
      const errorMsg = error.response?.data?.error || 'Não foi possível conectar ao servidor. Verifique se o Next.js está rodando.';
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
          {/* Efeito Glassmorphism Simulado (Nativo sem crash) */}
          <View style={styles.glassPanel}>
            
            {/* Brand Icon (Logo Real) */}
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../../assets/icon.jpg')} 
                style={styles.logoImage}
              />
            </View>

          {/* Header Text */}
          <View style={styles.headerContainer}>
            <Text style={styles.title}>Bem-vindo de volta</Text>
            <Text style={styles.subtitle}>Acesse sua jornada terapêutica digital.</Text>
          </View>

          {/* Form */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-mail</Text>
            <TextInput
              style={styles.input}
              placeholder="Digite seu e-mail"
              placeholderTextColor="rgba(255,255,255,0.5)"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, styles.passwordInput]}
                placeholder="Digite sua senha"
                placeholderTextColor="rgba(255,255,255,0.5)"
                secureTextEntry={!showPassword}
                value={password}
                onChangeText={setPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                {showPassword ? <EyeOff color="rgba(255,255,255,0.5)" size={20} /> : <Eye color="rgba(255,255,255,0.5)" size={20} />}
              </TouchableOpacity>
            </View>
          </View>

          {/* Botão de Login (Verde Teko) */}
          <Pressable 
            style={({ pressed }) => [
              styles.button, 
              loading && styles.buttonDisabled,
              pressed && !loading && { backgroundColor: '#7B61FF' }
            ]} 
            onPress={handleLogin}
            disabled={loading}
          >
            {({ pressed }) => loading ? (
              <ActivityIndicator color="#181c1c" />
            ) : (
              <Text style={[styles.buttonText, pressed && { color: '#FFF' }]}>Entrar</Text>
            )}
          </Pressable>

          {/* Footer Link (Roxo Teko) */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem uma conta?</Text>
            <TouchableOpacity onPress={onNavigateToRegister}>
              <Text style={styles.footerLink}>Criar uma conta</Text>
            </TouchableOpacity>
          </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Popup de Sucesso (Topo, grande e escuro) */}
      {showSuccessToast && (
        <Animated.View style={[styles.toastContainer, { transform: [{ translateY: slideAnim }] }]}>
          <View style={styles.toastIconBg}>
            <CheckCircle2 color="#FFC857" size={28} />
          </View>
          <View style={styles.toastTextContainer}>
            <Text style={styles.toastTitle}>Sucesso!</Text>
            <Text style={styles.toastMessage}>Acesso liberado. Redirecionando...</Text>
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

    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#084D48', // Cor de fundo real do site Teko
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  glassPanel: {
    borderRadius: 32,
    padding: 32,
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  logoWrapper: {
    alignSelf: 'center',
    marginBottom: 24,
    width: 96,
    height: 96,
    borderRadius: 32,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#2e2a1e', // surface-container-high da web
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
    overflow: 'hidden',
  },
  logoImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '900',
    color: '#FFF',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    color: '#FFF',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    fontSize: 16,
  },
  passwordContainer: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    paddingRight: 48,
  },
  eyeIcon: {
    position: 'absolute',
    right: 16,
    padding: 4,
  },
  button: {
    backgroundColor: '#FFC857',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 16,
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#181c1c',
    fontSize: 18,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 32,
    paddingTop: 24,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 15,
    marginRight: 8,
  },
  footerLink: {
    color: '#7B61FF', // Roxo Teko
    fontSize: 15,
    fontWeight: 'bold',
  },
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
});
