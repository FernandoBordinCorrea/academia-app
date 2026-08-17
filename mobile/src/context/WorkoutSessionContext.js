import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { AppState, Platform } from 'react-native';
import Constants, { ExecutionEnvironment } from 'expo-constants';

const WorkoutSessionContext = createContext(null);

// No Expo Go o módulo nativo do notifee nunca existe — nem tenta carregar o
// pacote nesse caso (evita o overlay de erro do Metro na primeira carga).
const IS_EXPO_GO = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

async function startWorkoutNotification(startTime) {
  if (Platform.OS !== 'android' || IS_EXPO_GO) return;

  try {
    const notifee = require('@notifee/react-native').default;
    const { AndroidImportance, AndroidColor } = require('@notifee/react-native');

    await notifee.requestPermission();
    const channelId = await notifee.createChannel({
      id: 'workout-timer',
      name: 'Cronômetro de treino',
      importance: AndroidImportance.LOW,
    });

    await notifee.displayNotification({
      title: 'Treino em andamento',
      body: 'Toque para voltar ao treino',
      android: {
        channelId,
        asForegroundService: true,
        ongoing: true,
        colorized: true,
        color: AndroidColor.BLUE,
        smallIcon: 'ic_launcher',
        showChronometer: true,
        chronometerDirection: 'up',
        timestamp: startTime,
        pressAction: { id: 'default' },
      },
    });
  } catch {
    // módulo nativo do notifee indisponível (ex: Expo Go) — segue sem o chip
  }
}

async function stopWorkoutNotification() {
  if (Platform.OS !== 'android' || IS_EXPO_GO) return;
  try {
    const notifee = require('@notifee/react-native').default;
    await notifee.stopForegroundService();
  } catch {
    // idem — nada a parar se o serviço nunca chegou a iniciar
  }
}

export function WorkoutSessionProvider({ children }) {
  const [session, setSession] = useState(null);
  const [elapsed, setElapsed] = useState(0);
  const startTimeRef = useRef(null);
  const intervalRef = useRef(null);

  const updateElapsed = useCallback(() => {
    if (!startTimeRef.current) return;
    setElapsed(Math.floor((Date.now() - startTimeRef.current) / 1000));
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') updateElapsed();
    });
    return () => subscription.remove();
  }, [updateElapsed]);

  const startSession = useCallback((workout, { weights, reps, fromLastSession }) => {
    startTimeRef.current = Date.now();
    setElapsed(0);
    setSession({ workout, weights, reps, fromLastSession });
    startWorkoutNotification(startTimeRef.current);
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(updateElapsed, 1000);
  }, [updateElapsed]);

  const endSession = useCallback(() => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    startTimeRef.current = null;
    stopWorkoutNotification();
    setSession(null);
    setElapsed(0);
  }, []);

  const setWeight = useCallback((exerciseId, value) => {
    setSession(prev => prev && { ...prev, weights: { ...prev.weights, [exerciseId]: value } });
  }, []);

  const setRep = useCallback((exerciseId, value) => {
    setSession(prev => prev && { ...prev, reps: { ...prev.reps, [exerciseId]: value } });
  }, []);

  const getFinalElapsed = useCallback(() => {
    return startTimeRef.current ? Math.floor((Date.now() - startTimeRef.current) / 1000) : elapsed;
  }, [elapsed]);

  return (
    <WorkoutSessionContext.Provider
      value={{ session, elapsed, startSession, endSession, setWeight, setRep, getFinalElapsed }}
    >
      {children}
    </WorkoutSessionContext.Provider>
  );
}

export function useWorkoutSession() {
  return useContext(WorkoutSessionContext);
}
