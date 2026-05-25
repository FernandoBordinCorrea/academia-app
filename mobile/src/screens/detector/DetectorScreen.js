import { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Brightness from 'expo-brightness';
import appConfig from '../../config';
import styles from './DetectorScreen.styles';

function formatDuracao(s) {
  const m   = Math.floor(s / 60);
  const sec = s % 60;
  return `${String(m).padStart(2, '0')}:${String(sec).padStart(2, '0')}`;
}

export default function DetectorScreen({ navigation }) {
  const [permission, requestPermission]       = useCameraPermissions();
  const [micPermission, requestMicPermission] = useMicrophonePermissions();
  const [facing, setFacing]       = useState('back');
  const [tela, setTela]           = useState('idle');
  const [contagem, setContagem]   = useState(3);
  const [duracao, setDuracao]     = useState(0);
  const [parando, setParando]     = useState(false);
  const [resultado, setResultado] = useState(null);
  const [erroMsg, setErroMsg]     = useState('');
  const [videoUri, setVideoUri]   = useState(null);
  const [showVideo, setShowVideo] = useState(false);
  const [torchOn, setTorchOn]     = useState(false);
  const [exercicio, setExercicio] = useState('frontraise');

  const cameraRef             = useRef(null);
  const timerRef              = useRef(null);
  const originalBrightnessRef = useRef(null);

  const player = useVideoPlayer(videoUri, p => { p.loop = false; });

  useEffect(() => {
    if (showVideo && videoUri) {
      player.replay();
    } else {
      player.pause();
    }
  }, [showVideo]);

  useEffect(() => {
    return () => {
      clearInterval(timerRef.current);
      // Restaura brilho original ao sair da tela
      if (originalBrightnessRef.current !== null) {
        Brightness.setBrightnessAsync(originalBrightnessRef.current);
      }
    };
  }, []);

  const toggleTorch = async () => {
    if (facing === 'front') {
      if (!torchOn) {
        originalBrightnessRef.current = await Brightness.getBrightnessAsync();
        await Brightness.setBrightnessAsync(1.0);
      } else {
        await Brightness.setBrightnessAsync(originalBrightnessRef.current ?? 0.5);
      }
    }
    setTorchOn(t => !t);
  };

  const flipCamera = () => {
    if (torchOn) {
      if (facing === 'front' && originalBrightnessRef.current !== null) {
        Brightness.setBrightnessAsync(originalBrightnessRef.current);
      }
      setTorchOn(false);
    }
    setFacing(f => f === 'front' ? 'back' : 'front');
  };

  const iniciarContagem = async () => {
    if (!micPermission?.granted) {
      const { granted } = await requestMicPermission();
      if (!granted) {
        setErroMsg('Permissão de microfone necessária para gravar vídeo.');
        setTela('error');
        return;
      }
    }
    setContagem(3);
    setTela('countdown');
    let count = 3;
    timerRef.current = setInterval(() => {
      count--;
      if (count <= 0) {
        clearInterval(timerRef.current);
        iniciarGravacao();
      } else {
        setContagem(count);
      }
    }, 1000);
  };

  const iniciarGravacao = async () => {
    setParando(false);
    setDuracao(0);
    setVideoUri(null);
    setTela('recording');

    await new Promise(resolve => setTimeout(resolve, 600));

    timerRef.current = setInterval(() => setDuracao(d => d + 1), 1000);

    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 120 });
      clearInterval(timerRef.current);

      if (!video?.uri) throw new Error('Arquivo de vídeo não gerado');

      setVideoUri(video.uri);
      setTela('processing');
      await enviarVideo(video.uri);
    } catch (e) {
      clearInterval(timerRef.current);
      setErroMsg(`Erro ao gravar: ${e?.message ?? 'tente novamente'}`);
      setTela('error');
    }
  };

  const pararGravacao = () => {
    setParando(true);
    clearInterval(timerRef.current);
    cameraRef.current?.stopRecording();
  };

  const enviarVideo = async (uri) => {
    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('video', { uri, type: 'video/mp4', name: 'exercise.mp4' });

      const response = await fetch(`${appConfig.API_URL}/detector/analyze?exercise=${exercicio}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
      });

      if (!response.ok) throw new Error(`Servidor retornou ${response.status}`);
      setResultado(await response.json());
      setTela('results');
    } catch (e) {
      setErroMsg(`Erro ao analisar: ${e?.message ?? 'verifique a conexão'}`);
      setTela('error');
    }
  };

  const reiniciar = () => {
    setResultado(null);
    setVideoUri(null);
    setTela('idle');
  };

  // ── Permissão ──────────────────────────────────────────────────────────────
  if (!permission) {
    return <View style={styles.center}><ActivityIndicator color="#E8FF47" /></View>;
  }

  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.center}>
        <Ionicons name="camera-outline" size={48} color="#E8FF47" />
        <Text style={styles.permText}>Precisamos de acesso à câmera</Text>
        <TouchableOpacity style={styles.btnErro} onPress={requestPermission}>
          <Text style={styles.btnText}>Permitir câmera</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  const showCamera = ['idle', 'countdown', 'recording'].includes(tela);

  return (
    <View style={styles.container}>

      {/* ── Câmera ── */}
      {showCamera && (
        <CameraView
          ref={cameraRef}
          style={styles.camera}
          facing={facing}
          mode="video"
          animateShutter={false}
          mute
          enableTorch={torchOn && facing === 'back'}
        />
      )}

      {/* Overlay branco para simular flash na câmera frontal */}
      {showCamera && torchOn && facing === 'front' && (
        <View style={styles.flashOverlay} pointerEvents="none" />
      )}

      {/* ── IDLE ── */}
      {tela === 'idle' && (
        <>
          <View style={styles.topOverlay}>
            <View style={styles.exercicioSelector}>
              <TouchableOpacity
                style={[styles.exercicioBtn, exercicio === 'frontraise' && styles.exercicioBtnAtivo]}
                onPress={() => setExercicio('frontraise')}
              >
                <Text style={[styles.exercicioBtnText, exercicio === 'frontraise' && styles.exercicioBtnTextAtivo]}>
                  Elevação Frontal
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.exercicioBtn, exercicio === 'biceps' && styles.exercicioBtnAtivo]}
                onPress={() => setExercicio('biceps')}
              >
                <Text style={[styles.exercicioBtnText, exercicio === 'biceps' && styles.exercicioBtnTextAtivo]}>
                  Rosca Direta
                </Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.instrucaoText}>
              {exercicio === 'frontraise'
                ? 'Posicione a câmera de lado e fique de lateral para ela'
                : 'Posicione a câmera de lado e fique de lateral para ela'}
            </Text>
          </View>
          <View style={styles.bottomOverlay}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
              <Ionicons name="arrow-back" size={26} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnIniciar} onPress={iniciarContagem}>
              <Text style={styles.btnIniciarText}>Iniciar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={toggleTorch}>
              <Ionicons
                name={facing === 'front' ? (torchOn ? 'sunny' : 'sunny-outline') : (torchOn ? 'flash' : 'flash-outline')}
                size={26}
                color={torchOn ? '#E8FF47' : '#fff'}
              />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconBtn} onPress={flipCamera}>
              <Ionicons name="camera-reverse-outline" size={28} color="#fff" />
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ── COUNTDOWN ── */}
      {tela === 'countdown' && (
        <View style={styles.fullOverlay}>
          <Text style={styles.contagemNum}>{contagem}</Text>
          <Text style={styles.contagemLabel}>Prepare-se...</Text>
        </View>
      )}

      {/* ── RECORDING ── */}
      {tela === 'recording' && (
        <>
          <View style={styles.topOverlayRow}>
            <View style={styles.recRow}>
              <View style={styles.recDot} />
              <Text style={styles.recText}>
                {parando ? 'Finalizando...' : `Gravando  ${formatDuracao(duracao)}`}
              </Text>
            </View>
            <TouchableOpacity onPress={toggleTorch} style={styles.torchBtn}>
              <Ionicons
                name={facing === 'front' ? (torchOn ? 'sunny' : 'sunny-outline') : (torchOn ? 'flash' : 'flash-outline')}
                size={24}
                color={torchOn ? '#E8FF47' : '#fff'}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.bottomOverlay}>
            {parando ? (
              <ActivityIndicator color="#E8FF47" style={{ flex: 1 }} />
            ) : (
              <TouchableOpacity style={styles.btnParar} onPress={pararGravacao}>
                <Ionicons name="stop-circle-outline" size={26} color="#121212" />
                <Text style={styles.btnPararText}>Parar</Text>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {/* ── PROCESSING ── */}
      {tela === 'processing' && (
        <View style={[styles.fullOverlay, { backgroundColor: '#121212' }]}>
          <ActivityIndicator size="large" color="#E8FF47" />
          <Text style={styles.processingText}>Analisando seu treino...</Text>
          <Text style={styles.processingSubText}>Isso pode levar alguns segundos</Text>
        </View>
      )}

      {/* ── RESULTS ── */}
      {tela === 'results' && resultado && (
        <SafeAreaView style={[styles.fullOverlay, { backgroundColor: '#121212' }]}>
          <ScrollView contentContainerStyle={styles.resultsContent} showsVerticalScrollIndicator={false}>
            <Text style={styles.resultsTitulo}>Resultado</Text>

            <Text style={styles.resultsReps}>{resultado.reps}</Text>
            <Text style={styles.resultsRepsLabel}>repetições detectadas</Text>

            <View style={styles.summaryRow}>
              <View style={styles.summaryBox}>
                <Text style={[styles.summaryNum, { color: '#4CAF50' }]}>{resultado.corretos}</Text>
                <Text style={styles.summaryLabel}>corretas</Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryBox}>
                <Text style={[styles.summaryNum, { color: '#F44336' }]}>{resultado.incorretos}</Text>
                <Text style={styles.summaryLabel}>incorretas</Text>
              </View>
            </View>

            {resultado.detalhes?.length > 0 && (
              <View style={styles.detalhesList}>
                {resultado.detalhes.map((item) => (
                  <View key={item.rep} style={styles.detalheItem}>
                    <Text style={styles.detalheRep}>Rep {item.rep}</Text>
                    <Text style={[styles.detalheLabel, { color: item.correto ? '#4CAF50' : '#F44336' }]}>
                      {item.label}
                    </Text>
                  </View>
                ))}
              </View>
            )}

            {resultado.reps === 0 && (
              <Text style={styles.semRepsText}>
                Nenhuma repetição detectada. Certifique-se de ficar de lateral para a câmera.
              </Text>
            )}
          </ScrollView>

          {videoUri && (
            <TouchableOpacity style={styles.btnReverVideo} onPress={() => setShowVideo(true)}>
              <Ionicons name="play-circle-outline" size={20} color="#121212" />
              <Text style={styles.btnReverVideoText}>Rever vídeo</Text>
            </TouchableOpacity>
          )}

          <View style={styles.resultsBtns}>
            <TouchableOpacity style={styles.btnSecundario} onPress={() => navigation.goBack()}>
              <Text style={styles.btnSecundarioText}>Voltar</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btn} onPress={reiniciar}>
              <Text style={styles.btnText}>Repetir</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      )}

      {/* ── ERROR ── */}
      {tela === 'error' && (
        <View style={[styles.fullOverlay, { backgroundColor: '#121212' }]}>
          <Ionicons name="alert-circle-outline" size={52} color="#F44336" />
          <Text style={styles.erroText}>{erroMsg}</Text>
          <TouchableOpacity style={styles.btnErro} onPress={reiniciar}>
            <Text style={styles.btnText}>Tentar novamente</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── MODAL DE VÍDEO ── */}
      <Modal visible={showVideo} animationType="slide" onRequestClose={() => setShowVideo(false)}>
        <View style={styles.videoModal}>
          <VideoView player={player} style={styles.videoPlayer} contentFit="contain" />
          <TouchableOpacity style={styles.videoCloseBtn} onPress={() => setShowVideo(false)}>
            <Ionicons name="close" size={22} color="#121212" />
            <Text style={styles.videoCloseBtnText}>Fechar</Text>
          </TouchableOpacity>
        </View>
      </Modal>

    </View>
  );
}
