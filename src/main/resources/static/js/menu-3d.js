import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

(function initHeroLiveParrot() {
    const canvas = document.getElementById('hero-parrot-canvas');
    const stage = document.getElementById('hero-parrot-stage');
    if (!canvas || !stage) return;

    const renderer = new THREE.WebGLRenderer({
        canvas: canvas,
        alpha: true,
        antialias: true,
        powerPreference: 'high-performance'
    });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;

    const scene = new THREE.Scene();

    // Cámara calibrada para que (0,0,0) proyecte exactamente en las garras sobre la barra superior de la E
    const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 20);
    camera.position.set(0, 0.20, 2.35);
    camera.lookAt(0, 0.20, 0);

    function resizeParrotCanvas() {
        const rect = stage.getBoundingClientRect();
        const w = Math.max(220, Math.round(rect.width || 320));
        const h = Math.max(220, Math.round(rect.height || 320));
        renderer.setSize(w, h, false);
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
    }
    resizeParrotCanvas();
    window.addEventListener('resize', resizeParrotCanvas, { passive: true });
    if (typeof ResizeObserver !== 'undefined') {
        new ResizeObserver(resizeParrotCanvas).observe(stage);
    }

    // Iluminación cinematográfica cálida + esmeralda botánica
    const hemiLight = new THREE.HemisphereLight(0xfffbeb, 0x1c1917, 1.55);
    scene.add(hemiLight);

    const keyLight = new THREE.DirectionalLight(0xfff4d6, 2.55);
    keyLight.position.set(1.6, 2.4, 2.8);
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 1.45);
    fillLight.position.set(-1.8, 1.2, 2.2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x34d399, 1.15);
    rimLight.position.set(0.4, -1.2, -1.8);
    scene.add(rimLight);

    // Grupo raíz anclado en las garras (0,0,0 = borde superior de la letra E)
    const perchGroup = new THREE.Group();
    perchGroup.position.set(0, 0, 0);
    perchGroup.rotation.y = -0.18;
    scene.add(perchGroup);

    // Sombra de contacto suave sobre el pelaje dorado de la letra E
    const shadowGeo = new THREE.PlaneGeometry(0.32, 0.14);
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 64;
    const sctx = shadowCanvas.getContext('2d');
    const sgrad = sctx.createRadialGradient(64, 32, 4, 64, 32, 56);
    sgrad.addColorStop(0, 'rgba(15, 8, 2, 0.72)');
    sgrad.addColorStop(0.55, 'rgba(20, 10, 3, 0.32)');
    sgrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
    sctx.fillStyle = sgrad;
    sctx.fillRect(0, 0, 128, 64);
    const shadowTex = new THREE.CanvasTexture(shadowCanvas);
    const shadowMat = new THREE.MeshBasicMaterial({
        map: shadowTex,
        transparent: true,
        depthWrite: false
    });
    const contactShadow = new THREE.Mesh(shadowGeo, shadowMat);
    contactShadow.rotation.x = -Math.PI * 0.46;
    contactShadow.position.set(0, -0.012, 0.02);
    scene.add(contactShadow);

    // Generador de texturas de plumas de Guacamaya Roja (Ara macao)
    function makeFeatherTexture(type) {
        const c = document.createElement('canvas');
        c.width = 256;
        c.height = 96;
        const ctx = c.getContext('2d');
        ctx.clearRect(0, 0, 256, 96);

        // Silueta de la pluma
        ctx.save();
        ctx.beginPath();
        ctx.moveTo(4, 48);
        ctx.bezierCurveTo(38, 8, 165, 6, 250, 46);
        ctx.bezierCurveTo(175, 90, 42, 88, 4, 48);
        ctx.closePath();
        ctx.clip();

        const g = ctx.createLinearGradient(0, 0, 256, 0);
        if (type === 'scarlet') {
            g.addColorStop(0, '#8f0704');
            g.addColorStop(0.28, '#d9140d');
            g.addColorStop(0.75, '#f22618');
            g.addColorStop(1, '#b00c07');
        } else if (type === 'gold_green') {
            g.addColorStop(0, '#c75c00');
            g.addColorStop(0.22, '#f59e0b');
            g.addColorStop(0.62, '#fbbf24');
            g.addColorStop(0.84, '#16a34a');
            g.addColorStop(1, '#065f46');
        } else if (type === 'royal_blue') {
            g.addColorStop(0, '#0f766e');
            g.addColorStop(0.18, '#0284c7');
            g.addColorStop(0.55, '#1d4ed8');
            g.addColorStop(0.88, '#1e3a8a');
            g.addColorStop(1, '#0f172a');
        } else {
            // Primaria larga azul cobalto con reflejo escarlata/dorado interior
            g.addColorStop(0, '#155e75');
            g.addColorStop(0.15, '#0369a1');
            g.addColorStop(0.5, '#1d4ed8');
            g.addColorStop(0.85, '#172554');
            g.addColorStop(1, '#090d16');
        }
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, 256, 96);

        // Sombreado transversal para volumen 3D de cada pluma
        const vg = ctx.createLinearGradient(0, 6, 0, 90);
        vg.addColorStop(0, 'rgba(255,255,255,0.22)');
        vg.addColorStop(0.48, 'rgba(0,0,0,0.0)');
        vg.addColorStop(0.52, 'rgba(20,10,5,0.35)');
        vg.addColorStop(1, 'rgba(0,0,0,0.45)');
        ctx.fillStyle = vg;
        ctx.fillRect(0, 0, 256, 96);

        // Barbas microscópicas diagonales
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.18)';
        ctx.lineWidth = 1;
        for (let x = 14; x < 246; x += 4) {
            ctx.beginPath();
            ctx.moveTo(x, 48);
            ctx.lineTo(x + 14, 10);
            ctx.moveTo(x, 48);
            ctx.lineTo(x + 12, 86);
            ctx.stroke();
        }

        // Raquis central (eje de la pluma)
        ctx.strokeStyle = type === 'scarlet' ? '#5c0503' : '#1e1b18';
        ctx.lineWidth = 2.4;
        ctx.beginPath();
        ctx.moveTo(4, 48);
        ctx.quadraticCurveTo(130, 44, 246, 46);
        ctx.stroke();

        ctx.restore();

        const tex = new THREE.CanvasTexture(c);
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.needsUpdate = true;
        return tex;
    }

    const featherMats = {
        scarlet: new THREE.MeshStandardMaterial({
            map: makeFeatherTexture('scarlet'),
            roughness: 0.72,
            metalness: 0.06,
            side: THREE.DoubleSide,
            alphaTest: 0.12,
            transparent: true
        }),
        goldGreen: new THREE.MeshStandardMaterial({
            map: makeFeatherTexture('gold_green'),
            roughness: 0.68,
            metalness: 0.08,
            side: THREE.DoubleSide,
            alphaTest: 0.12,
            transparent: true
        }),
        royalBlue: new THREE.MeshStandardMaterial({
            map: makeFeatherTexture('royal_blue'),
            roughness: 0.64,
            metalness: 0.10,
            side: THREE.DoubleSide,
            alphaTest: 0.12,
            transparent: true
        }),
        primaryBlue: new THREE.MeshStandardMaterial({
            map: makeFeatherTexture('primary'),
            roughness: 0.60,
            metalness: 0.12,
            side: THREE.DoubleSide,
            alphaTest: 0.12,
            transparent: true
        })
    };

    // Geometría curvada 3D para cada pluma individual (con arco natural y torsión suave)
    function createCurvedFeatherGeometry(length, width, archY, curveZ) {
        const geo = new THREE.PlaneGeometry(length, width, 10, 3);
        geo.translate(length * 0.48, 0, 0);
        const pos = geo.attributes.position;
        for (let i = 0; i < pos.count; i++) {
            const x = pos.getX(i);
            const y = pos.getY(i);
            const t = Math.max(0, Math.min(1, x / length));
            const camber = (1 - Math.pow((y / (width * 0.5)), 2)) * 0.008;
            const zOff = Math.sin(t * Math.PI) * archY + Math.pow(t, 1.7) * curveZ + camber;
            const yOff = -Math.pow(t, 1.8) * width * 0.22;
            pos.setY(i, y + yOff);
            pos.setZ(i, zOff);
        }
        geo.computeVertexNormals();
        return geo;
    }

    const baseFeatherGeo = createCurvedFeatherGeometry(1.0, 0.24, 0.03, -0.04);

    // Construcción de Ala 3D Articulada de 3 Segmentos (Húmero -> Cúbito -> Mano/Primarias)
    function buildArticulatedMacawWing(side) {
        // side: -1 = ala derecha del loro (izquierda en pantalla), +1 = ala izquierda del loro (derecha en pantalla)
        const root = new THREE.Group();
        const shoulder = new THREE.Group();
        root.add(shoulder);

        const elbow = new THREE.Group();
        elbow.position.set(side * 0.135, 0.015, -0.012);
        shoulder.add(elbow);

        const wrist = new THREE.Group();
        wrist.position.set(side * 0.165, 0.01, -0.015);
        elbow.add(wrist);

        const primaryFeathers = [];
        const secondaryFeathers = [];

        function addFeather(parent, mat, len, wid, x, y, z, rotZ, rotY, rotX) {
            const mesh = new THREE.Mesh(baseFeatherGeo, mat);
            mesh.scale.set(side * len, wid / 0.24, 1);
            mesh.position.set(x, y, z);
            mesh.rotation.order = 'ZYX';
            mesh.rotation.set(rotX, rotY, rotZ);
            parent.add(mesh);
            return mesh;
        }

        // 1. Plumas Remeras Primarias (11 plumas largas azul real en la mano/muñeca)
        for (let i = 0; i < 11; i++) {
            const f = i / 10;
            const len = 0.27 + Math.sin(f * Math.PI * 0.82) * 0.21;
            const wid = 0.058 + (1 - f) * 0.018;
            const baseAngle = side * (-0.58 + f * 1.02);
            const m = addFeather(
                wrist,
                featherMats.primaryBlue,
                len,
                wid,
                side * (f * 0.045),
                -0.015 + f * 0.018,
                -0.022 - i * 0.0025,
                baseAngle,
                side * (-0.08 + f * 0.12),
                0.08
            );
            m.userData = { baseRotZ: baseAngle, idx: i, frac: f };
            primaryFeathers.push(m);
        }

        // 2. Plumas Remeras Secundarias (9 plumas azul cobalto/turquesa en el antebrazo)
        for (let i = 0; i < 9; i++) {
            const f = i / 8;
            const len = 0.23 + Math.sin(f * Math.PI) * 0.05;
            const wid = 0.068;
            const baseAngle = side * (-0.98 + f * 0.36);
            const m = addFeather(
                elbow,
                featherMats.royalBlue,
                len,
                wid,
                side * (0.015 + f * 0.145),
                -0.01,
                -0.016 - i * 0.002,
                baseAngle,
                side * -0.06,
                0.10
            );
            m.userData = { baseRotZ: baseAngle, frac: f };
            secondaryFeathers.push(m);
        }

        // 3. Coberteras Medianas Amarillas-Oro con Puntas Verde Esmeralda (2 hileras densas)
        for (let row = 0; row < 2; row++) {
            const count = row === 0 ? 10 : 8;
            for (let i = 0; i < count; i++) {
                const f = i / (count - 1);
                const len = (row === 0 ? 0.165 : 0.135) + Math.sin(f * Math.PI) * 0.035;
                const wid = 0.064;
                const baseAngle = side * (-0.92 + f * 0.54);
                addFeather(
                    elbow,
                    featherMats.goldGreen,
                    len,
                    wid,
                    side * (0.005 + f * 0.155),
                    0.012 + row * 0.018,
                    -0.002 + row * 0.007 + i * 0.001,
                    baseAngle,
                    side * -0.04,
                    0.12
                );
            }
        }
        // Coberteras Amarillo-Esmeralda sobre la muñeca
        for (let i = 0; i < 6; i++) {
            const f = i / 5;
            addFeather(
                wrist,
                featherMats.goldGreen,
                0.155 - f * 0.03,
                0.056,
                side * (f * 0.035),
                0.012,
                -0.004 + i * 0.001,
                side * (-0.52 + f * 0.65),
                side * -0.03,
                0.10
            );
        }

        // 4. Coberteras Menores y Escapulares Rojo Escarlata (3 hileras en hombro y antebrazo superior)
        for (let row = 0; row < 3; row++) {
            const count = 9;
            for (let i = 0; i < count; i++) {
                const f = i / (count - 1);
                const len = 0.125 - row * 0.018 + Math.sin(f * Math.PI) * 0.025;
                const wid = 0.066;
                const baseAngle = side * (-0.85 + f * 0.68);
                addFeather(
                    shoulder,
                    featherMats.scarlet,
                    len,
                    wid,
                    side * (f * 0.135),
                    0.022 + row * 0.018,
                    0.008 + row * 0.008 + i * 0.001,
                    baseAngle,
                    side * -0.05,
                    0.15
                );
            }
        }
        for (let i = 0; i < 8; i++) {
            const f = i / 7;
            addFeather(
                elbow,
                featherMats.scarlet,
                0.115 - f * 0.02,
                0.062,
                side * (f * 0.145),
                0.038,
                0.016 + i * 0.001,
                side * (-0.75 + f * 0.58),
                side * -0.04,
                0.14
            );
        }

        return { root, shoulder, elbow, wrist, primaryFeathers, secondaryFeathers, side };
    }

    const rightWing = buildArticulatedMacawWing(-1);
    const leftWing = buildArticulatedMacawWing(1);

    // Posición base de los hombros en el espacio de perchGroup
    const rightShoulderBase = new THREE.Vector3(-0.082, 0.275, -0.012);
    const leftShoulderBase = new THREE.Vector3(0.068, 0.275, -0.012);
    rightWing.root.position.copy(rightShoulderBase);
    leftWing.root.position.copy(leftShoulderBase);
    perchGroup.add(rightWing.root);
    perchGroup.add(leftWing.root);

    // Uniforms compartidos con el Vertex Shader del modelo parrot-light.glb
    const parrotUniforms = {
        uTime: { value: 0 },
        uWingOpen: { value: 0.9 },
        uWingFlap: { value: 0.0 },
        uHeadYaw: { value: 0.0 },
        uHeadPitch: { value: 0.0 },
        uHeadRoll: { value: 0.0 },
        uBreath: { value: 0.0 },
        uBodyPitch: { value: 0.0 },
        uBodyBob: { value: 0.0 },
        uTailPitch: { value: 0.0 }
    };

    function injectParrotLifeShader(material) {
        material.onBeforeCompile = function(shader) {
            shader.uniforms.uTime = parrotUniforms.uTime;
            shader.uniforms.uWingOpen = parrotUniforms.uWingOpen;
            shader.uniforms.uWingFlap = parrotUniforms.uWingFlap;
            shader.uniforms.uHeadYaw = parrotUniforms.uHeadYaw;
            shader.uniforms.uHeadPitch = parrotUniforms.uHeadPitch;
            shader.uniforms.uHeadRoll = parrotUniforms.uHeadRoll;
            shader.uniforms.uBreath = parrotUniforms.uBreath;
            shader.uniforms.uBodyPitch = parrotUniforms.uBodyPitch;
            shader.uniforms.uBodyBob = parrotUniforms.uBodyBob;
            shader.uniforms.uTailPitch = parrotUniforms.uTailPitch;

            shader.vertexShader = `
                uniform float uTime;
                uniform float uWingOpen;
                uniform float uWingFlap;
                uniform float uHeadYaw;
                uniform float uHeadPitch;
                uniform float uHeadRoll;
                uniform float uBreath;
                uniform float uBodyPitch;
                uniform float uBodyBob;
                uniform float uTailPitch;
                mat2 rot2D(float a) {
                    float s = sin(a), c = cos(a);
                    return mat2(c, -s, s, c);
                }
            ` + shader.vertexShader;

            shader.vertexShader = shader.vertexShader.replace(
                '#include <begin_vertex>',
                `
                #include <begin_vertex>
                vec3 p = transformed;

                // 1. Respiración en el pecho (y: 0.30..0.57, z > 0.18)
                float chestW = smoothstep(0.30, 0.43, p.y) * (1.0 - smoothstep(0.49, 0.58, p.y)) * smoothstep(0.18, 0.29, p.z);
                p.z += chestW * uBreath * 0.022;
                p.y += chestW * uBreath * 0.010;

                // 2. Hombros y pliegue lateral cuando el loro abre las alas
                float wingZoneY = smoothstep(0.26, 0.34, p.y) * (1.0 - smoothstep(0.48, 0.55, p.y));
                float shoulderZoneY = smoothstep(0.43, 0.49, p.y) * (1.0 - smoothstep(0.53, 0.58, p.y));
                float sideDist = abs(p.x + 0.012);
                float sideMask = smoothstep(0.055, 0.105, sideDist);
                float sgnX = p.x >= -0.012 ? 1.0 : -1.0;

                // Al abrir las alas, los hombros se elevan y las puntas plegadas bajas se recogen hacia el torso
                p.x += sgnX * shoulderZoneY * sideMask * uWingOpen * 0.038;
                p.y += shoulderZoneY * sideMask * (uWingOpen * 0.032 + uWingFlap * 0.018);
                float lowWingMask = smoothstep(0.25, 0.31, p.y) * (1.0 - smoothstep(0.39, 0.46, p.y)) * sideMask;
                p.x -= sgnX * lowWingMask * uWingOpen * 0.032;

                // 3. Movimiento vivo de cabeza y cuello (pivote en cuello: 0.015, 0.56, 0.31)
                float headW = smoothstep(0.51, 0.61, p.y);
                if (headW > 0.001) {
                    vec3 neckPivot = vec3(0.015, 0.56, 0.31);
                    vec3 hp = p - neckPivot;
                    hp.xz = rot2D(uHeadYaw * headW) * hp.xz;
                    hp.yz = rot2D(uHeadPitch * headW) * hp.yz;
                    hp.xy = rot2D(uHeadRoll * headW) * hp.xy;
                    p = neckPivot + hp;
                }

                // 4. Abanico y balanceo de la cola (pivote en base de cola: -0.015, 0.25, 0.16)
                float tailW = (1.0 - smoothstep(0.14, 0.28, p.y)) * (1.0 - smoothstep(0.06, 0.19, p.z));
                if (tailW > 0.001) {
                    vec3 tailPivot = vec3(-0.015, 0.25, 0.16);
                    vec3 tp = p - tailPivot;
                    tp.x *= (1.0 + uWingOpen * 0.42 * tailW);
                    tp.yz = rot2D(uTailPitch * tailW) * tp.yz;
                    p = tailPivot + tp;
                }

                // 5. Balanceo corporal anclado 100% en las garras sobre la letra E (-0.0197, 0.228, 0.2805)
                float isClaw = (1.0 - smoothstep(0.235, 0.285, p.y)) * smoothstep(0.16, 0.23, p.z);
                float bodyW = 1.0 - isClaw;
                vec3 clawPivot = vec3(-0.0197, 0.228, 0.2805);
                vec3 bp = p - clawPivot;
                bp.yz = rot2D(uBodyPitch * bodyW) * bp.yz;
                bp.y += uBodyBob * bodyW;
                transformed = clawPivot + bp;
                `
            );
        };
        material.needsUpdate = true;
    }

    // Cargar el modelo 3D real parrot-light.glb
    const loader = new GLTFLoader();
    loader.load(
        'parrot-light.glb',
        function(gltf) {
            const model = gltf.scene;
            // Centrar exactamente las garras (-0.0197, 0.225, 0.2805) en el origen (0,0,0) de perchGroup
            model.position.set(0.0197, -0.225, -0.2805);
            model.traverse(function(node) {
                if (node.isMesh && node.material) {
                    node.material.roughness = 0.72;
                    node.material.metalness = 0.05;
                    injectParrotLifeShader(node.material);
                }
            });
            perchGroup.add(model);
        },
        undefined,
        function(err) {
            console.warn('Error cargando parrot-light.glb:', err);
        }
    );

    // Interacción: al pasar el mouse o tocar al loro, abre las alas con aún más energía
    let excitementUntil = 0;
    function triggerParrotExcitement() {
        excitementUntil = performance.now() * 0.001 + 3.2;
    }
    stage.addEventListener('pointerenter', triggerParrotExcitement);
    stage.addEventListener('click', function(e) {
        e.stopPropagation();
        triggerParrotExcitement();
    });

    // Actualizar cinemática de cada ala articulada 3D
    function updateWingRig(wing, openAmt, flapWave, wristLagWave, t) {
        const s = wing.side;
        // Visibilidad y despliegue suave desde el hombro cuando el ala se abre
        const visScale = THREE.MathUtils.smoothstep(openAmt, 0.02, 0.24);
        wing.root.visible = visScale > 0.005;
        const spanScale = 0.28 + 0.72 * THREE.MathUtils.smoothstep(openAmt, 0.02, 0.55);
        wing.root.scale.set(spanScale, spanScale, spanScale);

        // Articulación Hombro (Húmero)
        const foldZ = s * -1.18;
        const openZ = s * (0.22 + flapWave * 0.52);
        wing.shoulder.rotation.z = THREE.MathUtils.lerp(foldZ, openZ, openAmt);
        wing.shoulder.rotation.y = s * THREE.MathUtils.lerp(-0.55, -0.14 - flapWave * 0.28, openAmt);
        wing.shoulder.rotation.x = THREE.MathUtils.lerp(0.45, 0.16 + flapWave * 0.22, openAmt);

        // Articulación Codo (Antebrazo / Cúbito)
        wing.elbow.rotation.z = s * THREE.MathUtils.lerp(1.45, 0.12 + wristLagWave * 0.34, openAmt);
        wing.elbow.rotation.y = s * THREE.MathUtils.lerp(0.35, -0.08 - wristLagWave * 0.20, openAmt);

        // Articulación Muñeca (Mano / Primarias)
        wing.wrist.rotation.z = s * THREE.MathUtils.lerp(-1.35, 0.08 + wristLagWave * 0.42, openAmt);
        wing.wrist.rotation.y = s * (-0.05 - wristLagWave * 0.22 * openAmt);

        // Abanico individual y torsión aerodinámica de las 11 plumas primarias
        for (let i = 0; i < wing.primaryFeathers.length; i++) {
            const pf = wing.primaryFeathers[i];
            const f = pf.userData.frac;
            const foldedRot = s * (-1.12 + f * 0.18);
            const openRot = pf.userData.baseRotZ + s * (wristLagWave * 0.16 * f);
            pf.rotation.z = THREE.MathUtils.lerp(foldedRot, openRot, openAmt);
            pf.rotation.x = 0.08 + Math.sin(t * 9.0 - f * 2.2) * 0.08 * openAmt;
        }
    }

    const clock = new THREE.Clock();

    function animate() {
        requestAnimationFrame(animate);

        // Pausar render si el usuario bajó lejos del Hero para ahorrar GPU
        if (window.scrollY > window.innerHeight * 1.4) return;

        const t = clock.getElapsedTime();
        parrotUniforms.uTime.value = t;

        // Ciclo natural de vida (6.0s): abre grande las alas, aletea, luce su plumaje, descansa un instante y vuelve a abrirlas
        const cycle = t % 6.0;
        const isExcited = t < excitementUntil;
        let openTarget = 0.0;
        let flapIntensity = 0.0;

        if (isExcited) {
            openTarget = 1.0;
            flapIntensity = 1.0;
        } else if (cycle < 2.6) {
            // Despliegue majestuoso y aleteo activo
            openTarget = THREE.MathUtils.smoothstep(cycle, 0.0, 0.42);
            flapIntensity = 0.95;
        } else if (cycle < 3.9) {
            // Alas abiertas planeando / mostrando plumaje sobre la letra E
            openTarget = 0.88 + Math.sin((cycle - 2.6) * 2.4) * 0.08;
            flapIntensity = 0.28;
        } else if (cycle < 4.9) {
            // Pliega suavemente las alas mientras observa alrededor
            openTarget = 0.88 * (1.0 - THREE.MathUtils.smoothstep(cycle, 3.9, 4.65));
            flapIntensity = 0.08;
        } else {
            // Prepara e inicia nueva apertura de alas
            openTarget = THREE.MathUtils.smoothstep(cycle, 5.15, 5.95);
            flapIntensity = 0.65 * openTarget;
        }

        // Suavizado exponencial
        const curOpen = THREE.MathUtils.lerp(parrotUniforms.uWingOpen.value, openTarget, 0.12);
        parrotUniforms.uWingOpen.value = curOpen;

        // Onda de aleteo principal y onda con desfase en muñeca/puntas
        const flapSpeed = isExcited ? 11.5 : 8.6;
        const flapWave = Math.sin(t * flapSpeed) * flapIntensity * curOpen;
        const wristLagWave = Math.sin(t * flapSpeed - 0.65) * flapIntensity * curOpen;
        parrotUniforms.uWingFlap.value = flapWave;

        // Cinemática del cuerpo, cabeza, respiración y cola
        const breath = Math.sin(t * 3.2) * 0.5 + 0.5 + curOpen * 0.4;
        parrotUniforms.uBreath.value = breath;

        // El loro mira hacia el frente y gira curiosamente la cabeza a ambos lados
        parrotUniforms.uHeadYaw.value = -0.22 + Math.sin(t * 1.45) * 0.28 + Math.cos(t * 0.72) * 0.12;
        parrotUniforms.uHeadPitch.value = -0.06 * curOpen + Math.sin(t * 2.3) * 0.08 - flapWave * 0.06;
        parrotUniforms.uHeadRoll.value = Math.sin(t * 1.85) * 0.14;

        // Inclinación de pecho y rebote sutil sincronizados con el aleteo (garras fijas en 0,0,0)
        const bodyPitch = 0.08 * curOpen + flapWave * 0.045 + Math.sin(t * 1.6) * 0.02;
        const bodyBob = Math.max(0, flapWave) * 0.018 + Math.sin(t * 3.2) * 0.004;
        parrotUniforms.uBodyPitch.value = bodyPitch;
        parrotUniforms.uBodyBob.value = bodyBob;
        parrotUniforms.uTailPitch.value = -bodyPitch * 1.35 + Math.sin(t * 4.2) * 0.06;

        // Sincronizar posición de los hombros de las alas 3D con el balanceo del torso
        const pitchOffsetZ = Math.sin(bodyPitch) * 0.275;
        const pitchOffsetY = (Math.cos(bodyPitch) - 1.0) * 0.275 + bodyBob;

        rightWing.root.position.set(
            rightShoulderBase.x - curOpen * 0.012,
            rightShoulderBase.y + pitchOffsetY + curOpen * 0.016,
            rightShoulderBase.z + pitchOffsetZ
        );
        leftWing.root.position.set(
            leftShoulderBase.x + curOpen * 0.012,
            leftShoulderBase.y + pitchOffsetY + curOpen * 0.016,
            leftShoulderBase.z + pitchOffsetZ
        );

        updateWingRig(rightWing, curOpen, flapWave, wristLagWave, t);
        updateWingRig(leftWing, curOpen, flapWave, wristLagWave, t);

        // Ligero giro vivo del cuerpo sobre la letra E
        perchGroup.rotation.y = -0.18 + Math.sin(t * 0.95) * 0.08;

        renderer.render(scene, camera);
    }

    animate();
})();
