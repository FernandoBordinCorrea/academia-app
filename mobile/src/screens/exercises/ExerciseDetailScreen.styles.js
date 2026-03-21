import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  content: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 40,
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
    flex: 1,
    marginRight: 12,
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8FF47',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    gap: 4,
  },
  editButtonText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 13,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 28,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    paddingVertical: 14,
    alignItems: 'center',
    gap: 4,
  },
  statValue: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  statLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  sectionTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 16,
  },
  chartContainer: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
    overflow: 'hidden',
    paddingBottom: 12,
  },
  chart: {
    borderRadius: 16,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    paddingTop: 4,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  legendLabel: {
    color: '#aaa',
    fontSize: 12,
  },
  emptyChart: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 48,
    gap: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#2a2a2a',
  },
  emptyText: {
    color: '#555',
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 24,
  },
});
