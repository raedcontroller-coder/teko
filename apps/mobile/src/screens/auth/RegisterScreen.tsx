import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, SafeAreaView, KeyboardAvoidingView, Platform, ScrollView, Image, Animated, Easing, ActivityIndicator, Alert, Pressable } from 'react-native';
import { CheckCircle2, Eye, EyeOff, XCircle } from 'lucide-react-native';
import { api } from '../../services/api';

interface RegisterScreenProps {
  onRegisterSuccess: (token: string, user: any) => void;
  onNavigateToLogin: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({ onRegisterSuccess, onNavigateToLogin }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [crp, setCrp] = useState('');
  const [clinicName, setClinicName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleCrpChange = (value: string) => {
    let finalValue = value.replace(/\D/g, '');
    if (finalValue.length > 7) finalValue = finalValue.substring(0, 7);
    if (finalValue.length > 2) finalValue = `${finalValue.substring(0, 2)}/${finalValue.substring(2)}`;
    setCrp(finalValue);
  };

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

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword) {
      showError('Por favor, preencha todos os campos obrigatórios (*).');
      return;
    }

    if (password !== confirmPassword) {
      showError('As senhas não coincidem. Verifique e tente novamente.');
      return;
    }

    try {
      setLoading(true);
      const response = await api.post('/api/auth/register', { 
        name, 
        email, 
        password, 
        confirmPassword, 
        crp, 
        clinicName 
      });
      
      if (response.data.success && response.data.token) {
        setLoading(false);
        showToast();
        setTimeout(() => {
          onRegisterSuccess(response.data.token, response.data.user);
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
          <View style={{ flex: 1 }} />
          {/* Glassmorphism Simulado */}
          <View style={styles.glassPanel}>
            
            {/* Logo Oficial Teko */}
            <View style={styles.logoWrapper}>
              <Image 
                source={require('../../../assets/icon.jpg')} 
                style={styles.logoImage}
              />
            </View>

            {/* Cabeçalho */}
            <View style={styles.headerContainer}>
              <Text style={styles.title}>Crie sua conta</Text>
              <Text style={styles.subtitle}>Junte-se à revolução terapêutica.</Text>
            </View>

            {/* Campos de Input */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome Completo *</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Dra. Ana Silva"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>E-mail *</Text>
              <TextInput
                style={styles.input}
                placeholder="seu.email@exemplo.com"
                placeholderTextColor="rgba(255,255,255,0.5)"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>CRP (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: 00/00000"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={crp}
                onChangeText={handleCrpChange}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Nome da Clínica (Opcional)</Text>
              <TextInput
                style={styles.input}
                placeholder="Ex: Clínica Teko Mente"
                placeholderTextColor="rgba(255,255,255,0.5)"
                value={clinicName}
                onChangeText={setClinicName}
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Senha *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Mínimo 6 caracteres"
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

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Confirmar Senha *</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={[styles.input, styles.passwordInput]}
                  placeholder="Digite a senha novamente"
                  placeholderTextColor="rgba(255,255,255,0.5)"
                  secureTextEntry={!showConfirmPassword}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  {showConfirmPassword ? <EyeOff color="rgba(255,255,255,0.5)" size={20} /> : <Eye color="rgba(255,255,255,0.5)" size={20} />}
                </TouchableOpacity>
              </View>
            </View>

            {/* Botão de Cadastro (Amarelo Teko) */}
            <Pressable 
              style={({ pressed }) => [
                styles.button, 
                loading && styles.buttonDisabled,
                pressed && !loading && { backgroundColor: '#7B61FF' }
              ]} 
              onPress={handleRegister}
              disabled={loading}
            >
              {({ pressed }) => loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text style={[styles.buttonText, pressed && { color: '#FFF' }]}>Cadastrar</Text>
              )}
            </Pressable>

            {/* Footer de Navegação (Roxo Teko) */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>Já tem uma conta?</Text>
              <TouchableOpacity onPress={onNavigateToLogin}>
                <Text style={styles.footerLink}>Faça login</Text>
              </TouchableOpacity>
            </View>

          </View>
          <View style={{ flex: 1 }} />
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
            <Text style={styles.toastMessage}>Cadastro concluído. Redirecionando...</Text>
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
    backgroundColor: '#084D48',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    width: 80,
    height: 80,
    borderRadius: 24,
    borderWidth: 4,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: '#2e2a1e',
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
    marginBottom: 24,
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
    marginBottom: 16,
  },
  label: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    color: '#FFF',
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
    marginTop: 16,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#084D48',
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
    color: '#FFC857', // Amarelo Teko
    fontSize: 15,
    fontWeight: 'bold',
  },
  toastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    right: 16,
    left: 16, // Stretch across the screen with margin
    backgroundColor: '#181c1c', // Fundo bem escuro e destacado
    borderLeftWidth: 6,
    borderLeftColor: '#FFC857', // Destaque na borda esquerda
    borderTopWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20, // Padding maior
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20, // Sombra super forte
  },
  toastIconBg: {
    width: 50, // Ícone maior
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,200,87,0.15)',
    borderWidth: 1,
    borderColor: 'rgba(255,200,87,0.4)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  toastTextContainer: {
    flex: 1,
  },
  toastTitle: {
    color: '#FFC857', // Amarelo Teko
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
  toastMessage: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 15,
    fontWeight: '500',
  },
  errorToastContainer: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 20 : 10,
    right: 16,
    left: 16,
    backgroundColor: '#181c1c', 
    borderLeftWidth: 6,
    borderLeftColor: '#FF4B4B', // Vermelho forte
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
  errorToastTitle: {
    color: '#FF4B4B', 
    fontSize: 18,
    fontWeight: '900',
    marginBottom: 4,
  },
});
