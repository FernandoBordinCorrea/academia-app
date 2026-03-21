import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
  },
  addButton: {
    backgroundColor: '#E8FF47',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  cardInfo: {
    flex: 1,
    marginRight: 12,
  },
  cardName: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDetail: {
    color: '#E8FF47',
    fontSize: 12,
    marginBottom: 8,
  },
  cardActions: {
    gap: 8,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  deleteBtn: {
    color: '#ff5555',
    fontSize: 13,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: '#aaa',
    fontSize: 15,
    marginBottom: 12,
  },
  emptyLink: {
    color: '#E8FF47',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
