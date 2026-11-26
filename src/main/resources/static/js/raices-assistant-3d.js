import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const h = React.createElement;

export const AVATAR_STATES = {
    IDLE: 'IDLE',
    LISTENING: 'LISTENING',
    THINKING: 'THINKING',
    TALKING: 'TALKING',
    CELEBRATING: 'CELEBRATING'
};

const CLIENT_SESSION_ID = 'raices-kiosk-' + Math.random().toString(36).slice(2, 10) + '-' + Date.now().toString(36);

function normalizarTexto(s) {
    if (!s) return '';
    return String(s)
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim();
}

function formatearCLP(n) {
    return '$' + Math.round(Number(n) || 0).toLocaleString('es-CL');
}

/**
 * Construye la escena 3D completa estilo Kiosco Inteligente (inspirada en tótems conversacionales reales):
 * - Fondo de local cálido con estanterías iluminadas y botellas de batidos/shots de colores.
 * - Cartel luminoso RAÍCES en la pared posterior.
 * - Mostrador de madera/esmeralda en primer plano con termo RAÍCES y terminal POS interactiva.
 * - Personaje 3D carismático ("Rafa, Barista RAÍCES") con párpados, pupilas con mirada viva, cejas expresivas,
 *   mandíbula/labios articulados por onda de audio real (AnalyserNode) y brazos que teclean en el POS y saludan.
 */
function buildKioskSceneAndCharacter(scene) {
    const disposables = [];
    const trackMat = (m) => { disposables.push(m); return m; };

    // Materiales de entorno y personaje
    const mats = {
        backWall: trackMat(new THREE.MeshStandardMaterial({ color: 0x162921, roughness: 0.85 })),
        shelfWood: trackMat(new THREE.MeshStandardMaterial({ color: 0x6e472b, roughness: 0.72 })),
        counterTop: trackMat(new THREE.MeshStandardMaterial({ color: 0x8c5835, roughness: 0.55, metalness: 0.05 })),
        counterFront: trackMat(new THREE.MeshStandardMaterial({ color: 0x0b4f2f, roughness: 0.65 })),
        goldSign: trackMat(new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0x8a6d00, emissiveIntensity: 0.65, roughness: 0.25, metalness: 0.8 })),
        posBody: trackMat(new THREE.MeshStandardMaterial({ color: 0x2a1c1b, roughness: 0.4, metalness: 0.35 })),
        posScreen: trackMat(new THREE.MeshBasicMaterial({ color: 0x22ffa3 })),
        thermosBody: trackMat(new THREE.MeshStandardMaterial({ color: 0x12181b, roughness: 0.32, metalness: 0.55 })),
        thermosSticker: trackMat(new THREE.MeshBasicMaterial({ color: 0x19d876 })),
        skin: trackMat(new THREE.MeshStandardMaterial({ color: 0xf2be96, roughness: 0.52, metalness: 0.02 })),
        skinShade: trackMat(new THREE.MeshStandardMaterial({ color: 0xe3a278, roughness: 0.58 })),
        hair: trackMat(new THREE.MeshStandardMaterial({ color: 0x2e1b11, roughness: 0.78 })),
        poloWhite: trackMat(new THREE.MeshStandardMaterial({ color: 0xf7f8f5, roughness: 0.65 })),
        apronGreen: trackMat(new THREE.MeshStandardMaterial({ color: 0x0e6e40, roughness: 0.52 })),
        capGreen: trackMat(new THREE.MeshStandardMaterial({ color: 0x134e35, roughness: 0.58 })),
        eyeWhite: trackMat(new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.15 })),
        irisBrown: trackMat(new THREE.MeshStandardMaterial({ color: 0x2b1708, roughness: 0.12 })),
        pupilBlack: trackMat(new THREE.MeshBasicMaterial({ color: 0x050505 })),
        eyeHighlight: trackMat(new THREE.MeshBasicMaterial({ color: 0xffffff })),
        mouthCavity: trackMat(new THREE.MeshStandardMaterial({ color: 0x4a1019, roughness: 0.7 })),
        tongue: trackMat(new THREE.MeshStandardMaterial({ color: 0xd95b66, roughness: 0.55 })),
        bottleGreen: trackMat(new THREE.MeshStandardMaterial({ color: 0x19d876, emissive: 0x064e28, emissiveIntensity: 0.4, roughness: 0.2 })),
        bottleRed: trackMat(new THREE.MeshStandardMaterial({ color: 0xff4d6d, emissive: 0x590d22, emissiveIntensity: 0.35, roughness: 0.2 })),
        bottleGold: trackMat(new THREE.MeshStandardMaterial({ color: 0xffbe0b, emissive: 0x664400, emissiveIntensity: 0.4, roughness: 0.2 })),
        bottlePurple: trackMat(new THREE.MeshStandardMaterial({ color: 0x9d4edd, emissive: 0x3c096c, emissiveIntensity: 0.4, roughness: 0.2 }))
    };

    // 1. PARED DE FONDO Y ESTANTERÍAS DEL LOCAL RAÍCES
    const backWall = new THREE.Mesh(new THREE.PlaneGeometry(5.5, 4.0), mats.backWall);
    backWall.position.set(0, 0.4, -1.35);
    scene.add(backWall);

    // Cartel superior luminoso
    const signBoard = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.26, 0.06), mats.counterFront);
    signBoard.position.set(0, 0.98, -1.28);
    scene.add(signBoard);
    const signFrame = new THREE.Mesh(new THREE.BoxGeometry(1.21, 0.31, 0.04), mats.goldSign);
    signFrame.position.set(0, 0.98, -1.30);
    scene.add(signFrame);

    // Estantes laterales con botellas de elíxires
    const bottleMats = [mats.bottleGreen, mats.bottleGold, mats.bottleRed, mats.bottlePurple];
    [-1.05, 1.05].forEach((sideX, sIdx) => {
        [0.25, 0.68].forEach((shelfY, yIdx) => {
            const shelf = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.045, 0.26), mats.shelfWood);
            shelf.position.set(sideX, shelfY, -1.18);
            scene.add(shelf);

            for (let b = -1; b <= 1; b++) {
                const bMat = bottleMats[(sIdx + yIdx + b + 4) % bottleMats.length];
                const bottle = new THREE.Group();
                bottle.position.set(sideX + b * 0.22, shelfY + 0.12, -1.16);
                bottle.add(new THREE.Mesh(new THREE.CylinderGeometry(0.048, 0.048, 0.18, 12), bMat));
                const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.035, 10), mats.goldSign);
                cap.position.y = 0.105;
                bottle.add(cap);
                scene.add(bottle);
            }
        });
    });

    // 2. MOSTRADOR FRONTAL DEL KIOSQUERO + PROPS (TERMO Y TERMINAL POS)
    const counterGroup = new THREE.Group();
    counterGroup.position.set(0, -0.58, 0.42);
    scene.add(counterGroup);

    const counterTopMesh = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.09, 0.68), mats.counterTop);
    counterTopMesh.position.set(0, 0.08, 0);
    counterGroup.add(counterTopMesh);

    const counterFrontMesh = new THREE.Mesh(new THREE.BoxGeometry(2.76, 0.75, 0.60), mats.counterFront);
    counterFrontMesh.position.set(0, -0.34, -0.02);
    counterGroup.add(counterFrontMesh);

    // Termo / Shaker RAÍCES sobre el mostrador (izquierda del espectador, igual al video)
    const thermos = new THREE.Group();
    thermos.position.set(-0.62, 0.28, 0.08);
    counterGroup.add(thermos);
    thermos.add(new THREE.Mesh(new THREE.CylinderGeometry(0.082, 0.078, 0.32, 16), mats.thermosBody));
    const thermosCap = new THREE.Mesh(new THREE.CylinderGeometry(0.068, 0.082, 0.06, 16), mats.goldSign);
    thermosCap.position.y = 0.185;
    thermos.add(thermosCap);
    const sticker = new THREE.Mesh(new THREE.CircleGeometry(0.048, 16), mats.thermosSticker);
    sticker.position.set(0, 0.02, 0.082);
    thermos.add(sticker);

    // Terminal POS / Mini-Laptop en el mostrador frente al personaje
    const posTerminal = new THREE.Group();
    posTerminal.position.set(0.08, 0.13, 0.08);
    counterGroup.add(posTerminal);

    const posBase = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.025, 0.26), mats.posBody);
    posTerminal.add(posBase);

    const posMonitorPivot = new THREE.Group();
    posMonitorPivot.position.set(0, 0.015, 0.11);
    posMonitorPivot.rotation.x = -0.35;
    posTerminal.add(posMonitorPivot);

    const posMonitor = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.25, 0.022), mats.posBody);
    posMonitor.position.set(0, 0.125, 0);
    posMonitorPivot.add(posMonitor);

    const posGlow = new THREE.Mesh(new THREE.PlaneGeometry(0.33, 0.20), mats.posScreen);
    posGlow.position.set(0, 0.125, -0.013);
    posGlow.rotation.y = Math.PI;
    posMonitorPivot.add(posGlow);

    // 3. PROTOTIPO OFICIAL 3D PINTADO: CHIMPANCÉ RAÍCES (chimp-raices.glb V3 con calce anatómico exacto)
    const chimpGroup = new THREE.Group();
    chimpGroup.position.set(0.022, -0.39, -0.05);
    scene.add(chimpGroup);

    let chimpMorphMesh = null;
    const gltfLoader = new GLTFLoader();

    // Respaldo procedural ultra-rápido solo durante los milisegundos de carga inicial del GLB
    const charRoot = new THREE.Group();
    charRoot.position.set(0, -0.34, -0.10);
    scene.add(charRoot);

    gltfLoader.load(
        'chimp-raices.glb?v=6',
        (gltf) => {
            charRoot.visible = false;
            const model = gltf.scene;
            model.traverse((obj) => {
                if (obj.isMesh) {
                    if (obj.material && obj.material.map) {
                        obj.material.map.colorSpace = THREE.SRGBColorSpace;
                        obj.material.emissiveMap = obj.material.map;
                        obj.material.emissive = new THREE.Color(0xfff4e6);
                        obj.material.emissiveIntensity = 0.16;
                        obj.material.roughness = 0.68;
                        obj.material.metalness = 0.04;
                        obj.material.needsUpdate = true;
                    }
                    if (obj.morphTargetInfluences && obj.morphTargetInfluences.length >= 6) {
                        chimpMorphMesh = obj;
                    }
                }
            });
            chimpGroup.add(model);
        },
        undefined,
        () => {
            charRoot.visible = true;
        }
    );

    // Torso con Polo Blanco + Delantal RAÍCES + Cuello
    const torso = new THREE.Group();
    torso.position.set(0, 0.06, 0);
    charRoot.add(torso);

    const chest = new THREE.Mesh(new THREE.CapsuleGeometry(0.28, 0.34, 12, 20), mats.poloWhite);
    torso.add(chest);

    const apron = new THREE.Mesh(
        new THREE.CylinderGeometry(0.286, 0.305, 0.50, 20, 1, false, -Math.PI * 0.52, Math.PI * 1.04),
        mats.apronGreen
    );
    apron.position.set(0, -0.04, 0.015);
    torso.add(apron);

    const apronBadge = new THREE.Mesh(new THREE.CircleGeometry(0.055, 18), mats.goldSign);
    apronBadge.position.set(0.09, 0.09, 0.295);
    torso.add(apronBadge);

    const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.095, 0.11, 0.14, 14), mats.skinShade);
    neck.position.set(0, 0.33, 0.01);
    torso.add(neck);

    // Brazos articulados (Hombro -> Antebrazo -> Mano expresiva sobre mostrador)
    function makeArm(side) {
        const shoulder = new THREE.Group();
        shoulder.position.set(side * 0.31, 0.20, 0.02);
        torso.add(shoulder);

        const sleeve = new THREE.Mesh(new THREE.CapsuleGeometry(0.082, 0.13, 8, 12), mats.poloWhite);
        sleeve.position.set(side * 0.04, -0.07, 0.02);
        sleeve.rotation.z = -side * 0.22;
        shoulder.add(sleeve);

        const elbow = new THREE.Group();
        elbow.position.set(side * 0.07, -0.18, 0.05);
        shoulder.add(elbow);

        const forearm = new THREE.Mesh(new THREE.CapsuleGeometry(0.064, 0.18, 8, 12), mats.skin);
        forearm.position.set(-side * 0.03, -0.06, 0.11);
        forearm.rotation.x = Math.PI * 0.38;
        forearm.rotation.z = side * 0.18;
        elbow.add(forearm);

        const hand = new THREE.Mesh(new THREE.SphereGeometry(0.074, 14, 14), mats.skin);
        hand.scale.set(1.05, 0.78, 1.18);
        hand.position.set(-side * 0.06, -0.12, 0.22);
        elbow.add(hand);

        return { shoulder, elbow, hand };
    }

    const leftArm = makeArm(-1);
    const rightArm = makeArm(1);

    // CABEZA EXPRESIVA CON ROSTRO HUMANO CARISMÁTICO
    const head = new THREE.Group();
    head.position.set(0, 0.58, 0.03);
    charRoot.add(head);

    const cranium = new THREE.Mesh(new THREE.SphereGeometry(0.285, 28, 28), mats.skin);
    cranium.scale.set(0.96, 1.06, 0.95);
    head.add(cranium);

    // Orejas
    [-1, 1].forEach((s) => {
        const ear = new THREE.Mesh(new THREE.SphereGeometry(0.062, 12, 12), mats.skinShade);
        ear.scale.set(0.45, 0.85, 0.65);
        ear.position.set(s * 0.275, -0.01, -0.01);
        head.add(ear);
    });

    // Cabello y Gorra Barista RAÍCES
    const hairBack = new THREE.Mesh(
        new THREE.SphereGeometry(0.292, 22, 18, 0, Math.PI * 2, 0, Math.PI * 0.58),
        mats.hair
    );
    hairBack.position.set(0, 0.04, -0.02);
    head.add(hairBack);

    const capDome = new THREE.Mesh(
        new THREE.SphereGeometry(0.296, 22, 16, 0, Math.PI * 2, 0, Math.PI * 0.48),
        mats.capGreen
    );
    capDome.position.set(0, 0.08, 0);
    capDome.rotation.x = -0.12;
    head.add(capDome);

    const capBrim = new THREE.Mesh(
        new THREE.CylinderGeometry(0.25, 0.28, 0.032, 20, 1, false, -Math.PI * 0.45, Math.PI * 0.9),
        mats.capGreen
    );
    capBrim.position.set(0, 0.155, 0.16);
    capBrim.rotation.x = 0.14;
    head.add(capBrim);

    const capLogo = new THREE.Mesh(new THREE.CircleGeometry(0.045, 16), mats.goldSign);
    capLogo.position.set(0, 0.21, 0.272);
    capLogo.rotation.x = -0.2;
    head.add(capLogo);

    // Ojos grandes expresivos con esclerótica, iris, pupila móvil y párpado superior para parpadeo humano
    function makeExpressiveEye(x) {
        const eyeGroup = new THREE.Group();
        eyeGroup.position.set(x, 0.045, 0.242);
        head.add(eyeGroup);

        const sclera = new THREE.Mesh(new THREE.SphereGeometry(0.056, 18, 18), mats.eyeWhite);
        sclera.scale.set(1.0, 1.08, 0.65);
        eyeGroup.add(sclera);

        const gazeGroup = new THREE.Group();
        eyeGroup.add(gazeGroup);

        const iris = new THREE.Mesh(new THREE.CircleGeometry(0.031, 16), mats.irisBrown);
        iris.position.set(0, 0, 0.037);
        gazeGroup.add(iris);

        const pupil = new THREE.Mesh(new THREE.CircleGeometry(0.016, 14), mats.pupilBlack);
        pupil.position.set(0, 0, 0.038);
        gazeGroup.add(pupil);

        const spark = new THREE.Mesh(new THREE.CircleGeometry(0.008, 10), mats.eyeHighlight);
        spark.position.set(0.011, 0.012, 0.039);
        gazeGroup.add(spark);

        const upperLid = new THREE.Mesh(
            new THREE.SphereGeometry(0.060, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52),
            mats.skinShade
        );
        upperLid.scale.set(1.02, 1.08, 0.72);
        upperLid.rotation.x = -1.25; // Abierto en reposo
        eyeGroup.add(upperLid);

        return { eyeGroup, gazeGroup, upperLid };
    }

    const leftEye = makeExpressiveEye(-0.098);
    const rightEye = makeExpressiveEye(0.098);

    // Cejas expresivas
    function makeBrow(x, side) {
        const brow = new THREE.Mesh(new THREE.CapsuleGeometry(0.015, 0.068, 6, 10), mats.hair);
        brow.position.set(x, 0.132, 0.258);
        brow.rotation.z = Math.PI * 0.5 - side * 0.06;
        head.add(brow);
        return brow;
    }
    const leftBrow = makeBrow(-0.10, -1);
    const rightBrow = makeBrow(0.10, 1);

    // Nariz cálida redondeada
    const nose = new THREE.Mesh(new THREE.SphereGeometry(0.038, 14, 14), mats.skinShade);
    nose.scale.set(0.92, 1.08, 1.15);
    nose.position.set(0, -0.022, 0.278);
    head.add(nose);

    // Boca articulada con cavidad bucal y lengua para lip-sync realista
    const mouthPivot = new THREE.Group();
    mouthPivot.position.set(0, -0.115, 0.252);
    head.add(mouthPivot);

    const mouthBg = new THREE.Mesh(new THREE.CapsuleGeometry(0.032, 0.058, 8, 14), mats.mouthCavity);
    mouthBg.rotation.z = Math.PI * 0.5;
    mouthBg.scale.set(0.32, 1.0, 0.55);
    mouthPivot.add(mouthBg);

    const tongueMesh = new THREE.Mesh(new THREE.SphereGeometry(0.026, 12, 10), mats.tongue);
    tongueMesh.scale.set(1.2, 0.55, 0.7);
    tongueMesh.position.set(0, -0.012, 0.008);
    mouthPivot.add(tongueMesh);

    // Estado interno de micro-expresiones humanas (parpadeo, mirada sacádica, gestos de POS)
    const anim = {
        nextBlinkAt: 1.5,
        blinking: false,
        blinkPhase: 0,
        nextSaccadeAt: 1.2,
        gazeX: 0,
        gazeY: 0,
        gestureTimer: 0,
        gestureType: null
    };

    function triggerGesture(type, duration = 1.6) {
        anim.gestureType = type;
        anim.gestureTimer = duration;
    }

    function update(dt, t, avatarState, audioLevel) {
        const isTalking = avatarState === AVATAR_STATES.TALKING;
        const isListening = avatarState === AVATAR_STATES.LISTENING;
        const isThinking = avatarState === AVATAR_STATES.THINKING;
        const isCelebrating = avatarState === AVATAR_STATES.CELEBRATING;

        if (anim.gestureTimer > 0) {
            anim.gestureTimer = Math.max(0, anim.gestureTimer - dt);
            if (anim.gestureTimer === 0) anim.gestureType = null;
        }
        const isTypingPos = isThinking || anim.gestureType === 'POS_TAP';
        const isWaving = anim.gestureType === 'WAVE';

        // Respiración orgánica de pecho y hombros
        const breath = Math.sin(t * 2.1) * 0.014;
        const bounce = isCelebrating ? Math.abs(Math.sin(t * 7.2)) * 0.045 : 0;
        charRoot.position.y = -0.34 + breath + bounce;
        torso.rotation.z = Math.sin(t * 0.9) * 0.018;

        // Postura y mirada natural de la cabeza
        let headYaw = Math.sin(t * 0.75) * 0.065;
        let headPitch = Math.sin(t * 1.15) * 0.025;
        let headRoll = Math.sin(t * 0.6) * 0.025;

        if (isTypingPos) {
            // Mira brevemente hacia la pantalla de su terminal POS en el mostrador como en el video
            headYaw = 0.08;
            headPitch = 0.20 + Math.sin(t * 8.0) * 0.02;
            headRoll = -0.04;
        } else if (isListening) {
            // Atención activa: leve inclinación empática escuchando al cliente
            headYaw = 0.09 + Math.sin(t * 1.6) * 0.03;
            headPitch = -0.03 + Math.sin(t * 2.8) * 0.02;
            headRoll = -0.075;
        } else if (isTalking) {
            // Conversación humana viva con cadencia natural de cabeza
            headYaw = Math.sin(t * 2.3) * 0.13 + Math.cos(t * 1.1) * 0.05;
            headPitch = Math.sin(t * 4.4) * 0.055 - 0.015;
            headRoll = Math.sin(t * 1.8) * 0.055;
        } else if (isCelebrating) {
            headYaw = Math.sin(t * 4.5) * 0.16;
            headPitch = -0.06 + Math.sin(t * 9.0) * 0.045;
            headRoll = Math.sin(t * 4.5) * 0.08;
        }

        head.rotation.y = THREE.MathUtils.lerp(head.rotation.y, headYaw, 0.14);
        head.rotation.x = THREE.MathUtils.lerp(head.rotation.x, headPitch, 0.14);
        head.rotation.z = THREE.MathUtils.lerp(head.rotation.z, headRoll, 0.14);

        // Micro-movimientos oculares (saccades humanos)
        if (t >= anim.nextSaccadeAt) {
            anim.nextSaccadeAt = t + 1.1 + Math.random() * 2.4;
            if (isTypingPos) {
                anim.gazeX = 0.006;
                anim.gazeY = -0.012;
            } else {
                anim.gazeX = (Math.random() - 0.5) * 0.014;
                anim.gazeY = (Math.random() - 0.5) * 0.009;
            }
        }
        leftEye.gazeGroup.position.x = THREE.MathUtils.lerp(leftEye.gazeGroup.position.x, anim.gazeX, 0.22);
        leftEye.gazeGroup.position.y = THREE.MathUtils.lerp(leftEye.gazeGroup.position.y, anim.gazeY, 0.22);
        rightEye.gazeGroup.position.x = THREE.MathUtils.lerp(rightEye.gazeGroup.position.x, anim.gazeX, 0.22);
        rightEye.gazeGroup.position.y = THREE.MathUtils.lerp(rightEye.gazeGroup.position.y, anim.gazeY, 0.22);

        // Parpadeo natural con párpados superiores
        if (!anim.blinking && t >= anim.nextBlinkAt) {
            anim.blinking = true;
            anim.blinkPhase = 0;
        }
        let lidAngle = isListening ? -1.35 : -1.22;
        if (anim.blinking) {
            anim.blinkPhase += dt * 16.0;
            if (anim.blinkPhase >= Math.PI) {
                anim.blinking = false;
                anim.nextBlinkAt = t + 2.0 + Math.random() * 3.5;
            } else {
                lidAngle = THREE.MathUtils.lerp(-1.22, -0.08, Math.sin(anim.blinkPhase));
            }
        }
        leftEye.upperLid.rotation.x = lidAngle;
        rightEye.upperLid.rotation.x = lidAngle;

        // Cejas expresivas
        const browOffset = isListening
            ? 0.022
            : isCelebrating
            ? 0.032
            : isTalking
            ? 0.012 + Math.sin(t * 6.2) * 0.014
            : 0;
        leftBrow.position.y = THREE.MathUtils.lerp(leftBrow.position.y, 0.132 + browOffset, 0.22);
        rightBrow.position.y = THREE.MathUtils.lerp(rightBrow.position.y, 0.132 + browOffset, 0.22);
        leftBrow.rotation.z = THREE.MathUtils.lerp(leftBrow.rotation.z, Math.PI * 0.5 + (isListening ? 0.14 : 0.06), 0.2);
        rightBrow.rotation.z = THREE.MathUtils.lerp(rightBrow.rotation.z, Math.PI * 0.5 - (isListening ? 0.14 : 0.06), 0.2);

        // Lip-Sync por amplitud real de voz (audioLevel de AnalyserNode) o cadencia silábica
        const fallbackSyllables = Math.max(0.05, Math.sin(t * 15.0) * 0.5 + Math.sin(t * 9.2) * 0.45);
        const voiceAmp = audioLevel > 0.015 ? THREE.MathUtils.clamp(audioLevel * 1.75, 0.08, 1.15) : fallbackSyllables;

        let mouthOpen = 0.22;
        let mouthWidth = 1.05;
        if (isTalking) {
            mouthOpen = 0.26 + voiceAmp * 1.35;
            mouthWidth = 0.88 + (1.0 - Math.min(1, voiceAmp)) * 0.26;
        } else if (isCelebrating) {
            mouthOpen = 1.05;
            mouthWidth = 1.25;
        } else if (isListening) {
            mouthOpen = 0.28;
            mouthWidth = 1.12;
        }
        mouthBg.scale.x = THREE.MathUtils.lerp(mouthBg.scale.x, mouthOpen, 0.38);
        mouthBg.scale.y = THREE.MathUtils.lerp(mouthBg.scale.y, mouthWidth, 0.28);
        tongueMesh.visible = mouthBg.scale.x > 0.45;

        // Gesticulación humana de brazos sobre el mostrador
        let lShX = 0.12, lShZ = 0.08, lElX = 0.0;
        let rShX = 0.12, rShZ = -0.08, rElX = 0.0;

        if (isWaving) {
            lShX = -0.85;
            lShZ = 0.55 + Math.sin(t * 10.0) * 0.28;
            lElX = -0.45;
        } else if (isTypingPos) {
            // Teclea ágilmente sobre su terminal POS del mostrador al cargar el pedido o generar QR
            rShX = 0.32;
            rShZ = -0.22;
            rElX = Math.sin(t * 18.0) * 0.12;
            lShX = 0.28;
            lShZ = 0.18;
            lElX = Math.cos(t * 18.0) * 0.10;
            mats.posScreen.color.setHex(Math.sin(t * 20) > 0 ? 0x00f0ff : 0x22ffa3);
        } else if (isTalking) {
            lShX = 0.32 + Math.sin(t * 4.2) * 0.18;
            lShZ = 0.16 + Math.cos(t * 3.4) * 0.12;
            lElX = -0.22 + Math.sin(t * 4.8) * 0.15;

            rShX = 0.28 + Math.cos(t * 3.9) * 0.16;
            rShZ = -0.14 - Math.sin(t * 3.2) * 0.10;
            rElX = -0.18 + Math.cos(t * 4.5) * 0.14;
            mats.posScreen.color.setHex(0x22ffa3);
        } else if (isCelebrating) {
            lShX = -0.75 + Math.sin(t * 9.0) * 0.2;
            lShZ = 0.45;
            rShX = -0.75 + Math.cos(t * 9.0) * 0.2;
            rShZ = -0.45;
        } else {
            mats.posScreen.color.setHex(0x22ffa3);
        }

        leftArm.shoulder.rotation.x = THREE.MathUtils.lerp(leftArm.shoulder.rotation.x, lShX, 0.18);
        leftArm.shoulder.rotation.z = THREE.MathUtils.lerp(leftArm.shoulder.rotation.z, lShZ, 0.18);
        leftArm.elbow.rotation.x = THREE.MathUtils.lerp(leftArm.elbow.rotation.x, lElX, 0.22);

        rightArm.shoulder.rotation.x = THREE.MathUtils.lerp(rightArm.shoulder.rotation.x, rShX, 0.18);
        rightArm.shoulder.rotation.z = THREE.MathUtils.lerp(rightArm.shoulder.rotation.z, rShZ, 0.18);
        rightArm.elbow.rotation.x = THREE.MathUtils.lerp(rightArm.elbow.rotation.x, rElX, 0.22);

        // Animación viva libre de deformación facial sobre chimp-raices.glb
        // Morph targets: [0]=jawTalk, [1]=blink, [4]=breathe, [5]=armGesture
        if (chimpMorphMesh && chimpMorphMesh.morphTargetInfluences) {
            const inf = chimpMorphMesh.morphTargetInfluences;

            // [0] Mandíbula/labio inferior sincronizado suavemente con la voz humana de OpenAI
            const targetJaw = isTalking
                ? THREE.MathUtils.clamp(voiceAmp * 0.85, 0.04, 0.78)
                : isCelebrating
                ? 0.40
                : 0.0;
            inf[0] = THREE.MathUtils.lerp(inf[0], targetJaw, 0.40);

            // [1] Parpadeo natural en los ojos reales (y=0.735)
            const blinkVal = anim.blinking ? Math.sin(anim.blinkPhase) : 0;
            inf[1] = THREE.MathUtils.clamp(blinkVal, 0, 1);

            inf[2] = 0;
            inf[3] = 0;

            // [4] Respiración torácica sutil (sin deformar cuello/hombros)
            inf[4] = 0.22 + 0.22 * Math.sin(t * 2.2);

            // [5] Desactivado: armGesture mueve 9893 vértices sin skinning y rasga hombros/cuello
            inf[5] = 0;
        }

        // Encuadre centrado (muestra la gorra Raíces BATIDOS completa arriba) + giro rígido natural sin deformar la cara
        const baseChimpY = anim.fullBodyMode ? 0.04 : -0.39;
        const chimpScale = anim.fullBodyMode ? 0.76 : 0.94;
        chimpGroup.position.x = 0.022;
        chimpGroup.scale.setScalar(THREE.MathUtils.lerp(chimpGroup.scale.x, chimpScale, 0.14));
        chimpGroup.position.y = THREE.MathUtils.lerp(
            chimpGroup.position.y,
            baseChimpY + Math.sin(t * 2.2) * 0.010 + (isCelebrating ? Math.abs(Math.sin(t * 7.2)) * 0.035 : 0),
            0.2
        );

        const naturalYaw = isTypingPos
            ? 0.08
            : isListening
            ? 0.10 + Math.sin(t * 1.6) * 0.03
            : isTalking
            ? Math.sin(t * 2.1) * 0.14 + Math.cos(t * 1.1) * 0.05
            : Math.sin(t * 0.85) * 0.06;
        const naturalPitch = isTypingPos
            ? 0.09
            : isListening
            ? -0.03
            : isTalking
            ? Math.sin(t * 4.2) * 0.035
            : 0;

        chimpGroup.rotation.y = THREE.MathUtils.lerp(chimpGroup.rotation.y, (anim.userRotY || 0) + naturalYaw, 0.14);
        chimpGroup.rotation.x = THREE.MathUtils.lerp(chimpGroup.rotation.x, naturalPitch, 0.14);
        chimpGroup.rotation.z = THREE.MathUtils.lerp(chimpGroup.rotation.z, Math.sin(t * 1.1) * (isTalking ? 0.025 : 0.01), 0.14);
        counterGroup.visible = !anim.fullBodyMode;
    }

    function setFullBodyMode(enabled) {
        anim.fullBodyMode = Boolean(enabled);
        if (!enabled) anim.userRotY = 0;
    }

    function addRotationY(deltaRad) {
        anim.userRotY = THREE.MathUtils.clamp((anim.userRotY || 0) + deltaRad, -Math.PI, Math.PI);
    }

    function dispose() {
        disposables.forEach((m) => m.dispose());
    }

    return { update, triggerGesture, setFullBodyMode, addRotationY, dispose };
}

function Kiosk3DStage({ avatarState, audioLevel, lastGestureSignal, fullBodyView, onStageTap }) {
    const containerRef = useRef(null);
    const stateRef = useRef(avatarState);
    const audioRef = useRef(audioLevel);
    const kioskControllerRef = useRef(null);
    const dragRef = useRef({ down: false, startX: 0, moved: false });

    useEffect(() => { stateRef.current = avatarState; }, [avatarState]);
    useEffect(() => { audioRef.current = audioLevel; }, [audioLevel]);

    useEffect(() => {
        if (kioskControllerRef.current) {
            kioskControllerRef.current.setFullBodyMode(fullBodyView);
        }
    }, [fullBodyView]);

    useEffect(() => {
        if (lastGestureSignal && kioskControllerRef.current) {
            kioskControllerRef.current.triggerGesture(lastGestureSignal.type, 1.6);
        }
    }, [lastGestureSignal]);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        const canvas = document.createElement('canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.style.display = 'block';
        container.innerHTML = '';
        container.appendChild(canvas);

        const renderer = new THREE.WebGLRenderer({
            canvas,
            antialias: true,
            powerPreference: 'high-performance',
            stencil: false
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
        renderer.outputColorSpace = THREE.SRGBColorSpace;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.15;

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(0x102119);

        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 20);
        camera.position.set(0, 0.18, 2.08);
        camera.lookAt(0, 0.04, 0);

        scene.add(new THREE.HemisphereLight(0xfff8ee, 0x3b271c, 1.45));
        const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.0);
        keyLight.position.set(1.8, 2.6, 2.8);
        scene.add(keyLight);

        const fillLight = new THREE.DirectionalLight(0xffe8cf, 0.95);
        fillLight.position.set(-1.8, 1.2, 1.8);
        scene.add(fillLight);

        const rimLight = new THREE.DirectionalLight(0x34d399, 0.55);
        rimLight.position.set(0, 1.4, -2.0);
        scene.add(rimLight);

        const shopWarmGlow = new THREE.PointLight(0xffb703, 1.2, 5);
        shopWarmGlow.position.set(0, 0.9, -0.8);
        scene.add(shopWarmGlow);

        const kioskCtrl = buildKioskSceneAndCharacter(scene);
        kioskControllerRef.current = kioskCtrl;

        function resize() {
            if (!container) return;
            const w = Math.max(220, container.clientWidth || 340);
            const hPx = Math.max(220, container.clientHeight || 290);
            renderer.setSize(w, hPx, false);
            camera.aspect = w / hPx;
            camera.updateProjectionMatrix();
        }
        resize();

        let ro = null;
        if (typeof ResizeObserver !== 'undefined') {
            ro = new ResizeObserver(resize);
            ro.observe(container);
        }

        let visible = true;
        const onVis = () => { visible = !document.hidden; };
        document.addEventListener('visibilitychange', onVis);

        const clock = new THREE.Clock();
        let rafId = null;

        function animate() {
            rafId = requestAnimationFrame(animate);
            if (!visible) return;
            const dt = Math.min(clock.getDelta(), 0.05);
            kioskCtrl.update(dt, clock.elapsedTime, stateRef.current, audioRef.current);
            renderer.render(scene, camera);
        }
        animate();

        return () => {
            cancelAnimationFrame(rafId);
            document.removeEventListener('visibilitychange', onVis);
            if (ro) ro.disconnect();
            kioskCtrl.dispose();
            renderer.dispose();
        };
    }, []);

    return h('div', {
        ref: containerRef,
        onPointerDown: (e) => {
            dragRef.current = { down: true, startX: e.clientX, lastX: e.clientX, moved: false };
        },
        onPointerMove: (e) => {
            if (!dragRef.current.down) return;
            const dx = e.clientX - dragRef.current.lastX;
            dragRef.current.lastX = e.clientX;
            if (Math.abs(e.clientX - dragRef.current.startX) > 6) {
                dragRef.current.moved = true;
            }
            if (kioskControllerRef.current && Math.abs(dx) > 0) {
                kioskControllerRef.current.addRotationY(dx * 0.012);
            }
        },
        onPointerUp: () => {
            const wasDrag = dragRef.current.moved;
            dragRef.current.down = false;
            if (!wasDrag && onStageTap) onStageTap();
        },
        onPointerLeave: () => { dragRef.current.down = false; },
        title: 'Arrastra para girar en 3D o toca para hablar por micrófono',
        style: { width: '100%', height: '100%', cursor: 'grab', position: 'relative', touchAction: 'none' }
    });
}

function selectBestBrowserVoice() {
    if (!('speechSynthesis' in window)) return null;
    const voices = window.speechSynthesis.getVoices() || [];
    const es = voices.filter((v) => /^es([-_]|$)/i.test(v.lang));
    if (es.length === 0) return null;
    return (
        es.find((v) => /tomas|lorenzo|alonso|alvaro|jorge|natural|neural|online/i.test(v.name)) ||
        es.find((v) => /sabina|dalia|elena|google español/i.test(v.name)) ||
        es[0]
    );
}

/**
 * Pantalla Verde "Escaneá y Pagá con QR" integrada en el Kiosco (igual al video de referencia)
 */
function KioskQrOverlay({ total, qrUrl, onConfirmPaid, onRequestDelivery, onCancelQr }) {
    const qrImgSrc = `https://api.qrserver.com/v1/create-qr-code/?size=210x210&margin=8&data=${encodeURIComponent(
        qrUrl || window.location.origin + '/menu-clasico'
    )}`;

    return h(
        'div',
        {
            style: {
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '18px 16px 14px',
                background: 'linear-gradient(165deg, #0d9f5f 0%, #065f39 60%, #043922 100%)',
                color: '#fff',
                textAlign: 'center'
            }
        },
        h(
            'div',
            null,
            h(
                'div',
                {
                    style: {
                        fontFamily: "'Rajdhani', sans-serif",
                        fontSize: '1.75rem',
                        fontWeight: 800,
                        lineHeight: 1.1,
                        textShadow: '0 2px 10px rgba(0,0,0,0.35)'
                    }
                },
                '¡Escaneá y pagá!'
            ),
            h(
                'div',
                { style: { fontSize: '0.88rem', opacity: 0.92, marginTop: '3px' } },
                'Con tu billetera, WebPay o transferencia'
            )
        ),
        h(
            'div',
            {
                style: {
                    background: '#fff',
                    padding: '12px',
                    borderRadius: '18px',
                    boxShadow: '0 12px 30px rgba(0,0,0,0.4)',
                    margin: '10px 0'
                }
            },
            h('img', {
                src: qrImgSrc,
                alt: 'Código QR de pago RAÍCES',
                style: { width: '176px', height: '176px', display: 'block', borderRadius: '8px' }
            }),
            h(
                'div',
                {
                    style: {
                        color: '#064e2b',
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 900,
                        fontSize: '1.15rem',
                        marginTop: '6px'
                    }
                },
                `TOTAL ${formatearCLP(total)}`
            )
        ),
        h(
            'div',
            { style: { width: '100%', display: 'flex', flexDirection: 'column', gap: '7px' } },
            h(
                'button',
                {
                    type: 'button',
                    onClick: onConfirmPaid,
                    style: {
                        width: '100%',
                        padding: '10px 14px',
                        borderRadius: '12px',
                        border: 'none',
                        background: '#ffd700',
                        color: '#042b17',
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 900,
                        fontSize: '0.82rem',
                        cursor: 'pointer',
                        boxShadow: '0 4px 14px rgba(0,0,0,0.35)'
                    }
                },
                '✅ CONFIRMAR COMPRA AHORA'
            ),
            h(
                'div',
                { style: { display: 'flex', gap: '6px' } },
                h(
                    'button',
                    {
                        type: 'button',
                        onClick: onRequestDelivery,
                        style: {
                            flex: 1,
                            padding: '7px 8px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.55)',
                            background: 'rgba(0,0,0,0.25)',
                            color: '#fff',
                            fontSize: '0.76rem',
                            fontWeight: 700,
                            cursor: 'pointer'
                        }
                    },
                    '🛵 Envío a domicilio'
                ),
                h(
                    'button',
                    {
                        type: 'button',
                        onClick: onCancelQr,
                        style: {
                            padding: '7px 12px',
                            borderRadius: '10px',
                            border: '1px solid rgba(255,255,255,0.35)',
                            background: 'transparent',
                            color: '#fff',
                            fontSize: '0.76rem',
                            cursor: 'pointer'
                        }
                    },
                    'Volver'
                )
            )
        )
    );
}

function RaicesKioskAssistantApp() {
    const [isOpen, setIsOpen] = useState(true);
    const [avatarState, setAvatarState] = useState(AVATAR_STATES.IDLE);
    const [audioLevel, setAudioLevel] = useState(0);
    const [assistantSubtitle, setAssistantSubtitle] = useState('¡Hola, buenas! ¿Qué te puedo ofrecer?');
    const [userSubtitle, setUserSubtitle] = useState('');
    const [cartSnapshot, setCartSnapshot] = useState([]);
    const [qrMode, setQrMode] = useState(null); // { total, qrUrl, metodo }
    const [showTextInput, setShowTextInput] = useState(false);
    const [inputText, setInputText] = useState('');
    const [handsFree, setHandsFree] = useState(true);
    const [gestureSignal, setGestureSignal] = useState(null);
    const [openaiActive, setOpenaiActive] = useState(false);
    const [fullBodyView, setFullBodyView] = useState(false);

    const wsRef = useRef(null);
    const recognitionRef = useRef(null);
    const audioCtxRef = useRef(null);
    const activeSourceRef = useRef(null);
    const rafMeterRef = useRef(null);
    const autoListenTimerRef = useRef(null);
    const greetedOnceRef = useRef(false);

    const handsFreeRef = useRef(handsFree);
    const conversationActiveRef = useRef(true);
    const isSpeakingRef = useRef(false);
    const silentRetriesRef = useRef(0);
    const startListeningFnRef = useRef(null);

    useEffect(() => { handsFreeRef.current = handsFree; }, [handsFree]);

    // Sincronizar el mini-ticket inferior del mostrador con el carrito real de menu-clasico
    const syncCartTicket = useCallback(() => {
        if (window.RaicesMenuBridge) {
            setCartSnapshot(window.RaicesMenuBridge.getCart());
        }
    }, []);

    useEffect(() => {
        syncCartTicket();
        const id = setInterval(syncCartTicket, 700);
        fetch('/api/asistente/status')
            .then((r) => (r.ok ? r.json() : null))
            .then((j) => { if (j && j.openaiActive) setOpenaiActive(true); })
            .catch(() => {});
        return () => clearInterval(id);
    }, [syncCartTicket]);

    const stopAudioMeter = useCallback(() => {
        if (rafMeterRef.current) {
            cancelAnimationFrame(rafMeterRef.current);
            rafMeterRef.current = null;
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
    }, []);

    const finishSpeakingAndMaybeListen = useCallback((expectingReply = true) => {
        isSpeakingRef.current = false;
        stopAudioMeter();
        setAvatarState(AVATAR_STATES.IDLE);

        if (expectingReply && conversationActiveRef.current && handsFreeRef.current) {
            clearTimeout(autoListenTimerRef.current);
            autoListenTimerRef.current = setTimeout(() => {
                if (!isSpeakingRef.current && conversationActiveRef.current && handsFreeRef.current && startListeningFnRef.current) {
                    startListeningFnRef.current(true);
                }
            }, 350);
        }
    }, [stopAudioMeter]);

    /**
     * Reproduce el audio neural humano MP3 (Base64) enviado por Spring Boot y alimenta
     * la mandíbula/boca del personaje 3D con la onda acústica real (AnalyserNode).
     */
    const playNeuralAudioBase64 = useCallback(async (base64Audio, { celebrate = false, expectingReply = true } = {}) => {
        if (!base64Audio) return false;
        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (!AudioCtx) return false;
            if (!audioCtxRef.current) audioCtxRef.current = new AudioCtx();
            if (audioCtxRef.current.state === 'suspended') {
                await audioCtxRef.current.resume();
            }

            if (activeSourceRef.current) {
                try { activeSourceRef.current.stop(); } catch (e) {}
                activeSourceRef.current = null;
            }

            const binary = atob(base64Audio);
            const bytes = new Uint8Array(binary.length);
            for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

            const buffer = await audioCtxRef.current.decodeAudioData(bytes.buffer.slice(0));
            const source = audioCtxRef.current.createBufferSource();
            source.buffer = buffer;
            activeSourceRef.current = source;

            const analyser = audioCtxRef.current.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);
            analyser.connect(audioCtxRef.current.destination);

            const timeData = new Uint8Array(analyser.frequencyBinCount);
            isSpeakingRef.current = true;
            setAvatarState(celebrate ? AVATAR_STATES.CELEBRATING : AVATAR_STATES.TALKING);

            if (celebrate) {
                setTimeout(() => {
                    if (isSpeakingRef.current) setAvatarState(AVATAR_STATES.TALKING);
                }, 850);
            }

            const tickMeter = () => {
                if (!isSpeakingRef.current) return;
                analyser.getByteTimeDomainData(timeData);
                let sum = 0;
                for (let i = 0; i < timeData.length; i++) {
                    const v = (timeData[i] - 128) / 128;
                    sum += v * v;
                }
                const rms = Math.sqrt(sum / timeData.length);
                setAudioLevel(Math.min(1.1, rms * 4.2));
                rafMeterRef.current = requestAnimationFrame(tickMeter);
            };
            tickMeter();

            source.onended = () => {
                activeSourceRef.current = null;
                finishSpeakingAndMaybeListen(expectingReply);
            };

            source.start(0);
            return true;
        } catch (err) {
            return false;
        }
    }, [finishSpeakingAndMaybeListen]);

    /**
     * Habla como humano: usa primero el audio neural del backend (o lo pide a /api/asistente/tts)
     * y si el navegador bloquea autoplay o está sin red usa la mejor voz natural disponible.
     */
    const speakHuman = useCallback(async (text, { audioBase64 = null, celebrate = false, expectingReply = true } = {}) => {
        if (!text) return;
        setAssistantSubtitle(text);
        stopRecognitionSafely();
        isSpeakingRef.current = true;

        let b64 = audioBase64;
        if (!b64) {
            try {
                const r = await fetch('/api/asistente/tts', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ text })
                });
                if (r.ok) {
                    const j = await r.json();
                    b64 = j.audioBase64 || null;
                }
            } catch (e) {}
        }

        if (b64) {
            const ok = await playNeuralAudioBase64(b64, { celebrate, expectingReply });
            if (ok) return;
        }

        if (!('speechSynthesis' in window)) {
            setAvatarState(celebrate ? AVATAR_STATES.CELEBRATING : AVATAR_STATES.TALKING);
            setTimeout(() => finishSpeakingAndMaybeListen(expectingReply), 2200);
            return;
        }

        window.speechSynthesis.cancel();
        const utt = new SpeechSynthesisUtterance(text);
        const v = selectBestBrowserVoice();
        if (v) {
            utt.voice = v;
            utt.lang = v.lang;
        } else {
            utt.lang = 'es-AR';
        }
        utt.rate = 1.04;
        utt.pitch = 1.0;

        utt.onstart = () => setAvatarState(celebrate ? AVATAR_STATES.CELEBRATING : AVATAR_STATES.TALKING);
        utt.onboundary = () => setAudioLevel(0.35 + Math.random() * 0.55);
        utt.onend = () => finishSpeakingAndMaybeListen(expectingReply);
        utt.onerror = () => finishSpeakingAndMaybeListen(expectingReply);
        window.speechSynthesis.speak(utt);
    }, [finishSpeakingAndMaybeListen, playNeuralAudioBase64, stopRecognitionSafely]);

    const openQrPaymentScreen = useCallback(async (metodo = 'MercadoPago') => {
        const bridge = window.RaicesMenuBridge;
        const items = bridge ? bridge.getCart() : [];
        const total = items.reduce((s, i) => s + (Number(i.precio) || 0), 0);
        let qrUrl = window.location.origin + '/menu-clasico';

        if (metodo === 'MercadoPago' && items.length > 0) {
            try {
                const pais = document.getElementById('sucursal-activa')?.value || 'Antofagasta';
                const res = await fetch('/api/pagos/mercadopago', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        cliente: { nombre: 'Cliente Kiosco', direccion: 'Mostrador RAÍCES', telefono: 'Kiosco' },
                        items,
                        origen: 'Kiosco 3D QR',
                        pais
                    })
                });
                if (res.ok) {
                    const link = (await res.text()).trim();
                    if (link.startsWith('http')) qrUrl = link;
                }
            } catch (e) {}
        }

        setQrMode({ total, qrUrl, metodo });
    }, []);

    const handleAssistantResponse = useCallback(async (data) => {
        if (!data) return;
        if (data.type === 'STATE_CHANGE' && data.state) {
            setAvatarState(data.state);
            return;
        }

        if (data.aiEngine === 'openai') {
            setOpenaiActive(true);
        }
        if (data.gesture) {
            setGestureSignal({ type: data.gesture, ts: Date.now() });
        }

        const bridge = window.RaicesMenuBridge;
        const act = data.action;

        if (act === 'ADD_ITEMS' && Array.isArray(data.items)) {
            if (bridge) bridge.addItems(data.items);
            syncCartTicket();
        } else if (act === 'ADD_TO_CART' && data.product) {
            if (bridge) bridge.addItems([data.product]);
            syncCartTicket();
        } else if (act === 'REMOVE_ITEM' && typeof data.removeIndex === 'number') {
            if (bridge) bridge.removeItem(data.removeIndex);
            syncCartTicket();
        } else if (act === 'CLEAR_CART') {
            if (bridge) bridge.clearCart();
            setQrMode(null);
            syncCartTicket();
        } else if (act === 'OPEN_CART') {
            if (bridge) bridge.openCart();
        } else if (act === 'CLOSE_CART') {
            if (bridge) bridge.closeCart();
        } else if (act === 'SHOW_QR_PAYMENT') {
            await openQrPaymentScreen(data.paymentMethod || 'MercadoPago');
        } else if (act === 'CLOSE_QR') {
            setQrMode(null);
        } else if (act === 'FILTER_CATEGORY' && data.category) {
            if (bridge) bridge.filterCategory(data.category);
        } else if (act === 'HIGHLIGHT_PRODUCT' && data.product?.id) {
            if (bridge) bridge.highlightProduct(data.product.id);
        } else if (act === 'FILL_CHECKOUT' && data.checkoutData) {
            if (bridge) bridge.fillCheckoutFields(data.checkoutData);
        } else if (act === 'SUBMIT_ORDER') {
            setQrMode(null);
            if (bridge) {
                const od = data.orderData || {};
                await bridge.submitOrder({
                    nombre: od.nombre || 'Cliente Kiosco',
                    direccion: od.direccion || 'Retiro en Mostrador RAÍCES',
                    telefono: od.telefono || 'Mostrador',
                    medioPago: od.medioPago || 'Efectivo'
                });
                syncCartTicket();
            }
        }

        if (data.text) {
            const celebrate = data.state === 'CELEBRATING' || act === 'ADD_ITEMS' || act === 'SUBMIT_ORDER';
            await speakHuman(data.text, {
                audioBase64: data.audioBase64 || null,
                celebrate,
                expectingReply: data.expectingReply !== false
            });
        }
    }, [openQrPaymentScreen, speakHuman, syncCartTicket]);

    // Conexión WebSocket con Spring Boot (/ws/asistente)
    useEffect(() => {
        let unmounted = false;
        let retryTimer = null;
        let attempt = 0;

        function connect() {
            if (unmounted) return;
            const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            try {
                const ws = new WebSocket(`${proto}//${window.location.host}/ws/asistente`);
                wsRef.current = ws;

                ws.onopen = () => { attempt = 0; };
                ws.onmessage = (ev) => {
                    if (unmounted) return;
                    try { handleAssistantResponse(JSON.parse(ev.data)); } catch (e) {}
                };
                ws.onclose = () => {
                    if (unmounted) return;
                    retryTimer = setTimeout(connect, Math.min(6000, 1200 * Math.pow(1.5, attempt++)));
                };
                ws.onerror = () => ws.close();
            } catch (e) {}
        }

        connect();
        return () => {
            unmounted = true;
            clearTimeout(retryTimer);
            stopRecognitionSafely();
            stopAudioMeter();
            if (wsRef.current) wsRef.current.close();
        };
    }, [handleAssistantResponse, stopAudioMeter, stopRecognitionSafely]);

    const sendUtteranceToBrain = useCallback(async (rawText, { silentUserBubble = false } = {}) => {
        const txt = (rawText || '').trim();
        if (!txt) return;

        if (!silentUserBubble) {
            setUserSubtitle(txt);
        }
        setAvatarState(AVATAR_STATES.THINKING);
        setGestureSignal({ type: 'POS_TAP', ts: Date.now() });

        const bridge = window.RaicesMenuBridge;
        const payload = {
            sessionId: CLIENT_SESSION_ID,
            type: 'USER_MESSAGE',
            text: txt,
            sucursal: document.getElementById('sucursal-activa')?.value || 'Antofagasta',
            cart: bridge ? bridge.getCart() : [],
            customer: bridge ? bridge.getCustomer() : {}
        };

        if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            wsRef.current.send(JSON.stringify(payload));
            return;
        }

        try {
            const res = await fetch('/api/asistente/conversar', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });
            if (res.ok) {
                await handleAssistantResponse(await res.json());
            }
        } catch (e) {
            setAvatarState(AVATAR_STATES.IDLE);
        }
    }, [handleAssistantResponse]);

    const startListening = useCallback((isAutoReopen = false) => {
        const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SR) {
            if (!isAutoReopen) setShowTextInput(true);
            return;
        }

        stopRecognitionSafely();
        if (!isAutoReopen) {
            if ('speechSynthesis' in window) window.speechSynthesis.cancel();
            if (activeSourceRef.current) {
                try { activeSourceRef.current.stop(); } catch (e) {}
                activeSourceRef.current = null;
            }
            isSpeakingRef.current = false;
        }

        conversationActiveRef.current = true;
        const rec = new SR();
        rec.lang = 'es-CL';
        rec.continuous = false;
        rec.interimResults = true;
        recognitionRef.current = rec;

        let capturedFinal = '';

        rec.onstart = () => {
            setAvatarState(AVATAR_STATES.LISTENING);
        };

        rec.onresult = (ev) => {
            let interim = '';
            let finalPiece = '';
            for (let i = ev.resultIndex; i < ev.results.length; i++) {
                const tr = ev.results[i][0].transcript;
                if (ev.results[i].isFinal) finalPiece += tr;
                else interim += tr;
            }
            if (interim) setUserSubtitle(interim);
            if (finalPiece.trim()) {
                capturedFinal = finalPiece.trim();
                silentRetriesRef.current = 0;
                sendUtteranceToBrain(capturedFinal);
            }
        };

        rec.onerror = (ev) => {
            if (ev.error === 'no-speech' && isAutoReopen && silentRetriesRef.current < 2 && handsFreeRef.current && conversationActiveRef.current) {
                silentRetriesRef.current += 1;
                autoListenTimerRef.current = setTimeout(() => {
                    if (!isSpeakingRef.current && conversationActiveRef.current && handsFreeRef.current) {
                        startListening(true);
                    }
                }, 350);
                return;
            }
            if (ev.error === 'not-allowed') conversationActiveRef.current = false;
            setAvatarState(AVATAR_STATES.IDLE);
        };

        rec.onend = () => {
            if (!capturedFinal && !isSpeakingRef.current) {
                setAvatarState((prev) => (prev === AVATAR_STATES.LISTENING ? AVATAR_STATES.IDLE : prev));
            }
        };

        try {
            rec.start();
        } catch (e) {
            setAvatarState(AVATAR_STATES.IDLE);
        }
    }, [sendUtteranceToBrain, stopRecognitionSafely]);

    useEffect(() => { startListeningFnRef.current = startListening; }, [startListening]);

    const toggleMicrophone = useCallback(() => {
        setIsOpen(true);
        // Desbloquear AudioContext en el gesto del usuario para audio neural cristalino
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (AudioCtx && !audioCtxRef.current) audioCtxRef.current = new AudioCtx();
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume().catch(() => {});
        }

        if (avatarState === AVATAR_STATES.LISTENING) {
            conversationActiveRef.current = false;
            stopRecognitionSafely();
            setAvatarState(AVATAR_STATES.IDLE);
            return;
        }
        silentRetriesRef.current = 0;
        startListening(false);
    }, [avatarState, startListening, stopRecognitionSafely]);

    // Eventos globales: Saludo humano automático al abrir el kiosco + reacciones al carrito
    useEffect(() => {
        const onKioskGreet = () => {
            if (greetedOnceRef.current) return;
            greetedOnceRef.current = true;
            setIsOpen(true);
            setHandsFree(true);
            conversationActiveRef.current = true;
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            if (AudioCtx && !audioCtxRef.current) audioCtxRef.current = new AudioCtx();
            if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
                audioCtxRef.current.resume().catch(() => {});
            }
            sendUtteranceToBrain('__saludo_inicial__', { silentUserBubble: true });
        };

        const onCartAddedManual = (e) => {
            syncCartTicket();
            const nombre = e.detail?.nombre || 'eso';
            setGestureSignal({ type: 'POS_TAP', ts: Date.now() });
            speakHuman(`¡Listo, ya te sumé ${nombre} al carrito!`, {
                celebrate: true,
                expectingReply: conversationActiveRef.current
            });
        };

        const onVoiceStart = () => {
            setIsOpen(true);
            setHandsFree(true);
            startListening(false);
        };

        const onCheckoutVoice = () => {
            setIsOpen(true);
            setHandsFree(true);
            sendUtteranceToBrain('¿Y cómo pago?');
        };

        window.addEventListener('raices:kiosk-greet', onKioskGreet);
        window.addEventListener('raices:cart-item-added', onCartAddedManual);
        window.addEventListener('raices:assistant-voice-start', onVoiceStart);
        window.addEventListener('raices:assistant-checkout-voice', onCheckoutVoice);
        window.addEventListener('raices:assistant-toggle', () => setIsOpen((v) => !v));

        return () => {
            window.removeEventListener('raices:kiosk-greet', onKioskGreet);
            window.removeEventListener('raices:cart-item-added', onCartAddedManual);
            window.removeEventListener('raices:assistant-voice-start', onVoiceStart);
            window.removeEventListener('raices:assistant-checkout-voice', onCheckoutVoice);
        };
    }, [sendUtteranceToBrain, speakHuman, startListening, syncCartTicket]);

    const totalCarrito = cartSnapshot.reduce((s, i) => s + (Number(i.precio) || 0), 0);

    // Agrupar ítems para el ticket limpio estilo mostrador
    const groupedTicketItems = [];
    const mapTicket = new Map();
    cartSnapshot.forEach((it) => {
        const k = it.nombre;
        if (!mapTicket.has(k)) {
            const obj = { nombre: it.nombre, cantidad: 1, subtotal: Number(it.precio) || 0 };
            mapTicket.set(k, obj);
            groupedTicketItems.push(obj);
        } else {
            const obj = mapTicket.get(k);
            obj.cantidad += 1;
            obj.subtotal += Number(it.precio) || 0;
        }
    });

    if (!isOpen) {
        return h(
            'button',
            {
                type: 'button',
                onClick: () => setIsOpen(true),
                style: {
                    position: 'fixed',
                    bottom: '90px',
                    right: '16px',
                    zIndex: 9995,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '11px 18px',
                    borderRadius: '999px',
                    border: '2px solid #ffd700',
                    background: 'linear-gradient(135deg, #0d6e3f, #052917)',
                    color: '#fff',
                    boxShadow: '0 10px 28px rgba(0,0,0,0.85)',
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    cursor: 'pointer'
                }
            },
            h('span', {
                style: {
                    width: '11px',
                    height: '11px',
                    borderRadius: '50%',
                    background: '#22ffa3',
                    boxShadow: '0 0 10px #22ffa3'
                }
            }),
            h('span', null, 'HABLAR CON GM GUARDIÁN'),
            h('i', { className: 'bi bi-mic-fill', style: { color: '#ffd700' } })
        );
    }

    return h(
        'aside',
        {
            'aria-label': 'Kiosco Inteligente 3D RAÍCES',
            style: {
                position: 'fixed',
                bottom: '84px',
                right: '14px',
                width: 'min(365px, calc(100vw - 24px))',
                height: 'min(545px, calc(100vh - 98px))',
                zIndex: 9996,
                display: 'flex',
                flexDirection: 'column',
                borderRadius: '22px',
                overflow: 'hidden',
                border: '2px solid rgba(255, 215, 0, 0.75)',
                background: '#102119',
                boxShadow: '0 22px 55px rgba(0,0,0,0.92)'
            }
        },

        // Barra superior minimalista del Kiosco
        h(
            'div',
            {
                style: {
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '7px 11px',
                    background: 'rgba(3, 18, 10, 0.94)',
                    borderBottom: '1px solid rgba(255,215,0,0.25)'
                }
            },
            h(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: '7px' } },
                h('span', {
                    style: {
                        width: '9px',
                        height: '9px',
                        borderRadius: '50%',
                        background:
                            avatarState === AVATAR_STATES.LISTENING
                                ? '#00f0ff'
                                : avatarState === AVATAR_STATES.TALKING
                                ? '#ffd700'
                                : '#22ffa3',
                        boxShadow: '0 0 8px currentColor'
                    }
                }),
                h(
                    'span',
                    {
                        style: {
                            fontFamily: "'Orbitron', sans-serif",
                            fontSize: '0.68rem',
                            fontWeight: 800,
                            color: '#fff',
                            letterSpacing: '0.5px'
                        }
                    },
                    avatarState === AVATAR_STATES.LISTENING
                        ? 'TE ESCUCHO...'
                        : avatarState === AVATAR_STATES.TALKING
                        ? 'GM GUARDIÁN · HABLANDO'
                        : 'GM GUARDIÁN DE RAÍCES'
                )
            ),
            h(
                'div',
                { style: { display: 'flex', alignItems: 'center', gap: '6px' } },
                h(
                    'span',
                    {
                        title: openaiActive
                            ? 'Cerebro y voz OpenAI conectados'
                            : 'Agrega OPENAI_API_KEY en .env para activar OpenAI',
                        style: {
                            padding: '2px 7px',
                            borderRadius: '999px',
                            fontSize: '0.58rem',
                            fontFamily: "'Orbitron', sans-serif",
                            fontWeight: 800,
                            border: openaiActive ? '1px solid #22ffa3' : '1px solid rgba(255,215,0,0.45)',
                            background: openaiActive ? 'rgba(34,255,163,0.16)' : 'rgba(255,215,0,0.10)',
                            color: openaiActive ? '#22ffa3' : '#ffd700'
                        }
                    },
                    openaiActive ? 'OPENAI ON' : 'IA LOCAL'
                ),
                h(
                    'button',
                    {
                        type: 'button',
                        onClick: () => setFullBodyView((v) => !v),
                        title: 'Alternar entre Mostrador y Cuerpo Entero 360°',
                        style: {
                            background: fullBodyView ? 'rgba(0,240,255,0.2)' : 'rgba(255,255,255,0.08)',
                            border: fullBodyView ? '1px solid #00f0ff' : '1px solid rgba(255,255,255,0.2)',
                            color: fullBodyView ? '#00f0ff' : '#ddd',
                            borderRadius: '8px',
                            padding: '2px 7px',
                            fontSize: '0.62rem',
                            fontFamily: "'Orbitron', sans-serif",
                            fontWeight: 700,
                            cursor: 'pointer'
                        }
                    },
                    fullBodyView ? 'BARRA' : '360°'
                ),
                h(
                    'button',
                    {
                        type: 'button',
                        onClick: () => setShowTextInput((s) => !s),
                        title: 'Mostrar u ocultar teclado opcional',
                        style: {
                            background: 'rgba(255,255,255,0.08)',
                            border: '1px solid rgba(255,255,255,0.2)',
                            color: '#ddd',
                            borderRadius: '8px',
                            padding: '2px 7px',
                            fontSize: '0.72rem',
                            cursor: 'pointer'
                        }
                    },
                    h('i', { className: 'bi bi-keyboard' })
                ),
                h(
                    'button',
                    {
                        type: 'button',
                        onClick: () => setIsOpen(false),
                        title: 'Minimizar kiosco',
                        style: {
                            background: 'transparent',
                            border: 'none',
                            color: '#fff',
                            fontSize: '1.05rem',
                            cursor: 'pointer',
                            padding: '0 4px'
                        }
                    },
                    '✕'
                )
            )
        ),

        // CUERPO CENTRAL: o Pantalla QR Verde ("¡Escaneá y pagá!") o Escena 3D del Mostrador + Ticket Inferior
        qrMode
            ? h(KioskQrOverlay, {
                  total: qrMode.total,
                  qrUrl: qrMode.qrUrl,
                  onConfirmPaid: () => sendUtteranceToBrain('Listo, confirmar compra'),
                  onRequestDelivery: () => sendUtteranceToBrain('Quiero envío a domicilio'),
                  onCancelQr: () => {
                      setQrMode(null);
                      sendUtteranceToBrain('Seguir comprando');
                  }
              })
            : h(
                  React.Fragment,
                  null,
                  // 1. VENTANA 3D DEL MOSTRADOR + SUBTÍTULOS FLOTANTES EN VIVO (IGUAL AL VIDEO)
                  h(
                      'div',
                      { style: { flex: 1, position: 'relative', minHeight: '275px', overflow: 'hidden' } },
                      h(Kiosk3DStage, {
                          avatarState,
                          audioLevel,
                          lastGestureSignal: gestureSignal,
                          fullBodyView,
                          onStageTap: toggleMicrophone
                      }),

                      // Subtítulo de lo que dice el cliente arriba
                      userSubtitle
                          ? h(
                                'div',
                                {
                                    style: {
                                        position: 'absolute',
                                        top: '10px',
                                        left: '12px',
                                        right: '12px',
                                        textAlign: 'center',
                                        pointerEvents: 'none'
                                    }
                                },
                                h(
                                    'span',
                                    {
                                        style: {
                                            display: 'inline-block',
                                            padding: '4px 12px',
                                            borderRadius: '999px',
                                            background: 'rgba(0, 20, 28, 0.78)',
                                            border: '1px solid rgba(0, 240, 255, 0.6)',
                                            color: '#8ff7ff',
                                            fontFamily: "'Rajdhani', sans-serif",
                                            fontWeight: 700,
                                            fontSize: '0.96rem'
                                        }
                                    },
                                    `“${userSubtitle}”`
                                )
                            )
                          : null,

                      // Subtítulo vivo de Rafa (estilo subtítulo cinematográfico limpio sobre el mostrador)
                      assistantSubtitle
                          ? h(
                                'div',
                                {
                                    style: {
                                        position: 'absolute',
                                        bottom: '50px',
                                        left: '12px',
                                        right: '12px',
                                        textAlign: 'center',
                                        pointerEvents: 'none'
                                    }
                                },
                                h(
                                    'span',
                                    {
                                        style: {
                                            display: 'inline-block',
                                            padding: '6px 12px',
                                            borderRadius: '12px',
                                            background: 'rgba(0, 0, 0, 0.68)',
                                            color: '#ffffff',
                                            fontFamily: "'Rajdhani', sans-serif",
                                            fontWeight: 800,
                                            fontSize: '1.12rem',
                                            lineHeight: 1.22,
                                            textShadow: '0 2px 6px #000'
                                        }
                                    },
                                    assistantSubtitle
                                )
                            )
                          : null,

                      // Botón flotante de Micrófono Manos Libres
                      h(
                          'button',
                          {
                              type: 'button',
                              onClick: toggleMicrophone,
                              style: {
                                  position: 'absolute',
                                  bottom: '10px',
                                  left: '50%',
                                  transform: 'translateX(-50%)',
                                  borderRadius: '999px',
                                  padding: '7px 18px',
                                  border:
                                      avatarState === AVATAR_STATES.LISTENING
                                          ? '2px solid #00f0ff'
                                          : '2px solid #ffd700',
                                  background:
                                      avatarState === AVATAR_STATES.LISTENING
                                          ? 'rgba(0, 195, 255, 0.28)'
                                          : 'rgba(6, 32, 18, 0.88)',
                                  color: '#fff',
                                  boxShadow:
                                      avatarState === AVATAR_STATES.LISTENING
                                          ? '0 0 18px rgba(0,240,255,0.65)'
                                          : '0 4px 14px rgba(0,0,0,0.6)',
                                  fontFamily: "'Orbitron', sans-serif",
                                  fontSize: '0.72rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  whiteSpace: 'nowrap'
                              }
                          },
                          h('i', {
                              className:
                                  avatarState === AVATAR_STATES.LISTENING
                                      ? 'bi bi-soundwave me-2'
                                      : 'bi bi-mic-fill me-2',
                              style: { color: avatarState === AVATAR_STATES.LISTENING ? '#00f0ff' : '#ffd700' }
                          }),
                          avatarState === AVATAR_STATES.LISTENING ? 'ESCUCHÁNDOTE...' : 'HABLAME AQUÍ'
                      )
                  ),

                  // 2. TICKET DE CARRITO DEBAJO DEL MOSTRADOR (IDÉNTICO AL DISEÑO DEL KIOSCO DEL VIDEO)
                  h(
                      'div',
                      {
                          style: {
                              background: '#f7f9f7',
                              color: '#14261c',
                              padding: '10px 14px 12px',
                              borderTop: '3px solid #ffd700'
                          }
                      },
                      groupedTicketItems.length === 0
                          ? h(
                                'div',
                                {
                                    style: {
                                        textAlign: 'center',
                                        color: '#6c7a72',
                                        fontFamily: "'Rajdhani', sans-serif",
                                        fontWeight: 700,
                                        fontSize: '1.02rem',
                                        padding: '8px 0'
                                    }
                                },
                                'El carrito está vacío · Pedime por voz tu batido o shot'
                            )
                          : h(
                                'div',
                                {
                                    style: {
                                        maxHeight: '78px',
                                        overflowY: 'auto',
                                        marginBottom: '8px',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '4px'
                                    }
                                },
                                groupedTicketItems.map((item) =>
                                    h(
                                        'div',
                                        {
                                            key: item.nombre,
                                            style: {
                                                display: 'flex',
                                                justifyContent: 'space-between',
                                                alignItems: 'center',
                                                fontSize: '0.94rem',
                                                fontFamily: "'Rajdhani', sans-serif",
                                                fontWeight: 700,
                                                borderBottom: '1px dashed #d5ded8',
                                                paddingBottom: '2px'
                                            }
                                        },
                                        h('span', null, `🥤 ${item.cantidad > 1 ? item.cantidad + 'x ' : ''}${item.nombre}`),
                                        h('span', { style: { fontWeight: 800, color: '#0b5d34' } }, formatearCLP(item.subtotal))
                                    )
                                )
                            ),

                      h(
                          'div',
                          {
                              style: {
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  paddingTop: '4px'
                              }
                          },
                          h(
                              'div',
                              null,
                              h(
                                  'span',
                                  {
                                      style: {
                                          fontFamily: "'Orbitron', sans-serif",
                                          fontSize: '0.72rem',
                                          fontWeight: 800,
                                          color: '#52635a',
                                          marginRight: '8px'
                                      }
                                  },
                                  'TOTAL'
                              ),
                              h(
                                  'span',
                                  {
                                      style: {
                                          fontFamily: "'Orbitron', sans-serif",
                                          fontSize: '1.18rem',
                                          fontWeight: 900,
                                          color: '#083d22'
                                      }
                                  },
                                  formatearCLP(totalCarrito)
                              )
                          ),
                          groupedTicketItems.length > 0
                              ? h(
                                    'button',
                                    {
                                        type: 'button',
                                        onClick: () => sendUtteranceToBrain('¿Y cómo pago?'),
                                        style: {
                                            borderRadius: '10px',
                                            padding: '6px 13px',
                                            border: 'none',
                                            background: '#0d8a50',
                                            color: '#fff',
                                            fontFamily: "'Orbitron', sans-serif",
                                            fontSize: '0.72rem',
                                            fontWeight: 800,
                                            cursor: 'pointer'
                                        }
                                    },
                                    'PAGAR CON QR'
                                )
                              : null
                      )
                  )
              ),

        // Teclado opcional plegable (solo si alguien está sin micrófono)
        showTextInput
            ? h(
                  'form',
                  {
                      onSubmit: (e) => {
                          e.preventDefault();
                          if (!inputText.trim()) return;
                          sendUtteranceToBrain(inputText);
                          setInputText('');
                      },
                      style: {
                          display: 'flex',
                          gap: '6px',
                          padding: '8px 10px',
                          background: '#06150d',
                          borderTop: '1px solid rgba(255,215,0,0.25)'
                      }
                  },
                  h('input', {
                      type: 'text',
                      value: inputText,
                      onChange: (e) => setInputText(e.target.value),
                      placeholder: 'Escribile a GM Guardián de Raíces...',
                      style: {
                          flex: 1,
                          borderRadius: '8px',
                          border: '1px solid rgba(255,215,0,0.4)',
                          background: 'rgba(255,255,255,0.08)',
                          color: '#fff',
                          padding: '6px 10px',
                          fontSize: '0.88rem',
                          outline: 'none'
                      }
                  }),
                  h(
                      'button',
                      {
                          type: 'submit',
                          style: {
                              borderRadius: '8px',
                              border: 'none',
                              background: '#ffd700',
                              color: '#042614',
                              fontWeight: 800,
                              padding: '0 12px',
                              cursor: 'pointer'
                          }
                      },
                      h('i', { className: 'bi bi-send-fill' })
                  )
              )
            : null
    );
}

(function mountRaicesKiosk3D() {
    const host = document.getElementById('raices-assistant-3d-root');
    if (!host) return;
    const root = createRoot(host);
    root.render(h(RaicesKioskAssistantApp));
})();
