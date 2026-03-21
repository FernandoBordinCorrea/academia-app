import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import styles from './RegisterScreen.styles';
import { parseApiError } from '../../utils/errorMessage';
import { Ionicons } from '@expo/vector-icons';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmpassword: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    const { name, email, phone, password, confirmpassword } = form;
    if (!name || !email || !phone || !password || !confirmpassword) {
      Alert.alert('Erro', 'Preencha todos os campos');
      return;
    }
    if (password !== confirmpassword) {
      Alert.alert('Erro', 'As senhas não conferem');
      return;
    }
    try {
      setLoading(true);
      await register(name, email, phone, password, confirmpassword);
    } catch (e) {
      Alert.alert('Erro', parseApiError(e, 'Erro ao cadastrar'));
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#121212' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Criar conta</Text>
        <Text style={styles.subtitle}>Preencha seus dados</Text>

        {[
          { field: 'name', placeholder: 'Nome completo' },
          { field: 'email', placeholder: 'Email', keyboard: 'email-address', autoCapitalize: 'none' },
          { field: 'phone', placeholder: 'Telefone', keyboard: 'phone-pad' },
        ].map(({ field, placeholder, keyboard, autoCapitalize }) => (
          <TextInput
            key={field}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#999"
            keyboardType={keyboard || 'default'}
            autoCapitalize={autoCapitalize || 'words'}
            value={form[field]}
            onChangeText={(v) => setField(field, v)}
          />
        ))}

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Senha"
            placeholderTextColor="#999"
            autoCapitalize="none"
            secureTextEntry={!showPassword}
            value={form.password}
            onChangeText={(v) => setField('password', v)}
          />
          <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.eyeButton}>
            <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#999" />
          </TouchableOpacity>
        </View>

        <View style={styles.passwordContainer}>
          <TextInput
            style={styles.passwordInput}
            placeholder="Confirmar senha"
            placeholderTextColor="#999"
            autoCapitalize="none"
            secureTextEntry={!showConfirmPassword}
            value={form.confirmpassword}
            onChangeText={(v) => setField('confirmpassword', v)}
          />
          <TouchableOpacity onPress={() => setShowConfirmPassword(p => !p)} style={styles.eyeButton}>
            <Ionicons name={showConfirmPassword ? 'eye-off-outline' : 'eye-outline'} size={22} color="#999" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
          {loading ? <ActivityIndicator color="#121212" /> : <Text style={styles.buttonText}>Cadastrar</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.link}>Já tem conta? <Text style={styles.linkBold}>Entrar</Text></Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

