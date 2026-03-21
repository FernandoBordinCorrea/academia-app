import { useEffect, useRef, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import styles from './WorkoutSessionScreen.styles';
import { useModal } from '../../context/ModalContext';

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function calcCalories(seconds, weight, gender) {
  const factor = gender === 'M' ? 0.07 : 0.06;
  return Math.round((seconds / 60) * weight * factor);
}

export default function WorkoutSessionScreen({ route, navigation }) {
  const { show } = useModal();
  const { workout } = route.params;
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const [elapsed, setElapsed] = useState(0);
  const [weights, setWeights] = useState({});
  const [reps, setReps] = useState({});
  const [fromLastSession, setFromLastSession] = useState({});
  const [loading, setLoading] = useState(true);
  const intervalRef = useRef(null);

  useEffect(() => {
    fetchLastWeights();
    intervalRef.current = setInterval(() => {
      setElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(intervalRef.current);
  }, []);

  async function fetchLastWeights() {
    const initialWeights = {};
    const initialReps = {};
    const lastSessionMap = {};

    try {
      const { data } = await api.get(`/sessions/last-weights/${workout.id}`);
      workout.items.forEach((item) => {
        const lastWeight = data[item.exercise_id];
        if (lastWeight !== undefined) {
          initialWeights[item.exercise_id] = String(lastWeight);
          lastSessionMap[item.exercise_id] = true;
        } else {
          initialWeights[item.exercise_id] = String(item.exercise.weight);
        }
        initialReps[item.exercise_id] = String(item.exercise.reps);
      });
    } catch {
      workout.items.forEach((item) => {
        initialWeights[item.exercise_id] = String(item.exercise.weight);
        initialReps[item.exercise_id] = String(item.exercise.reps);
      });
    }

    setWeights(initialWeights);
    setReps(initialReps);
    setFromLastSession(lastSessionMap);
    setLoading(false);
  }

  async function handleFinish() {
    clearInterval(intervalRef.current);

    const calories = user?.weight && user?.gender
      ? calcCalories(elapsed, user.weight, user.gender)
      : null;

    const logs = workout.items.map((item) => ({
      exercise_id: item.exercise_id,
      weight_used: parseFloat(weights[item.exercise_id]) || item.exercise.weight,
      reps_used: parseInt(reps[item.exercise_id]) || item.exercise.reps,
    }));

    try {
      await api.post('/sessions/', {
        workout_id: workout.id,
        duration_seconds: elapsed,
        calories_burned: calories,
        logs,
      });
    } catch {
      // treino registrado localmente mesmo sem salvar no servidor
    }

    const caloriesLine = calories !== null ? `\nCalorias: ~${calories} kcal` : '';
    show(
      'Treino finalizado!',
      `Duração: ${formatTime(elapsed)}${caloriesLine}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  }

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#E8FF47" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <Text style={styles.timerLabel}>TEMPO DE TREINO</Text>
        <Text style={styles.timer}>{formatTime(elapsed)}</Text>
        <Text style={styles.workoutName}>{workout.name}</Text>
        {user?.weight && user?.gender && (
          <View style={styles.caloriesRow}>
            <Ionicons name="flame-outline" size={14} color="#E8FF47" />
            <Text style={styles.caloriesText}>
              ~{calcCalories(elapsed, user.weight, user.gender)} kcal
            </Text>
          </View>
        )}
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {workout.items.map((item) => (
          <View key={item.exercise_id} style={styles.card}>
            <View style={styles.cardOrder}>
              <Text style={styles.cardOrderText}>{item.order}</Text>
            </View>
            <View style={styles.cardInfo}>
              <Text style={styles.cardName}>{item.exercise.name}</Text>
              <View style={styles.statsRow}>
                <View style={styles.stat}>
                  <MaterialCommunityIcons name="repeat" size={14} color="#E8FF47" />
                  <Text style={styles.statValue}>{item.exercise.sets}</Text>
                  <Text style={styles.statLabel}>séries</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.weightStat}>
                  <Ionicons name="flash-outline" size={14} color="#E8FF47" />
                  <TextInput
                    style={styles.weightInput}
                    value={reps[item.exercise_id]}
                    onChangeText={(v) =>
                      setReps((prev) => ({ ...prev, [item.exercise_id]: v }))
                    }
                    keyboardType="number-pad"
                    selectTextOnFocus
                  />
                  <Text style={styles.statLabel}>reps</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.weightStat}>
                  <MaterialCommunityIcons name="weight-kilogram" size={14} color="#E8FF47" />
                  <TextInput
                    style={styles.weightInput}
                    value={weights[item.exercise_id]}
                    onChangeText={(v) =>
                      setWeights((prev) => ({ ...prev, [item.exercise_id]: v }))
                    }
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                  <Text style={styles.statLabel}>kg</Text>
                </View>
              </View>
              <Text style={styles.weightHint}>
                {fromLastSession[item.exercise_id] ? '↑ último treino' : '↑ peso cadastrado'}
              </Text>
            </View>
          </View>
        ))}
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.finishButton} onPress={handleFinish}>
          <Ionicons name="checkmark-circle-outline" size={20} color="#121212" />
          <Text style={styles.finishButtonText}>Finalizar Treino</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
