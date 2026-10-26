import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useWorkoutSession } from '../context/WorkoutSessionContext';
import { navigationRef } from '../navigation/navigationRef';

function formatTime(seconds) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function TimerChip() {
  const { session, elapsed } = useWorkoutSession();

  if (!session) return null;

  function handlePress() {
    if (navigationRef.isReady()) {
      navigationRef.navigate('WorkoutSession', { workout: session.workout });
    }
  }

  return (
    <TouchableOpacity style={styles.chip} onPress={handlePress} activeOpacity={0.85}>
      <View style={styles.dot} />
      <Text style={styles.timer}>{formatTime(elapsed)}</Text>
      <Ionicons name="chevron-up" size={14} color="#121212" />
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FF47',
    borderRadius: 16,
    paddingVertical: 6,
    paddingHorizontal: 10,
    gap: 5,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#121212',
  },
  timer: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 13,
    fontVariant: ['tabular-nums'],
  },
});
