import { useState } from 'react';
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
    sets: existing?.sets?.toString() || '',
    reps: existing?.reps?.toString() || '',
    weight: existing?.weight?.toString() || '',
  });
  const [loading, setLoading] = useState(false);

  function setField(field, value) {
    setForm(prev => ({ ...prev, [field]: value }));
  }

  async function handleSubmit() {
    const { name, sets, reps, weight } = form;
    if (!name || !sets || !reps || !weight) {
      show('Erro', 'Preencha todos os campos');
      return;
    }
    try {
      setLoading(true);
      const payload = {
        name,
        sets: parseInt(sets),
        reps: parseInt(reps),
        weight: parseFloat(weight),
      };
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

        <View style={styles.row}>
          <View style={styles.halfField}>
            <Text style={styles.label}>Séries</Text>
            <TextInput
              style={styles.input}
              placeholder="3"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={form.sets}
              onChangeText={(v) => setField('sets', v)}
            />
          </View>
          <View style={styles.halfField}>
            <Text style={styles.label}>Repetições</Text>
            <TextInput
              style={styles.input}
              placeholder="12"
              placeholderTextColor="#666"
              keyboardType="numeric"
              value={form.reps}
              onChangeText={(v) => setField('reps', v)}
            />
          </View>
        </View>

        <Text style={styles.label}>Peso (kg)</Text>
        <TextInput
          style={styles.input}
          placeholder="8.0"
          placeholderTextColor="#666"
          keyboardType="decimal-pad"
          value={form.weight}
          onChangeText={(v) => setField('weight', v)}
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
