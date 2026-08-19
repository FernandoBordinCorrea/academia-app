import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import styles from './ExerciseFormScreen.styles';
import api from '../../services/api';
import { useModal } from '../../context/ModalContext';

export default function ExerciseFormScreen({ route, navigation }) {
  const { show } = useModal();
  const existing = route.params?.exercise;
  const isEditing = !!existing;

  const [form, setForm] = useState({
    name: existing?.name || '',
  });
  const [loading, setLoading] = useState(false);
  const [existingExercises, setExistingExercises] = useState([]);

  useEffect(() => {
    api.get('/exercises/').then(res => setExistingExercises(res.data)).catch(() => {});
  }, []);

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function saveExercise() {
    try {
      setLoading(true);
      const payload = { name: form.name.trim() };
      if (isEditing) {
        await api.patch(`/exercises/${existing.id}`, payload);
      } else {
        await api.post('/exercises/', payload);
      }
      navigation.goBack();
    } catch (e) {
      show('Erro', e.response?.data?.detail || 'Erro ao salvar exercício');
    } finally {
      setLoading(false);
    }
  }

  function handleSubmit() {
    const name = form.name.trim();
    if (!name) {
      show('Erro', 'Preencha o nome do exercício');
      return;
    }

    const duplicate = existingExercises.find(
      e => e.id !== existing?.id && e.name.trim().toLowerCase() === name.toLowerCase()
    );
    if (duplicate) {
      show(
        'Exercício já existe',
        `Já existe um exercício chamado "${duplicate.name}". Deseja ${isEditing ? 'salvar' : 'criar'} mesmo assim?`,
        [
          { text: 'Cancelar', style: 'cancel' },
          { text: isEditing ? 'Salvar mesmo assim' : 'Criar mesmo assim', onPress: saveExercise },
        ]
      );
      return;
    }

    saveExercise();
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: '#121212' }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isEditing ? 'Editar exercício' : 'Novo exercício'}</Text>

        <Text style={styles.label}>Nome</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Elevação Lateral"
          placeholderTextColor="#666"
          value={form.name}
          onChangeText={(v) => setField('name', v)}
        />

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading ? <ActivityIndicator color="#121212" /> : <Text style={styles.buttonText}>{isEditing ? 'Salvar alterações' : 'Criar exercício'}</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
