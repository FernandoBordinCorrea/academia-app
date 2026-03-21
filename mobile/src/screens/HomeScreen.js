import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useAuth } from '../context/AuthContext';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import api from '../services/api';
import styles from './HomeScreen.styles';

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];

function formatDate(date) {
  const weekdays = ['Domingo','Segunda-feira','Terça-feira','Quarta-feira','Quinta-feira','Sexta-feira','Sábado'];
  return `${weekdays[date.getDay()]}, ${date.getDate()} de ${MONTHS[date.getMonth()]}`;
}

export default function HomeScreen({ navigation }) {
  const { user, logout } = useAuth();
  const [stats, setStats] = useState({ total_workouts: 0, total_calories: 0 });
  const today = new Date();

  useFocusEffect(
    useCallback(() => {
      api.get('/sessions/monthly-stats')
        .then(res => setStats(res.data))
        .catch(() => {});
    }, [])
  );

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.date}>{formatDate(today)}</Text>
      <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]}</Text>
      <Text style={styles.subtitle}>O que vamos treinar hoje?</Text>

      <View style={styles.statsRow}>
        <Ionicons name="barbell-outline" size={18} color="#E8FF47" />
        <Text style={styles.statText}>
          <Text style={styles.statHighlight}>{stats.total_workouts}</Text> treinos
        </Text>
        <Text style={styles.statDivider}>·</Text>
        <Ionicons name="flame-outline" size={18} color="#E8FF47" />
        <Text style={styles.statText}>
          <Text style={styles.statHighlight}>{stats.total_calories}</Text> kcal
        </Text>
        <Text style={styles.statDivider}>este mês</Text>
      </View>

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
        <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('Calendar')}>
          <Ionicons name="calendar-outline" size={32} color="#E8FF47" style={styles.cardIcon} />
          <Text style={styles.cardTitle}>Calendário</Text>
          <Text style={styles.cardSub}>Histórico de treinos</Text>
        </TouchableOpacity>
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
