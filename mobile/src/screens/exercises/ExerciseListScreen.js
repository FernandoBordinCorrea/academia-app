import { useState, useCallback } from 'react';
import {
  View, Text, FlatList, TouchableOpacity,
  StyleSheet, Alert, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import api from '../../services/api';

export default function ExerciseListScreen({ navigation }) {
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
      Alert.alert('Erro', 'Não foi possível carregar os exercícios');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    Alert.alert('Remover', 'Tem certeza que deseja remover este exercício?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/exercises/${id}`);
            setExercises(prev => prev.filter(e => e.id !== id));
          } catch {
            Alert.alert('Erro', 'Não foi possível remover');
          }
        },
      },
    ]);
  }

  function renderItem({ item }) {
    return (
      <View style={styles.card}>
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
      </View>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#E8FF47',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDetail: {
    color: '#aaa',
    fontSize: 13,
  },
  cardActions: {
    gap: 8,
    alignItems: 'flex-end',
  },
  editBtn: {
    color: '#E8FF47',
    fontSize: 13,
    fontWeight: 'bold',
  },
  deleteBtn: {
    color: '#ff5555',
    fontSize: 13,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 15,
    marginBottom: 12,
  },
  emptyLink: {
    color: '#E8FF47',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
