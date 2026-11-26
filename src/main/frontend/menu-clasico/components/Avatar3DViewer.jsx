import React, { Suspense, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { Canvas, useFrame } from '@react-three/fiber';
import { ContactShadows, useAnimations, useGLTF } from '@react-three/drei';

/**
 * Estados soportados por el Avatar 3D Conversacional:
 * - 'IDLE': Respiración suave, micro-balanceo y parpadeo natural aleatorio.
 * - 'LISTENING': Inclinación atenta de cabeza hacia el usuario, ojos abiertos y anillo bio-aqua activo.
 * - 'THINKING': Gesto reflexivo sutil mientras espera respuesta del backend.
 * - 'TALKING': Lip-sync dinámico (mandíbula/visemas) sincronizado con audioLevel o cadencia de voz + gesticulación de manos/cabeza.
 * - 'CELEBRATING': Gesto entusiasta al confirmar que se agregó un Shot, Batido o Pack al carrito.
 */
export const AVATAR_STATES = {
  IDLE: 'IDLE',
  LISTENING: 'LISTENING',
  THINKING: 'THINKING',
  TALKING: 'TALKING',
  CELEBRATING: 'CELEBRATING',
};

// Mapeo flexible de nombres de clips en modelos .glb/.gltf (Mixamo, ReadyPlayerMe, Blockbench, Blender)
const CLIP_ALIASES = {
  IDLE: ['idle', 'reposo', 'breathing', 'stand', 'neutral', 'wait'],
  LISTENING: ['listen', 'escuchando', 'attentive', 'nod', 'focus', 'idle'],
  THINKING: ['think', 'pensando', 'look', 'idle'],
  TALKING: ['talk', 'hablando', 'speak', 'chat', 'explain', 'gesture'],
  CELEBRATING: ['celebrate', 'wave', 'victory', 'happy', 'cheer', 'confirm', 'thumbsup'],
};

// Posibles nombres de Morph Targets (BlendShapes ARKit / Oculus Visemes / RPM) para apertura bucal
const MOUTH_MORPH_NAMES = [
  'jawOpen',
  'mouthOpen',
  'viseme_aa',
  'viseme_O',
  'vrc.v_aa',
  'Mouth_Open',
];

const BLINK_MORPH_NAMES = [
  'eyesClosed',
  'eyeBlinkLeft',
  'eyeBlinkRight',
  'blink',
  'Blink',
];

/**
 * ErrorBoundary interno para que si la ruta del .glb aún no existe o falla por red,
 * se renderice automáticamente el Avatar 3D Low-Poly estilizado oficial de RAÍCES sin romper el Canvas.
 */
class ModelErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() {
    return { hasError: true };
  }
  componentDidUpdate(prevProps) {
    if (prevProps.modelUrl !== this.props.modelUrl && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }
  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

/**
 * Subcomponente que carga un archivo .glb / .gltf optimizado y controla:
 * 1) THREE.AnimationMixer (vía useAnimations) con crossFade suave entre clips.
 * 2) Lip-Sync por MorphTargets o hueso de mandíbula + parpadeo automático + micro-movimientos procedurales.
 */
function GLBCharacterAvatar({
  modelUrl,
  avatarState = AVATAR_STATES.IDLE,
  audioLevel = 0,
  scale = 1.35,
  position = [0, -1.05, 0],
}) {
  const groupRef = useRef();
  const { scene, animations } = useGLTF(modelUrl);
  const { actions, names, mixer } = useAnimations(animations, groupRef);

  const currentActionRef = useRef(null);
  const blinkStateRef = useRef({ nextBlinkAt: 2.2, blinkProgress: 0, isBlinking: false });

  // Cachear referencias a meshes con morphTargets y huesos clave una sola vez (0 alocaciones por frame)
  const rigRefs = useMemo(() => {
    const morphMeshes = [];
    const bones = { head: null, neck: null, jaw: null, spine: null, rightArm: null, leftArm: null };

    scene.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = false;
        child.receiveShadow = false;
        if (child.morphTargetDictionary && child.morphTargetInfluences) {
          morphMeshes.push(child);
        }
      }
      if (child.isBone) {
        const n = child.name.toLowerCase();
        if (!bones.head && n.includes('head')) bones.head = child;
        else if (!bones.neck && n.includes('neck')) bones.neck = child;
        else if (!bones.jaw && (n.includes('jaw') || n.includes('chin'))) bones.jaw = child;
        else if (!bones.spine && n.includes('spine')) bones.spine = child;
        else if (!bones.rightArm && (n.includes('rightarm') || n.includes('arm_r') || n.includes('upperarm_r'))) {
          bones.rightArm = child;
        } else if (!bones.leftArm && (n.includes('leftarm') || n.includes('arm_l') || n.includes('upperarm_l'))) {
          bones.leftArm = child;
        }
      }
    });

    return { morphMeshes, bones };
  }, [scene]);

  // Controlador de estados del AnimationMixer: crossFade suave al cambiar avatarState
  useEffect(() => {
    if (!names || names.length === 0) return;

    const candidates = CLIP_ALIASES[avatarState] || CLIP_ALIASES.IDLE;
    let matchedName = null;

    for (const alias of candidates) {
      matchedName = names.find((clipName) => clipName.toLowerCase().includes(alias));
      if (matchedName) break;
    }
    if (!matchedName) matchedName = names[0];

    const nextAction = actions[matchedName];
    if (!nextAction) return;

    if (currentActionRef.current !== nextAction) {
      nextAction.reset();
      nextAction.setEffectiveTimeScale(avatarState === AVATAR_STATES.TALKING ? 1.08 : 1.0);
      nextAction.setEffectiveWeight(1.0);
      nextAction.fadeIn(0.28).play();

      if (currentActionRef.current) {
        currentActionRef.current.fadeOut(0.28);
      }
      currentActionRef.current = nextAction;
    }
  }, [avatarState, actions, names]);

  // Limpieza de memoria del mixer al desmontar
  useEffect(() => {
    return () => {
      if (mixer) mixer.stopAllAction();
    };
  }, [mixer]);

  // Loop de animación procedural ligera (parpadeo, lip-sync y lenguaje corporal complementario)
  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const isTalking = avatarState === AVATAR_STATES.TALKING;
    const isListening = avatarState === AVATAR_STATES.LISTENING;
    const isCelebrating = avatarState === AVATAR_STATES.CELEBRATING;

    // 1. Parpadeo natural aleatorio
    const bState = blinkStateRef.current;
    if (!bState.isBlinking && t >= bState.nextBlinkAt) {
      bState.isBlinking = true;
      bState.blinkProgress = 0;
    }
    let blinkValue = 0;
    if (bState.isBlinking) {
      bState.blinkProgress += delta * 7.5;
      if (bState.blinkProgress >= Math.PI) {
        bState.isBlinking = false;
        bState.nextBlinkAt = t + 2.4 + Math.random() * 3.2;
      } else {
        blinkValue = Math.sin(bState.blinkProgress);
      }
    }

    // 2. Apertura bucal (usa audioLevel real del WebSocket/WebAudio o cadencia silábica natural si es TTS)
    const syntheticSpeechWave =
      Math.max(0, Math.sin(t * 13.5) * 0.6 + Math.sin(t * 7.2) * 0.4) * 0.72;
    const targetMouthOpen = isTalking
      ? THREE.MathUtils.clamp(audioLevel > 0.02 ? audioLevel * 1.35 : syntheticSpeechWave, 0.06, 0.92)
      : isCelebrating
      ? 0.35
      : 0.0;

    // Aplicar MorphTargets (Boca y Parpadeo)
    for (const mesh of rigRefs.morphMeshes) {
      const dict = mesh.morphTargetDictionary;
      const infl = mesh.morphTargetInfluences;

      for (const mName of MOUTH_MORPH_NAMES) {
        if (dict[mName] !== undefined) {
          infl[dict[mName]] = THREE.MathUtils.lerp(infl[dict[mName]], targetMouthOpen, 0.28);
        }
      }
      for (const bName of BLINK_MORPH_NAMES) {
        if (dict[bName] !== undefined) {
          infl[dict[bName]] = blinkValue;
        }
      }
    }

    // Fallback de mandíbula por hueso si el .glb no usa morphTargets
    if (rigRefs.bones.jaw) {
      rigRefs.bones.jaw.rotation.x = THREE.MathUtils.lerp(
        rigRefs.bones.jaw.rotation.x,
        targetMouthOpen * 0.32,
        0.28
      );
    }

    // 3. Micro-gestos de cabeza y respiración si el modelo no trae clips dedicados para ese estado
    if (names.length === 0 && groupRef.current) {
      const breath = Math.sin(t * 2.2) * 0.018;
      groupRef.current.position.y = position[1] + breath + (isCelebrating ? Math.abs(Math.sin(t * 7.0)) * 0.06 : 0);

      if (rigRefs.bones.head) {
        const targetYaw = isListening ? 0.12 : isTalking ? Math.sin(t * 2.6) * 0.14 : Math.sin(t * 0.9) * 0.06;
        const targetPitch = isListening ? 0.08 : isTalking ? Math.sin(t * 4.4) * 0.07 : Math.sin(t * 1.5) * 0.03;
        const targetRoll = isListening ? -0.1 : isTalking ? Math.cos(t * 2.1) * 0.06 : 0;

        rigRefs.bones.head.rotation.y = THREE.MathUtils.lerp(rigRefs.bones.head.rotation.y, targetYaw, 0.12);
        rigRefs.bones.head.rotation.x = THREE.MathUtils.lerp(rigRefs.bones.head.rotation.x, targetPitch, 0.12);
        rigRefs.bones.head.rotation.z = THREE.MathUtils.lerp(rigRefs.bones.head.rotation.z, targetRoll, 0.12);
      }
    }
  });

  return (
    <group ref={groupRef} position={position} scale={scale} dispose={null}>
      <primitive object={scene} />
    </group>
  );
}

/**
 * Personaje 3D Low-Poly Estilizado Nativo ("Bio-Guía RAÍCES"):
 * Mascota/Barista Botánico amigable con indumentaria oficial RAÍCES (delantal verde selva,
 * insignia dorada, visera orgánica con hojas vivas, cejas expresivas, parpadeo y lip-sync).
 * Garantiza 60 FPS instantáneos incluso sin descargar megabytes extra en tótems o tablets.
 */
function StylizedRaicesBotanicalCharacter({ avatarState = AVATAR_STATES.IDLE, audioLevel = 0 }) {
  const rootRef = useRef();
  const headGroupRef = useRef();
  const torsoGroupRef = useRef();
  const mouthRef = useRef();
  const leftEyeRef = useRef();
  const rightEyeRef = useRef();
  const leftBrowRef = useRef();
  const rightBrowRef = useRef();
  const leftArmRef = useRef();
  const rightArmRef = useRef();
  const haloRingRef = useRef();
  const leafCrownRef = useRef();

  const blinkRef = useRef({ nextAt: 1.8, progress: 0, active: false });

  // Materiales compartidos y memoizados para mínimo consumo de GPU
  const mats = useMemo(
    () => ({
      skin: new THREE.MeshStandardMaterial({ color: '#f4c7a1', roughness: 0.55, metalness: 0.02 }),
      cheeks: new THREE.MeshStandardMaterial({ color: '#f28b82', roughness: 0.65, transparent: true, opacity: 0.55 }),
      hairWood: new THREE.MeshStandardMaterial({ color: '#3b2314', roughness: 0.78 }),
      apronGreen: new THREE.MeshStandardMaterial({ color: '#0c6b3d', roughness: 0.52, metalness: 0.08 }),
      shirtCream: new THREE.MeshStandardMaterial({ color: '#f7f3e3', roughness: 0.68 }),
      goldTrim: new THREE.MeshStandardMaterial({
        color: '#ffd700',
        emissive: '#594300',
        emissiveIntensity: 0.35,
        roughness: 0.28,
        metalness: 0.72,
      }),
      leafBright: new THREE.MeshStandardMaterial({
        color: '#19d876',
        emissive: '#073b20',
        emissiveIntensity: 0.35,
        roughness: 0.42,
      }),
      eyeDark: new THREE.MeshStandardMaterial({ color: '#11181c', roughness: 0.2, metalness: 0.1 }),
      eyeSparkle: new THREE.MeshBasicMaterial({ color: '#ffffff' }),
      mouthInner: new THREE.MeshStandardMaterial({ color: '#6e1d2a', roughness: 0.6 }),
      cupGlass: new THREE.MeshStandardMaterial({
        color: '#22ffa3',
        emissive: '#00b86b',
        emissiveIntensity: 0.45,
        roughness: 0.18,
        transparent: true,
        opacity: 0.88,
      }),
      auraCyan: new THREE.MeshBasicMaterial({ color: '#00f0ff', transparent: true, opacity: 0.45 }),
    }),
    []
  );

  useEffect(() => {
    return () => {
      Object.values(mats).forEach((m) => m.dispose());
    };
  }, [mats]);

  useFrame((state, delta) => {
    const t = state.clock.elapsedTime;
    const isTalking = avatarState === AVATAR_STATES.TALKING;
    const isListening = avatarState === AVATAR_STATES.LISTENING;
    const isThinking = avatarState === AVATAR_STATES.THINKING;
    const isCelebrating = avatarState === AVATAR_STATES.CELEBRATING;

    // 1. Respiración orgánica y flotación sutil de tótem
    if (rootRef.current && torsoGroupRef.current) {
      const breath = Math.sin(t * 2.4) * 0.022;
      const celebrateHop = isCelebrating ? Math.abs(Math.sin(t * 7.5)) * 0.075 : 0;
      rootRef.current.position.y = -0.35 + breath + celebrateHop;
      torsoGroupRef.current.scale.set(1 + breath * 0.6, 1 - breath * 0.35, 1 + breath * 0.6);
    }

    // 2. Cabeza y mirada expresiva según estado conversacional
    if (headGroupRef.current) {
      let targetYaw = Math.sin(t * 0.85) * 0.08;
      let targetPitch = Math.sin(t * 1.4) * 0.03;
      let targetRoll = Math.sin(t * 0.65) * 0.03;

      if (isListening) {
        targetYaw = 0.14 + Math.sin(t * 1.8) * 0.04;
        targetPitch = 0.07 + Math.sin(t * 3.2) * 0.025; // Asiente sutilmente escuchando
        targetRoll = -0.11;
      } else if (isThinking) {
        targetYaw = -0.18;
        targetPitch = -0.09;
        targetRoll = 0.09;
      } else if (isTalking) {
        targetYaw = Math.sin(t * 2.7) * 0.16 + Math.cos(t * 1.3) * 0.06;
        targetPitch = Math.sin(t * 5.2) * 0.065;
        targetRoll = Math.sin(t * 2.1) * 0.075;
      } else if (isCelebrating) {
        targetYaw = Math.sin(t * 5.0) * 0.22;
        targetPitch = -0.06 + Math.sin(t * 10.0) * 0.06;
        targetRoll = Math.sin(t * 5.0) * 0.1;
      }

      headGroupRef.current.rotation.y = THREE.MathUtils.lerp(headGroupRef.current.rotation.y, targetYaw, 0.12);
      headGroupRef.current.rotation.x = THREE.MathUtils.lerp(headGroupRef.current.rotation.x, targetPitch, 0.12);
      headGroupRef.current.rotation.z = THREE.MathUtils.lerp(headGroupRef.current.rotation.z, targetRoll, 0.12);
    }

    // 3. Parpadeo natural + expresividad de cejas
    const b = blinkRef.current;
    if (!b.active && t >= b.nextAt) {
      b.active = true;
      b.progress = 0;
    }
    let eyeScaleY = 1.0;
    if (b.active) {
      b.progress += delta * 14.0;
      if (b.progress >= Math.PI) {
        b.active = false;
        b.nextAt = t + 2.2 + Math.random() * 3.4;
      } else {
        eyeScaleY = Math.max(0.08, 1.0 - Math.sin(b.progress));
      }
    }
    if (leftEyeRef.current && rightEyeRef.current) {
      const widen = isListening || isCelebrating ? 1.14 : 1.0;
      leftEyeRef.current.scale.set(widen, eyeScaleY * widen, 1);
      rightEyeRef.current.scale.set(widen, eyeScaleY * widen, 1);
    }
    if (leftBrowRef.current && rightBrowRef.current) {
      const browLift = isListening
        ? 0.045
        : isCelebrating
        ? 0.06
        : isTalking
        ? 0.02 + Math.sin(t * 6.5) * 0.022
        : 0;
      leftBrowRef.current.position.y = THREE.MathUtils.lerp(leftBrowRef.current.position.y, 0.18 + browLift, 0.18);
      rightBrowRef.current.position.y = THREE.MathUtils.lerp(rightBrowRef.current.position.y, 0.18 + browLift, 0.18);
    }

    // 4. Lip-Sync de boca en tiempo real (audio del WebSocket o cadencia silábica natural)
    if (mouthRef.current) {
      const cadence = Math.max(0.08, Math.sin(t * 14.5) * 0.55 + Math.sin(t * 8.3) * 0.45);
      const talkAmp = audioLevel > 0.02 ? THREE.MathUtils.clamp(audioLevel * 1.6, 0.15, 1.0) : cadence;

      const targetMouthY = isTalking ? 0.35 + talkAmp * 1.45 : isCelebrating ? 1.15 : isListening ? 0.42 : 0.26;
      const targetMouthX = isTalking ? 0.88 + (1.0 - talkAmp) * 0.32 : isCelebrating ? 1.28 : 1.0;

      mouthRef.current.scale.y = THREE.MathUtils.lerp(mouthRef.current.scale.y, targetMouthY, 0.32);
      mouthRef.current.scale.x = THREE.MathUtils.lerp(mouthRef.current.scale.x, targetMouthX, 0.25);
    }

    // 5. Gesticulación de brazos (saludo, explicación conversacional y brindis con elíxir Raíces)
    if (leftArmRef.current && rightArmRef.current) {
      let lRotZ = 0.28 + Math.sin(t * 2.0) * 0.04;
      let lRotX = 0.12;
      let rRotZ = -0.32 - Math.sin(t * 2.0) * 0.04;
      let rRotX = 0.25;

      if (isListening) {
        lRotZ = 0.2;
        lRotX = 0.35;
        rRotZ = -0.24;
        rRotX = 0.42;
      } else if (isTalking) {
        lRotZ = 0.38 + Math.sin(t * 4.6) * 0.22;
        lRotX = 0.55 + Math.cos(t * 3.8) * 0.24;
        rRotZ = -0.36 - Math.cos(t * 4.2) * 0.18;
        rRotX = 0.5 + Math.sin(t * 4.2) * 0.2;
      } else if (isCelebrating) {
        lRotZ = 0.95 + Math.sin(t * 11.0) * 0.35; // Saludo alegre con mano izquierda
        lRotX = 0.85;
        rRotZ = -0.55;
        rRotX = 0.78; // Levanta el vaso bio-elíxir
      }

      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, lRotZ, 0.15);
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, lRotX, 0.15);
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, rRotZ, 0.15);
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(rightArmRef.current.rotation.x, rRotX, 0.15);
    }

    // 6. Hojas botánicas y anillo holográfico de estado en la base
    if (leafCrownRef.current) {
      leafCrownRef.current.rotation.z = Math.sin(t * 2.8) * (isTalking || isCelebrating ? 0.14 : 0.05);
    }
    if (haloRingRef.current) {
      haloRingRef.current.rotation.z = t * (isListening || isTalking ? 1.8 : 0.5);
      const pulse = 1 + Math.sin(t * (isListening ? 6.0 : 3.0)) * 0.06;
      haloRingRef.current.scale.set(pulse, pulse, 1);
      mats.auraCyan.color.set(
        isListening ? '#00f0ff' : isTalking ? '#ffd700' : isCelebrating ? '#22ffa3' : '#19d876'
      );
      mats.auraCyan.opacity = isListening || isTalking ? 0.68 : 0.32;
    }
  });

  return (
    <group ref={rootRef} position={[0, -0.35, 0]}>
      {/* Anillo holográfico inferior de estado del Tótem */}
      <mesh ref={haloRingRef} position={[0, -0.52, 0]} rotation={[-Math.PI / 2, 0, 0]} material={mats.auraCyan}>
        <ringGeometry args={[0.52, 0.6, 36]} />
      </mesh>

      {/* Torso con camisa orgánica y Delantal Barista RAÍCES */}
      <group ref={torsoGroupRef} position={[0, -0.1, 0]}>
        {/* Camisa base */}
        <mesh position={[0, 0, 0]} material={mats.shirtCream}>
          <cylinderGeometry args={[0.27, 0.34, 0.68, 20]} />
        </mesh>

        {/* Delantal Verde Esmeralda RAÍCES */}
        <mesh position={[0, -0.02, 0.03]} material={mats.apronGreen}>
          <cylinderGeometry args={[0.278, 0.348, 0.62, 20, 1, false, -Math.PI * 0.55, Math.PI * 1.1]} />
        </mesh>

        {/* Tirantes dorados/verdes y Medallón Dorado RAÍCES en el pecho */}
        <mesh position={[0, 0.11, 0.295]} material={mats.goldTrim}>
          <circleGeometry args={[0.075, 20]} />
        </mesh>
        <mesh position={[0, 0.11, 0.302]} material={mats.leafBright}>
          <octahedronGeometry args={[0.042, 0]} />
        </mesh>

        {/* Brazo Izquierdo (saluda y gesticula al hablar) */}
        <group ref={leftArmRef} position={[-0.33, 0.22, 0]}>
          <mesh position={[-0.08, -0.16, 0]} material={mats.shirtCream}>
            <capsuleGeometry args={[0.075, 0.24, 8, 12]} />
          </mesh>
          <mesh position={[-0.09, -0.33, 0.02]} material={mats.skin}>
            <sphereGeometry args={[0.078, 14, 14]} />
          </mesh>
        </group>

        {/* Brazo Derecho sosteniendo un Elíxir Bio-Luminiscente RAÍCES */}
        <group ref={rightArmRef} position={[0.33, 0.22, 0]}>
          <mesh position={[0.08, -0.16, 0]} material={mats.shirtCream}>
            <capsuleGeometry args={[0.075, 0.24, 8, 12]} />
          </mesh>
          <mesh position={[0.09, -0.33, 0.04]} material={mats.skin}>
            <sphereGeometry args={[0.078, 14, 14]} />
          </mesh>
          {/* Mini Vaso Elíxir 500ml en su mano */}
          <group position={[0.11, -0.26, 0.14]} rotation={[-0.25, 0, 0.15]}>
            <mesh material={mats.cupGlass}>
              <cylinderGeometry args={[0.068, 0.052, 0.16, 14]} />
            </mesh>
            <mesh position={[0, 0.085, 0]} material={mats.goldTrim}>
              <cylinderGeometry args={[0.072, 0.072, 0.022, 14]} />
            </mesh>
            <mesh position={[0.015, 0.13, 0]} rotation={[0, 0, -0.2]} material={mats.leafBright}>
              <cylinderGeometry args={[0.008, 0.008, 0.11, 8]} />
            </mesh>
          </group>
        </group>
      </group>

      {/* Cabeza Expresiva Estilo Cartoon 3D */}
      <group ref={headGroupRef} position={[0, 0.46, 0]}>
        {/* Rostro redondeado */}
        <mesh material={mats.skin}>
          <sphereGeometry args={[0.34, 24, 24]} />
        </mesh>

        {/* Cabello / Gorra Barista Madera Cálida + Visera Esmeralda */}
        <mesh position={[0, 0.08, -0.03]} material={mats.hairWood}>
          <sphereGeometry args={[0.352, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.56]} />
        </mesh>
        <mesh position={[0, 0.17, 0.19]} rotation={[0.22, 0, 0]} material={mats.apronGreen}>
          <cylinderGeometry args={[0.28, 0.32, 0.055, 20, 1, false, -Math.PI * 0.48, Math.PI * 0.96]} />
        </mesh>
        <mesh position={[0, 0.2, 0.32]} material={mats.goldTrim}>
          <boxGeometry args={[0.14, 0.032, 0.02]} />
        </mesh>

        {/* Brote Botánico Vivo en la cima (símbolo de Raíces) */}
        <group ref={leafCrownRef} position={[0, 0.42, 0]}>
          <mesh position={[-0.06, 0.05, 0]} rotation={[0, 0, 0.55]} scale={[1, 1.6, 0.35]} material={mats.leafBright}>
            <sphereGeometry args={[0.058, 12, 12]} />
          </mesh>
          <mesh position={[0.06, 0.04, 0]} rotation={[0, 0, -0.55]} scale={[1, 1.45, 0.35]} material={mats.leafBright}>
            <sphereGeometry args={[0.05, 12, 12]} />
          </mesh>
        </group>

        {/* Ojos con brillo vivo */}
        <group ref={leftEyeRef} position={[-0.115, 0.04, 0.295]}>
          <mesh material={mats.eyeDark}>
            <sphereGeometry args={[0.046, 14, 14]} />
          </mesh>
          <mesh position={[0.014, 0.015, 0.038]} material={mats.eyeSparkle}>
            <sphereGeometry args={[0.013, 8, 8]} />
          </mesh>
        </group>

        <group ref={rightEyeRef} position={[0.115, 0.04, 0.295]}>
          <mesh material={mats.eyeDark}>
            <sphereGeometry args={[0.046, 14, 14]} />
          </mesh>
          <mesh position={[0.014, 0.015, 0.038]} material={mats.eyeSparkle}>
            <sphereGeometry args={[0.013, 8, 8]} />
          </mesh>
        </group>

        {/* Cejas expresivas */}
        <mesh ref={leftBrowRef} position={[-0.115, 0.14, 0.305]} rotation={[0, 0, 0.08]} material={mats.hairWood}>
          <capsuleGeometry args={[0.014, 0.065, 4, 8]} />
        </mesh>
        <mesh ref={rightBrowRef} position={[0.115, 0.14, 0.305]} rotation={[0, 0, -0.08]} material={mats.hairWood}>
          <capsuleGeometry args={[0.014, 0.065, 4, 8]} />
        </mesh>

        {/* Mejillas cálidas y nariz */}
        <mesh position={[-0.19, -0.03, 0.26]} material={mats.cheeks}>
          <sphereGeometry args={[0.042, 10, 10]} />
        </mesh>
        <mesh position={[0.19, -0.03, 0.26]} material={mats.cheeks}>
          <sphereGeometry args={[0.042, 10, 10]} />
        </mesh>
        <mesh position={[0, -0.01, 0.335]} material={mats.skin}>
          <sphereGeometry args={[0.034, 12, 12]} />
        </mesh>

        {/* Boca articulada para Lip-Sync */}
        <mesh ref={mouthRef} position={[0, -0.11, 0.312]} material={mats.mouthInner}>
          <capsuleGeometry args={[0.038, 0.055, 6, 12]} />
        </mesh>
      </group>
    </group>
  );
}

/**
 * Componente Principal Exportable: Avatar3DViewer
 *
 * Props:
 * - avatarState: 'IDLE' | 'LISTENING' | 'THINKING' | 'TALKING' | 'CELEBRATING'
 * - audioLevel: número [0..1] opcional calculado desde el stream de audio del WebSocket para lip-sync exacto
 * - modelUrl: ruta opcional a un archivo '.glb' / '.gltf' personalizado (ej: '/models/raices-avatar.glb').
 *             Si se omite o mientras carga, renderiza el personaje 3D nativo "Bio-Guía RAÍCES".
 * - onAvatarClick: callback al tocar/hacer clic sobre el avatar (ej: activar micrófono en pantalla táctil / tótem)
 * - className / style: personalización de contenedor
 */
export default function Avatar3DViewer({
  avatarState = AVATAR_STATES.IDLE,
  audioLevel = 0,
  modelUrl = null,
  onAvatarClick,
  className = '',
  style = {},
}) {
  const containerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);

  // Optimización GPU/CPU para tablets y tótems: pausar renderizado si el contenedor sale de vista o la pestaña se oculta
  useEffect(() => {
    const handleVisibility = () => setIsVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);

    let observer;
    if (typeof IntersectionObserver !== 'undefined' && containerRef.current) {
      observer = new IntersectionObserver(
        ([entry]) => setIsVisible(entry.isIntersecting && !document.hidden),
        { threshold: 0.05 }
      );
      observer.observe(containerRef.current);
    }

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
      if (observer) observer.disconnect();
    };
  }, []);

  const fallbackCharacter = (
    <StylizedRaicesBotanicalCharacter avatarState={avatarState} audioLevel={audioLevel} />
  );

  return (
    <div
      ref={containerRef}
      onClick={onAvatarClick}
      className={`raices-avatar-3d-stage ${className}`}
      style={{
        width: '100%',
        height: '100%',
        minHeight: '210px',
        position: 'relative',
        cursor: onAvatarClick ? 'pointer' : 'default',
        touchAction: 'manipulation',
        ...style,
      }}
      title="Toca al asistente 3D para hablar"
    >
      <Canvas
        frameloop={isVisible ? 'always' : 'never'}
        dpr={[1, 1.5]} // Limita pixelRatio a 1.5x para máxima fluidez térmica en tablets y tótems
        camera={{ position: [0, 0.15, 2.35], fov: 36, near: 0.1, far: 20 }}
        gl={{
          alpha: true,
          antialias: true,
          powerPreference: 'high-performance',
          stencil: false,
          depth: true,
        }}
      >
        {/* Iluminación Bio-Botánica de 3 puntos (Cálida Solar + Relleno Esmeralda + Rim Aqua) */}
        <hemisphereLight args={['#fff9e6', '#052e16', 1.35]} />
        <directionalLight position={[2.2, 3.0, 3.2]} intensity={2.1} color="#fff3cc" />
        <directionalLight position={[-2.0, 1.4, 2.0]} intensity={1.1} color="#a7f3d0" />
        <pointLight
          position={[0, 0.4, -1.6]}
          intensity={avatarState === AVATAR_STATES.LISTENING ? 2.4 : 1.3}
          color={avatarState === AVATAR_STATES.TALKING ? '#ffd700' : '#00f0ff'}
        />

        {modelUrl ? (
          <ModelErrorBoundary modelUrl={modelUrl} fallback={fallbackCharacter}>
            <Suspense fallback={fallbackCharacter}>
              <GLBCharacterAvatar
                modelUrl={modelUrl}
                avatarState={avatarState}
                audioLevel={audioLevel}
              />
            </Suspense>
          </ModelErrorBoundary>
        ) : (
          fallbackCharacter
        )}

        <ContactShadows
          position={[0, -0.88, 0]}
          opacity={0.42}
          scale={2.2}
          blur={2.1}
          far={1.4}
          frames={isVisible ? Infinity : 1}
        />
      </Canvas>
    </div>
  );
}
