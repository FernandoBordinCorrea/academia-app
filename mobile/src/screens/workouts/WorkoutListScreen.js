import { useState, useCallback } from 'react';
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import styles from './WorkoutListScreen.styles';
import { useModal } from '../../context/ModalContext';

export default function WorkoutListScreen({ navigation }) {
  const { show } = useModal();
  const [workouts, setWorkouts] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchWorkouts();
    }, [])
  );

  async function fetchWorkouts() {
    try {
      setLoading(true);
      const res = await api.get('/workouts/');
      setWorkouts(res.data);
    } catch {
      show('Erro', 'Não foi possível carregar os treinos');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id) {
    show('Remover treino', 'Tem certeza que deseja remover este treino?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: async () => {
          try {
            await api.delete(`/workouts/${id}`);
            setWorkouts(prev => prev.filter(w => w.id !== id));
          } catch {
            show('Erro', 'Não foi possível remover o treino');
          }
        },
      },
    ]);
  }

  function renderItem({ item }) {
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WorkoutDetail', { workout: item })}>
        <View style={styles.cardInfo}>
          <Text style={styles.cardName}>{item.name}</Text>
          <Text style={styles.cardDetail}>
            {item.items.length} {item.items.length === 1 ? 'exercício' : 'exercícios'}
          </Text>
        </View>
        <View style={styles.cardActions}>
          <TouchableOpacity onPress={() => handleDelete(item.id)}>
            <Text style={styles.deleteBtn}>Remover</Text>
          </TouchableOpacity>
          <Ionicons name="chevron-forward" size={18} color="#555" />
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Meus Treinos</Text>
        <TouchableOpacity style={styles.addButton} onPress={() => navigation.navigate('WorkoutForm', {})}>
          <Text style={styles.addButtonText}>+ Novo</Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <ActivityIndicator color="#E8FF47" style={{ marginTop: 40 }} />
      ) : workouts.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="barbell-outline" size={48} color="#333" style={{ marginBottom: 12 }} />
          <Text style={styles.emptyText}>Nenhum treino cadastrado ainda.</Text>
          <TouchableOpacity onPress={() => navigation.navigate('WorkoutForm', {})}>
            <Text style={styles.emptyLink}>Criar treino</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={workouts}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}
