import { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, ScrollView, Modal } from 'react-native';
import { CameraView, useCameraPermissions, useMicrophonePermissions } from 'expo-camera';
import { useVideoPlayer, VideoView } from 'expo-video';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Brightness from 'expo-brightness';
import * as MediaLibrary from 'expo-media-library';
import * as ImagePicker from 'expo-image-picker';
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
  const [localUrl, setLocalUrl]         = useState('');
  const [comparando, setComparando]     = useState(false);
  const [resultadoLocal, setResultadoLocal] = useState(null);
  const [erroLocal, setErroLocal]       = useState('');
  const [salvoGaleria, setSalvoGaleria] = useState(false);

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
    AsyncStorage.getItem('localServerUrl').then(saved => {
      if (saved) setLocalUrl(saved);
    });

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
    setSalvoGaleria(false);
    setTela('recording');

    await new Promise(resolve => setTimeout(resolve, 600));

    timerRef.current = setInterval(() => setDuracao(d => d + 1), 1000);

    try {
      const video = await cameraRef.current.recordAsync({ maxDuration: 120 });
      clearInterval(timerRef.current);

      if (!video?.uri) throw new Error('Arquivo de vídeo não gerado');

      setVideoUri(video.uri);
      salvarNaGaleria(video.uri);
      setTela('processing');
      await enviarVideo(video.uri);
    } catch (e) {
      clearInterval(timerRef.current);
      setErroMsg(`Erro ao gravar: ${e?.message ?? 'tente novamente'}`);
      setTela('error');
    }
  };

  // Salva o vídeo bruto (sem a compressão do player/WhatsApp) na galeria,
  // pra dar pra reanalisar/comparar depois. Best-effort: se a permissão for
  // negada ou o salvamento falhar, não interrompe o fluxo de análise.
  const salvarNaGaleria = async (uri) => {
    try {
      const { granted } = await MediaLibrary.requestPermissionsAsync();
      if (!granted) return;
      await MediaLibrary.createAssetAsync(uri);
      setSalvoGaleria(true);
    } catch {
      // sem espaço, permissão revogada no meio do caminho, etc — ignora
    }
  };

  // Permite analisar um vídeo já gravado fora do app (ex: celular fixo num
  // tripé/apoio, ângulo controlado) em vez de gravar direto pela câmera.
  const escolherDaGaleria = async () => {
    const { granted } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!granted) {
      setErroMsg('Permissão de galeria necessária para escolher um vídeo.');
      setTela('error');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
    });
    if (result.canceled || !result.assets?.length) return;

    const asset = result.assets[0];
    if (asset.duration && asset.duration > 120000) {
      setErroMsg('Vídeo muito longo (máx. 2 minutos). Escolha um trecho menor ou grave direto pelo app.');
      setTela('error');
      return;
    }
    if (Math.max(asset.width ?? 0, asset.height ?? 0) > 1920) {
      setErroMsg(
        'Esse vídeo está em resolução muito alta (provavelmente 4K) e a análise pode ' +
        'travar ou demorar demais. Reduza a qualidade de gravação da câmera do celular ' +
        '(geralmente em Câmera > Configurações > Qualidade de vídeo) para 1080p ou menos.'
      );
      setTela('error');
      return;
    }

    setVideoUri(asset.uri);
    setSalvoGaleria(false);
    setTela('processing');
    await enviarVideo(asset.uri);
  };

  const pararGravacao = () => {
    setParando(true);
    clearInterval(timerRef.current);
    cameraRef.current?.stopRecording();
  };

  const enviarVideo = async (uri) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);

    try {
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('video', { uri, type: 'video/mp4', name: 'exercise.mp4' });

      const response = await fetch(`${appConfig.API_URL}/detector/analyze?exercise=${exercicio}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Servidor retornou ${response.status}`);
      setResultado(await response.json());
      setTela('results');
    } catch (e) {
      const msg = e?.name === 'AbortError'
        ? 'Análise demorou demais (mais de 90s) — tente um vídeo mais curto'
        : `Erro ao analisar: ${e?.message ?? 'verifique a conexão'}`;
      setErroMsg(msg);
      setTela('error');
    } finally {
      clearTimeout(timeout);
    }
  };

  const compararLocal = async () => {
    const url = localUrl.trim().replace(/\/+$/, '');
    if (!url) {
      setErroLocal('Informe o endereço do servidor local (ex: http://192.168.0.x:8000)');
      return;
    }
    if (!videoUri) return;

    setComparando(true);
    setErroLocal('');
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 90000);
    try {
      await AsyncStorage.setItem('localServerUrl', url);
      const token = await AsyncStorage.getItem('token');
      const formData = new FormData();
      formData.append('video', { uri: videoUri, type: 'video/mp4', name: 'exercise.mp4' });

      const response = await fetch(`${url}/detector/analyze?exercise=${exercicio}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok) throw new Error(`Servidor retornou ${response.status}`);
      setResultadoLocal(await response.json());
    } catch (e) {
      const msg = e?.name === 'AbortError'
        ? 'Comparação demorou demais (mais de 90s)'
        : `Erro ao comparar: ${e?.message ?? 'verifique o endereço e se está na mesma rede'}`;
      setErroLocal(msg);
    } finally {
      clearTimeout(timeout);
      setComparando(false);
    }
  };

  const reiniciar = () => {
    setResultado(null);
    setResultadoLocal(null);
    setErroLocal('');
    setVideoUri(null);
    setSalvoGaleria(false);
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
            <TouchableOpacity style={styles.iconBtn} onPress={escolherDaGaleria}>
              <Ionicons name="images-outline" size={24} color="#fff" />
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
            <Text style={styles.resultsTitulo}>Resultado · Nuvem</Text>

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

            {/* ── Comparar com servidor local ── */}
            <View style={styles.compareBox}>
              <Text style={styles.compareLabel}>Comparar com servidor local</Text>
              <View style={styles.compareRow}>
                <TextInput
                  style={styles.compareInput}
                  placeholder="http://192.168.0.x:8000"
                  placeholderTextColor="#555"
                  autoCapitalize="none"
                  autoCorrect={false}
                  keyboardType="url"
                  value={localUrl}
                  onChangeText={setLocalUrl}
                />
                <TouchableOpacity style={styles.compareBtn} onPress={compararLocal} disabled={comparando}>
                  {comparando
                    ? <ActivityIndicator color="#121212" size="small" />
                    : <Ionicons name="git-compare-outline" size={20} color="#121212" />
                  }
                </TouchableOpacity>
              </View>
              {!!erroLocal && <Text style={styles.compareErro}>{erroLocal}</Text>}

              {resultadoLocal && (
                <View style={styles.compareResult}>
                  <Text style={styles.resultsTitulo}>Resultado · Local</Text>
                  <Text style={styles.resultsReps}>{resultadoLocal.reps}</Text>
                  <Text style={styles.resultsRepsLabel}>repetições detectadas</Text>
                  <View style={styles.summaryRow}>
                    <View style={styles.summaryBox}>
                      <Text style={[styles.summaryNum, { color: '#4CAF50' }]}>{resultadoLocal.corretos}</Text>
                      <Text style={styles.summaryLabel}>corretas</Text>
                    </View>
                    <View style={styles.summaryDivider} />
                    <View style={styles.summaryBox}>
                      <Text style={[styles.summaryNum, { color: '#F44336' }]}>{resultadoLocal.incorretos}</Text>
                      <Text style={styles.summaryLabel}>incorretas</Text>
                    </View>
                  </View>
                  {resultadoLocal.detalhes?.length > 0 && (
                    <View style={styles.detalhesList}>
                      {resultadoLocal.detalhes.map((item) => (
                        <View key={item.rep} style={styles.detalheItem}>
                          <Text style={styles.detalheRep}>Rep {item.rep}</Text>
                          <Text style={[styles.detalheLabel, { color: item.correto ? '#4CAF50' : '#F44336' }]}>
                            {item.label}
                          </Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              )}
            </View>
          </ScrollView>

          {videoUri && (
            <TouchableOpacity style={styles.btnReverVideo} onPress={() => setShowVideo(true)}>
              <Ionicons name="play-circle-outline" size={20} color="#121212" />
              <Text style={styles.btnReverVideoText}>Rever vídeo</Text>
            </TouchableOpacity>
          )}
          {salvoGaleria && (
            <View style={styles.salvoGaleriaRow}>
              <Ionicons name="checkmark-circle" size={14} color="#4CAF50" />
              <Text style={styles.salvoGaleriaText}>Vídeo original salvo na galeria</Text>
            </View>
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
