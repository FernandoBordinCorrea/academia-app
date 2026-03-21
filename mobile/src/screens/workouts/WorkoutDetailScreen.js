import { View, Text, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import styles from './WorkoutDetailScreen.styles';

export default function WorkoutDetailScreen({ route, navigation }) {
  const { workout } = route.params;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>{workout.name}</Text>
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('WorkoutForm', { workout })}
        >
          <Ionicons name="pencil-outline" size={16} color="#121212" />
          <Text style={styles.editButtonText}>Editar</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.subtitle}>
        {workout.items.length} {workout.items.length === 1 ? 'exercício' : 'exercícios'}
      </Text>

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
              <View style={styles.stat}>
                <Ionicons name="flash-outline" size={14} color="#E8FF47" />
                <Text style={styles.statValue}>{item.exercise.reps}</Text>
                <Text style={styles.statLabel}>reps</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.stat}>
                <MaterialCommunityIcons name="weight-kilogram" size={14} color="#E8FF47" />
                <Text style={styles.statValue}>{item.exercise.weight}</Text>
                <Text style={styles.statLabel}>kg</Text>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
}
