import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';

export default function RegisterScreen({ navigation }) {
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmpassword: '' });
  const [loading, setLoading] = useState(false);

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
      Alert.alert('Erro', e.response?.data?.detail || 'Erro ao cadastrar');
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
          { field: 'password', placeholder: 'Senha', secure: true },
          { field: 'confirmpassword', placeholder: 'Confirmar senha', secure: true },
        ].map(({ field, placeholder, keyboard, secure, autoCapitalize }) => (
          <TextInput
            key={field}
            style={styles.input}
            placeholder={placeholder}
            placeholderTextColor="#999"
            keyboardType={keyboard || 'default'}
            autoCapitalize={autoCapitalize || 'words'}
            secureTextEntry={secure || false}
            value={form[field]}
            onChangeText={(v) => setField(field, v)}
          />
        ))}

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

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#E8FF47',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: '#aaa',
    marginBottom: 28,
  },
  input: {
    width: '100%',
    backgroundColor: '#1E1E1E',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  button: {
    width: '100%',
    backgroundColor: '#E8FF47',
    borderRadius: 10,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  buttonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 16,
  },
  link: {
    color: '#aaa',
    fontSize: 14,
  },
  linkBold: {
    color: '#E8FF47',
    fontWeight: 'bold',
  },
});
