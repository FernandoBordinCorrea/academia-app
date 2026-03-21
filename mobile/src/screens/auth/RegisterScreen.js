import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView,
  Platform, ScrollView
} from 'react-native';
import { useAuth } from '../../context/AuthContext';
import styles from './RegisterScreen.styles';
import { parseApiError } from '../../utils/errorMessage';
import { Ionicons } from '@expo/vector-icons';
import { useModal } from '../../context/ModalContext';

export default function RegisterScreen({ navigation }) {
  const { show } = useModal();
  const { register } = useAuth();
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', confirmpassword: '', weight: '' });
  const [gender, setGender] = useState(null); // 'M' ou 'F'
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleRegister() {
    const { name, email, phone, password, confirmpassword, weight } = form;
    if (!name || !email || !phone || !password || !confirmpassword || !weight) {
      show('Erro', 'Preencha todos os campos');
      return;
    }
    if (!gender) {
      show('Erro', 'Selecione o sexo');
      return;
    }
    if (password !== confirmpassword) {
      show('Erro', 'As senhas não conferem');
      return;
    }
    const weightNum = parseFloat(weight.replace(',', '.'));
    if (isNaN(weightNum) || weightNum <= 0) {
      show('Erro', 'Informe um peso válido');
      return;
    }
    try {
      setLoading(true);
      await register(name, email, phone, password, confirmpassword, weightNum, gender);
    } catch (e) {
      show('Erro', parseApiError(e, 'Erro ao cadastrar'));
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

        <TextInput
          style={styles.input}
          placeholder="Peso (kg)"
          placeholderTextColor="#999"
          keyboardType="decimal-pad"
          value={form.weight}
          onChangeText={(v) => setField('weight', v)}
        />

        <Text style={styles.genderLabel}>Sexo</Text>
        <View style={styles.genderRow}>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'M' && styles.genderButtonActive]}
            onPress={() => setGender('M')}
          >
            <Ionicons name="male-outline" size={18} color={gender === 'M' ? '#121212' : '#aaa'} />
            <Text style={[styles.genderButtonText, gender === 'M' && styles.genderButtonTextActive]}>
              Masculino
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'F' && styles.genderButtonActive]}
            onPress={() => setGender('F')}
          >
            <Ionicons name="female-outline" size={18} color={gender === 'F' ? '#121212' : '#aaa'} />
            <Text style={[styles.genderButtonText, gender === 'F' && styles.genderButtonTextActive]}>
              Feminino
            </Text>
          </TouchableOpacity>
        </View>

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
