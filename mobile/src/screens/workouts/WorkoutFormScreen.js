import { useState, useEffect } from 'react';
import {
  View, Pressable, Text, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import DraggableFlatList, { ScaleDecorator } from 'react-native-draggable-flatlist';
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
    existing?.items?.map(i => ({
      id: i.exercise.id,
      name: i.exercise.name,
      order: i.order,
      sets: String(i.sets),
      reps: String(i.reps),
      weight: String(i.weight),
    })) || []
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
    setSelected(prev => [...prev, {
      id: exercise.id,
      name: exercise.name,
      order: prev.length + 1,
      sets: '3',
      reps: exercise.last_reps != null ? String(exercise.last_reps) : '12',
      weight: exercise.last_weight != null ? String(exercise.last_weight) : '',
    }]);
  }

  function removeExercise(id) {
    setSelected(prev => {
      const updated = prev.filter(e => e.id !== id);
      return updated.map((e, i) => ({ ...e, order: i + 1 }));
    });
  }

  function reorder(data) {
    setSelected(data.map((e, i) => ({ ...e, order: i + 1 })));
  }

  function setItemField(id, field, value) {
    setSelected(prev => prev.map(e => e.id === id ? { ...e, [field]: value } : e));
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

    const invalid = selected.find(e => !e.sets || !e.reps || !e.weight);
    if (invalid) {
      show('Erro', `Preencha séries, reps e peso de "${invalid.name}"`);
      return;
    }

    const payload = {
      name: name.trim(),
      exercises: selected.map(e => ({
        exercise_id: e.id,
        order: e.order,
        sets: parseInt(e.sets),
        reps: parseInt(e.reps),
        weight: parseFloat(e.weight),
      })),
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

  function renderSelectedItem({ item, drag, isActive, getIndex }) {
    return (
      <ScaleDecorator>
        <Pressable
          onLongPress={drag}
          disabled={isActive}
          style={[styles.selectedItem, isActive && styles.selectedItemActive]}
        >
          <View style={styles.selectedTopRow}>
            <Text style={styles.selectedOrder}>{getIndex() + 1}</Text>
            <Text style={styles.selectedName}>{item.name}</Text>
            <View style={styles.selectedActions}>
              <TouchableOpacity onPress={() => removeExercise(item.id)} style={styles.orderBtn}>
                <Ionicons name="close" size={18} color="#ff5555" />
              </TouchableOpacity>
              <View style={styles.orderBtn}>
                <Ionicons name="reorder-three" size={22} color="#aaa" />
              </View>
            </View>
          </View>
          <View style={styles.selectedGoalsRow}>
            <View style={styles.goalField}>
              <TextInput
                style={styles.goalInput}
                value={item.sets}
                onChangeText={(v) => setItemField(item.id, 'sets', v)}
                keyboardType="number-pad"
                selectTextOnFocus
              />
              <Text style={styles.goalLabel}>séries</Text>
            </View>
            <View style={styles.goalDivider} />
            <View style={styles.goalField}>
              <TextInput
                style={styles.goalInput}
                value={item.reps}
                onChangeText={(v) => setItemField(item.id, 'reps', v)}
                keyboardType="number-pad"
                selectTextOnFocus
              />
              <Text style={styles.goalLabel}>reps</Text>
            </View>
            <View style={styles.goalDivider} />
            <View style={styles.goalField}>
              <TextInput
                style={styles.goalInput}
                value={item.weight}
                onChangeText={(v) => setItemField(item.id, 'weight', v)}
                keyboardType="decimal-pad"
                selectTextOnFocus
              />
              <Text style={styles.goalLabel}>kg</Text>
            </View>
          </View>
        </Pressable>
      </ScaleDecorator>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.wrapper} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <DraggableFlatList
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        data={selected}
        keyExtractor={item => String(item.id)}
        onDragEnd={({ data }) => reorder(data)}
        animationConfig={{
          damping: 24,
          mass: 0.3,
          stiffness: 300,
          overshootClamping: true,
          restSpeedThreshold: 5,
          restDisplacementThreshold: 5,
        }}
        renderItem={renderSelectedItem}
        ListHeaderComponent={
          <>
            <Text style={styles.title}>{isEditing ? 'Editar treino' : 'Novo treino'}</Text>

            <Text style={styles.label}>Nome do treino</Text>
            <TextInput
              style={styles.input}
              placeholder="Ex: Treino de perna"
              placeholderTextColor="#666"
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.label}>Sequência de exercícios</Text>
            {selected.length === 0 && (
              <View style={styles.emptySelected}>
                <Text style={styles.emptySelectedText}>Nenhum exercício adicionado</Text>
              </View>
            )}
          </>
        }
        ListFooterComponent={
          <>
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
                  {exercise.last_weight != null && (
                    <Text style={styles.availableDetail}>último: {exercise.last_weight}kg · {exercise.last_reps} reps</Text>
                  )}
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
          </>
        }
      />
    </KeyboardAvoidingView>
  );
}
