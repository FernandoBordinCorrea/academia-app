import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import styles from './WorkoutSessionScreen.styles';
import { useModal } from '../../context/ModalContext';
import { useWorkoutSession } from '../../context/WorkoutSessionContext';

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
  const { session, elapsed, startSession, endSession, setWeight, setRep, getFinalElapsed } = useWorkoutSession();
  const isResuming = session?.workout.id === workout.id;
  const [loading, setLoading] = useState(!isResuming);

  useEffect(() => {
    if (isResuming) return;
    fetchLastWeights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

    startSession(workout, { weights: initialWeights, reps: initialReps, fromLastSession: lastSessionMap });
    setLoading(false);
  }

  async function handleFinish() {
    const finalElapsed = getFinalElapsed();

    const calories = user?.weight && user?.gender
      ? calcCalories(finalElapsed, user.weight, user.gender)
      : null;

    const logs = workout.items.map((item) => ({
      exercise_id: item.exercise_id,
      weight_used: parseFloat(session.weights[item.exercise_id]) || item.exercise.weight,
      reps_used: parseInt(session.reps[item.exercise_id]) || item.exercise.reps,
    }));

    try {
      await api.post('/sessions/', {
        workout_id: workout.id,
        duration_seconds: finalElapsed,
        calories_burned: calories,
        logs,
      });
    } catch {
      // treino registrado localmente mesmo sem salvar no servidor
    }

    endSession();
    const caloriesLine = calories !== null ? `\nCalorias: ~${calories} kcal` : '';
    show(
      'Treino finalizado!',
      `Duração: ${formatTime(finalElapsed)}${caloriesLine}`,
      [{ text: 'OK', onPress: () => navigation.goBack() }]
    );
  }

  if (loading || !session) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator color="#E8FF47" size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.timerContainer}>
        <TouchableOpacity style={styles.minimizeBtn} onPress={() => navigation.goBack()} hitSlop={10}>
          <Ionicons name="chevron-down" size={22} color="#aaa" />
        </TouchableOpacity>
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
                    value={session.reps[item.exercise_id]}
                    onChangeText={(v) => setRep(item.exercise_id, v)}
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
                    value={session.weights[item.exercise_id]}
                    onChangeText={(v) => setWeight(item.exercise_id, v)}
                    keyboardType="decimal-pad"
                    selectTextOnFocus
                  />
                  <Text style={styles.statLabel}>kg</Text>
                </View>
              </View>
              <Text style={styles.weightHint}>
                {session.fromLastSession[item.exercise_id] ? '↑ último treino' : '↑ peso cadastrado'}
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
