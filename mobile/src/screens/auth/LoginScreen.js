import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import styles from './LoginScreen.styles';
import { parseApiError } from '../../utils/errorMessage';
import { Ionicons } from '@expo/vector-icons';
import { useModal } from '../../context/ModalContext';

export default function LoginScreen({ navigation }) {
  const { show } = useModal();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      show('Erro', 'Preencha todos os campos');
      return;
    }
    try {
      setLoading(true);
      await login(email, password);
    } catch (e) {
      show('Erro', parseApiError(e, 'Erro ao fazer login'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>Academia App</Text>
      <Text style={styles.subtitle}>Entre na sua conta</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#999"
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />
      <View style={styles.passwordContainer}>
        <TextInput
          style={styles.passwordInput}
          placeholder="Senha"
          placeholderTextColor="#999"
          autoCapitalize="none"
          secureTextEntry={!showPassword}
          value={password}
          onChangeText={setPassword}
        />
        <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeButton}>
          <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#999" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate('Register')}>
        <Text style={styles.link}>Não tem conta? <Text style={styles.linkBold}>Cadastre-se</Text></Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}
