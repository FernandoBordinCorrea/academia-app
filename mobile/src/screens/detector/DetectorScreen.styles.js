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

  // ── Overlays ──────────────────────────────────────────────────────────────
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
    gap: 6,
  },
  topOverlayRow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingTop: 52,
    paddingBottom: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
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
  fullOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },

  // ── Idle ──────────────────────────────────────────────────────────────────
  exercicioSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: 10,
    padding: 4,
    gap: 4,
  },
  exercicioBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  exercicioBtnAtivo: {
    backgroundColor: '#E8FF47',
  },
  exercicioBtnText: {
    color: '#aaa',
    fontSize: 14,
    fontWeight: '600',
  },
  exercicioBtnTextAtivo: {
    color: '#121212',
  },
  instrucaoText: {
    color: '#ccc',
    fontSize: 14,
    textAlign: 'center',
  },
  iconBtn: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  btnIniciar: {
    backgroundColor: '#E8FF47',
    paddingHorizontal: 40,
    paddingVertical: 14,
    borderRadius: 30,
  },
  btnIniciarText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 17,
  },

  // ── Flash ─────────────────────────────────────────────────────────────────
  flashOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(255,255,255,0.60)',
  },
  torchBtn: {
    padding: 6,
  },

  // ── Countdown ─────────────────────────────────────────────────────────────
  contagemNum: {
    fontSize: 120,
    fontWeight: 'bold',
    color: '#E8FF47',
    lineHeight: 130,
  },
  contagemLabel: {
    fontSize: 20,
    color: '#fff',
    marginTop: 8,
  },

  // ── Recording ─────────────────────────────────────────────────────────────
  recRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  recDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#F44336',
  },
  recText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  btnParar: {
    flex: 1,
    flexDirection: 'row',
    backgroundColor: '#E8FF47',
    paddingVertical: 14,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  btnPararText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 17,
  },

  // ── Processing ────────────────────────────────────────────────────────────
  processingText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  processingSubText: {
    color: '#888',
    fontSize: 14,
  },

  // ── Results ───────────────────────────────────────────────────────────────
  resultsContent: {
    alignItems: 'center',
    paddingTop: 40,
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 8,
  },
  resultsTitulo: {
    color: '#888',
    fontSize: 14,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  resultsReps: {
    color: '#E8FF47',
    fontSize: 80,
    fontWeight: 'bold',
    lineHeight: 88,
  },
  resultsRepsLabel: {
    color: '#ccc',
    fontSize: 16,
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 24,
    marginBottom: 24,
  },
  summaryBox: {
    alignItems: 'center',
    gap: 4,
  },
  summaryNum: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: '#888',
    fontSize: 13,
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: '#333',
  },
  detalhesList: {
    width: '100%',
    gap: 8,
  },
  detalheItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
  },
  detalheRep: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  detalheLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  semRepsText: {
    color: '#888',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 22,
  },
  resultsBtns: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  btnSecundario: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#444',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSecundarioText: {
    color: '#ccc',
    fontWeight: '600',
    fontSize: 15,
  },

  // ── Error ─────────────────────────────────────────────────────────────────
  erroText: {
    color: '#ccc',
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
  btnErro: {
    backgroundColor: '#E8FF47',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 10,
    marginTop: 8,
  },

  // ── Rever vídeo ───────────────────────────────────────────────────────────
  btnReverVideo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#E8FF47',
    marginHorizontal: 24,
    marginBottom: 12,
    paddingVertical: 18,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  btnReverVideoText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 17,
    letterSpacing: 0.3,
  },

  // ── Modal de vídeo ────────────────────────────────────────────────────────
  videoModal: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
  },
  videoPlayer: {
    flex: 1,
  },
  videoCloseBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#E8FF47',
    margin: 24,
    paddingVertical: 14,
    borderRadius: 10,
  },
  videoCloseBtnText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 15,
  },

  // ── Compartilhados ────────────────────────────────────────────────────────
  btn: {
    flex: 1,
    backgroundColor: '#E8FF47',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: {
    color: '#121212',
    fontWeight: 'bold',
    fontSize: 15,
  },
  permText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 32,
  },
});
