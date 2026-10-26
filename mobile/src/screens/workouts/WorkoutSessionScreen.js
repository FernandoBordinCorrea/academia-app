import { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
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

function lastFilledSet(setLogs) {
  if (!setLogs) return null;
  for (let i = setLogs.length - 1; i >= 0; i--) {
    if (setLogs[i]?.weight && setLogs[i]?.reps) return setLogs[i];
  }
  return null;
}

function ExerciseSessionCard({ item, session, isExpanded, onToggle, setWeight, setRep, setSetField, onToggleCompleted, onToggleSetCompleted }) {
  const setLogs = session.setLogs[item.exercise_id] || [];
  const completedSets = session.completedSets[item.exercise_id] || [];
  const completed = !!session.completedExercises[item.exercise_id];
  const filled = lastFilledSet(setLogs);
  const rotation = useSharedValue(isExpanded ? 180 : 0);

  useEffect(() => {
    rotation.value = withTiming(isExpanded ? 180 : 0, { duration: 200 });
  }, [isExpanded, rotation]);

  const chevronStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  return (
    <Animated.View style={[styles.card, completed && styles.cardDone]} layout={LinearTransition.duration(200)}>
      <View style={styles.cardOrder}>
        <Text style={styles.cardOrderText}>{item.order}</Text>
      </View>
      <View style={styles.cardInfo}>
        <View style={styles.cardHeaderRow}>
          <TouchableOpacity onPress={() => onToggleCompleted(item.exercise_id)} hitSlop={8}>
            <Ionicons
              name={completed ? 'checkmark-circle' : 'ellipse-outline'}
              size={22}
              color={completed ? '#E8FF47' : '#555'}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.cardHeaderNameRow} onPress={onToggle} activeOpacity={0.7}>
            <Text style={[styles.cardName, completed && styles.textDone]}>{item.exercise.name}</Text>
            <Animated.View style={chevronStyle}>
              <Ionicons name="chevron-down" size={18} color="#aaa" />
            </Animated.View>
          </TouchableOpacity>
        </View>
        <View style={styles.statsRow}>
          <View style={styles.stat}>
            <MaterialCommunityIcons name="repeat" size={14} color="#E8FF47" />
            <Text style={styles.statValue}>{item.sets}</Text>
            <Text style={styles.statLabel}>séries</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.weightStat}>
            <Ionicons name="flash-outline" size={14} color="#E8FF47" />
            <TextInput
              style={[styles.weightInput, !!filled && styles.weightInputReadonly]}
              value={filled ? filled.reps : session.reps[item.exercise_id]}
              onChangeText={(v) => setRep(item.exercise_id, v)}
              editable={!filled}
              keyboardType="number-pad"
              selectTextOnFocus
            />
            <Text style={styles.statLabel}>reps</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.weightStat}>
            <MaterialCommunityIcons name="weight-kilogram" size={14} color="#E8FF47" />
            <TextInput
              style={[styles.weightInput, !!filled && styles.weightInputReadonly]}
              value={filled ? filled.weight : session.weights[item.exercise_id]}
              onChangeText={(v) => setWeight(item.exercise_id, v)}
              editable={!filled}
              keyboardType="decimal-pad"
              selectTextOnFocus
            />
            <Text style={styles.statLabel}>kg</Text>
          </View>
        </View>
        <Text style={styles.weightHint}>
          {filled
            ? '↑ última série preenchida'
            : session.fromLastSession[item.exercise_id] ? '↑ último treino' : '↑ peso cadastrado'}
        </Text>

        {isExpanded && (
          <Animated.View
            style={styles.setsList}
            entering={FadeIn.duration(180)}
            exiting={FadeOut.duration(120)}
            layout={LinearTransition.duration(200)}
          >
            {setLogs.map((set, i) => {
              const setDone = !!completedSets[i];
              return (
                <View key={i} style={[styles.setRow, setDone && styles.setRowDone]}>
                  <View style={styles.setLabelGroup}>
                    <TouchableOpacity onPress={() => onToggleSetCompleted(item.exercise_id, i)} hitSlop={8}>
                      <Ionicons
                        name={setDone ? 'checkmark-circle' : 'ellipse-outline'}
                        size={18}
                        color={setDone ? '#E8FF47' : '#555'}
                      />
                    </TouchableOpacity>
                    <Text style={[styles.setNumberLabel, setDone && styles.textDone]}>Série {i + 1}</Text>
                  </View>
                  <View style={styles.weightStat}>
                    <TextInput
                      style={styles.weightInput}
                      value={set.reps}
                      onChangeText={(v) => setSetField(item.exercise_id, i, 'reps', v)}
                      keyboardType="number-pad"
                      selectTextOnFocus
                      placeholder="-"
                      placeholderTextColor="#555"
                    />
                    <Text style={styles.statLabel}>reps</Text>
                  </View>
                  <View style={styles.weightStat}>
                    <TextInput
                      style={styles.weightInput}
                      value={set.weight}
                      onChangeText={(v) => setSetField(item.exercise_id, i, 'weight', v)}
                      keyboardType="decimal-pad"
                      selectTextOnFocus
                      placeholder="-"
                      placeholderTextColor="#555"
                    />
                    <Text style={styles.statLabel}>kg</Text>
                  </View>
                </View>
              );
            })}
          </Animated.View>
        )}
      </View>
    </Animated.View>
  );
}

export default function WorkoutSessionScreen({ route, navigation }) {
  const { show } = useModal();
  const { workout } = route.params;
  const insets = useSafeAreaInsets();
  const {
    session, elapsed, startSession, endSession, setWeight, setRep, setSetField,
    toggleExerciseCompleted, toggleSetCompleted, getFinalElapsed,
  } = useWorkoutSession();
  const isResuming = session?.workout.id === workout.id;
  const [loading, setLoading] = useState(!isResuming);
  const [expanded, setExpanded] = useState({});

  useEffect(() => {
    if (isResuming) return;
    fetchLastLog();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function toggleExpanded(exerciseId) {
    setExpanded(prev => ({ ...prev, [exerciseId]: !prev[exerciseId] }));
  }

  async function fetchLastLog() {
    const initialWeights = {};
    const initialReps = {};
    const lastSessionMap = {};
    const initialSetLogs = {};
    const initialCompletedExercises = {};
    const initialCompletedSets = {};

    try {
      const { data } = await api.get(`/sessions/last-log/${workout.id}`);
      workout.items.forEach((item) => {
        const lastLog = data[item.exercise_id];
        if (lastLog !== undefined) {
          initialWeights[item.exercise_id] = String(lastLog.weight_used);
          initialReps[item.exercise_id] = String(lastLog.reps_used ?? item.reps);
          lastSessionMap[item.exercise_id] = true;
        } else {
          initialWeights[item.exercise_id] = String(item.weight);
          initialReps[item.exercise_id] = String(item.reps);
        }
        initialSetLogs[item.exercise_id] = Array.from({ length: item.sets }, (_, i) => {
          const lastSet = lastLog?.sets?.[i];
          return { weight: lastSet ? String(lastSet.weight_used) : '', reps: lastSet ? String(lastSet.reps_used) : '' };
        });
        initialCompletedExercises[item.exercise_id] = false;
        initialCompletedSets[item.exercise_id] = Array(item.sets).fill(false);
      });
    } catch {
      workout.items.forEach((item) => {
        initialWeights[item.exercise_id] = String(item.weight);
        initialReps[item.exercise_id] = String(item.reps);
        initialSetLogs[item.exercise_id] = Array.from({ length: item.sets }, () => ({ weight: '', reps: '' }));
        initialCompletedExercises[item.exercise_id] = false;
        initialCompletedSets[item.exercise_id] = Array(item.sets).fill(false);
      });
    }

    startSession(workout, {
      weights: initialWeights,
      reps: initialReps,
      fromLastSession: lastSessionMap,
      setLogs: initialSetLogs,
      completedExercises: initialCompletedExercises,
      completedSets: initialCompletedSets,
    });
    setLoading(false);
  }

  async function handleFinish() {
    const finalElapsed = getFinalElapsed();

    const logs = workout.items.map((item) => {
      const filledSets = (session.setLogs[item.exercise_id] || [])
        .map((s, i) => ({ set_number: i + 1, weight: s.weight, reps: s.reps }))
        .filter(s => s.weight && s.reps);
      const lastSet = filledSets[filledSets.length - 1];

      return {
        exercise_id: item.exercise_id,
        weight_used: lastSet ? parseFloat(lastSet.weight) : (parseFloat(session.weights[item.exercise_id]) || item.weight),
        reps_used: lastSet ? parseInt(lastSet.reps) : (parseInt(session.reps[item.exercise_id]) || item.reps),
        sets: filledSets.map(s => ({
          set_number: s.set_number,
          weight_used: parseFloat(s.weight),
          reps_used: parseInt(s.reps),
        })),
      };
    });

    try {
      await api.post('/sessions/', {
        workout_id: workout.id,
        duration_seconds: finalElapsed,
        logs,
      });
    } catch {
      // treino registrado localmente mesmo sem salvar no servidor
    }

    endSession();
    show(
      'Treino finalizado!',
      `Duração: ${formatTime(finalElapsed)}`,
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
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
        {workout.items.map((item) => (
          <ExerciseSessionCard
            key={item.exercise_id}
            item={item}
            session={session}
            isExpanded={!!expanded[item.exercise_id]}
            onToggle={() => toggleExpanded(item.exercise_id)}
            setWeight={setWeight}
            setRep={setRep}
            setSetField={setSetField}
            onToggleCompleted={toggleExerciseCompleted}
            onToggleSetCompleted={toggleSetCompleted}
          />
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
