import { useCallback, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { LineChart } from 'react-native-chart-kit';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../../services/api';
import styles from './ExerciseDetailScreen.styles';

const SCREEN_WIDTH = Dimensions.get('window').width;

const CHART_CONFIG = {
  backgroundGradientFrom: '#1E1E1E',
  backgroundGradientTo: '#1E1E1E',
  color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
  labelColor: () => '#aaa',
  strokeWidth: 2,
  propsForDots: { r: '4' },
  propsForBackgroundLines: { stroke: '#2a2a2a' },
  decimalPlaces: 0,
};

export default function ExerciseDetailScreen({ route, navigation }) {
  const { exercise } = route.params;
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      fetchHistory();
    }, [])
  );

  async function fetchHistory() {
    setLoading(true);
    try {
      const { data } = await api.get(`/sessions/exercise-history/${exercise.id}`);
      setHistory(data);
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }

  const hasHistory = history.length >= 2;

  const chartData = hasHistory
    ? {
        labels: history.map((h) => h.date),
        datasets: [
          {
            data: history.map((h) => h.weight_used),
            color: () => '#E8FF47',
            strokeWidth: 2,
          },
          {
            data: history.map((h) => h.reps_used ?? exercise.reps),
            color: () => '#888',
            strokeWidth: 2,
          },
        ],
        legend: ['Peso (kg)', 'Reps'],
      }
    : null;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{exercise.name}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('ExerciseForm', { exercise })}
        >
          <Ionicons name="pencil-outline" size={16} color="#121212" />
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="repeat" size={20} color="#E8FF47" />
          <Text style={styles.statValue}>{exercise.sets}</Text>
          <Text style={styles.statLabel}>séries</Text>
        </View>
        <View style={styles.statCard}>
          <Ionicons name="flash-outline" size={20} color="#E8FF47" />
          <Text style={styles.statValue}>{exercise.reps}</Text>
          <Text style={styles.statLabel}>reps</Text>
        </View>
        <View style={styles.statCard}>
          <MaterialCommunityIcons name="weight-kilogram" size={20} color="#E8FF47" />
          <Text style={styles.statValue}>{exercise.weight}</Text>
          <Text style={styles.statLabel}>kg</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Histórico</Text>

      {loading ? (
        <ActivityIndicator color="#E8FF47" style={{ marginTop: 32 }} />
      ) : !hasHistory ? (
        <View style={styles.emptyChart}>
          <Ionicons name="bar-chart-outline" size={40} color="#333" />
          <Text style={styles.emptyText}>
            {history.length === 0
              ? 'Nenhum treino registrado ainda'
              : 'Faça pelo menos 2 treinos para ver o gráfico'}
          </Text>
        </View>
      ) : (
        <View style={styles.chartContainer}>
          <LineChart
            data={chartData}
            width={SCREEN_WIDTH - 40}
            height={220}
            chartConfig={CHART_CONFIG}
            bezier
            style={styles.chart}
            withInnerLines={true}
            withOuterLines={false}
            fromZero={false}
          />
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#E8FF47' }]} />
              <Text style={styles.legendLabel}>Peso (kg)</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#888' }]} />
              <Text style={styles.legendLabel}>Reps</Text>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}
