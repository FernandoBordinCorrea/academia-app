import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../context/AuthContext';
import styles from './HomeScreen.styles';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}</Text>
      <Text style={styles.subtitle}>O que vamos treinar hoje?</Text>

      <View style={styles.cardsRow}>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ExerciseList')}>
          <MaterialCommunityIcons name="dumbbell" size={32} color="#E8FF47" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Exercícios</Text>
          <Text style={styles.cardSub}>Gerencie seus exercícios</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('WorkoutList')}>
          <Ionicons name="list-outline" size={32} color="#E8FF47" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Treinos</Text>
          <Text style={styles.cardSub}>Monte sua rotina</Text>
        </TouchableOpacity>
      </View>
      <View style={[styles.cardsRow, { marginTop: 12 }]}>
        <View style={[styles.card, styles.cardDisabled]}>
          <Ionicons name="camera-outline" size={32} color="#E8FF47" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Detector</Text>
          <Text style={styles.cardSub}>Em breve</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

