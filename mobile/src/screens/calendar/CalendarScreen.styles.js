import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  calendar: {
    borderBottomWidth: 1,
    borderBottomColor: '#2a2a2a',
  },
  detailContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  detailTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
    textTransform: 'capitalize',
  },
  sessionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    gap: 14,
  },
  sessionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2a2a2a',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sessionInfo: {
    flex: 1,
  },
  sessionName: {
    color: '#fff',
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  sessionStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  sessionStat: {
    color: '#aaa',
    fontSize: 13,
  },
  sessionStatDivider: {
    color: '#444',
    fontSize: 13,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingBottom: 60,
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
  },
});
