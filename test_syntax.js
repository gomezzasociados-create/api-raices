
    // ==========================================
    // SISTEMA DE VOZ INTELIGENTE CON MODO WIZARD (FLUJO GUIADO)
    // ==========================================
    let estadoInteraccionVoz = 'LIBRE';
    let reconocimiento = null;

    // EL PARCHE ANTIMAREOS: SI CIERRAS EL MODAL, LA IA SE RESETEA SOLA
    document.addEventListener('DOMContentLoaded', () => {
        const modalElement = document.getElementById('modalCobro');
        if (modalElement) {
            modalElement.addEventListener('hidden.bs.modal', function () {
                estadoInteraccionVoz = 'LIBRE';
                window.speechSynthesis.cancel();
                document.getElementById('btn-mic').classList.remove('glow-red');
            });
        }
    });

    function hablar(texto) {
        window.speechSynthesis.cancel();
        const voz = new SpeechSynthesisUtterance(texto);
        voz.lang = 'es-ES'; voz.rate = 1.1; voz.pitch = 0.9;
        window.speechSynthesis.speak(voz);
    }

    function hablarYEscuchar(texto, siguienteEstado) {
        window.speechSynthesis.cancel();
        estadoInteraccionVoz = siguienteEstado;
        const voz = new SpeechSynthesisUtterance(texto);
        voz.lang = 'es-ES'; voz.rate = 1.1; voz.pitch = 0.9;

        voz.onend = function() {
            setTimeout(iniciarReconocimientoVoz, 300);
        };
        window.speechSynthesis.speak(voz);
    }

    function iniciarReconocimientoVoz() {
        if (!('webkitSpeechRecognition' in window)) {
            hablar("Tu navegador no soporta comandos de voz."); return;
        }
        if(reconocimiento) reconocimiento.stop();

        reconocimiento = new webkitSpeechRecognition();
        reconocimiento.lang = 'es-ES';
        reconocimiento.continuous = false;
        reconocimiento.interimResults = false;

        reconocimiento.onstart = function() {
            playSound('granted');
            document.getElementById('btn-mic').classList.add('glow-red');
        };

        reconocimiento.onresult = function(event) {
            const comandoRaw = event.results[0][0].transcript;
            console.log("Audio capturado: ", comandoRaw);
            procesarComandoVozWizard(comandoRaw);
        };

        reconocimiento.onend = function() {
            document.getElementById('btn-mic').classList.remove('glow-red');
        };

        reconocimiento.start();
    }

    function procesarComandoVozWizard(comandoRaw) {
        // NORMALIZADOR MAESTRO: Mata tildes y pasa todo a minúsculas
        const normalizar = (str) => {
            if(!str) return "";
            return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
        };

        const comando = normalizar(comandoRaw);

        // --- COMANDO DE EMERGENCIA: CANCELAR O ABORTAR ---
        if (comando.includes("cancelar") || comando.includes("abortar") || comando.includes("detener") || comando.includes("atras")) {
            estadoInteraccionVoz = 'LIBRE';
            const modalCobroObj = bootstrap.Modal.getInstance(document.getElementById('modalCobro'));
            if(modalCobroObj) modalCobroObj.hide();
            playSound('error');
            hablar("Protocolo abortado. Regresando a modo libre.");
            return;
        }

        // --- ESTADO 1: LIBRE ---
        if (estadoInteraccionVoz === 'LIBRE') {
            if (comando.includes("anadir") || comando.includes("pon") || comando.includes("suma") || comando.includes("agregar")) {

                // MODO INTELIGENTE: Filtra usando los nombres limpios (sin tildes)
                let candidatos = catalogoGlobal.filter(p => {
                    if(!p.nombre) return false;
                    return comando.includes(normalizar(p.nombre));
                });

                // Ordena para que coja el nombre más específico primero
                candidatos.sort((a, b) => b.nombre.length - a.nombre.length);
                let productoEncontrado = candidatos[0];

                if (productoEncontrado) {
                    agregarAlTicket(productoEncontrado.id, productoEncontrado.nombre, productoEncontrado.precio);
                    hablar(productoEncontrado.nombre + " añadido a la orden.");
                } else {
                    playSound('error'); hablar("No encontré ese elíxir en este Nodo. Intenta de nuevo.");
                }
            }
            else if (comando.includes("cobrar") || comando.includes("pagar") || comando.includes("sintetizar")) {
                if (carrito.length > 0) {
                    abrirModalCobro();
                    hablarYEscuchar("Iniciando síntesis. ¿Nombre del receptor?", 'ESPERANDO_NOMBRE');
                } else {
                    playSound('error'); hablar("El ticket está vacío. Añade productos primero.");
                }
            }
            else if (comando.includes("limpiar") || comando.includes("borrar") || comando.includes("vaciar")) {
                if (carrito.length > 0) {
                    carrito = []; renderizarTicket(); playSound('error'); hablar("Ticket purgado exitosamente.");
                }
            }
            else if (comando.includes("cerrar sesion") || comando.includes("desconectar") || comando.includes("salir")) {
                cerrarSesion();
            }
            else {
                playSound('error'); hablar("Comando no reconocido por la base de datos.");
            }
        }

        // --- ESTADO 2: ESPERANDO NOMBRE ---
        else if (estadoInteraccionVoz === 'ESPERANDO_NOMBRE') {
            document.getElementById('crm-nombre').value = comandoRaw.toUpperCase();
            hablarYEscuchar("Identificación copiada. ¿Cuál es el número de enlace o teléfono?", 'ESPERANDO_TEL');
        }

        // --- ESTADO 3: ESPERANDO TELÉFONO Y PREGUNTANDO MÉTODO SEGÚN EL PAÍS ---
        else if (estadoInteraccionVoz === 'ESPERANDO_TEL') {
            document.getElementById('crm-telefono').value = comando.replace(/\s/g, '');

            const paisActual = document.getElementById('sucursal-activa').value;
            let opcionesMetodo = "Efectivo, Tarjeta, Transferencia o Enlace Web";
            if(paisActual === 'España') opcionesMetodo = "Efectivo, Tarjeta, Bizum o Transferencia";
            if(paisActual === 'Colombia') opcionesMetodo = "Efectivo, Tarjeta, Nequi o Daviplata";
            if(paisActual === 'Chile') opcionesMetodo = "Efectivo, Tarjeta, Mercado Pago o Transferencia";

            hablarYEscuchar(`Enlace asegurado. Para finalizar, dictame el canal: ${opcionesMetodo}.`, 'ESPERANDO_METODO');
        }

        // --- ESTADO 4: PROCESANDO EL MÉTODO SEGÚN EL PAÍS ---
        else if (estadoInteraccionVoz === 'ESPERANDO_METODO') {
            const paisActual = document.getElementById('sucursal-activa').value;
            let metodoObj = 'Efectivo';

            if(comando.includes("tarjeta") || comando.includes("datafono")) metodoObj = 'Tarjeta';
            else if(comando.includes("transferencia") || comando.includes("qr")) metodoObj = 'Transferencia';
            else if(comando.includes("enlace") || comando.includes("web")) metodoObj = 'EnlaceWeb';

            if(paisActual === 'España' && comando.includes("bizum")) metodoObj = 'Bizum';
            if(paisActual === 'Colombia' && (comando.includes("nequi") || comando.includes("neki"))) metodoObj = 'Nequi';
            if(paisActual === 'Colombia' && comando.includes("daviplata")) metodoObj = 'Daviplata';
            if(paisActual === 'Chile' && (comando.includes("mercado pago") || comando.includes("mercadopago"))) metodoObj = 'MercadoPago';

            seleccionarMetodo(metodoObj);
            estadoInteraccionVoz = 'LIBRE';
            procesarPagoFinal();
        }
    }

    // ==========================================
    // MOTOR DE AUDIO SCI-FI (WEB AUDIO API)
    // ==========================================
    let audioCtx = null;
    function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if(audioCtx.state === 'suspended') audioCtx.resume(); }

    function playSound(type) {
        if (!audioCtx) return;
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);

        if (type === 'hover') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);
            gain.gain.setValueAtTime(0.02, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);
            osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'add') {
            osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.linearRampToValueAtTime(800, now + 0.1);
            gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.1);
            osc.start(now); osc.stop(now + 0.1);

            const osc2 = audioCtx.createOscillator(); const gain2 = audioCtx.createGain();
            osc2.connect(gain2); gain2.connect(audioCtx.destination);
            osc2.type = 'sine'; osc2.frequency.setValueAtTime(1200, now + 0.05); osc2.frequency.linearRampToValueAtTime(1600, now + 0.2);
            gain2.gain.setValueAtTime(0.03, now + 0.05); gain2.gain.linearRampToValueAtTime(0, now + 0.2);
            osc2.start(now + 0.05); osc2.stop(now + 0.2);
        } else if (type === 'granted') {
            osc.type = 'triangle'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(600, now + 0.8);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.8);
            osc.start(now); osc.stop(now + 0.8);
        } else if (type === 'error') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.4);
            osc.start(now); osc.stop(now + 0.4);
        } else if (type === 'checkout') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(400, now); osc.frequency.exponentialRampToValueAtTime(1200, now + 0.3);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0.05, now + 0.3);
            osc.start(now); osc.stop(now + 0.3);

            const osc3 = audioCtx.createOscillator(); const gain3 = audioCtx.createGain();
            osc3.connect(gain3); gain3.connect(audioCtx.destination);
            osc3.type = 'square'; osc3.frequency.setValueAtTime(1200, now + 0.3); osc3.frequency.exponentialRampToValueAtTime(2400, now + 0.6);
            gain3.gain.setValueAtTime(0.05, now + 0.3); gain3.gain.linearRampToValueAtTime(0, now + 0.6);
            osc3.start(now + 0.3); osc3.stop(now + 0.6);
        }
    }

    // ==========================================
    // LÓGICA DE SEGURIDAD Y VOZ DE INGRESO
    // ==========================================
    function validarAcceso() {
        playSound('add');
        const userRaw = document.getElementById('user-operador').value.trim();
        const pass = document.getElementById('pass-operador').value.trim();
        const selectorSucursal = document.getElementById('sucursal-activa');

        const normalizar = (str) => str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
        const userNorm = normalizar(userRaw);

        let loginExitoso = true; // BYPASS SEGURIDAD
        let mensajeVoz = "Acceso libre habilitado por comando de emergencia.";
        selectorSucursal.disabled = false;

        if(loginExitoso) {
            playSound('granted');
            document.getElementById('pantalla-login').style.opacity = '0';
            setTimeout(() => {
                document.getElementById('pantalla-login').style.display = 'none';
                document.getElementById('sistema-pos').style.display = 'block';
                document.getElementById('nombre-cajero').innerText = "OP: " + userRaw.toUpperCase();

                hablar(mensajeVoz);
                iniciarSistemaPOS();
            }, 800);
        } else {
            playSound('error');
            document.getElementById('error-login').style.display = 'block';
            hablar("Acceso denegado. Credenciales inválidas.");
        }
    }

    function cerrarSesion() {
        playSound('error');
        hablar("Desconectando enlace neuronal. Hasta pronto.");
        document.getElementById('user-operador').value = ''; document.getElementById('pass-operador').value = '';
        document.getElementById('error-login').style.display = 'none';
        document.getElementById('pantalla-login').style.opacity = '1';
        document.getElementById('pantalla-login').style.display = 'flex';
        document.getElementById('sistema-pos').style.display = 'none';
        carrito = []; renderizarTicket();
    }

    // ==========================================
    // CONEXIÓN BD Y RENDERIZADO DINÁMICO DE PAGOS
    // ==========================================
    const API_PRODUCTOS = '/api/productos';
    let catalogoGlobal = [], carrito = [], simboloActual = '$', totalActualCaja = 0;
    let modalTicketMobileInst;
    let filtroActualActivo = 'Todos';

    window.addEventListener('DOMContentLoaded', () => {
        modalTicketMobileInst = new bootstrap.Modal(document.getElementById('modalTicketMobile'));
    });

    function iniciarSistemaPOS() {
        cambiarSucursal();
        iniciarAutoSync();
    }

    // EL CEREBRO QUE DIBUJA LOS BOTONES DE PAGO SEGÚN EL PAÍS
    function renderizarMetodosPago() {
        const pais = document.getElementById('sucursal-activa').value;
        const contenedor = document.getElementById('contenedor-metodos-pago');
        let html = '';

        const btnEfectivo = `<div class="col-4"><div class="btn-opcion-pago active" id="pago-Efectivo" onclick="seleccionarMetodo('Efectivo')" onmouseenter="playSound('hover')"><i class="bi bi-cash-stack fs-2 d-block mb-2"></i> FÍSICO</div></div>`;
        const btnTarjeta = `<div class="col-4"><div class="btn-opcion-pago" id="pago-Tarjeta" onclick="seleccionarMetodo('Tarjeta')" onmouseenter="playSound('hover')"><i class="bi bi-credit-card fs-2 d-block mb-2"></i> DATÁFONO</div></div>`;
        const btnTransf = `<div class="col-6"><div class="btn-opcion-pago" id="pago-Transferencia" onclick="seleccionarMetodo('Transferencia')" onmouseenter="playSound('hover')"><i class="bi bi-qr-code-scan fs-2 d-block mb-2"></i> TRANSFERENCIA</div></div>`;
        const btnEnlace = `<div class="col-6"><div class="btn-opcion-pago" id="pago-EnlaceWeb" onclick="seleccionarMetodo('EnlaceWeb')" onmouseenter="playSound('hover')"><i class="bi bi-link-45deg fs-2 d-block mb-2"></i> ENLACE WEB</div></div>`;

        if (pais === 'España') {
            html = btnEfectivo + btnTarjeta +
                   `<div class="col-4"><div class="btn-opcion-pago" id="pago-Bizum" onclick="seleccionarMetodo('Bizum')" onmouseenter="playSound('hover')"><i class="bi bi-phone-vibrate fs-2 d-block mb-2"></i> BIZUM</div></div>` +
                   btnTransf + btnEnlace;
        } else if (pais === 'Colombia') {
            html = btnEfectivo + btnTarjeta +
                   `<div class="col-4"><div class="btn-opcion-pago" id="pago-Nequi" onclick="seleccionarMetodo('Nequi')" onmouseenter="playSound('hover')"><i class="bi bi-phone fs-2 d-block mb-2"></i> NEQUI</div></div>` +
                   `<div class="col-6"><div class="btn-opcion-pago" id="pago-Daviplata" onclick="seleccionarMetodo('Daviplata')" onmouseenter="playSound('hover')"><i class="bi bi-bank fs-2 d-block mb-2"></i> DAVIPLATA</div></div>` +
                   btnTransf;
        } else if (pais === 'Chile') {
            // AQUÍ ESTÁ EL BOTÓN DE MERCADO PAGO COMO GUEST CHECKOUT (SIN CUENTA)
            html = btnEfectivo + btnTarjeta +
                   `<div class="col-4"><div class="btn-opcion-pago" id="pago-MercadoPago" onclick="seleccionarMetodo('MercadoPago')" onmouseenter="playSound('hover')"><i class="bi bi-credit-card-2-front fs-2 d-block mb-1"></i> MERCADO PAGO<br><span style="font-size:0.55rem; opacity:0.8;">(Ingreso Tarjeta)</span></div></div>` +
                   btnTransf + btnEnlace;
        } else {
            html = btnEfectivo + btnTarjeta + btnTransf + btnEnlace;
        }

        contenedor.innerHTML = html;
        document.getElementById('metodo-seleccionado').value = 'Efectivo';
    }

    async function cargarProductos(silencioso = false) {
        const pais = document.getElementById('sucursal-activa').value;
        const contenedor = document.getElementById('grid-pos-productos');

        if(!silencioso) {
            contenedor.innerHTML = '<div class="col-12 text-center mt-5"><div class="spinner-bio mx-auto mb-4"></div><h3 class="font-orbitron glitch-text" style="color:var(--p-eco-green); letter-spacing:4px;">LEYENDO MATRIZ...</h3></div>';
        }

        try {
            const res = await fetch(`${API_PRODUCTOS}/sucursal/${encodeURIComponent(pais)}`);
            if(!res.ok) throw new Error("Fallo API");
            catalogoGlobal = await res.json();

            if(catalogoGlobal.length === 0 && !silencioso) {
                contenedor.innerHTML = '<div class="col-12 text-center mt-5 text-white-50"><i class="bi bi-x-octagon fs-1 d-block mb-3"></i> NODO VACÍO. Inyecte datos en Control Central.</div>';
                return;
            }
            construirFiltros(catalogoGlobal);
            filtrarPos(filtroActualActivo, null, silencioso);

        } catch(e) {
            if(!silencioso) {
                contenedor.innerHTML = '<div class="col-12 text-center mt-5 text-danger"><i class="bi bi-exclamation-triangle fs-1 d-block mb-3"></i> FALLO DE CONEXIÓN CON EYWA.</div>';
            }
        }
    }

    function cambiarSucursal() {
        if(carrito.length > 0) {
            if(confirm("ALERTA: El cambio de Nodo purgará el ticket actual. ¿Proceder?")) {
                carrito = []; renderizarTicket();
            } else { return; }
        }
        simboloActual = document.getElementById('sucursal-activa').value === 'España' ? '€' : '$';
        filtroActualActivo = 'Todos';
        cargarProductos(false);
        renderizarMetodosPago(); // Al cambiar sucursal, los botones cambian de inmediato
    }

    function sincronizarMatrizManual() {
        playSound('granted');
        const icono = document.getElementById('icono-sync');
        icono.classList.add('sync-spin');
        cargarProductos(false).then(() => { setTimeout(() => icono.classList.remove('sync-spin'), 1000); });
    }

    function iniciarAutoSync() {
        setInterval(() => {
            if(document.getElementById('sistema-pos').style.display !== 'none') { cargarProductos(true); }
        }, 10000);
    }

    function construirFiltros(productos) {
        const contenedorFiltros = document.getElementById('contenedor-filtros');
        const categoriasUnicas = ["Todos"];
        productos.forEach(p => {
            const cat = p.categoria ? p.categoria.trim() : "Genérico";
            if(cat && !categoriasUnicas.includes(cat)) { categoriasUnicas.push(cat); }
        });

        contenedorFiltros.innerHTML = '';
        categoriasUnicas.forEach(cat => {
            const isActive = cat === filtroActualActivo ? 'active' : '';
            contenedorFiltros.innerHTML += `<button class="btn-filtro ${isActive}" onclick="filtrarPos('${cat}', this)" onmouseenter="playSound('hover')">${cat.toUpperCase()}</button>`;
        });
    }

    function filtrarPos(filtro, botonElemento = null, silencioso = false) {
        if(botonElemento && !silencioso) playSound('add');
        filtroActualActivo = filtro;

        if(botonElemento) {
            document.querySelectorAll('.btn-filtro').forEach(b => b.classList.remove('active'));
            botonElemento.classList.add('active');
        }

        const contenedor = document.getElementById('grid-pos-productos');
        let lista = catalogoGlobal;
        if(filtro !== 'Todos') {
            lista = catalogoGlobal.filter(p => {
                const catProducto = p.categoria ? p.categoria.toLowerCase() : "genérico";
                return catProducto.includes(filtro.toLowerCase());
            });
        }

        let htmlTemporal = '';
        if(lista.length === 0) { htmlTemporal = `<div class="col-12 text-center text-white-50 mt-4 font-orbitron">SIN REGISTROS GENÉTICOS.</div>`; }

        lista.forEach((p, index) => {
            const idValido = p.id || index;
            const tagImagen = p.imagen && p.imagen.trim() !== ""
                ? `<img src="${p.imagen}" class="pos-item-img" loading="lazy" alt="${p.nombre}">`
                : `<i class="bi bi-hexagon-half fs-1" style="color: var(--p-cyan) !important; text-shadow: var(--resplandor-cyan);"></i>`;

            htmlTemporal += `
                <div class="col-6 col-md-4 col-xl-3">
                    <div class="btn-pos-item" onclick="agregarAlTicket(${idValido}, '${p.nombre.replace(/'/g, "\\'")}', ${p.precio})" onmouseenter="playSound('hover')">
                        <div class="pos-item-img-container">${tagImagen}</div>
                        <div class="pos-item-body">
                            <div class="pos-item-nombre">${p.nombre}</div>
                            <div class="pos-item-precio">${simboloActual}${p.precio.toLocaleString('es-ES')}</div>
                        </div>
                    </div>
                </div>
            `;
        });

        if (!silencioso || contenedor.innerHTML !== htmlTemporal) { contenedor.innerHTML = htmlTemporal; }
    }

    // ==========================================
    // LÓGICA DEL TICKET
    // ==========================================
    function agregarAlTicket(id, nombre, precio) {
        playSound('add');
        carrito.push({ id, nombre, precio: Number(precio) });
        renderizarTicket();
    }

    function eliminarDelTicket(index) {
        playSound('error');
        carrito.splice(index, 1);
        renderizarTicket();
        if(carrito.length === 0) { modalTicketMobileInst.hide(); }
    }

    function renderizarTicket() {
        const listaDesktop = document.getElementById('lista-ticket-desktop');
        const listaMobile = document.getElementById('lista-ticket-mobile');
        const barraMobile = document.getElementById('carrito-bar-mobile');
        const btnsCobrar = document.querySelectorAll('.btn-cobrar-ticket');
        const vacioHTML = `<div class="text-center mt-5 ticket-vacio"><i class="bi bi-hexagon fs-1 opacity-25" style="color: var(--p-cyan); display:block; animation: rotateRadar 4s linear infinite;"></i><br><span style="font-family:'Orbitron'; font-size:1rem; color:var(--p-cyan); opacity:0.5; letter-spacing: 2px;">MODO ESPERA</span></div>`;

        listaDesktop.innerHTML = ''; listaMobile.innerHTML = ''; totalActualCaja = 0;

        if(carrito.length === 0) {
            listaDesktop.innerHTML = vacioHTML; listaMobile.innerHTML = vacioHTML;
            btnsCobrar.forEach(btn => btn.disabled = true);
            barraMobile.style.display = 'none';
            actualizarTextosTotal(`${simboloActual}0`);
            return;
        }

        btnsCobrar.forEach(btn => btn.disabled = false);
        barraMobile.style.display = 'flex';
        document.getElementById('items-count-mobile').innerText = carrito.length;

        carrito.forEach((item, index) => {
            totalActualCaja += item.precio;
            const filaHTML = `
                <div class="ticket-item-row">
                    <div style="font-family: 'Rajdhani'; font-weight: 700; width: 65%; line-height: 1.1; color: white; font-size: 1.1rem;">${item.nombre}</div>
                    <div style="font-family: 'Orbitron'; color: var(--p-eco-green); font-weight: 900; font-size:1.1rem; text-shadow: var(--resplandor-eco);">${simboloActual}${item.precio.toLocaleString('es-ES')}</div>
                    <button class="btn btn-sm btn-outline-danger py-1 px-2 border-0" onclick="eliminarDelTicket(${index})" onmouseenter="playSound('hover')"><i class="bi bi-x-lg fs-5"></i></button>
                </div>
            `;
            listaDesktop.innerHTML += filaHTML; listaMobile.innerHTML += filaHTML;
        });

        actualizarTextosTotal(`${simboloActual}${totalActualCaja.toLocaleString('es-ES')}`);
    }

    function actualizarTextosTotal(texto) { document.querySelectorAll('.total-caja-display').forEach(el => el.innerText = texto); }

    function abrirModalTicketMobile() { playSound('hover'); if(carrito.length > 0) modalTicketMobileInst.show(); }
    function cerrarTicketMobileYAbrirCobro() { playSound('add'); modalTicketMobileInst.hide(); setTimeout(abrirModalCobro, 400); }

    // ==========================================
    // CHECKOUT Y PAGO
    // ==========================================
    function abrirModalCobro() {
        playSound('granted');
        seleccionarMetodo('Efectivo');
        document.getElementById('crm-nombre').value = '';
        document.getElementById('crm-telefono').value = '';
        new bootstrap.Modal(document.getElementById('modalCobro')).show();
    }

    function seleccionarMetodo(metodo) {
        playSound('add');
        // Usamos el id dinámico que creamos en renderizarMetodosPago
        document.querySelectorAll('.btn-opcion-pago').forEach(el => el.classList.remove('active'));
        const elementoActivado = document.getElementById('pago-' + metodo);
        if(elementoActivado) elementoActivado.classList.add('active');
        document.getElementById('metodo-seleccionado').value = metodo;
    }

    async function procesarPagoFinal() {
        playSound('checkout');
        const metodo = document.getElementById('metodo-seleccionado').value;
        const pais = document.getElementById('sucursal-activa').value;
        const nombreCajero = document.getElementById('nombre-cajero').innerText.replace('OP: ', '');
        const crmNombre = document.getElementById('crm-nombre').value.trim();

        let msjAlerta = `[ SÍNTESIS AUTORIZADA ]\n\n`;
        msjAlerta += `CANTIDAD: ${simboloActual}${totalActualCaja.toLocaleString('es-ES')}\n`;

        // Formatear el método para que se lea mejor en el comprobante final
        let metodoMostrado = metodo.toUpperCase();
        if(metodo === 'EnlaceWeb') metodoMostrado = 'ENLACE WEB';
        if(metodo === 'MercadoPago') metodoMostrado = 'MERCADO PAGO (TARJETA INVITADO)';

        // ================= CONEXIÓN A CONTABILIDAD Y DESCUENTO INVENTARIO =================
        try {
            // Guardar Venta en BD
            const res = await fetch(`/api/ventas?origen=Caja POS&pais=${pais}&estado=Pagado&medioPago=${metodo}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(carrito)
            });
            const ventaGuardada = await res.json();
            
            // Procesar los ingredientes (Dispara el Controlador Java para descontar insumos o packs)
            await fetch(`/api/ventas/${ventaGuardada.id}/pagar`, { method: 'PUT' });

        } catch (e) {
            playSound('error');
            alert("Error crítico conectando con el motor contable.");
            return;
        }

        msjAlerta += `VÍA: ${metodoMostrado}\n`;
        msjAlerta += `RECEPTOR: ${crmNombre ? crmNombre.toUpperCase() : 'ANÓNIMO'}\n`;

        setTimeout(() => {
            hablar("Síntesis autorizada y guardada en contabilidad.");
            alert(msjAlerta);
            carrito = []; renderizarTicket();
            bootstrap.Modal.getInstance(document.getElementById('modalCobro')).hide();
        }, 600);
    }

    // ==========================================
    // MÓDULO DE CAJA (CIERRE Y LIBRO)
    // ==========================================
    async function abrirLibroCaja() {
        playSound('granted');
        const pais = document.getElementById('sucursal-activa').value;
        const res = await fetch(`/api/finanzas/indicadores/${pais}`);
        const data = await res.json();

        document.getElementById('caja-efectivo').innerText = `${simboloActual}${data.ingresosEfectivo.toLocaleString('es-ES')}`;
        document.getElementById('caja-banco').innerText = `${simboloActual}${data.ingresosBanco.toLocaleString('es-ES')}`;
        document.getElementById('caja-total').innerText = `${simboloActual}${data.ingresosNetos.toLocaleString('es-ES')}`;
        
        cargarPedidosWeb(pais);
        new bootstrap.Modal(document.getElementById('modalLibroCaja')).show();
    }

    async function cargarPedidosWeb(pais) {
        const res = await fetch('/api/ventas');
        const ventas = await res.json();
        const ventasWeb = ventas.filter(v => v.origen === 'Web' && v.pais === pais && v.estado === 'Pendiente' && !v.archivada);
        const cont = document.getElementById('contenedor-pedidos-web');
        const lista = document.getElementById('lista-pedidos-web');
        
        if (ventasWeb.length > 0) {
            lista.innerHTML = '';
            ventasWeb.forEach(v => {
                lista.innerHTML += `<li class="list-group-item bg-transparent text-white border-warning">Pedido #00${v.id} - ${simboloActual}${v.total} (Esperando preparación)</li>`;
            });
            cont.style.display = 'block';
        } else {
            cont.style.display = 'none';
        }
    }

    async function ejecutarCierreDiario() {
        if(confirm("⚠ ATENCIÓN: El Arqueo y Cierre Diaro reseteará los indicadores a $0.00 para la caja activa. ¿Proceder?")) {
            playSound('error');
            const pais = document.getElementById('sucursal-activa').value;
            await fetch(`/api/finanzas/cierre/${pais}`, { method: 'PUT' });
            hablar("Arqueo cerrado y sincronizado con Contabilidad Central.");
            bootstrap.Modal.getInstance(document.getElementById('modalLibroCaja')).hide();
        }
    }

    // ==========================================
    // INSTALADOR PWA (APP NATIVA)
    // ==========================================
    let eventoInstalacionPWA;
    const btnDescarga = document.getElementById('btn-descargar-app');

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        eventoInstalacionPWA = e;
        if(btnDescarga) btnDescarga.style.display = 'inline-block';
    });

    async function instalarAppPWA() {
        if (eventoInstalacionPWA) {
            if(typeof playSound === 'function') playSound('granted');

            eventoInstalacionPWA.prompt();
            const { outcome } = await eventoInstalacionPWA.userChoice;

            if (outcome === 'accepted') {
                console.log('App instalada con éxito en la matriz');
                if(btnDescarga) btnDescarga.style.display = 'none';
            }
            eventoInstalacionPWA = null;
        }
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Error:', err));
        });
    }

