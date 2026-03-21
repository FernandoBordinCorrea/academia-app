import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 24,
    paddingTop: 16,
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
