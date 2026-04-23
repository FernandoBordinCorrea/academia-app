import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  camera: {
    flex: 1,
  },
  center: {
    flex: 1,
    backgroundColor: '#121212',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },

  // Overlay superior
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    alignItems: 'center',
    gap: 4,
  },
  resultLabel: {
    fontSize: 26,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  repsText: {
    fontSize: 16,
    color: '#ccc',
  },

  // Overlay inferior
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.55)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingVertical: 24,
    paddingBottom: 40,
  },
  iconBtn: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },

  // Status de conexão
  statusOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  statusText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 8,
  },

  // Permissão
  permText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
  },
  btn: {
    backgroundColor: '#E8FF47',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  btnText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
