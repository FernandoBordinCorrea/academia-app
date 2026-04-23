import { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import appConfig from '../../config';
import styles from './DetectorScreen.styles';

const COR_MAP = {
  verde:    '#4CAF50',
  vermelho: '#F44336',
  amarelo:  '#FFD600',
  cinza:    '#9E9E9E',
};

export default function DetectorScreen({ navigation }) {
  const [permission, requestPermission] = useCameraPermissions();
  const [facing, setFacing]   = useState('front');
  const [wsStatus, setWsStatus] = useState('connecting'); // connecting | connected | error
  const [resultado, setResultado] = useState({ state: 'AGUARDANDO', label: 'Conectando...', cor: 'cinza', reps: 0 });

  const cameraRef   = useRef(null);
  const wsRef       = useRef(null);
  const intervalRef = useRef(null);
  const sendingRef  = useRef(false);

  const stopFrames = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const startFrames = () => {
    stopFrames();
    intervalRef.current = setInterval(async () => {
      if (sendingRef.current) return;
      if (!cameraRef.current) return;
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;

      sendingRef.current = true;
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 0.25,
          base64: true,
          skipProcessing: true,
        });
        if (photo?.base64 && wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(photo.base64);
        }
      } catch (_) {
        // ignora erros de frame individual
      } finally {
        sendingRef.current = false;
      }
    }, 250);
  };

  const connect = useCallback(() => {
    if (wsRef.current) wsRef.current.close();
    setWsStatus('connecting');

    const ws = new WebSocket(`${appConfig.WS_URL}/ws/detector`);

    ws.onopen = () => {
      wsRef.current = ws;
      setWsStatus('connected');
      startFrames();
    };

    ws.onmessage = (e) => {
      try { setResultado(JSON.parse(e.data)); } catch (_) {}
    };

    ws.onerror = () => setWsStatus('error');

    ws.onclose = () => {
      setWsStatus('error');
      stopFrames();
    };
  }, []);

  useEffect(() => {
    connect();
    return () => {
      stopFrames();
      wsRef.current?.close();
    };
  }, []);

  // ── Permissão de câmera ──────────────────────────────────────────────────
  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color="#E8FF47" /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="camera-outline" size={48} color="#E8FF47" />
        <Text style={styles.permText}>Precisamos de acesso à câmera</Text>
        <TouchableOpacity style={styles.btn} onPress={requestPermission}>
          <Text style={styles.btnText}>Permitir câmera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const labelCor = COR_MAP[resultado.cor] ?? '#9E9E9E';

  return (
    <View style={styles.container}>
      <CameraView ref={cameraRef} style={styles.camera} facing={facing} animateShutter={false} />

      {/* Overlay superior — resultado */}
      <View style={styles.topOverlay}>
        <Text style={[styles.resultLabel, { color: labelCor }]} numberOfLines={1}>
          {resultado.label}
        </Text>
        <Text style={styles.repsText}>Reps: {resultado.reps}</Text>
      </View>

      {/* Overlay inferior — controles */}
      <View style={styles.bottomOverlay}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={26} color="#fff" />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.iconBtn}
          onPress={() => setFacing(f => f === 'front' ? 'back' : 'front')}
        >
          <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Status de conexão */}
      {wsStatus !== 'connected' && (
        <View style={styles.statusOverlay}>
          {wsStatus === 'connecting' ? (
            <>
              <ActivityIndicator color="#E8FF47" />
              <Text style={styles.statusText}>Conectando...</Text>
            </>
          ) : (
            <>
              <Text style={styles.statusText}>Sem conexão com o servidor</Text>
              <TouchableOpacity style={styles.btn} onPress={connect}>
                <Text style={styles.btnText}>Reconectar</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}
    </View>
  );
}
