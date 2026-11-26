import React, { useEffect, useRef, useState } from 'react';
import Avatar3DViewer, { AVATAR_STATES } from './Avatar3DViewer';
import { useAssistantSocket } from '../hooks/useAssistantSocket';

const STATE_BADGES = {
  [AVATAR_STATES.IDLE]: { label: 'ASESOR IA · EN LÍNEA', color: '#19d876' },
  [AVATAR_STATES.LISTENING]: { label: 'ESCUCHANDO TU VOZ...', color: '#00f0ff' },
  [AVATAR_STATES.THINKING]: { label: 'GESTIONANDO PEDIDO...', color: '#ffd700' },
  [AVATAR_STATES.TALKING]: { label: 'ATENDIENDO POR VOZ', color: '#ffd700' },
  [AVATAR_STATES.CELEBRATING]: { label: '¡PEDIDO ACTUALIZADO!', color: '#22ffa3' },
};

const STAGE_BADGES = {
  ASESORIA: 'ASESORÍA & VENTA',
  UPSELLING: 'SUGERENCIA VITAL',
  CHECKOUT_NOMBRE: 'PASO 1/5 · TU NOMBRE',
  CHECKOUT_DIRECCION: 'PASO 2/5 · DIRECCIÓN / RETIRO',
  CHECKOUT_TELEFONO: 'PASO 3/5 · TELÉFONO',
  CHECKOUT_PAGO: 'PASO 4/5 · MEDIO DE PAGO',
  CHECKOUT_CONFIRMACION: 'PASO 5/5 · CONFIRMAR COMPRA',
};

const QUICK_PROMPTS = [
  '⚡ ¿Qué me recomiendas para energía y defensas?',
  '🥬 Quiero dos Green Detox',
  '🍓 Quiero armar un batido personalizado',
  '✅ Quiero cerrar mi pedido y pagar',
];

/**
 * Panel Flotante Estilo Tótem Conversacional 3D Autónomo para `menu-clasico` de RAÍCES.
 * Atiende, vende y gestiona toda la compra hasta cerrarla mediante conversación continua por voz.
 */
export default function RaicesAssistantTotem({
  wsUrl,
  modelUrl = null,
  sucursal = 'Antofagasta',
  onCartAction,
  defaultOpen = false,
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [inputValue, setInputValue] = useState('');
  const chatScrollRef = useRef(null);

  const {
    avatarState,
    salesStage,
    handsFree,
    setHandsFree,
    interimTranscript,
    audioLevel,
    isConnected,
    messages,
    sendUserMessage,
    toggleVoiceListening,
  } = useAssistantSocket({ wsUrl, sucursal, onCartAction });

  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
    }
  }, [messages, interimTranscript, isOpen]);

  const badge = STATE_BADGES[avatarState] || STATE_BADGES[AVATAR_STATES.IDLE];
  const stageLabel = STAGE_BADGES[salesStage] || null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    sendUserMessage(inputValue, { fromVoice: false });
    setInputValue('');
  };

  return (
    <div className="raices-totem-assistant-wrapper">
      {!isOpen && (
        <button
          type="button"
          onClick={() => setIsOpen(true)}
          aria-label="Abrir Asesor Virtual 3D por Voz RAÍCES"
          style={{
            position: 'fixed',
            bottom: '92px',
            right: '18px',
            zIndex: 9995,
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 18px',
            borderRadius: '999px',
            border: '2px solid #ffd700',
            background: 'linear-gradient(135deg, rgba(4, 34, 19, 0.96), rgba(1, 16, 9, 0.98))',
            color: '#fff',
            boxShadow: '0 8px 28px rgba(0, 0, 0, 0.75), 0 0 20px rgba(25, 216, 118, 0.35)',
            fontFamily: "'Orbitron', sans-serif",
            fontSize: '0.8rem',
            fontWeight: 800,
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              width: '12px',
              height: '12px',
              borderRadius: '50%',
              background: badge.color,
              boxShadow: `0 0 10px ${badge.color}`,
            }}
          />
          <span>ASESOR VOZ 3D</span>
          <i className="bi bi-mic-fill" style={{ color: '#00f0ff', fontSize: '1.05rem' }} />
        </button>
      )}

      {isOpen && (
        <aside
          aria-label="Tótem Conversacional 3D RAÍCES"
          style={{
            position: 'fixed',
            bottom: '84px',
            right: '16px',
            width: 'min(378px, calc(100vw - 24px))',
            maxHeight: 'min(635px, calc(100vh - 96px))',
            zIndex: 9996,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: '22px',
            overflow: 'hidden',
            border: '1.5px solid rgba(255, 215, 0, 0.65)',
            background: 'linear-gradient(180deg, rgba(4, 28, 16, 0.97) 0%, rgba(2, 12, 7, 0.99) 100%)',
            boxShadow: '0 18px 50px rgba(0, 0, 0, 0.88), 0 0 30px rgba(0, 240, 255, 0.2)',
            backdropFilter: 'blur(14px)',
          }}
        >
          {/* Cabecera */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '9px 12px',
              borderBottom: '1px solid rgba(255, 215, 0, 0.2)',
              background: 'rgba(0, 0, 0, 0.42)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
              <span
                style={{
                  width: '9px',
                  height: '9px',
                  borderRadius: '50%',
                  background: badge.color,
                  boxShadow: `0 0 10px ${badge.color}`,
                }}
              />
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.68rem',
                  fontWeight: 700,
                  color: badge.color,
                  letterSpacing: '0.6px',
                }}
              >
                {badge.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button
                type="button"
                onClick={() => setHandsFree((v) => !v)}
                title="Conversación continua manos libres"
                style={{
                  borderRadius: '999px',
                  padding: '2px 7px',
                  fontSize: '0.62rem',
                  fontFamily: "'Orbitron', sans-serif",
                  border: handsFree ? '1px solid #22ffa3' : '1px solid rgba(255,255,255,0.3)',
                  background: handsFree ? 'rgba(34,255,163,0.16)' : 'rgba(255,255,255,0.06)',
                  color: handsFree ? '#22ffa3' : '#aaa',
                  cursor: 'pointer',
                }}
              >
                {handsFree ? '🎙️ AUTO: ON' : '🎙️ AUTO: OFF'}
              </button>
              <span
                title={isConnected ? 'WebSocket conectado a Spring Boot' : 'Modo autónomo activo'}
                style={{ fontSize: '0.68rem', color: isConnected ? '#19d876' : '#ffd700' }}
              >
                ●
              </span>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                aria-label="Minimizar asistente"
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#fff',
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          </div>

          {/* Escenario Superior 3D */}
          <div
            style={{
              height: '210px',
              position: 'relative',
              background:
                'radial-gradient(circle at 50% 38%, rgba(25, 216, 118, 0.22) 0%, rgba(1, 18, 10, 0.92) 74%)',
              borderBottom: '1px solid rgba(0, 240, 255, 0.2)',
            }}
          >
            <Avatar3DViewer
              avatarState={avatarState}
              audioLevel={audioLevel}
              modelUrl={modelUrl}
              onAvatarClick={toggleVoiceListening}
            />
            {stageLabel && (
              <div
                style={{
                  position: 'absolute',
                  top: '8px',
                  left: '10px',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: 'rgba(0,0,0,0.72)',
                  border: '1px solid rgba(255,215,0,0.55)',
                  color: '#ffd700',
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: '0.6rem',
                  fontWeight: 700,
                }}
              >
                {stageLabel}
              </div>
            )}
            <button
              type="button"
              onClick={toggleVoiceListening}
              style={{
                position: 'absolute',
                bottom: '10px',
                right: '12px',
                borderRadius: '999px',
                padding: '7px 14px',
                border:
                  avatarState === AVATAR_STATES.LISTENING
                    ? '1.5px solid #00f0ff'
                    : '1.5px solid #ffd700',
                background:
                  avatarState === AVATAR_STATES.LISTENING
                    ? 'rgba(0, 240, 255, 0.24)'
                    : 'rgba(0, 0, 0, 0.72)',
                color: avatarState === AVATAR_STATES.LISTENING ? '#00f0ff' : '#ffd700',
                fontFamily: "'Orbitron', sans-serif",
                fontSize: '0.68rem',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <i className="bi bi-mic-fill me-1" />
              {avatarState === AVATAR_STATES.LISTENING ? 'ESCUCHANDO...' : 'HABLAR POR VOZ'}
            </button>
          </div>

          {/* Historial Conversacional */}
          <div
            ref={chatScrollRef}
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '10px 12px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              maxHeight: '205px',
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  alignSelf: m.sender === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '88%',
                  padding: '8px 12px',
                  borderRadius:
                    m.sender === 'user' ? '14px 14px 2px 14px' : '14px 14px 14px 2px',
                  background:
                    m.sender === 'user'
                      ? 'linear-gradient(135deg, #0c6b3d, #094a2a)'
                      : 'rgba(255, 255, 255, 0.08)',
                  border:
                    m.sender === 'user'
                      ? '1px solid rgba(25, 216, 118, 0.5)'
                      : '1px solid rgba(255, 215, 0, 0.25)',
                  color: '#fff',
                  fontSize: '0.92rem',
                  lineHeight: 1.35,
                }}
              >
                {m.text}
              </div>
            ))}
            {interimTranscript && (
              <div
                style={{
                  alignSelf: 'flex-end',
                  maxWidth: '88%',
                  padding: '6px 11px',
                  borderRadius: '12px',
                  background: 'rgba(0, 240, 255, 0.14)',
                  border: '1px dashed #00f0ff',
                  color: '#b8fbff',
                  fontSize: '0.86rem',
                  fontStyle: 'italic',
                }}
              >
                🎙️ {interimTranscript}...
              </div>
            )}
          </div>

          {/* Sugerencias Táctiles Rápidas */}
          <div
            style={{
              display: 'flex',
              gap: '6px',
              overflowX: 'auto',
              padding: '6px 10px',
              borderTop: '1px solid rgba(255, 255, 255, 0.07)',
            }}
          >
            {QUICK_PROMPTS.map((prompt) => (
              <button
                key={prompt}
                type="button"
                onClick={() => sendUserMessage(prompt, { fromVoice: false })}
                style={{
                  whiteSpace: 'nowrap',
                  borderRadius: '999px',
                  padding: '4px 10px',
                  fontSize: '0.74rem',
                  border: '1px solid rgba(0, 240, 255, 0.35)',
                  background: 'rgba(0, 240, 255, 0.08)',
                  color: '#d9fdf7',
                  cursor: 'pointer',
                }}
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* Barra Inferior de Entrada de Texto */}
          <form
            onSubmit={handleSubmit}
            style={{
              display: 'flex',
              gap: '6px',
              padding: '9px 10px',
              borderTop: '1px solid rgba(255, 215, 0, 0.2)',
              background: 'rgba(0, 0, 0, 0.5)',
            }}
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Habla con el micrófono o escribe aquí..."
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.07)',
                border: '1px solid rgba(255, 215, 0, 0.35)',
                borderRadius: '10px',
                padding: '7px 11px',
                color: '#fff',
                fontSize: '0.9rem',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              style={{
                borderRadius: '10px',
                padding: '0 14px',
                border: 'none',
                background: '#ffd700',
                color: '#051b0e',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              <i className="bi bi-send-fill" />
            </button>
          </form>
        </aside>
      )}
    </div>
  );
}
