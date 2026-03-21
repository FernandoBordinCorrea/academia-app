import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  ActivityIndicator
} from 'react-native';
import styles from './ExerciseListScreen.styles';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';
import { useModal } from '../../context/ModalContext';

export default function ExerciseListScreen({ navigation }) {
  const { show } = useModal();
  const [exercises, setExercises] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchExercises();
    }, [])
  );

  async function fetchExercises() {
    try {
      setLoading(true);
      const res = await api.get('/exercises/');
      setExercises(res.data);
    } catch (e) {
      show('Erro', 'Não foi possível carregar os exercícios');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    show('Remover', 'Tem certeza que deseja remover este exercício?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/exercises/${id}`);
            setExercises(prev => prev.filter(e => e.id !== id));
          } catch {
            show('Erro', 'Não foi possível remover');
          }
        },
      },
    ]);
  }

  function renderItem({ item }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ExerciseDetail', { exercise: item })}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardDetail}>{item.sets} séries · {item.reps} reps · {item.weight}kg</Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => navigation.navigate('ExerciseForm', { exercise: item })}>
            <Text style={styles.editBtn}>Editar</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteBtn}>Remover</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Exercícios</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('ExerciseForm', {})}>
          <Text style={styles.addButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#E8FF47" style={{ marginTop: 40 }} />
      ) : exercises.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Nenhum exercício cadastrado ainda.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('ExerciseForm', {})}>
            <Text style={styles.emptyLink}>Adicionar exercício</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={exercises}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}
