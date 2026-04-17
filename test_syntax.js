
    // ==========================================
    // MOTOR DE AUDIO SCI-FI EXTREMO (Web Audio API)
    // ==========================================
    let audioCtx = null;
    function initAudio() { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if(audioCtx.state === 'suspended') audioCtx.resume(); }

    function playSound(type) {
        if (!audioCtx) return;
        const now = audioCtx.currentTime; const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
        osc.connect(gain); gain.connect(audioCtx.destination);

        if (type === 'click') {
            osc.type = 'square'; osc.frequency.setValueAtTime(800, now); osc.frequency.exponentialRampToValueAtTime(100, now + 0.1);
            gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.1); osc.start(); osc.stop(now + 0.1);
        } else if (type === 'hover') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(1200, now); osc.frequency.exponentialRampToValueAtTime(1800, now + 0.05);
            gain.gain.setValueAtTime(0.01, now); gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05); osc.start(now); osc.stop(now + 0.05);
        } else if (type === 'magic') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(100, now); osc.frequency.exponentialRampToValueAtTime(800, now + 2);
            gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(0.1, now + 1); gain.gain.linearRampToValueAtTime(0, now + 2.5);
            osc.start(); osc.stop(now + 2.5);

            const osc2 = audioCtx.createOscillator(); const gain2 = audioCtx.createGain();
            osc2.connect(gain2); gain2.connect(audioCtx.destination);
            osc2.type = 'sine'; osc2.frequency.setValueAtTime(800, now); osc2.frequency.exponentialRampToValueAtTime(200, now + 2.5);
            gain2.gain.setValueAtTime(0.05, now); gain2.gain.linearRampToValueAtTime(0, now + 2.5);
            osc2.start(); osc2.stop(now + 2.5);
        } else if (type === 'success') {
            osc.type = 'sine'; osc.frequency.setValueAtTime(523.25, now);
            gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 1);
            osc.start(); osc.stop(now + 1);

            const osc3 = audioCtx.createOscillator(); const gain3 = audioCtx.createGain();
            osc3.connect(gain3); gain3.connect(audioCtx.destination);
            osc3.type = 'sine'; osc3.frequency.setValueAtTime(659.25, now + 0.1);
            gain3.gain.setValueAtTime(0.1, now + 0.1); gain3.gain.exponentialRampToValueAtTime(0.01, now + 1.1);
            osc3.start(now + 0.1); osc3.stop(now + 1.1);
        } else if (type === 'error') {
            osc.type = 'sawtooth'; osc.frequency.setValueAtTime(150, now); osc.frequency.exponentialRampToValueAtTime(50, now + 0.4);
            gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.4); osc.start(); osc.stop(now + 0.4);
        }
    }

    // --- VARIABLES GLOBALES PARA EL ASISTENTE DE VOZ ---
    let lotesProduccion = JSON.parse(localStorage.getItem('raices_lotes_adn')) || {};
    let catalogoGlobal = [];
    let insMem = [];
    let produccionGlobal = [];

    // --- LÓGICA DE USUARIOS ---
    let rolUsuario = null; let sucursalAdmin = null; let baseCRM = JSON.parse(localStorage.getItem('raices_crm')) || [];

    window.addEventListener('DOMContentLoaded', () => {
        const inputFecha = document.getElementById('prod-fecha');
        if(inputFecha) inputFecha.valueAsDate = new Date();
    });

    const normalizarStr = (str) => str ? str.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim() : '';

    function validarAcceso() {
        playSound('magic');
        const userRaw = document.getElementById('input-usuario').value.trim();
        const pass = document.getElementById('input-clave').value.trim();
        const userNorm = normalizarStr(userRaw);

        let rol = null, etiqueta = null, sucursalBase = null, msgVoz = "";

        if(userNorm === 'admin' && pass === '1234') {
            rol = 'SUPREMO'; etiqueta = 'COMANDANTE SUPREMO';
            msgVoz = "Bienvenido Comandante Supremo. Todos los módulos habilitados y enlace neuronal estable.";
        }
        else if(userNorm === 'linda mama spa' && pass === '3002') {
            rol = 'ADMIN'; etiqueta = 'ADMIN CHILE'; sucursalBase = 'Chile';
            msgVoz = "Linda mamá spa y raíces, la combinación perfecta.";
        }
        else if(userNorm === 'administrador juan' && pass === '1807') {
            rol = 'ADMIN'; etiqueta = 'ADMIN ESPAÑA'; sucursalBase = 'España';
            msgVoz = "Juan eres el mejor, nunca lo olvides, y todo lo que el ser humano se proponga, lo puede lograr.";
        }
        else if(userNorm === 'carolina' && pass === '2907') {
            rol = 'ADMIN'; etiqueta = 'ADMIN ESPAÑA'; sucursalBase = 'España';
            msgVoz = "Bienvenida Carolina, que tengas un excelente turno operando en Raíces.";
        }
        else if(userNorm === 'hermana' && pass === '1307') {
            rol = 'ADMIN'; etiqueta = 'ADMIN ESPAÑA'; sucursalBase = 'España';
            msgVoz = "Hola Hermana, lista para iniciar la operación con la mejor energía.";
        }
        else { playSound('error'); document.getElementById('error-login').style.display='block'; return; }

        playSound('success'); rolUsuario = rol; sucursalAdmin = sucursalBase;

        if ('speechSynthesis' in window && msgVoz !== "") {
            const voz = new SpeechSynthesisUtterance(msgVoz);
            voz.lang = 'es-ES';
            voz.rate = 1.0;
            window.speechSynthesis.speak(voz);
        }

        document.getElementById('login-screen').style.opacity = '0';
        setTimeout(() => {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('app-dashboard').style.display = 'block';
            setTimeout(() => { document.getElementById('app-dashboard').style.opacity = '1'; }, 50);
            document.getElementById('label-rol').innerText = etiqueta;

            // MOSTRAR MICRÓFONO AL ENTRAR
            if('webkitSpeechRecognition' in window) {
                document.getElementById('btn-mic-admin').style.display = 'flex';
            }

            aplicarSeguridad();
            cargarProduccion();
            cargarTesoreria(); // Para tener data lista para el asistente
            cargarInsumos(); // Para tener data lista para el asistente
        }, 800);
    }

    // =======================================================
    // CIFRADO DE PERMISOS ESTRICTOS (RBAC BLINDADO)
    // =======================================================
    function aplicarSeguridad() {
        const esSupremo = (rolUsuario === 'SUPREMO');

        const navCrm = document.getElementById('nav-crm');
        if (navCrm) navCrm.style.display = 'block';
        cargarCRM();

        const dropZone = document.getElementById('drop-zone');
        if (dropZone) dropZone.style.display = esSupremo ? 'block' : 'none';

        const selectores = ['prod-sucursal', 'ins-sucursal', 'vaso-sucursal', 'filtro-sucursal-catalogo', 'filtro-sucursal-recetas', 'crm-nodo'];
        selectores.forEach(id => {
            const el = document.getElementById(id);
            if (el) {
                if (!esSupremo) {
                    const sucAdminNorm = normalizarStr(sucursalAdmin);
                    for(let i=0; i<el.options.length; i++) {
                        if(normalizarStr(el.options[i].value).includes(sucAdminNorm)) {
                            el.selectedIndex = i;
                            break;
                        }
                    }
                    el.disabled = true;
                    el.classList.add('locked-select');
                } else {
                    el.disabled = false;
                    el.classList.remove('locked-select');
                }
            }
        });

        if (!esSupremo) {
            const pCol = document.getElementById('panel-stat-col');
            const pChi = document.getElementById('panel-stat-chi');
            const pEsp = document.getElementById('panel-stat-esp');

            if (sucursalAdmin !== 'Colombia' && pCol) pCol.style.display = 'none';
            if (sucursalAdmin !== 'Chile' && pChi) pChi.style.display = 'none';
            if (sucursalAdmin !== 'España' && pEsp) pEsp.style.display = 'none';
        } else {
            let p1 = document.getElementById('panel-stat-col'); if(p1) p1.style.display = 'block';
            let p2 = document.getElementById('panel-stat-chi'); if(p2) p2.style.display = 'block';
            let p3 = document.getElementById('panel-stat-esp'); if(p3) p3.style.display = 'block';
        }
    }

    // =======================================================
    // SINTETIZADOR GENÉTICO (PRODUCCIÓN CON FECHAS)
    // =======================================================
    async function cargarProductosSelect() {
        try {
            const suc = document.getElementById('prod-sucursal').value;
            const res = await fetch('/api/productos');
            catalogoGlobal = await res.json();
            const select = document.getElementById('prod-item');
            select.innerHTML = '<option value="">-- Seleccione Genética --</option>';
            catalogoGlobal.forEach(p => { 
                const nNorm = normalizarStr(p.nombre || '');
                const cNorm = normalizarStr(p.categoria || '');
                if(p.sucursal === suc && (nNorm.includes('pulpa') || cNorm.includes('pulpa'))) { 
                    select.innerHTML += `<option value="${p.id}">${p.nombre}</option>`; 
                } 
            });
        } catch(e) {}
    }

    async function cargarProduccion() {
        await cargarProductosSelect();
        try {
            const res = await fetch('/api/productos');
            let data = await res.json();
            
            // Filar solo pulpas para el Génesis de Producción
            data = data.filter(p => {
                const nNorm = normalizarStr(p.nombre || '');
                const cNorm = normalizarStr(p.categoria || '');
                return nNorm.includes('pulpa') || cNorm.includes('pulpa');
            });
            
            produccionGlobal = data; // Guardamos para el asistente
            const tb = document.getElementById('tabla-produccion'); tb.innerHTML='';
            const sucSeleccionada = document.getElementById('prod-sucursal').value;

            data.forEach(p => {
                const sucProd = normalizarStr(p.sucursal);
                const sucFiltro = normalizarStr(sucSeleccionada);
                
                // Siempre guiarse por el combo de la interfaz (limitado por seguridad o manejable por el supremo)
                if (!sucProd.includes(sucFiltro)) return;

                let stock = p.stock || 0;
                let lote = lotesProduccion[p.id];
                let fElabHtml = `<span class="text-white-50">SIN REGISTRO</span>`;
                let fVencHtml = `<span class="text-white-50">---</span>`;
                let barraHtml = `<span class="text-muted font-orbitron">NO APLICA / SIN STOCK</span>`;

                if(stock > 0 && lote) {
                    fElabHtml = `<span class="text-white fw-bold font-orbitron">${lote.elaboracion}</span>`;
                    fVencHtml = `<span class="text-white fw-bold font-orbitron">${lote.vencimiento}</span>`;

                    let hoy = new Date(); hoy.setHours(0,0,0,0);
                    let fVenc = new Date(lote.vencimiento); fVenc.setHours(0,0,0,0);
                    let fElab = new Date(lote.elaboracion); fElab.setHours(0,0,0,0);

                    let diasTotal = Math.round((fVenc - fElab) / (1000 * 60 * 60 * 24));
                    let diasRestantes = Math.round((fVenc - hoy) / (1000 * 60 * 60 * 24));

                    let pct = 0;
                    if(diasTotal > 0) pct = (diasRestantes / diasTotal) * 100;
                    pct = Math.max(0, Math.min(100, pct));

                    let estadoClase = "optimal";
                    let icono = `<i class="bi bi-shield-check"></i> ESTABILIDAD ÓPTIMA`;
                    let colorTexto = "var(--p-eco-green)";

                    if(pct <= 30 && pct > 0) {
                        estadoClase = "warning";
                        icono = `<i class="bi bi-exclamation-triangle"></i> FASE DE DEGRADACIÓN`;
                        colorTexto = "var(--p-warning)";
                    } else if (pct <= 0 || diasRestantes < 0) {
                        estadoClase = "critical";
                        icono = `<i class="bi bi-biohazard"></i> COLAPSO ORGÁNICO`;
                        colorTexto = "var(--p-danger)";
                        pct = 100;
                    }

                    barraHtml = `
                        <div style="font-family:'Orbitron'; font-size:0.85rem; font-weight:bold; color:${colorTexto}; margin-bottom:6px; letter-spacing:1px; text-shadow: 0 0 10px ${colorTexto};">
                            ${icono} (${diasRestantes} DÍAS)
                        </div>
                        <div class="bio-indicator">
                            <div class="bio-fill ${estadoClase}" style="width: ${pct}%;"></div>
                        </div>
                    `;
                }

                tb.innerHTML += `
                <tr>
                    <td class="fw-bold text-white fs-5 text-start ps-3">${p.nombre}</td>
                    <td class="text-money-green fs-3 fw-bold">${stock}</td>
                    <td>${fElabHtml}</td>
                    <td>${fVencHtml}</td>
                    <td class="pe-4">${barraHtml}</td>
                    <td>
                        <button class="btn btn-sm text-info border-0 me-1" onclick="cargarEditorProduccion(${p.id})"><i class="bi bi-pencil-square fs-3"></i></button>
                        <button class="btn btn-sm text-danger border-0" onclick="resetearProduccion(${p.id})"><i class="bi bi-scissors fs-3"></i></button>
                    </td>
                </tr>`;
            });
        } catch(e) {}
    }

    function procesarEnsamblaje() {
        const id = document.getElementById('prod-item').value;
        const cant = document.getElementById('prod-cantidad').value;
        const fechaElab = document.getElementById('prod-fecha').value;

        if(!id || !cant || cant <= 0 || !fechaElab) { playSound('error'); alert("ALERTA: Faltan parámetros genéticos para la síntesis."); return; }

        playSound('magic');
        const overlay = document.getElementById('overlay-ensamblaje');
        overlay.style.display = 'flex';

        const prod = catalogoGlobal.find(p => p.id == id);
        let diasVidaPura = 5;

        if(prod && prod.categoria) {
            let cat = normalizarStr(prod.categoria);
            if(cat.includes('500')) diasVidaPura = 3;
            else if(cat.includes('pack')) diasVidaPura = 7;
            else if(cat.includes('pulpa')) diasVidaPura = 30;
        }

        let dateElabObj = new Date(fechaElab + 'T12:00:00');
        let dateVencObj = new Date(dateElabObj);
        dateVencObj.setDate(dateElabObj.getDate() + diasVidaPura);

        lotesProduccion[id] = {
            elaboracion: fechaElab,
            vencimiento: dateVencObj.toISOString().split('T')[0],
            vidaTotalDias: diasVidaPura
        };
        localStorage.setItem('raices_lotes_adn', JSON.stringify(lotesProduccion));

        setTimeout(async () => {
            try {
                // LLAMADA REPARADA: Usa ProduccionController para descontar matriz de botánica
                await fetch(`/api/produccion/fabricar`, {
                    method:'POST',
                    headers:{'Content-Type':'application/json'},
                    body:JSON.stringify({idProducto: id, cantidad: cant})
                });
                document.getElementById('prod-cantidad').value = '';
                await cargarProduccion();
                overlay.style.display = 'none';
                playSound('success');
            } catch(e) {
                overlay.style.display = 'none'; playSound('error');
            }
        }, 2800);
    }

    // --- EDICIÓN Y RESETEO DE PRODUCCIÓN (GÉNESIS) ---
    function cargarEditorProduccion(id) {
        const prod = catalogoGlobal.find(p => p.id === id);
        if(!prod) return;
        document.getElementById('prod-item').value = prod.id;
        document.getElementById('prod-cantidad').value = prod.stock || 0;
        if(lotesProduccion[id]) {
            document.getElementById('prod-fecha').value = lotesProduccion[id].elaboracion;
        }
        window.scrollTo({top:0, behavior:'smooth'});
        
        // Reemplazar la funcionalidad de Procesar ADN temporalmente para usar la ruta "ajustar-stock" rápida
        const btnFn = document.querySelector('button[onclick="procesarEnsamblaje()"]');
        if (btnFn) {
            btnFn.setAttribute('onclick', 'guardarEdicionProduccion()');
            btnFn.innerHTML = '<i class="bi bi-check-circle-fill"></i> CORREGIR REGISTRO';
            btnFn.classList.replace('btn-bio', 'btn-warning');
        }
    }

    async function guardarEdicionProduccion() {
        const id = document.getElementById('prod-item').value;
        const cant = document.getElementById('prod-cantidad').value;
        const fechaElab = document.getElementById('prod-fecha').value;

        if(!id || cant == '') return;

        // Repara localstorage
        if(fechaElab) {
            const prod = catalogoGlobal.find(p => p.id == id);
            let diasVidaPura = lotesProduccion[id] ? lotesProduccion[id].vidaTotalDias : 5;
            if(prod && prod.categoria && !lotesProduccion[id]) {
                let cat = normalizarStr(prod.categoria);
                if(cat.includes('500')) diasVidaPura = 3; else if(cat.includes('pack')) diasVidaPura = 7; else if(cat.includes('pulpa')) diasVidaPura = 30;
            }
            let dateElabObj = new Date(fechaElab + 'T12:00:00'); let dateVencObj = new Date(dateElabObj); dateVencObj.setDate(dateElabObj.getDate() + diasVidaPura);
            lotesProduccion[id] = { elaboracion: fechaElab, vencimiento: dateVencObj.toISOString().split('T')[0], vidaTotalDias: diasVidaPura };
            localStorage.setItem('raices_lotes_adn', JSON.stringify(lotesProduccion));
        }

        // Envia ajuste al servidor sin fabricar/descontar matriz
        await fetch(`/api/productos/${id}/ajustar-stock?cantidad=${cant}`, {method:'PUT'});

        document.getElementById('prod-cantidad').value = '';
        
        const btnFn = document.querySelector('button[onclick="guardarEdicionProduccion()"]');
        if (btnFn) {
            btnFn.setAttribute('onclick', 'procesarEnsamblaje()');
            btnFn.innerHTML = '<i class="bi bi-fingerprint"></i> PROCESAR ADN';
            btnFn.classList.replace('btn-warning', 'btn-bio');
        }

        cargarProduccion();
        playSound('success');
    }

    async function resetearProduccion(id) {
        if(confirm("¿Estás seguro de ELIMINAR el stock y reseter la biología local de este producto?")) {
            delete lotesProduccion[id];
            localStorage.setItem('raices_lotes_adn', JSON.stringify(lotesProduccion));
            await fetch(`/api/productos/${id}/ajustar-stock?cantidad=0`, {method:'PUT'});
            cargarProduccion();
            playSound('error');
        }
    }

    // --- TESORERÍA Y FINANZAS ---
    async function cargarTesoreria() {
        const paisVenta = document.getElementById('tesoreria-sucursal').value;
        const smb = paisVenta.includes('España') ? '€' : '$';

        try {
            // INDICADORES
            const resInd = await fetch(`/api/finanzas/indicadores/${paisVenta}`);
            const dataInd = await resInd.json();
            
            document.getElementById('tesoreria-efectivo').innerText = `${smb}${dataInd.ingresosEfectivo.toLocaleString('es-ES')}`;
            document.getElementById('tesoreria-bancos').innerText = `${smb}${dataInd.ingresosBanco.toLocaleString('es-ES')}`;
            document.getElementById('tesoreria-gastos').innerText = `${smb}${dataInd.gastos.toLocaleString('es-ES')}`;
            document.getElementById('tesoreria-utilidad').innerText = `${smb}${dataInd.utilidad.toLocaleString('es-ES')}`;

            // VENTAS PENDIENTES / ACTIVAS (E-commerce y POS no archivadas)
            const resVentas = await fetch('/api/ventas');
            const dataVentas = await resVentas.json();
            const tbVentas = document.getElementById('tabla-historico-ventas'); tbVentas.innerHTML='';
            
            dataVentas.forEach(v => {
                if (v.pais !== paisVenta || v.archivada) return;
                let badgeEstado = v.estado === 'Pagado' ? `<span style="color:var(--p-bio-green); font-weight:900;"><i class="bi bi-shield-check"></i> PAGADO</span>` : `<span style="color:#ffdd00; font-weight:900;"><i class="bi bi-clock-history"></i> PENDIENTE</span>`;
                tbVentas.innerHTML += `<tr>
                    <td class="text-white fw-bold">#OP-${v.id}</td>
                    <td>${v.origen}</td>
                    <td style="color:var(--p-cyan)">${v.medioPago || 'Por Definir'}</td>
                    <td class="text-money-green fw-bold">${smb}${v.total.toLocaleString('es-ES')}</td>
                    <td>${badgeEstado} <button class="btn btn-sm btn-outline-info ms-2 border-0" onclick="imprimirTicket(${v.id})" title="Imprimir Recibo"><i class="bi bi-printer fs-5"></i></button></td>
                </tr>`;
            });

            // GASTOS ACTIVOS
            const resGastos = await fetch(`/api/finanzas/gastos/${paisVenta}`);
            const dataGastos = await resGastos.json();
            const tbGastos = document.getElementById('tabla-historico-gastos'); tbGastos.innerHTML='';
            
            dataGastos.forEach(g => {
                tbGastos.innerHTML += `<tr>
                    <td class="text-white">${g.concepto}</td>
                    <td style="color:#ff0055" class="fw-bold">-${smb}${g.monto.toLocaleString('es-ES')}</td>
                    <td><button class="btn btn-sm btn-outline-warning border-0" onclick="eliminarGasto(${g.id})"><i class="bi bi-trash fs-5"></i></button></td>
                </tr>`;
            });

        } catch(e) { console.error("Error cargando Tesorería", e); }
    }

    async function guardarGasto() {
        playSound('click');
        const concepto = document.getElementById('gasto-concepto').value;
        const monto = parseFloat(document.getElementById('gasto-monto').value);
        const sucursal = document.getElementById('tesoreria-sucursal').value;
        if (!concepto || !monto) { alert("Complete parámetros del egreso."); return; }

        await fetch('/api/finanzas/gastos', {
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify({concepto, monto, sucursal, archivada: false})
        });
        
        document.getElementById('gasto-concepto').value = '';
        document.getElementById('gasto-monto').value = '';
        cargarTesoreria();
    }

    async function eliminarGasto(id) {
        playSound('error');
        if(confirm("¿Eliminar este registro de gasto?")) {
            await fetch(`/api/finanzas/gastos/${id}`, { method: 'DELETE' });
            cargarTesoreria();
        }
    }

    async function ejecutarCierreAdmin() {
        if(confirm("⚠ ATENCIÓN: Esta acción archivará todas las ventas y egresos activos del nodo actual, reseteando la caja a 0. ¿Proceder?")) {
            playSound('error');
            const pais = document.getElementById('tesoreria-sucursal').value;
            await fetch(`/api/finanzas/cierre/${pais}`, { method: 'PUT' });
            alert("Contadores reseteados y archivados correctamente.");
            cargarTesoreria();
        }
    }

    // --- MÓDULO PROFESIONAL DE IMPRESIÓN Y CAJA ---
    function formatMoney(amount, nodo) {
        return (nodo.includes('España') ? '€' : '$') + amount.toLocaleString('es-ES');
    }

    async function imprimirTicket(idVenta) {
        playSound('magic');
        try {
            const res = await fetch('/api/ventas');
            const ventas = await res.json();
            const v = ventas.find(x => x.id === idVenta);
            if(!v) return alert('Operación no encontrada.');

            let itemsHtml = '';
            v.productos.forEach(p => {
                itemsHtml += `<tr>
                    <td style="text-align:left; border:none; border-bottom:1px solid #ccc; padding:4px 0;">${p.nombre}</td>
                    <td style="text-align:right; border:none; border-bottom:1px solid #ccc; padding:4px 0;">${formatMoney(p.precio, v.pais)}</td>
                </tr>`;
            });

            const zona = document.getElementById('impresion-zona');
            zona.innerHTML = `
                <div class="ticket-print font-orbitron">
                    <h2 style="font-weight:900; margin-bottom:0;">BATIDOS RAÍCES</h2>
                    <p style="font-size:12px; margin-top:2px;">SISTEMA ERP · NODO ${v.pais.toUpperCase()}</p>
                    <p style="font-size:12px; border-bottom:1px solid #000; padding-bottom:5px;">
                        TICKET ORIGINAL CLIENTE
                    </p>
                    <div style="text-align:left; margin-bottom:10px; font-size:13px;">
                        <b>FECHA:</b> ${v.fecha ? new Date(v.fecha).toLocaleString() : new Date().toLocaleString()}<br>
                        <b>ORDEN:</b> #OP-${v.id}<br>
                        <b>ORIGEN:</b> ${v.origen.toUpperCase()}<br>
                        <b>PAGO:</b> ${v.medioPago ? v.medioPago.toUpperCase() : 'PENDIENTE'}
                    </div>
                    
                    <table style="width:100%; font-size:13px; margin-bottom:10px; border:none;">
                        <thead>
                            <tr>
                                <th style="text-align:left; border:none; border-bottom:2px solid #000;">PRODUCTO</th>
                                <th style="text-align:right; border:none; border-bottom:2px solid #000;">IMPORTE</th>
                            </tr>
                        </thead>
                        <tbody>${itemsHtml}</tbody>
                    </table>
                    
                    <div style="text-align:right; font-size:16px; font-weight:bold; margin-top:10px;">
                        TOTAL BRUTO: ${formatMoney(v.total, v.pais)}
                    </div>
                    <div style="text-align:right; font-size:12px; margin-top:5px; color:#555 !important;">
                        (IVA Incluido / Base Legal Exenta)
                    </div>
                    
                    <p style="font-size:12px; margin-top:20px; font-weight:bold;">
                        ¡GRACIAS POR PREFERIR BATIDOS RAÍCES!
                    </p>
                </div>
            `;
            window.print();
        } catch(e) { console.error(e); }
    }

    async function imprimirCierreCaja() {
        playSound('magic');
        const nodo = document.getElementById('tesoreria-sucursal').value;
        const efe = document.getElementById('tesoreria-efectivo').innerText;
        const ban = document.getElementById('tesoreria-bancos').innerText;
        const gas = document.getElementById('tesoreria-gastos').innerText;
        const uti = document.getElementById('tesoreria-utilidad').innerText;
        
        const fechaStr = new Date().toLocaleString() + ' - OPERADOR: ' + (rolUsuario || 'ADMIN');

        const zona = document.getElementById('impresion-zona');
        zona.innerHTML = `
            <div class="libro-print" style="max-width:400px; margin: 0 auto;">
                <div class="header-print font-orbitron">
                    <h2>REPORTE DE CIERRE DE TURNO</h2>
                    <h4>NODO: ${nodo.toUpperCase()}</h4>
                    <p style="font-size:14px; margin-top:5px;">FECHA Y HORA: ${fechaStr}</p>
                </div>
                
                <table style="width:100%; border:2px solid #000; font-size:15px; margin-bottom:30px;">
                    <tr><td style="font-weight:bold;">INGRESOS EN EFECTIVO (CAJA BASE)</td><td style="text-align:right;">${efe}</td></tr>
                    <tr><td style="font-weight:bold;">INGRESOS VÍA BANCOS / DIGITALES</td><td style="text-align:right;">${ban}</td></tr>
                    <tr><td style="font-weight:bold; color:red !important;">TOTAL EGRESOS Y GASTOS (DEBE)</td><td style="text-align:right; color:red !important;">${gas}</td></tr>
                    <tr><td style="font-weight:bold; background:#eee !important;">UTILIDAD NETA DEL TURNO (HABER)</td><td style="text-align:right; font-weight:bold; background:#eee !important;">${uti}</td></tr>
                </table>
                
                <div style="margin-top: 50px; text-align:center;">
                    <p>____________________________________</p>
                    <p style="font-size:14px; font-weight:bold;">FIRMA RESPONSABLE (OPERADOR CAJA)</p>
                </div>
            </div>
        `;
        window.print();
    }

    async function abrirLibroContable() {
        playSound('magic');
        const nodo = document.getElementById('tesoreria-sucursal').value;
        const zona = document.getElementById('impresion-zona');
        zona.innerHTML = `<h2 class="text-center" style="margin-top:50px;">Generando Libro Mayor Histórico para ${nodo}... Espera.</h2>`;
        
        try {
            const resVentas = await fetch('/api/ventas');
            const dataVentas = await resVentas.json();
            
            const resGastos = await fetch(`/api/finanzas/gastos/todos/${nodo}`);
            const dataGastos = await resGastos.json();
            
            // Unificar todos los movimientos en un array historico
            let movimientos = [];
            
            dataVentas.forEach(v => {
                if (v.pais !== nodo) return;
                movimientos.push({
                    fecha: new Date(v.fecha || new Date()),
                    tipo: 'INGRESO VENTA',
                    concepto: 'OP#' + v.id + ' (' + v.medioPago + ')',
                    entrada: v.total,
                    salida: 0
                });
            });
            
            dataGastos.forEach(g => {
                movimientos.push({
                    fecha: new Date(g.fecha || new Date()),
                    tipo: 'EGRESO OPERATIVO',
                    concepto: g.concepto,
                    entrada: 0,
                    salida: g.monto
                });
            });
            
            movimientos.sort((a,b) => a.fecha - b.fecha);
            
            let htmlMovs = '';
            let balance = 0;
            movimientos.forEach(m => {
                balance += (m.entrada - m.salida);
                htmlMovs += `<tr>
                    <td>${m.fecha.toLocaleDateString()} ${m.fecha.toLocaleTimeString()}</td>
                    <td><b>${m.tipo}</b></td>
                    <td>${m.concepto}</td>
                    <td style="text-align:right; color:green !important;">${m.entrada > 0 ? formatMoney(m.entrada, nodo) : '-'}</td>
                    <td style="text-align:right; color:red !important;">${m.salida > 0 ? formatMoney(m.salida, nodo) : '-'}</td>
                    <td style="text-align:right; font-weight:bold;">${formatMoney(balance, nodo)}</td>
                </tr>`;
            });
            
            zona.innerHTML = `
                <div class="libro-print w-100 p-4">
                    <div class="header-print">
                        <h1 style="margin:0;">LIBRO CONTABLE Y MAYOR EMPRESARIAL</h1>
                        <h3 style="margin:5px 0;">SISTEMA RAÍCES ERP - NODO ${nodo.toUpperCase()}</h3>
                        <p>Impreso el: ${new Date().toLocaleString()}</p>
                    </div>
                    
                    <table style="width:100%; border-collapse:collapse; margin-top:20px;">
                        <thead>
                            <tr>
                                <th style="text-align:left;">FECHA</th>
                                <th style="text-align:left;">TIPO ORIGEN</th>
                                <th style="text-align:left;">DETALLE DE LA OPERACIÓN</th>
                                <th style="text-align:right;">DEBE (INGRESO)</th>
                                <th style="text-align:right;">HABER (EGRESO)</th>
                                <th style="text-align:right;">BALANCE (SALDO)</th>
                            </tr>
                        </thead>
                        <tbody>${htmlMovs}</tbody>
                    </table>
                    
                    <div style="margin-top:40px; text-align:right;">
                        <h3 style="display:inline-block; border-top:2px solid #000; padding-top:10px;">BALANCE PATRIMONIAL TOTAL: ${formatMoney(balance, nodo)}</h3>
                    </div>
                </div>
            `;
            window.print();
        } catch(e) {
            alert('Error generando libro contable: ' + e);
        }
    }

    // --- CRM ---
    function cargarCRM() {
        const tb = document.getElementById('tabla-crm'); tb.innerHTML='';
        baseCRM.forEach(c => {
            const nodoCrm = normalizarStr(c.nodo);
            const sucAdmin = normalizarStr(sucursalAdmin);

            if (rolUsuario !== 'SUPREMO' && !nodoCrm.includes(sucAdmin)) return;

            tb.innerHTML += `<tr><td class="fw-bold fs-5 text-white">${c.nombre}</td><td class="text-white fs-5">${c.tel}</td><td class="text-white-50 fs-6">${c.dir}</td><td><span class="badge border border-info text-info fs-6 px-3 py-2 bg-dark">${c.nodo}</span></td><td><button class="btn btn-sm text-info border-0 me-2" onclick="editarCliente(${c.id})"><i class="bi bi-pencil-square fs-3"></i></button><button class="btn btn-sm text-danger border-0" onclick="eliminarCliente(${c.id})"><i class="bi bi-trash3 fs-3"></i></button></td></tr>`;
        });
    }

    function guardarCliente() { playSound('click'); const id = document.getElementById('crm-id').value; const nombre = document.getElementById('crm-nombre').value; const tel = document.getElementById('crm-tel').value; const dir = document.getElementById('crm-dir').value; const nodo = document.getElementById('crm-nodo').value; if(!nombre) return alert("Falta identificación."); if(id) { let cli = baseCRM.find(c => c.id == id); if(cli) { cli.nombre = nombre; cli.tel = tel; cli.dir = dir; cli.nodo = nodo; } } else { let nuevoId = baseCRM.length > 0 ? Math.max(...baseCRM.map(c=>c.id)) + 1 : 1; baseCRM.push({ id: nuevoId, nombre, tel, dir, nodo }); } document.getElementById('crm-id').value = ''; document.getElementById('crm-nombre').value = ''; document.getElementById('crm-tel').value = ''; document.getElementById('crm-dir').value = ''; localStorage.setItem('raices_crm', JSON.stringify(baseCRM)); cargarCRM(); }
    function editarCliente(id) { playSound('click'); let cli = baseCRM.find(c => c.id === id); if(cli) { document.getElementById('crm-id').value = cli.id; document.getElementById('crm-nombre').value = cli.nombre; document.getElementById('crm-tel').value = cli.tel; document.getElementById('crm-dir').value = cli.dir; document.getElementById('crm-nodo').value = cli.nodo; } }
    function eliminarCliente(id) { playSound('error'); if(confirm("¿Eliminar registro?")) { baseCRM = baseCRM.filter(c => c.id !== id); localStorage.setItem('raices_crm', JSON.stringify(baseCRM)); cargarCRM(); } }

    // --- INSUMOS ---
    async function cargarInsumos() {
        try {
            const res = await fetch('/api/insumos/todos');
            const data = await res.json();
            insMem = data; // Guardamos globalmente
            const tb = document.getElementById('tabla-insumos'); tb.innerHTML='';

            data.sort((a,b)=>a.sucursal.localeCompare(b.sucursal)).forEach(i => {
                const sucIns = normalizarStr(i.sucursal);
                const sucAdmin = normalizarStr(sucursalAdmin);
                if (rolUsuario !== 'SUPREMO' && !sucIns.includes(sucAdmin)) return;

                const isVaso = i.categoria && i.categoria.includes('Vaso');
                tb.innerHTML += `<tr><td class="fw-bold text-white fs-5">${i.nombre}</td><td><span class="badge-categoria" style="${isVaso?'color:var(--p-cyan); border-color:var(--p-cyan); box-shadow:0 0 10px var(--p-cyan)':''}">${(i.categoria||'Pulpas').toUpperCase()}</span></td><td class="text-white">${i.sucursal}</td><td class="text-warning fw-bold fs-4" style="text-shadow:0 0 10px #ffdd00;">${i.unidadActual} <span class="fs-6 text-white-50">${i.medida}</span></td><td><button class="btn btn-sm text-info border-0 me-1" onclick="editarInsumo(${i.idInsumo})"><i class="bi bi-pencil-square fs-3"></i></button><button class="btn btn-sm text-danger border-0" onclick="eliminarInsumo(${i.idInsumo})"><i class="bi bi-trash3-fill fs-3"></i></button></td></tr>`;
            });
        } catch(e) {}
    }

    function editarInsumo(id) { let ins = insMem.find(i => i.idInsumo === id); if(ins) { if(ins.categoria && ins.categoria.includes('Vaso')) { document.getElementById('vaso-id').value = ins.idInsumo; document.getElementById('vaso-nombre').value = ins.nombre; document.getElementById('vaso-unidad').value = ins.medida; document.getElementById('vaso-stock').value = ins.unidadActual; document.getElementById('vaso-sucursal').value = ins.sucursal; } else { document.getElementById('ins-id').value = ins.idInsumo; document.getElementById('ins-nombre').value = ins.nombre; document.getElementById('ins-unidad').value = ins.medida; document.getElementById('ins-stock').value = ins.unidadActual; document.getElementById('ins-sucursal').value = ins.sucursal; } window.scrollTo({top:0, behavior:'smooth'}); } }
    function guardarInsumo(tipo) { let id, nombre, cat, uni, stock, suc; if(tipo==='pulpas'){ id = document.getElementById('ins-id').value; nombre = document.getElementById('ins-nombre').value; cat='Pulpas'; uni=document.getElementById('ins-unidad').value; stock=document.getElementById('ins-stock').value; suc=document.getElementById('ins-sucursal').value; } else { id = document.getElementById('vaso-id').value; nombre = document.getElementById('vaso-nombre').value; cat='Insumos Vaso'; uni=document.getElementById('vaso-unidad').value; stock=document.getElementById('vaso-stock').value; suc=document.getElementById('vaso-sucursal').value; } if(!nombre) return; let payload = {nombre, categoria:cat, medida:uni, unidadActual:parseInt(stock)||0, sucursal:suc}; if(id) { payload.idInsumo = parseInt(id); } fetch('/api/insumos/guardar',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(payload)}).then(()=>{ document.getElementById('ins-id').value=''; document.getElementById('vaso-id').value=''; document.getElementById('ins-nombre').value=''; document.getElementById('ins-stock').value=''; document.getElementById('vaso-nombre').value=''; document.getElementById('vaso-stock').value=''; cargarInsumos(); playSound('click'); }); }
    function eliminarInsumo(id) { if(confirm("¿Reciclar material?")) fetch(`/api/insumos/${id}`,{method:'DELETE'}).then(()=>cargarInsumos()); }

    // --- RECETAS ---
    async function prepararRecetas() { try { const [rP, rI] = await Promise.all([fetch('/api/productos'), fetch('/api/insumos/todos')]); const productos = await rP.json(); const insumos = await rI.json(); const suc = document.getElementById('filtro-sucursal-recetas').value; document.getElementById('rec-producto').innerHTML = productos.filter(p=>p.sucursal===suc).map(p=>`<option value="${p.id}">${p.nombre}</option>`).join(''); document.getElementById('rec-insumo').innerHTML = insumos.filter(i=>i.sucursal===suc).map(i=>`<option value="${i.nombre}">${i.nombre} (${i.medida})</option>`).join(''); cargarTablaReceta(); } catch(e) {} }
    async function guardarReceta() { const id = document.getElementById('rec-producto').value; const ing = document.getElementById('rec-insumo').value; const cant = document.getElementById('rec-cantidad').value; await fetch(`/api/insumos/${id}/vincular-ingrediente`, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({ingrediente:ing, gasto:cant})}); cargarTablaReceta(); playSound('click'); }
    async function desvincularIngrediente(nombreIngrediente) { const id = document.getElementById('rec-producto').value; if(confirm(`¿Desvincular ${nombreIngrediente} de la fórmula?`)){ await fetch(`/api/insumos/${id}/desvincular/${encodeURIComponent(nombreIngrediente)}`, {method:'DELETE'}); cargarTablaReceta(); playSound('error'); } }
    async function cargarTablaReceta() { const id = document.getElementById('rec-producto').value; if(!id) return; try { const res = await fetch(`/api/insumos/${id}/receta`); const txt = await res.text(); const tb = document.getElementById('tabla-vista-formula'); tb.innerHTML=''; txt.split('\n').forEach(l=>{ if(l.includes(':')) tb.innerHTML+=`<tr><td class="text-white fw-bold fs-4">${l.split(':')[0]}</td><td class="fs-4" style="color:var(--p-bio-green); text-shadow:var(--green-glow);">${l.split(':')[1]}</td><td><i class="bi bi-scissors text-danger fs-3" style="cursor:pointer;" onclick="desvincularIngrediente('${l.split(':')[0]}')"></i></td></tr>`; }); } catch(e) {} }

    // --- CATÁLOGO ---
    async function cargarCatalogo() {
        const suc = document.getElementById('filtro-sucursal-catalogo').value;
        const esSupremo = (rolUsuario === 'SUPREMO');

        try {
            const res = await fetch('/api/productos/sucursal/' + suc);
            const data = await res.json();
            const tb = document.getElementById('tabla-catalogo'); tb.innerHTML='';

            data.forEach(p => {
                const imgTag = p.imagen ? `<img src="${p.imagen}" class="img-preview" id="img-display-${p.id}">` : `<i class="bi bi-file-image fs-1 text-muted" id="img-display-${p.id}"></i>`;

                const attrReadonly = esSupremo ? '' : 'readonly';
                const classInput = esSupremo ? 'input-matriz' : 'input-matriz border-0 text-white-50 pointer-events-none';
                const classPrecio = esSupremo ? 'input-matriz text-money-green' : 'input-matriz border-0 text-money-green pointer-events-none';

                const colComandos = esSupremo ? `
                    <button class="btn btn-bio px-3 py-2 me-1 mb-1" onclick="actualizarProducto(${p.id})" title="Sobreescribir Matriz"><i class="bi bi-cloud-check-fill fs-5"></i></button>
                    <button class="btn btn-outline-danger px-3 py-2 border-0 mb-1" onclick="eliminarProducto(${p.id})" title="Purgar"><i class="bi bi-trash3-fill fs-5"></i></button>
                ` : `<span class="badge bg-dark border border-danger text-danger p-2 font-orbitron"><i class="bi bi-lock-fill"></i> DENEGADO</span>`;

                tb.innerHTML += `<tr id="fila-prod-${p.id}">
                    <td class="align-middle text-center">${imgTag}</td>
                    <td class="align-middle">
                        <input type="text" id="img-prod-${p.id}" value="${p.imagen || ''}" class="${classInput} w-100 text-info" style="font-size: 0.85rem; max-width: 150px;" placeholder="https://..." ${attrReadonly}>
                    </td>
                    <td class="align-middle">
                        <input type="text" id="nombre-prod-${p.id}" value="${p.nombre}" class="${classInput} w-100 fw-bold fs-5 text-center" ${attrReadonly}>
                    </td>
                    <td class="align-middle">
                        <input type="text" id="cat-prod-${p.id}" value="${p.categoria || 'Batidos'}" class="${classInput} w-100 text-warning fs-6 text-center" placeholder="Categoría" ${attrReadonly}>
                    </td>
                    <td class="align-middle">
                        <textarea id="desc-prod-${p.id}" class="${classInput} w-100" style="font-size: 0.9rem; min-width: 250px; height: 65px;" placeholder="Escribe la biología del producto aquí..." ${attrReadonly}>${p.descripcion || ''}</textarea>
                    </td>
                    <td class="align-middle text-white">${p.sucursal}</td>
                    <td class="align-middle">
                        <input type="number" id="precio-prod-${p.id}" value="${p.precio}" class="${classPrecio} text-center fw-bold fs-4" style="max-width:120px;" ${attrReadonly}>
                    </td>
                    <td class="align-middle">
                        ${colComandos}
                    </td>
                </tr>`;
            });
        } catch(e) { console.error("Error al cargar el catálogo:", e); }
    }

    async function actualizarProducto(id) {
        playSound('click');
        const nuevoNombre = document.getElementById(`nombre-prod-${id}`).value;
        const nuevaCategoria = document.getElementById(`cat-prod-${id}`).value;
        const nuevoPrecio = document.getElementById(`precio-prod-${id}`).value;
        const nuevaImagen = document.getElementById(`img-prod-${id}`).value;
        const nuevaDesc = document.getElementById(`desc-prod-${id}`).value;

        try {
            const res = await fetch(`/api/productos/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: nuevoNombre,
                    categoria: nuevaCategoria,
                    precio: parseInt(nuevoPrecio),
                    imagen: nuevaImagen,
                    descripcion: nuevaDesc
                })
            });
            if(res.ok) {
                const imgDisp = document.getElementById(`img-display-${id}`);
                if(imgDisp && nuevaImagen) {
                    if(imgDisp.tagName === 'I') {
                        imgDisp.outerHTML = `<img src="${nuevaImagen}" class="img-preview" id="img-display-${id}">`;
                    } else {
                        imgDisp.src = nuevaImagen;
                    }
                }
                const fila = document.getElementById(`fila-prod-${id}`);
                fila.style.boxShadow = "inset 0 0 30px var(--p-bio-green)";
                setTimeout(() => fila.style.boxShadow = "", 1000);
            }
        } catch(e) { playSound('error'); }
    }

    async function eliminarProducto(id) {
        playSound('error');
        if(confirm("ALERTA: ¿Deseas purgar este elixir de la base de datos de manera irreversible?")) {
            try {
                const res = await fetch(`/api/productos/${id}`, { method: 'DELETE' });
                if(res.ok) { document.getElementById(`fila-prod-${id}`).remove(); }
            } catch(e) { console.error("Error al purgar", e); }
        }
    }

    // --- CARGA MASIVA CSV ---
    const dropZone = document.getElementById('drop-zone');
    if (dropZone) {
        dropZone.addEventListener('dragover', (e) => { e.preventDefault(); dropZone.classList.add('dragover'); });
        dropZone.addEventListener('dragleave', () => { dropZone.classList.remove('dragover'); });
        dropZone.addEventListener('drop', (e) => {
            e.preventDefault(); dropZone.classList.remove('dragover');
            if(e.dataTransfer.files.length > 0) processUpload(e.dataTransfer.files);
        });
    }

    function handleMassiveUpload(event) {
        if(event.target.files.length > 0) processUpload(event.target.files);
    }

    function processUpload(files) {
        const file = files[0];

        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert("⚠️ Formato incorrecto. Sube un archivo .csv"); return;
        }

        const sucursalDestino = document.getElementById('filtro-sucursal-catalogo').value;
        playSound('upload');

        const icon = document.getElementById('upload-icon');
        const container = document.getElementById('upload-progress-container');
        const bar = document.getElementById('upload-bar');
        const status = document.getElementById('upload-status');

        icon.className = "bi bi-arrow-repeat spin-icon";
        container.style.display = 'block'; bar.style.width = '0%';
        let progress = 0; status.innerText = `LEYENDO ESTRUCTURA CSV...`;

        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            complete: async function(results) {
                const data = results.data;
                const totalItems = data.length;
                let procesados = 0;

                status.innerText = `INYECTANDO ${totalItems} DATOS AL NODO ${sucursalDestino.toUpperCase()}...`;

                for (const row of data) {
                    const nombre = row.PRODUCTO || row.producto || "";
                    const imagen = row.IMAGEN || row.imagen || "";
                    const precio = parseInt(row.PRECIO || row.precio || 0);
                    const descripcion = row.DESCRIPCION || row.descripcion || "";
                    const categoria = row.CATEGORIA || row.categoria || "Batidos";

                    if (nombre) {
                        try {
                            await fetch('/api/productos', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    nombre: nombre,
                                    imagen: imagen,
                                    precio: precio,
                                    descripcion: descripcion,
                                    categoria: categoria,
                                    sucursal: sucursalDestino,
                                    stock: 0
                                })
                            });
                        } catch(e) {}
                    }
                    procesados++;
                    bar.style.width = (procesados / totalItems * 100) + '%';
                }

                playSound('success');
                icon.className = "bi bi-check-circle-fill text-success";
                status.innerText = `¡SÍNTESIS MASIVA COMPLETADA!`;
                status.style.color = "var(--p-bio-green)";
                bar.style.background = "var(--p-bio-green)";

                cargarCatalogo();

                setTimeout(() => {
                    container.style.display = 'none';
                    icon.className = "bi bi-filetype-csv";
                    bar.style.width = '0%';
                    bar.style.background = "linear-gradient(90deg, var(--p-magenta), var(--p-cyan))";
                    status.style.color = "#fff";
                }, 3000);
            },
            error: function(error) {
                alert("Error al leer el CSV: " + error.message);
                container.style.display = 'none';
            }
        });
    }

    // ==========================================
    // ASISTENTE DE VOZ DEL ADMINISTRADOR (EYWA-ADMIN)
    // ==========================================
    let recVozAdmin = null;

    function hablarAdmin(texto) {
        window.speechSynthesis.cancel();
        const voz = new SpeechSynthesisUtterance(texto);
        voz.lang = 'es-ES';
        voz.rate = 1.05;
        voz.pitch = 1.0;
        window.speechSynthesis.speak(voz);
    }

    function generarReporteVentas() {
        let col = document.getElementById('caja-col').innerText || "0";
        let chi = document.getElementById('caja-chi').innerText || "0";
        let esp = document.getElementById('caja-esp').innerText || "0";

        if (rolUsuario === 'SUPREMO') {
            return `En tesorería general tenemos: Nodo Colombia con ${col} pesos. Nodo Chile con ${chi} pesos. Y Nodo España con ${esp} euros. `;
        } else {
            if(sucursalAdmin === 'Colombia') return `La tesorería del Nodo Colombia registra ${col} pesos. `;
            if(sucursalAdmin === 'Chile') return `La tesorería del Nodo Chile registra ${chi} pesos. `;
            if(sucursalAdmin === 'España') return `La tesorería del Nodo España registra ${esp} euros. `;
        }
        return "No hay datos de ventas disponibles. ";
    }

    function generarReporteProduccion() {
        let totalElixires = produccionGlobal.filter(p => p.stock > 0);
        if (rolUsuario !== 'SUPREMO') {
            totalElixires = totalElixires.filter(p => normalizarStr(p.sucursal).includes(normalizarStr(sucursalAdmin)));
        }
        return `En el sintetizador genético tenemos ${totalElixires.length} elíxires con stock activo. `;
    }

    function generarReporteBodega() {
        let totalInsumos = insMem;
        if (rolUsuario !== 'SUPREMO') {
            totalInsumos = totalInsumos.filter(i => normalizarStr(i.sucursal).includes(normalizarStr(sucursalAdmin)));
        }
        return `La bodega botánica cuenta con ${totalInsumos.length} elementos físicos y materias primas registradas. `;
    }

    function iniciarVozAdmin() {
        if (!('webkitSpeechRecognition' in window)) {
            alert("Tu navegador no soporta el reconocimiento de voz."); return;
        }

        const btnMic = document.getElementById('btn-mic-admin');

        if(recVozAdmin) recVozAdmin.stop();

        recVozAdmin = new webkitSpeechRecognition();
        recVozAdmin.lang = 'es-ES';
        recVozAdmin.continuous = false;
        recVozAdmin.interimResults = false;

        recVozAdmin.onstart = function() {
            btnMic.classList.add('escuchando');
            playSound('magic');
        };

        recVozAdmin.onresult = function(event) {
            const comandoRaw = event.results[0][0].transcript;
            console.log("Comando Admin: ", comandoRaw);
            procesarComandoAdmin(comandoRaw);
        };

        recVozAdmin.onend = function() {
            btnMic.classList.remove('escuchando');
        };

        recVozAdmin.start();
    }

    function procesarComandoAdmin(comandoRaw) {
        const comando = normalizarStr(comandoRaw);

        if (comando.includes("informe") || comando.includes("reporte") || comando.includes("resumen")) {
            let reporteCompleto = "Comandante, iniciando escaneo de la matriz. " +
                                  generarReporteVentas() +
                                  generarReporteProduccion() +
                                  generarReporteBodega() +
                                  "Fin del comunicado.";
            hablarAdmin(reporteCompleto);
        }
        else if (comando.includes("venta") || comando.includes("caja") || comando.includes("tesoreria") || comando.includes("dinero")) {
            hablarAdmin(generarReporteVentas());
        }
        else if (comando.includes("produccion") || comando.includes("elixir") || comando.includes("batido")) {
            hablarAdmin(generarReporteProduccion());
        }
        else if (comando.includes("bodega") || comando.includes("insumo") || comando.includes("material") || comando.includes("vaso")) {
            hablarAdmin(generarReporteBodega());
        }
        else {
            hablarAdmin("Comando no reconocido. Por favor, solicite información sobre ventas, producción, bodega o pida un informe general.");
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
            navigator.serviceWorker.register('/sw.js').catch(err => console.log('SW Error:', err));
        });
    }


