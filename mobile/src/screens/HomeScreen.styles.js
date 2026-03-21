import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  date: {
    fontSize: 13,
    color: '#555',
    marginBottom: 4,
    textTransform: 'capitalize',
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
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 28,
  },
  statText: {
    color: '#aaa',
    fontSize: 16,
  },
  statHighlight: {
    color: '#E8FF47',
    fontWeight: 'bold',
    fontSize: 18,
  },
  statDivider: {
    color: '#444',
    fontSize: 16,
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
  cardIcon: {
    marginBottom: 10,
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
