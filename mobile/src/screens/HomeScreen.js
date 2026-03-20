import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useAuth } from '../context/AuthContext';

export default function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.greeting}>Olá, {user?.name?.split(' ')[0]} 👋</Text>
      <Text style={styles.subtitle}>O que vamos treinar hoje?</Text>

      <View style={styles.cardsRow}>
        <View style={styles.card}>
          <Text style={styles.cardEmoji}>🏋️</Text>
          <Text style={styles.cardTitle}>Exercícios</Text>
          <Text style={styles.cardSub}>Gerencie seus exercícios</Text>
        </View>
        <View style={[styles.card, styles.cardDisabled]}>
          <Text style={styles.cardEmoji}>📷</Text>
          <Text style={styles.cardTitle}>Detector</Text>
          <Text style={styles.cardSub}>Em breve</Text>
        </View>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Sair</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  greeting: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 15,
    color: '#aaa',
    marginTop: 4,
    marginBottom: 32,
  },
  cardsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  card: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 14,
    padding: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  cardDisabled: {
    opacity: 0.5,
  },
  cardEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  cardTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  cardSub: {
    color: '#aaa',
    fontSize: 12,
  },
  logoutButton: {
    marginTop: 'auto',
    marginBottom: 32,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#333',
    alignItems: 'center',
  },
  logoutText: {
    color: '#aaa',
    fontSize: 15,
  },
});
