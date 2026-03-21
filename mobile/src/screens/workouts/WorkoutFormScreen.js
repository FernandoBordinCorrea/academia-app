import { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  ActivityIndicator, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import styles from './WorkoutFormScreen.styles';
import { useModal } from '../../context/ModalContext';

export default function WorkoutFormScreen({ route, navigation }) {
  const { show } = useModal();
  const existing = route.params?.workout;
  const isEditing = !!existing;

  const [name, setName] = useState(existing?.name || '');
  const [selected, setSelected] = useState(
    existing?.items?.map(i => ({ ...i.exercise, order: i.order })) || []
  );
  const [available, setAvailable] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingExercises, setLoadingExercises] = useState(true);

  useEffect(() => {
    fetchExercises();
  }, []);

  async function fetchExercises() {
    try {
      const res = await api.get('/exercises/');
      setAvailable(res.data);
    } catch {
      show('Erro', 'Não foi possível carregar os exercícios');
    } finally {
      setLoadingExercises(false);
    }
  }

  function addExercise(exercise) {
    if (selected.find(e => e.id === exercise.id)) return;
    setSelected(prev => [...prev, { ...exercise, order: prev.length + 1 }]);
  }

  function removeExercise(id) {
    setSelected(prev => {
      const updated = prev.filter(e => e.id !== id);
      return updated.map((e, i) => ({ ...e, order: i + 1 }));
    });
  }

  function moveUp(index) {
    if (index === 0) return;
    setSelected(prev => {
      const updated = [...prev];
      [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
      return updated.map((e, i) => ({ ...e, order: i + 1 }));
    });
  }

  function moveDown(index) {
    if (index === selected.length - 1) return;
    setSelected(prev => {
      const updated = [...prev];
      [updated[index], updated[index + 1]] = [updated[index + 1], updated[index]];
      return updated.map((e, i) => ({ ...e, order: i + 1 }));
    });
  }

  async function handleSubmit() {
    if (!name.trim()) {
      show('Erro', 'Digite um nome para o treino');
      return;
    }
    if (selected.length === 0) {
      show('Erro', 'Adicione pelo menos um exercício ao treino');
      return;
    }

    const payload = {
      name: name.trim(),
      exercises: selected.map(e => ({ exercise_id: e.id, order: e.order })),
    };

    try {
      setLoading(true);
      if (isEditing) {
        await api.patch(`/workouts/${existing.id}`, payload);
      } else {
        await api.post('/workouts/', payload);
      }
      navigation.goBack();
    } catch (e) {
      show('Erro', e.response?.data?.detail || 'Erro ao salvar treino');
    } finally {
      setLoading(false);
    }
  }

  const notSelected = available.filter(e => !selected.find(s => s.id === e.id));

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>{isEditing ? 'Editar treino' : 'Novo treino'}</Text>

        <Text style={styles.label}>Nome do treino</Text>
        <TextInput
          style={styles.input}
          placeholder="Ex: Treino de perna"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        {/* Exercícios selecionados */}
        <Text style={styles.label}>Sequência de exercícios</Text>
        {selected.length === 0 ? (
          <View style={styles.emptySelected}>
            <Text style={styles.emptySelectedText}>Nenhum exercício adicionado</Text>
          </View>
        ) : (
          selected.map((exercise, index) => (
            <View key={exercise.id} style={styles.selectedItem}>
              <Text style={styles.selectedOrder}>{exercise.order}</Text>
              <Text style={styles.selectedName}>{exercise.name}</Text>
              <View style={styles.selectedActions}>
                <TouchableOpacity onPress={() => moveUp(index)} style={styles.orderBtn}>
                  <Ionicons name="chevron-up" size={18} color={index === 0 ? '#444' : '#aaa'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => moveDown(index)} style={styles.orderBtn}>
                  <Ionicons name="chevron-down" size={18} color={index === selected.length - 1 ? '#444' : '#aaa'} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => removeExercise(exercise.id)} style={styles.orderBtn}>
                  <Ionicons name="close" size={18} color="#ff5555" />
                </TouchableOpacity>
              </View>
            </View>
          ))
        )}

        {/* Exercícios disponíveis */}
        <Text style={[styles.label, { marginTop: 20 }]}>Adicionar exercícios</Text>
        {loadingExercises ? (
          <ActivityIndicator color="#E8FF47" style={{ marginTop: 12 }} />
        ) : notSelected.length === 0 ? (
          <Text style={styles.allAddedText}>
            {available.length === 0
              ? 'Você ainda não tem exercícios cadastrados'
              : 'Todos os exercícios foram adicionados'}
          </Text>
        ) : (
          notSelected.map(exercise => (
            <TouchableOpacity key={exercise.id} style={styles.availableItem} onPress={() => addExercise(exercise)}>
              <Text style={styles.availableName}>{exercise.name}</Text>
              <Text style={styles.availableDetail}>{exercise.sets}x{exercise.reps} · {exercise.weight}kg</Text>
              <Ionicons name="add-circle-outline" size={22} color="#E8FF47" />
            </TouchableOpacity>
          ))
        )}

        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          {loading
            ? <ActivityIndicator color="#121212" />
            : <Text style={styles.buttonText}>{isEditing ? 'Salvar alterações' : 'Criar treino'}</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>Cancelar</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
