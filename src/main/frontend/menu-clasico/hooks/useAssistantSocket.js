import { useCallback, useEffect, useRef, useState } from 'react';
import { AVATAR_STATES } from '../components/Avatar3DViewer';

const SESSION_ID =
  'raices-voz-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);

function resolveDefaultWsUrl(path = '/ws/asistente') {
  if (typeof window === 'undefined') return `ws://localhost:8081${path}`;
  const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  return `${protocol}//${window.location.host}${path}`;
}

function selectBestSpanishVoice() {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return null;
  const voices = window.speechSynthesis.getVoices() || [];
  const esVoices = voices.filter((v) => /^es([-_]|$)/i.test(v.lang));
  if (esVoices.length === 0) return null;
  const preferred = esVoices.find((v) =>
    /natural|neural|online|sabina|dalia|elena|paulina|google español/i.test(v.name)
  );
  if (preferred) return preferred;
  return esVoices.find((v) => /es[-_](CL|MX|AR|CO|US|419)/i.test(v.lang)) || esVoices[0];
}

/**
 * Hook Controlador Autónomo del Asesor 3D por Voz (Conversación Continua + Cierre de Venta)
 */
export function useAssistantSocket({
  wsUrl = resolveDefaultWsUrl('/ws/asistente'),
  sucursal = 'Antofagasta',
  onCartAction,
  getCartSnapshot,
  getCustomerSnapshot,
} = {}) {
  const [avatarState, setAvatarState] = useState(AVATAR_STATES.IDLE);
  const [salesStage, setSalesStage] = useState('BIENVENIDA');
  const [handsFree, setHandsFree] = useState(true);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'welcome-1',
      sender: 'assistant',
      text: '¡Hola! Soy tu Asesor Virtual 3D de RAÍCES. Toca HABLAR y conversamos con manos libres: te asesoro, armo tu pedido y cierro toda tu compra por voz.',
      timestamp: Date.now(),
    },
  ]);

  const wsRef = useRef(null);
  const reconnectTimerRef = useRef(null);
  const reconnectAttemptsRef = useRef(0);
  const recognitionRef = useRef(null);
  const audioCtxRef = useRef(null);
  const analyserRef = useRef(null);
  const rafAudioRef = useRef(null);
  const celebrateTimerRef = useRef(null);
  const autoListenTimerRef = useRef(null);

  const handsFreeRef = useRef(handsFree);
  const conversationActiveRef = useRef(false);
  const isSpeakingRef = useRef(false);
  const silentRetriesRef = useRef(0);
  const startListeningFnRef = useRef(null);

  useEffect(() => {
    handsFreeRef.current = handsFree;
    if (!handsFree) clearTimeout(autoListenTimerRef.current);
  }, [handsFree]);

  const stopAudioMeter = useCallback(() => {
    if (rafAudioRef.current) {
      cancelAnimationFrame(rafAudioRef.current);
      rafAudioRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  const stopRecognitionSafely = useCallback(() => {
    clearTimeout(autoListenTimerRef.current);
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      } catch (e) {}
      recognitionRef.current = null;
    }
    setInterimTranscript('');
  }, []);

  const scheduleAutoReopenIfNeeded = useCallback(
    (expectingReply = true) => {
      isSpeakingRef.current = false;
      stopAudioMeter();
      setAvatarState(AVATAR_STATES.IDLE);

      if (expectingReply && conversationActiveRef.current && handsFreeRef.current) {
        clearTimeout(autoListenTimerRef.current);
        autoListenTimerRef.current = setTimeout(() => {
          if (
            !isSpeakingRef.current &&
            conversationActiveRef.current &&
            handsFreeRef.current &&
            startListeningFnRef.current
          ) {
            startListeningFnRef.current(true);
          }
        }, 420);
      } else if (!expectingReply) {
        conversationActiveRef.current = false;
      }
    },
    [stopAudioMeter]
  );

  const playBackendAudioBase64 = useCallback(
    async (base64Audio, { expectingReply = true } = {}) => {
      try {
        const AudioContextClass = window.AudioContext || window.webkitAudioContext;
        if (!AudioContextClass) return false;
        if (!audioCtxRef.current) audioCtxRef.current = new AudioContextClass();
        if (audioCtxRef.current.state === 'suspended') await audioCtxRef.current.resume();

        stopRecognitionSafely();
        isSpeakingRef.current = true;

        const binary = atob(base64Audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

        const audioBuffer = await audioCtxRef.current.decodeAudioData(bytes.buffer.slice(0));
        const source = audioCtxRef.current.createBufferSource();
        source.buffer = audioBuffer;

        const analyser = audioCtxRef.current.createAnalyser();
        analyser.fftSize = 256;
        analyserRef.current = analyser;

        source.connect(analyser);
        analyser.connect(audioCtxRef.current.destination);

        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        setAvatarState(AVATAR_STATES.TALKING);

        const updateMeter = () => {
          if (!analyserRef.current) return;
          analyserRef.current.getByteTimeDomainData(dataArray);
          let sumSquares = 0;
          for (let i = 0; i < dataArray.length; i++) {
            const norm = (dataArray[i] - 128) / 128;
            sumSquares += norm * norm;
          }
          const rms = Math.sqrt(sumSquares / dataArray.length);
          setAudioLevel(Math.min(1, rms * 3.8));
          rafAudioRef.current = requestAnimationFrame(updateMeter);
        };
        updateMeter();

        source.onended = () => scheduleAutoReopenIfNeeded(expectingReply);
        source.start(0);
        return true;
      } catch (err) {
        isSpeakingRef.current = false;
        stopAudioMeter();
        return false;
      }
    },
    [scheduleAutoReopenIfNeeded, stopAudioMeter, stopRecognitionSafely]
  );

  const speakText = useCallback(
    (text, { celebrateFirst = false, expectingReply = true } = {}) => {
      if (!text || typeof window === 'undefined' || !('speechSynthesis' in window)) {
        scheduleAutoReopenIfNeeded(expectingReply);
        return;
      }

      stopRecognitionSafely();
      isSpeakingRef.current = true;

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const voice = selectBestSpanishVoice();
      if (voice) {
        utterance.voice = voice;
        utterance.lang = voice.lang;
      } else {
        utterance.lang = 'es-CL';
      }
      utterance.rate = 1.03;
      utterance.pitch = 1.05;

      utterance.onstart = () => {
        if (!celebrateFirst) setAvatarState(AVATAR_STATES.TALKING);
      };

      utterance.onboundary = () => {
        setAudioLevel(0.38 + Math.random() * 0.55);
      };

      utterance.onend = () => scheduleAutoReopenIfNeeded(expectingReply);
      utterance.onerror = () => scheduleAutoReopenIfNeeded(expectingReply);

      if (celebrateFirst) {
        setAvatarState(AVATAR_STATES.CELEBRATING);
        clearTimeout(celebrateTimerRef.current);
        celebrateTimerRef.current = setTimeout(() => {
          if (isSpeakingRef.current) setAvatarState(AVATAR_STATES.TALKING);
        }, 900);
      } else {
        setAvatarState(AVATAR_STATES.TALKING);
      }

      window.speechSynthesis.speak(utterance);
    },
    [scheduleAutoReopenIfNeeded, stopRecognitionSafely]
  );

  const executeAssistantPayload = useCallback(
    async (payload) => {
      if (!payload) return;
      const eventType = (payload.type || payload.event || 'ASSISTANT_MESSAGE').toUpperCase();

      if (eventType === 'STATE_CHANGE' || eventType === 'LISTENING') {
        setAvatarState(payload.state || AVATAR_STATES.LISTENING);
        return;
      }
      if (eventType === 'SPEAKING_END' || eventType === 'IDLE') {
        scheduleAutoReopenIfNeeded(false);
        return;
      }

      if (payload.stage) setSalesStage(payload.stage);

      if (payload.action) {
        if (onCartAction) {
          onCartAction(payload);
        } else if (typeof window !== 'undefined' && window.RaicesMenuBridge) {
          const bridge = window.RaicesMenuBridge;
          if (payload.action === 'ADD_ITEMS' && Array.isArray(payload.items)) bridge.addItems(payload.items);
          else if (payload.action === 'ADD_TO_CART' && payload.product) bridge.addItems([payload.product]);
          else if (payload.action === 'REMOVE_ITEM') bridge.removeItem(payload.removeIndex);
          else if (payload.action === 'CLEAR_CART') bridge.clearCart();
          else if (payload.action === 'OPEN_CART') bridge.openCart();
          else if (payload.action === 'CLOSE_CART') bridge.closeCart();
          else if (payload.action === 'FILTER_CATEGORY') bridge.filterCategory(payload.category);
          else if (payload.action === 'HIGHLIGHT_PRODUCT' && payload.product?.id) bridge.highlightProduct(payload.product.id);
          else if (payload.action === 'FILL_CHECKOUT') bridge.fillCheckoutFields(payload.checkoutData || {});
          else if (payload.action === 'SUBMIT_ORDER') bridge.submitOrder(payload.orderData || {});
        }
      }

      if (payload.text) {
        setMessages((prev) => [
          ...prev.slice(-22),
          {
            id: `bot-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            sender: 'assistant',
            text: payload.text,
            product: payload.product || null,
            timestamp: Date.now(),
          },
        ]);
      }

      const celebrate =
        payload.state === 'CELEBRATING' ||
        payload.action === 'ADD_ITEMS' ||
        payload.action === 'ADD_TO_CART' ||
        payload.action === 'SUBMIT_ORDER';
      const expectingReply = payload.expectingReply !== false;

      if (payload.audioBase64) {
        const played = await playBackendAudioBase64(payload.audioBase64, { expectingReply });
        if (!played && payload.text) {
          speakText(payload.text, { celebrateFirst: celebrate, expectingReply });
        }
      } else if (payload.text) {
        speakText(payload.text, { celebrateFirst: celebrate, expectingReply });
      }
    },
    [onCartAction, playBackendAudioBase64, scheduleAutoReopenIfNeeded, speakText]
  );

  useEffect(() => {
    let unmounted = false;

    function connect() {
      if (unmounted) return;
      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (unmounted) return;
          setIsConnected(true);
          reconnectAttemptsRef.current = 0;
        };

        ws.onmessage = async (event) => {
          if (unmounted) return;
          try {
            const payload = JSON.parse(event.data);
            await executeAssistantPayload(payload);
          } catch (e) {}
        };

        ws.onclose = () => {
          if (unmounted) return;
          setIsConnected(false);
          const delay = Math.min(8000, 1200 * Math.pow(1.6, reconnectAttemptsRef.current++));
          reconnectTimerRef.current = setTimeout(connect, delay);
        };

        ws.onerror = () => ws.close();
      } catch (err) {}
    }

    connect();
    return () => {
      unmounted = true;
      clearTimeout(reconnectTimerRef.current);
      clearTimeout(celebrateTimerRef.current);
      stopRecognitionSafely();
      stopAudioMeter();
      if (wsRef.current) wsRef.current.close();
    };
  }, [wsUrl, executeAssistantPayload, stopAudioMeter, stopRecognitionSafely]);

  const sendUserMessage = useCallback(
    async (rawText, { fromVoice = false } = {}) => {
      const text = (rawText || '').trim();
      if (!text) return;

      if (fromVoice) {
        conversationActiveRef.current = true;
        silentRetriesRef.current = 0;
      }

      setInterimTranscript('');
      setMessages((prev) => [
        ...prev.slice(-22),
        { id: `usr-${Date.now()}`, sender: 'user', text, timestamp: Date.now() },
      ]);
      setAvatarState(AVATAR_STATES.THINKING);

      const bridge = typeof window !== 'undefined' ? window.RaicesMenuBridge : null;
      const requestBody = {
        sessionId: SESSION_ID,
        type: 'USER_MESSAGE',
        text,
        sucursal,
        cart: getCartSnapshot ? getCartSnapshot() : bridge ? bridge.getCart() : [],
        customer: getCustomerSnapshot ? getCustomerSnapshot() : bridge ? bridge.getCustomer() : {},
      };

      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify(requestBody));
        return;
      }

      try {
        const res = await fetch('/api/asistente/conversar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(requestBody),
        });
        if (res.ok) {
          const data = await res.json();
          await executeAssistantPayload(data);
        }
      } catch (err) {
        setAvatarState(AVATAR_STATES.IDLE);
      }
    },
    [executeAssistantPayload, getCartSnapshot, getCustomerSnapshot, sucursal]
  );

  const startVoiceListening = useCallback(
    (isAutoReopen = false) => {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        if (!isAutoReopen) alert('Tu navegador no soporta reconocimiento de voz interactivo.');
        return;
      }

      stopRecognitionSafely();
      if (!isAutoReopen && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        isSpeakingRef.current = false;
      }

      conversationActiveRef.current = true;
      const recognition = new SpeechRecognition();
      recognition.lang = 'es-CL';
      recognition.continuous = false;
      recognition.interimResults = true;
      recognitionRef.current = recognition;

      let finalCaptured = '';

      recognition.onstart = () => setAvatarState(AVATAR_STATES.LISTENING);

      recognition.onresult = (event) => {
        let interim = '';
        let finalTxt = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const piece = event.results[i][0].transcript;
          if (event.results[i].isFinal) finalTxt += piece;
          else interim += piece;
        }
        if (interim) setInterimTranscript(interim);
        if (finalTxt.trim()) {
          finalCaptured = finalTxt.trim();
          setInterimTranscript('');
          sendUserMessage(finalCaptured, { fromVoice: true });
        }
      };

      recognition.onerror = (ev) => {
        setInterimTranscript('');
        if (
          ev.error === 'no-speech' &&
          isAutoReopen &&
          silentRetriesRef.current < 1 &&
          handsFreeRef.current &&
          conversationActiveRef.current
        ) {
          silentRetriesRef.current += 1;
          autoListenTimerRef.current = setTimeout(() => {
            if (!isSpeakingRef.current && conversationActiveRef.current && handsFreeRef.current) {
              startVoiceListening(true);
            }
          }, 350);
          return;
        }
        if (ev.error === 'not-allowed') conversationActiveRef.current = false;
        setAvatarState(AVATAR_STATES.IDLE);
      };

      recognition.onend = () => {
        setInterimTranscript('');
        if (!finalCaptured && !isSpeakingRef.current) {
          setAvatarState((prev) => (prev === AVATAR_STATES.LISTENING ? AVATAR_STATES.IDLE : prev));
        }
      };

      try {
        recognition.start();
      } catch (e) {
        setAvatarState(AVATAR_STATES.IDLE);
      }
    },
    [sendUserMessage, stopRecognitionSafely]
  );

  useEffect(() => {
    startListeningFnRef.current = startVoiceListening;
  }, [startVoiceListening]);

  const toggleVoiceListening = useCallback(() => {
    if (avatarState === AVATAR_STATES.LISTENING) {
      conversationActiveRef.current = false;
      stopRecognitionSafely();
      setAvatarState(AVATAR_STATES.IDLE);
      return;
    }
    silentRetriesRef.current = 0;
    startVoiceListening(false);
  }, [avatarState, startVoiceListening, stopRecognitionSafely]);

  return {
    avatarState,
    setAvatarState,
    salesStage,
    handsFree,
    setHandsFree,
    interimTranscript,
    audioLevel,
    isConnected,
    messages,
    sendUserMessage,
    toggleVoiceListening,
    speakText,
  };
}
