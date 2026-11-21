var $ = function(id) { return document.getElementById(id); };
var scrubVideo = $('scroll-cinematic-video'), cinematicSection = $('cinematic-experience'), hudBar = $('hud-progress-bar');
var hud = [1, 2, 3, 4].map(function(i) { return $('hud-chap-' + i); });
var isAutoplayActive = false, targetTime = 0, scrollProgress = 0, lastSeekTimestamp = 0;
var esc = function(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function(c) { return '&#' + c.charCodeAt(0) + ';'; }); };
var money = function(n) { return '$' + Number(n).toLocaleString('es-CO'); };

/* Configuración dinámica conectada a /api/ajustes-web */
var AJUSTES = {
    heroTitulo: 'RAÍCES',
    heroSubtitulo: 'Nutrición celular viva, sin pasteurizar y sin azúcar añadida.',
    marquesinaTexto: 'Prensado en frío | Sin azúcar añadida | Sin conservantes | Cosecha de menos de 24 horas | Despacho el mismo día | Pide por voz',
    bannerPromoActivo: false,
    bannerPromoTexto: '',
    whatsappNumero: '573177651016',
    efectoSimiosActivo: true,
    efectoFloraActivo: true,
    efectoParticulasChimp: true,
    efectoLicuadoraActivo: true,
    efectoAudioFondo: true,
    blogBadge: 'COMUNIDAD BIO-ACTIVA & BLOG',
    blogTitulo: 'ESPACIO DE CONOCIMIENTO & CONEXIÓN VITAL',
    blogSubtitulo: 'Descubre los fundamentos de la nutrición celular viva, novedades del laboratorio RAÍCES y comparte tus sugerencias y peticiones de nuevos sabores para construir la comunidad.',
    blogActivo: true
};

function cargarAjustesDesdeBackend() {
    fetch('/api/ajustes-web')
        .then(function(res) { if (!res.ok) throw new Error('Status ' + res.status); return res.json(); })
        .then(function(data) {
            AJUSTES = Object.assign({}, AJUSTES, data);
            aplicarAjustesEnUI();
        })
        .catch(function(err) {
            console.warn('Ajustes locales activos (reserva offline):', err);
            aplicarAjustesEnUI();
        });
}

function actualizarHeaderOffset() {
    var banner = $('banner-anuncio-top');
    var nav = $('main-nav');
    var bh = (banner && banner.style.display !== 'none') ? banner.offsetHeight : 0;
    if (nav) nav.style.top = bh + 'px';
    var nh = nav ? nav.offsetHeight : 64;
    document.documentElement.style.setProperty('--header-offset', (bh + nh) + 'px');
}
window.addEventListener('resize', actualizarHeaderOffset, { passive: true });

function toggleNavOnScroll() {
    var nav = $('main-nav');
    if (!nav) return;
    if (window.scrollY > 16) {
        nav.classList.add('nav-hidden');
    } else {
        nav.classList.remove('nav-hidden');
    }
}
window.addEventListener('scroll', toggleNavOnScroll, { passive: true });

function aplicarAjustesEnUI() {
    // 0. Banner superior de Anuncio
    var banner = $('banner-anuncio-top');
    var nav = $('main-nav');
    if (banner) {
        if (AJUSTES.bannerPromoActivo && AJUSTES.bannerPromoTexto) {
            banner.innerHTML = AJUSTES.bannerPromoTexto;
            banner.style.display = 'flex';
        } else {
            banner.style.display = 'none';
        }
    }
    actualizarHeaderOffset();

    // 0.1 Header y Navegación
    if (AJUSTES.navBrandNombre) {
        if ($('nav-brand-nombre')) $('nav-brand-nombre').innerText = AJUSTES.navBrandNombre;
        if ($('footer-brand-nombre')) $('footer-brand-nombre').innerText = AJUSTES.navBrandNombre;
    }
    if (AJUSTES.navBrandTagline && $('nav-brand-tagline')) $('nav-brand-tagline').innerText = AJUSTES.navBrandTagline;
    if (AJUSTES.navLink1 && $('nav-link-1')) $('nav-link-1').innerText = AJUSTES.navLink1;
    if (AJUSTES.navLink2 && $('nav-link-2')) $('nav-link-2').innerText = AJUSTES.navLink2;
    if (AJUSTES.navLink3 && $('nav-link-3')) $('nav-link-3').innerText = AJUSTES.navLink3;
    if (AJUSTES.navLink4 && $('nav-link-4')) $('nav-link-4').innerText = AJUSTES.navLink4;
    if (AJUSTES.navBotonModo && $('text-scrub-mode')) $('text-scrub-mode').innerText = AJUSTES.navBotonModo;
    if (AJUSTES.navBotonPedir && $('nav-btn-pedir')) $('nav-btn-pedir').innerHTML = esc(AJUSTES.navBotonPedir) + ' <i class="bi bi-arrow-right"></i>';

    // 0.2 Footer
    if (AJUSTES.footerFrase && $('footer-display-frase')) $('footer-display-frase').innerText = AJUSTES.footerFrase;
    if (AJUSTES.footerCopyright && $('footer-display-copyright')) $('footer-display-copyright').innerText = AJUSTES.footerCopyright;
    if (AJUSTES.footerNorma && $('footer-display-norma')) $('footer-display-norma').innerText = AJUSTES.footerNorma;

    // 1. Hero Cinematográfico
    if (AJUSTES.heroBadge && $('hero-display-badge')) $('hero-display-badge').innerText = AJUSTES.heroBadge;
    if (AJUSTES.heroTitulo && $('hero-display-titulo')) $('hero-display-titulo').innerText = AJUSTES.heroTitulo;
    if (AJUSTES.heroSubtitulo && $('hero-display-subtitulo')) $('hero-display-subtitulo').innerText = AJUSTES.heroSubtitulo;
    if (AJUSTES.heroScrollCta && $('hero-display-cta')) $('hero-display-cta').innerText = AJUSTES.heroScrollCta;

    // 3. Escenas sobre el video (4 Esquinas Dinámicas)
    // Escena 1 (Inferior Izquierda)
    if (AJUSTES.videoEscena1Tag && $('video-escena1-tag')) $('video-escena1-tag').innerText = AJUSTES.videoEscena1Tag;
    if (AJUSTES.videoEscena1Titulo && $('video-escena1-titulo')) $('video-escena1-titulo').innerHTML = AJUSTES.videoEscena1Titulo;
    if (AJUSTES.videoEscena1Cifra && $('video-escena1-cifra')) $('video-escena1-cifra').innerText = AJUSTES.videoEscena1Cifra;
    if (AJUSTES.videoEscena1CifraLabel && $('video-escena1-cifra-label')) $('video-escena1-cifra-label').innerText = AJUSTES.videoEscena1CifraLabel;
    if (AJUSTES.videoEscena1Desc && $('video-escena1-desc')) $('video-escena1-desc').innerText = AJUSTES.videoEscena1Desc;

    // Escena 2 (Inferior Derecha)
    if (AJUSTES.videoEscena2Tag && $('video-escena2-tag')) $('video-escena2-tag').innerText = AJUSTES.videoEscena2Tag;
    if (AJUSTES.videoEscena2Titulo && $('video-escena2-titulo')) $('video-escena2-titulo').innerHTML = AJUSTES.videoEscena2Titulo;
    if (AJUSTES.videoEscena2Cifra && $('video-escena2-cifra')) $('video-escena2-cifra').innerText = AJUSTES.videoEscena2Cifra;
    if (AJUSTES.videoEscena2CifraLabel && $('video-escena2-cifra-label')) $('video-escena2-cifra-label').innerText = AJUSTES.videoEscena2CifraLabel;
    if (AJUSTES.videoEscena2Desc && $('video-escena2-desc')) $('video-escena2-desc').innerText = AJUSTES.videoEscena2Desc;

    // Escena 3 (Inferior Izquierda)
    if (AJUSTES.videoEscena3Tag && $('video-escena3-tag')) $('video-escena3-tag').innerText = AJUSTES.videoEscena3Tag;
    if (AJUSTES.videoEscena3Titulo && $('video-escena3-titulo')) $('video-escena3-titulo').innerHTML = AJUSTES.videoEscena3Titulo;
    if (AJUSTES.videoEscena3Cifra && $('video-escena3-cifra')) $('video-escena3-cifra').innerText = AJUSTES.videoEscena3Cifra;
    if (AJUSTES.videoEscena3CifraLabel && $('video-escena3-cifra-label')) $('video-escena3-cifra-label').innerText = AJUSTES.videoEscena3CifraLabel;
    if (AJUSTES.videoEscena3Desc && $('video-escena3-desc')) $('video-escena3-desc').innerText = AJUSTES.videoEscena3Desc;

    // Escena 4 (Inferior Derecha)
    if (AJUSTES.videoEscena4Tag && $('video-escena4-tag')) $('video-escena4-tag').innerText = AJUSTES.videoEscena4Tag;
    if (AJUSTES.videoEscena4Titulo && $('video-escena4-titulo')) $('video-escena4-titulo').innerHTML = AJUSTES.videoEscena4Titulo;
    if (AJUSTES.videoEscena4Desc && $('video-escena4-desc')) $('video-escena4-desc').innerText = AJUSTES.videoEscena4Desc;
    if (AJUSTES.videoEscena4Boton && $('video-escena4-boton')) $('video-escena4-boton').innerHTML = AJUSTES.videoEscena4Boton + ' <i class="bi bi-arrow-down-circle ms-1.5"></i>';

    // 4. Marquesina dinámica
    if (AJUSTES.marquesinaTexto) {
        var items = AJUSTES.marquesinaTexto.split('|').map(function(s) { return s.trim(); }).filter(Boolean);
        if (items.length) {
            var html = items.map(function(t) {
                return '<span class="flex items-center gap-3 font-cinzel text-lg text-slate-300 whitespace-nowrap"><i class="bi bi-stars text-emerald-400"></i>' + esc(t) + '</span>';
            }).join('');
            $('marquee-track').innerHTML = html + html;
        }
    }

    // 5. Secciones del Menú (Catálogo, Seis Raíces, Protocolo)
    if (AJUSTES.catalogoTitulo && $('catalogo-display-titulo')) $('catalogo-display-titulo').innerHTML = AJUSTES.catalogoTitulo;
    if (AJUSTES.catalogoSubtitulo && $('catalogo-display-subtitulo')) $('catalogo-display-subtitulo').innerText = AJUSTES.catalogoSubtitulo;

    if (AJUSTES.ingredientesTitulo && $('ingredientes-display-titulo')) $('ingredientes-display-titulo').innerHTML = AJUSTES.ingredientesTitulo;
    if (AJUSTES.ingredientesSubtitulo && $('ingredientes-display-subtitulo')) $('ingredientes-display-subtitulo').innerText = AJUSTES.ingredientesSubtitulo;

    if (AJUSTES.protocoloTitulo && $('protocolo-display-titulo')) $('protocolo-display-titulo').innerHTML = AJUSTES.protocoloTitulo;
    if (AJUSTES.protocoloSubtitulo && $('protocolo-display-subtitulo')) $('protocolo-display-subtitulo').innerText = AJUSTES.protocoloSubtitulo;

    // 6. Sección Chimpancé
    if (AJUSTES.chimpanceTag && $('chimpance-display-tag')) $('chimpance-display-tag').innerText = AJUSTES.chimpanceTag;
    if (AJUSTES.chimpanceTexto && $('cwords')) {
        $('cwords').innerText = AJUSTES.chimpanceTexto;
        if (typeof window.__rebuildChimpWords === 'function') window.__rebuildChimpWords();
    }
    if (AJUSTES.chimpanceBoton && $('chimpance-display-boton')) $('chimpance-display-boton').innerText = AJUSTES.chimpanceBoton;

    // 7. Efecto simios asomados
    if (AJUSTES.efectoSimiosActivo === false) {
        document.querySelectorAll('.ape-peek').forEach(function(el) { el.style.display = 'none'; });
    } else {
        document.querySelectorAll('.ape-peek').forEach(function(el) { el.style.display = ''; });
    }

    // 8. Efecto vegetación/flora
    if (AJUSTES.efectoFloraActivo === false) {
        document.querySelectorAll('.flora, .cfl').forEach(function(el) { el.style.display = 'none'; });
    } else {
        document.querySelectorAll('.flora, .cfl').forEach(function(el) { el.style.display = ''; });
    }

    // 9. Configuración y textos de Comunidad & Blog
    var secComunidad = $('comunidad');
    var catComunidad = $('cat-btn-comunidad');
    var navComunidad = $('nav-link-comunidad');
    var blogVisible = (AJUSTES.blogActivo !== false);
    if (secComunidad) secComunidad.style.display = blogVisible ? '' : 'none';
    if (catComunidad) catComunidad.style.display = blogVisible ? '' : 'none';
    if (navComunidad) navComunidad.style.display = blogVisible ? '' : 'none';

    if (AJUSTES.blogBadge) {
        if ($('blog-display-badge')) $('blog-display-badge').innerText = AJUSTES.blogBadge;
        if ($('comunidad-nav-badge')) $('comunidad-nav-badge').innerText = AJUSTES.blogBadge;
    }
    if (AJUSTES.blogTitulo) {
        if ($('blog-display-titulo')) $('blog-display-titulo').innerHTML = AJUSTES.blogTitulo;
        if ($('comunidad-nav-titulo')) $('comunidad-nav-titulo').innerHTML = AJUSTES.blogTitulo;
    }
    if (AJUSTES.blogSubtitulo) {
        if ($('blog-display-subtitulo')) $('blog-display-subtitulo').innerText = AJUSTES.blogSubtitulo;
        if ($('comunidad-nav-subtitulo')) $('comunidad-nav-subtitulo').innerText = AJUSTES.blogSubtitulo;
    }
}

/* Contenido estático inicial */
var BADGES = [ ['Espinaca silvestre', 'Clorofila pura', 'text-emerald-400'], ['Aloe vera nativo', 'Mucílago celular', 'text-aloe-400'], ['Jengibre prensado', 'Gingerol activo', 'text-amber-400'], ['Cúrcuma de raíz', 'Curcumina 95%', 'text-turmeric-400'] ];
if ($('hero-badges')) {
    $('hero-badges').innerHTML = BADGES.map(function(b) {
        return '<div class="px-4 py-3 rounded-2xl bg-black/30 border border-white/10 backdrop-blur-md text-left"><div class="text-xs text-slate-300">' + b[0] + '</div><div class="text-sm font-semibold ' + b[2] + '">' + b[1] + '</div></div>';
    }).join('');
}

var mq = ['Prensado en frío', 'Sin azúcar añadida', 'Sin conservantes', 'Cosecha de menos de 24 horas', 'Despacho el mismo día', 'Pide por voz'];
var mqHtml = mq.map(function(t) { return '<span class="flex items-center gap-3 font-cinzel text-lg text-slate-300 whitespace-nowrap"><i class="bi bi-stars text-emerald-400"></i>' + t + '</span>'; }).join('');
$('marquee-track').innerHTML = mqHtml + mqHtml;

/* Bento de Ingredientes */
var ING = [
    ['bi-flower1', 'Espinaca silvestre', 'Spinacia oleracea', 'Rica en tilacoides y antioxidantes que estimulan la regeneración celular y el transporte de oxígeno en sangre.', 'Clorofila 100%', '98.2%', '#22c55e', 'text-emerald-400', 'md:col-span-4'],
    ['bi-moisture', 'Aloe vera barbadensis', 'Aloe barbadensis Miller', 'Mucílagos vivos que regeneran la barrera gástrica y aceleran la cicatrización.', 'Acemanano nativo', '96.5%', '#a3e635', 'text-aloe-400', 'md:col-span-2'],
    ['bi-fire', 'Jengibre de raíz', 'Zingiber officinale', 'Su gingerol mejora la microcirculación y reparte mejor los compuestos activos.', 'Gingerol activo', '94.8%', '#f59e0b', 'text-amber-400', 'md:col-span-2'],
    ['bi-stars', 'Cúrcuma de raíz', 'Curcuma longa', 'Modula la inflamación celular y apoya la función depurativa del hígado.', 'Curcumina 95%', '92.3%', '#fbbf24', 'text-yellow-400', 'md:col-span-2'],
    ['bi-droplet-half', 'Semillas de chía', 'Salvia hispanica', 'Hidrocoloides naturales que hidratan y retardan la liberación de glucosa.', 'Omega-3 nativo', '95.0%', '#94a3b8', 'text-slate-300', 'md:col-span-2'],
    ['bi-heart-pulse', 'Remolacha y rábano', 'Beta vulgaris', 'Fuente primaria de betanina: estimula la circulación y dispara el flujo de oxígeno celular.', 'Óxido nítrico', '97.5%', '#10b981', 'text-emerald-400', 'md:col-span-6']
];
if ($('grid-ing')) {
    $('grid-ing').innerHTML = ING.map(function(g, i) {
        return '<div class="spot reveal rounded-[28px] p-8 ' + g[8] + '" style="--c:' + g[6] + ';--i:' + i + '"><div class="flex items-start justify-between mb-6"><span class="w-12 h-12 rounded-2xl bg-white/[.06] border border-white/15 grid place-items-center text-xl ' + g[7] + '"><i class="bi ' + g[0] + '"></i></span><span class="px-3 py-1 rounded-full text-xs font-semibold ' + g[7] + ' bg-black/30 border border-white/15">' + g[4] + '</span></div>' +
            '<h3 class="font-cinzel text-2xl font-bold mb-1">' + g[1] + '</h3><p class="text-sm italic text-slate-400 mb-4">' + g[2] + '</p><p class="text-slate-300 leading-relaxed mb-6 font-light max-w-xl">' + g[3] + '</p>' +
            '<div class="pt-5 border-t border-white/10 flex items-center justify-between text-sm"><span class="text-slate-400">Biodisponibilidad</span><span class="font-bold ' + g[7] + '">' + g[5] + '</span></div></div>';
    }).join('');
}

var DET = [ ['1', 'Depuración hepática', 'La clorofila y la curcumina ayudan a eliminar toxinas acumuladas y metales pesados.', 'text-emerald-400', '#22c55e'], ['2', 'Activación vascular', 'Los fitoquímicos vivos optimizan el flujo de oxígeno y nutrientes a nivel celular.', 'text-emerald-400', '#22c55e'], ['3', 'Regeneración de mucosa', 'El acemanano del aloe repara el endotelio digestivo para absorber mejor.', 'text-turmeric-400', '#fbbf24'] ];
if ($('grid-det')) {
    $('grid-det').innerHTML = DET.map(function(d, i) {
        return '<div class="spot reveal rounded-[28px] p-8" style="--c:' + d[4] + ';--i:' + i + '"><div class="font-cinzel text-6xl font-black ' + d[3] + ' mb-4">' + d[0] + '</div><h3 class="font-cinzel text-xl font-bold mb-3">' + d[1] + '</h3><p class="text-slate-300 text-sm font-light leading-relaxed">' + d[2] + '</p></div>';
    }).join('');
}

var STATS = [ [24, ' h', 'de la cosecha a tu mesa'], [0, ' g', 'de azúcar añadida'], [6, '', 'raíces por botella'], [98, '%', 'de biodisponibilidad'] ];
if ($('stats')) {
    $('stats').innerHTML = STATS.map(function(s, i) {
        return '<div class="spot reveal rounded-3xl p-6 text-center" style="--i:' + i + '"><div class="font-cinzel text-4xl md:text-5xl font-black shine"><span data-count="' + s[0] + '">0</span>' + s[1] + '</div><p class="text-xs text-slate-400 mt-2">' + s[2] + '</p></div>';
    }).join('');
}

/* 1. Video controlado por scroll */
var scrollPauseTimeout = null;
var isScrubSeeking = false;
var lastScrubScrollY = window.scrollY;

if (scrubVideo) {
    scrubVideo.muted = true;
    scrubVideo.playsInline = true;
    var onMeta = function() {
        if (!isAutoplayActive) {
            scrubVideo.pause();
            updateScrollProgress();
        }
    };
    if (scrubVideo.readyState >= 1) onMeta();
    else {
        scrubVideo.addEventListener('loadedmetadata', onMeta, { once: true });
        scrubVideo.addEventListener('canplay', onMeta, { once: true });
    }
    scrubVideo.addEventListener('seeked', function() {
        isScrubSeeking = false;
    });
}
function togglePlayPauseVideo() {
    var icon = $('icon-scrub-mode'), text = $('text-scrub-mode');
    isAutoplayActive = !isAutoplayActive;
    if (isAutoplayActive) {
        scrubVideo.loop = true;
        scrubVideo.playbackRate = 1.0;
        scrubVideo.play();
        icon.className = 'bi bi-pause-circle text-ruby-400';
        text.innerText = 'Modo scroll';
    } else {
        scrubVideo.pause();
        icon.className = 'bi bi-play-circle text-emerald-400';
        text.innerText = 'Ver continuo';
        updateScrollProgress();
    }
}
function scrollToProgress(t) {
    var top = window.scrollY + cinematicSection.getBoundingClientRect().top;
    window.scrollTo({ top: top + t * (cinematicSection.offsetHeight - window.innerHeight), behavior: 'smooth' });
}
function updateScrollProgress() {
    var rect = cinematicSection.getBoundingClientRect();
    var scrollable = cinematicSection.offsetHeight - window.innerHeight;
    var doc = document.documentElement;
    $('progress').style.width = (window.scrollY / Math.max(1, doc.scrollHeight - window.innerHeight) * 100) + '%';
    if (scrollable <= 0) return;
    scrollProgress = Math.max(0, Math.min(1, -rect.top / scrollable));
    hudBar.style.height = (scrollProgress * 100) + '%';
    var dur = (scrubVideo && scrubVideo.duration && isFinite(scrubVideo.duration)) ? scrubVideo.duration : 10.027;
    targetTime = Math.min(scrollProgress, 0.999) * dur;
    hud[0].classList.toggle('active', scrollProgress < 0.2);
    hud[1].classList.toggle('active', scrollProgress >= 0.2 && scrollProgress < 0.6);
    hud[2].classList.toggle('active', scrollProgress >= 0.6 && scrollProgress < 0.8);
    hud[3].classList.toggle('active', scrollProgress >= 0.8);

    // Reproducción viva y sincronizada según el movimiento del scroll
    if (!isAutoplayActive && scrubVideo && isFinite(targetTime) && scrubVideo.readyState >= 2) {
        var diff = targetTime - scrubVideo.currentTime;
        var isScrollingDown = window.scrollY >= lastScrubScrollY;
        lastScrubScrollY = window.scrollY;

        if (isScrollingDown && diff > 0.06) {
            scrubVideo.playbackRate = Math.min(3.5, Math.max(0.75, diff * 2.5));
            if (scrubVideo.paused) {
                scrubVideo.play().catch(function() {});
            }
            clearTimeout(scrollPauseTimeout);
            scrollPauseTimeout = setTimeout(function() {
                if (!isAutoplayActive && scrubVideo) scrubVideo.pause();
            }, 140);
        } else if (!isScrollingDown && diff < -0.06) {
            if (!scrubVideo.paused) scrubVideo.pause();
            if (!scrubVideo.seeking && !isScrubSeeking) {
                isScrubSeeking = true;
                if (typeof scrubVideo.fastSeek === 'function') {
                    scrubVideo.fastSeek(targetTime);
                } else {
                    scrubVideo.currentTime = targetTime;
                }
            }
        }
    }

    if (window.floraTick) floraTick();
}
window.addEventListener('scroll', updateScrollProgress, { passive: true });
window.addEventListener('resize', updateScrollProgress);

var clamp = function(v) { return Math.max(0, Math.min(1, v)); };
var ss = function(a, b, x) { if (b <= a) return x >= a ? 1 : 0; var t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
var texts = Array.prototype.map.call(document.querySelectorAll('.scroll-text'), function(el) { return { el: el, r: el.getAttribute('data-r').split(',').map(Number) }; });

function cinematicScrubLoop() {
    if (!isAutoplayActive && scrubVideo && isFinite(targetTime)) {
        if (!scrubVideo.paused && scrubVideo.currentTime >= targetTime) {
            scrubVideo.pause();
        }
    }
    for (var i = 0; i < texts.length; i++) {
        var t = texts[i], inV = ss(t.r[0], t.r[1], scrollProgress), outV = ss(t.r[2], t.r[3], scrollProgress), a = inV * (1 - outV);
        t.el.style.opacity = a;
        if (t.el.id === 'scene-hero') {
            var shiftY = (1 - inV) * 35 - outV * 35;
            t.el.style.transform = 'translate3d(0,' + shiftY + 'px,0)';
        } else if (t.el.classList.contains('corner-left')) {
            var shiftX = (1 - inV) * -45 - outV * 35;
            var shiftY = (1 - inV) * 22 - outV * 15;
            t.el.style.transform = 'translate3d(' + shiftX + 'px,' + shiftY + 'px,0)';
        } else if (t.el.classList.contains('corner-right')) {
            var shiftX = (1 - inV) * 45 + outV * 35;
            var shiftY = (1 - inV) * 22 - outV * 15;
            t.el.style.transform = 'translate3d(' + shiftX + 'px,' + shiftY + 'px,0)';
        } else {
            var shiftY = (1 - inV) * 16 - outV * 16;
            t.el.style.transform = 'translate3d(0,' + shiftY + 'px,0)';
        }
        t.el.style.visibility = a < 0.02 ? 'hidden' : 'visible';
    }
    requestAnimationFrame(cinematicScrubLoop);
}
cinematicScrubLoop();

/* 2. Revelado, contadores */
var io = new IntersectionObserver(function(entries) {
    entries.forEach(function(e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('visible'); io.unobserve(e.target);
        e.target.querySelectorAll('[data-count]').forEach(function(c) {
            var end = +c.getAttribute('data-count'), t0 = performance.now();
            (function tick(n) { var p = Math.min(1, (n - t0) / 1400); c.textContent = Math.round(end * (1 - Math.pow(1 - p, 3))); if (p < 1) requestAnimationFrame(tick); })(t0);
        });
    });
}, { threshold: 0.15 });
function observeReveals() { document.querySelectorAll('.reveal:not(.visible)').forEach(function(el) { io.observe(el); }); }
observeReveals();

/* 3. Foco de luz, inclinación 3D y botones magnéticos */
document.addEventListener('pointermove', function(e) {
    var s = e.target.closest ? e.target.closest('.spot') : null;
    if (s) { var r = s.getBoundingClientRect(); s.style.setProperty('--mx', (e.clientX - r.left) + 'px'); s.style.setProperty('--my', (e.clientY - r.top) + 'px'); }
    var cc = e.target.closest ? e.target.closest('.corner-card') : null;
    if (cc) { var cr = cc.getBoundingClientRect(); cc.style.setProperty('--cx', (e.clientX - cr.left) + 'px'); cc.style.setProperty('--cy', (e.clientY - cr.top) + 'px'); }
    if (e.pointerType !== 'mouse') return;
    var c = e.target.closest ? e.target.closest('.card-escena') : null;
    if (c) { var b = c.getBoundingClientRect(); c.style.transform = 'rotateX(' + ((e.clientY - b.top) / b.height - .5) * -9 + 'deg) rotateY(' + ((e.clientX - b.left) / b.width - .5) * 9 + 'deg) translateY(-6px)'; }
    var m = e.target.closest ? e.target.closest('.btn-leaf,.btn-ruby') : null;
    if (m) { var q = m.getBoundingClientRect(); m.style.transform = 'translate(' + (e.clientX - q.left - q.width / 2) * .18 + 'px,' + (e.clientY - q.top - q.height / 2) * .25 + 'px) scale(1.05)'; }
});
document.addEventListener('pointerout', function(e) {
    var el = e.target.closest ? e.target.closest('.card-escena,.btn-leaf,.btn-ruby') : null;
    if (el) el.style.transform = '';
});

function toast(msg) { var t = $('toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(toast._t); toast._t = setTimeout(function() { t.classList.remove('show'); }, 2200); }

/* 4. Meta Pixel + CAPI */
function trackEvent(eventName, customData) {
    if (!customData) customData = {};
    var eventId = eventName + '_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    var getCookie = function(n) { var v = document.cookie.match('(^|;)\\s*' + n + '\\s*=\\s*([^;]+)'); return v ? v.pop() : ''; };
    var val = function(id) { var e = $(id); return e ? e.value.trim() : ''; };
    var nombre = val('nombreCliente'), telefono = val('telefonoCliente'), correo = val('correoCliente'), ciudad = val('ciudadCliente'), zp = val('codigoPostalCliente');
    var fn = '', ln = '';
    if (nombre) { var p = nombre.split(/\s+/); fn = p[0] || ''; ln = p.slice(1).join(' ') || ''; }
    var sucursal = $('sucursal-activa') ? $('sucursal-activa').value : 'Colombia';
    var country = 'co';
    if (sucursal === 'Chile') country = 'cl';
    if (sucursal === 'España') country = 'es';
    var userData = { em: correo.toLowerCase(), ph: telefono.replace(/\D/g, ''), fn: fn, ln: ln, ct: ciudad.toLowerCase(), country: country, zp: zp, fbp: getCookie('_fbp'), fbc: getCookie('_fbc'), client_user_agent: navigator.userAgent };
    if (typeof fbq === 'function') fbq('track', eventName, customData, { eventID: eventId });
    fetch('https://bot.gomezz.space/webhook/meta-webhook', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ event_name: eventName, event_time: Math.floor(Date.now() / 1000), event_id: eventId, event_source_url: window.location.href, action_source: 'website', user_data: userData, custom_data: customData }) }).catch(function(err) { console.error('Error CAPI:', err); });
}

/* 5. Audio */
var mainAudio = $('mainAudio'), cashSound = $('sfxCash'), blenderSound = $('sfxBlender'), apeSound = $('sfxApe');
var lastApeSoundTime = 0;
function playApeSound(force) {
    if (AJUSTES && AJUSTES.efectoSimiosActivo === false) return;
    var now = performance.now();
    if (!force && now - lastApeSoundTime < 3800) return;
    lastApeSoundTime = now;
    if (!apeSound) apeSound = $('sfxApe');
    if (apeSound) {
        apeSound.currentTime = 0;
        apeSound.volume = 1;
        var p = apeSound.play();
        if (p && typeof p.catch === 'function') {
            p.catch(function(err) { console.log('Ape sound play handled:', err); });
        }
    }
}
var blenderFadeInterval = null;
var blenderCtx = null;
var blenderNodes = null;

function startWebAudioBlenderSynth() {
    try {
        var AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        if (!blenderCtx) blenderCtx = new AudioCtx();
        if (blenderCtx.state === 'suspended') blenderCtx.resume();

        var t = blenderCtx.currentTime;
        var masterGain = blenderCtx.createGain();
        masterGain.gain.setValueAtTime(0.01, t);
        masterGain.gain.exponentialRampToValueAtTime(0.32, t + 0.35);
        masterGain.connect(blenderCtx.destination);

        // 1. Motor principal (Sawtooth con rampa de aceleración de RPM)
        var motorOsc = blenderCtx.createOscillator();
        motorOsc.type = 'sawtooth';
        motorOsc.frequency.setValueAtTime(65, t);
        motorOsc.frequency.exponentialRampToValueAtTime(175, t + 0.45);
        
        var motorFilter = blenderCtx.createBiquadFilter();
        motorFilter.type = 'lowpass';
        motorFilter.frequency.setValueAtTime(450, t);
        motorFilter.frequency.exponentialRampToValueAtTime(850, t + 0.45);

        motorOsc.connect(motorFilter);
        motorFilter.connect(masterGain);
        motorOsc.start(t);

        // 2. Sub-bajo / resonancia de la base de la licuadora
        var subOsc = blenderCtx.createOscillator();
        subOsc.type = 'sine';
        subOsc.frequency.setValueAtTime(55, t);
        var subGain = blenderCtx.createGain();
        subGain.gain.value = 0.35;
        subOsc.connect(subGain);
        subGain.connect(masterGain);
        subOsc.start(t);

        // 3. Cuchillas y turbulencia de fruta/hielo
        var bufferSize = blenderCtx.sampleRate * 2;
        var noiseBuffer = blenderCtx.createBuffer(1, bufferSize, blenderCtx.sampleRate);
        var output = noiseBuffer.getChannelData(0);
        for (var i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }
        var whiteNoise = blenderCtx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        var noiseFilter = blenderCtx.createBiquadFilter();
        noiseFilter.type = 'bandpass';
        noiseFilter.frequency.setValueAtTime(700, t);
        noiseFilter.Q.value = 1.8;

        var lfo = blenderCtx.createOscillator();
        lfo.frequency.setValueAtTime(9.5, t);
        var lfoGain = blenderCtx.createGain();
        lfoGain.gain.value = 350;
        lfo.connect(lfoGain);
        lfoGain.connect(noiseFilter.frequency);

        var noiseGain = blenderCtx.createGain();
        noiseGain.gain.setValueAtTime(0.01, t);
        noiseGain.gain.exponentialRampToValueAtTime(0.25, t + 0.4);

        whiteNoise.connect(noiseFilter);
        noiseFilter.connect(noiseGain);
        noiseGain.connect(masterGain);

        whiteNoise.start(t);
        lfo.start(t);

        blenderNodes = {
            masterGain: masterGain,
            motorOsc: motorOsc,
            subOsc: subOsc,
            whiteNoise: whiteNoise,
            lfo: lfo
        };
    } catch (e) {
        console.warn('WebAudio blender synth no disponible:', e);
    }
}

function stopWebAudioBlenderSynth() {
    if (!blenderNodes || !blenderCtx) return;
    try {
        var t = blenderCtx.currentTime;
        blenderNodes.masterGain.gain.cancelScheduledValues(t);
        blenderNodes.masterGain.gain.setValueAtTime(blenderNodes.masterGain.gain.value, t);
        if (blenderNodes.motorOsc) {
            blenderNodes.motorOsc.frequency.cancelScheduledValues(t);
            blenderNodes.motorOsc.frequency.setValueAtTime(blenderNodes.motorOsc.frequency.value, t);
            blenderNodes.motorOsc.frequency.exponentialRampToValueAtTime(35, t + 0.35);
        }
        blenderNodes.masterGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);
        
        var nodes = blenderNodes;
        blenderNodes = null;
        setTimeout(function() {
            try {
                if (nodes.motorOsc) nodes.motorOsc.stop();
                if (nodes.subOsc) nodes.subOsc.stop();
                if (nodes.whiteNoise) nodes.whiteNoise.stop();
                if (nodes.lfo) nodes.lfo.stop();
            } catch (err) {}
        }, 400);
    } catch (e) {
        blenderNodes = null;
    }
}

function playBlenderSound() {
    if (blenderFadeInterval) { clearInterval(blenderFadeInterval); blenderFadeInterval = null; }
    
    // 1. Audio HTML5 nativo con el efecto de sonido cargado por el usuario
    if (blenderSound) {
        blenderSound.volume = 1;
        blenderSound.currentTime = 0;
        var p = blenderSound.play();
        if (p && typeof p.catch === 'function') {
            p.catch(function(err) {
                console.log('Audio element play handled, activando fallback synth:', err);
                startWebAudioBlenderSynth();
            });
        }
    } else {
        startWebAudioBlenderSynth();
    }
}

function stopBlenderSound() {
    if (blenderSound && !blenderSound.paused) {
        var v = blenderSound.volume;
        if (blenderFadeInterval) clearInterval(blenderFadeInterval);
        blenderFadeInterval = setInterval(function() {
            v = Math.max(0, v - 0.2);
            blenderSound.volume = v;
            if (v <= 0) {
                clearInterval(blenderFadeInterval);
                blenderFadeInterval = null;
                blenderSound.pause();
                blenderSound.currentTime = 0;
                blenderSound.volume = 1;
            }
        }, 35);
    }
    stopWebAudioBlenderSynth();
}
var audioUsuarioPausado = false;
var audioAutoIniciado = false;

function intentarReproducirAudioFondo() {
    if (audioUsuarioPausado || AJUSTES.efectoAudioFondo === false || !mainAudio) return;
    mainAudio.volume = 0.65;
    var p = mainAudio.play();
    if (p && typeof p.then === 'function') {
        p.then(function() {
            audioAutoIniciado = true;
            var icono = $('icono-audio');
            if (icono) icono.className = 'bi bi-volume-up-fill';
        }).catch(function() {});
    }
}

['pointerdown', 'touchstart', 'keydown', 'click'].forEach(function(evt) {
    window.addEventListener(evt, function onFirstGesture(e) {
        if (e && e.target && e.target.closest && e.target.closest('[onclick*="toggleAudio"]')) return;
        if (!audioAutoIniciado && !audioUsuarioPausado) {
            intentarReproducirAudioFondo();
        }
    }, { passive: true });
});

function toggleAudio() {
    var icono = $('icono-audio');
    if (AJUSTES.efectoAudioFondo === false || !mainAudio) return;
    if (mainAudio.paused) {
        audioUsuarioPausado = false;
        audioAutoIniciado = true;
        mainAudio.volume = 0.65;
        mainAudio.play().catch(function() {});
        if (icono) icono.className = 'bi bi-volume-up-fill';
    } else {
        audioUsuarioPausado = true;
        mainAudio.pause();
        if (icono) icono.className = 'bi bi-volume-mute-fill';
    }
}

/* 6. Catálogo, carrito y checkout */
var productos = [], carrito = [], categoriaActual = '500 mls';
var insumosReales = [];
function initNodo() {
    var p = new URLSearchParams(window.location.search);
    var nodoParam = p.get('sucursal') || p.get('nodo') || p.get('pais') || 'Antofagasta';
    var nodo = $('display-nodo-actual'), suc = $('sucursal-activa');
    if (suc) suc.value = nodoParam;
    if (nodo) {
        if (nodoParam.toLowerCase().includes('anto') || nodoParam.toLowerCase() === 'chile') {
            nodo.innerText = '🇨🇱 Nodo Antofagasta';
        } else if (nodoParam.toLowerCase().includes('espana') || nodoParam.toLowerCase().includes('españa')) {
            nodo.innerText = '🇪🇸 Nodo Chamberí';
        } else if (nodoParam.toLowerCase().includes('tulu') || nodoParam.toLowerCase() === 'colombia') {
            nodo.innerText = '🇨🇴 Cosecha Tuluá';
        } else {
            nodo.innerText = '🇨🇱 Nodo ' + nodoParam;
        }
    }
    $('grid-menu').innerHTML = '<div class="skel"></div><div class="skel hidden md:block"></div><div class="skel hidden lg:block"></div>';
    cargarCatalogo(nodoParam);
    cargarInsumosReales(nodoParam);
}

function cargarCatalogo(sucursal) {
    var url = '/api/productos/sucursal/' + encodeURIComponent(sucursal) + '?_t=' + Date.now();
    fetch(url, { cache: 'no-store' })
        .then(function(res) { return res.ok ? res.json() : []; })
        .then(function(data) {
            if (!data || !data.length) {
                return fetch('/api/productos?_t=' + Date.now(), { cache: 'no-store' }).then(function(r) { return r.ok ? r.json() : []; });
            }
            return data;
        })
        .then(function(data) {
            if (data && data.length) {
                productos = data;
                if (insumosReales && insumosReales.length) procesarInsumosBodegaArmado(insumosReales);
            } else {
                renderFallbackCatalogo();
                return;
            }
            renderCatalogo();
        })
        .catch(function(err) {
            console.error('Error API productos:', err);
            fetch('/api/productos?_t=' + Date.now())
                .then(function(r) { return r.ok ? r.json() : []; })
                .then(function(d) {
                    if (d && d.length) {
                        productos = d;
                        if (insumosReales && insumosReales.length) procesarInsumosBodegaArmado(insumosReales);
                        renderCatalogo();
                    }
                    else { renderFallbackCatalogo(); }
                })
                .catch(function() { renderFallbackCatalogo(); });
        });
}

var CACHE_EXPRESS_INSUMOS = 'raices_cache_insumos_v2_';
var FALLBACK_SMOOTHIE_IMG = 'https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&auto=format&fit=crop&q=80';
var globalInsumosArmado = [];
var porcionesArmado = {};
var insumosInfoMap = {};
var subcategoriaFiltroActual = 'Todas';

function normalizarStr(str) {
    return (str || '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

function obtenerSubcategoriaInsumo(i) {
    if (i.subcategoria && i.subcategoria.trim() !== '') return i.subcategoria.trim();
    var nom = (i.nombre || '').toLowerCase();
    var cat = (i.categoria || '').toLowerCase();
    if (cat.includes('base') || nom.includes('leche') || nom.includes('agua') || nom.includes('aloe') || nom.includes('base') || nom.includes('yogur')) return 'Base';
    if (cat.includes('semilla') || nom.includes('chía') || nom.includes('chia') || nom.includes('linaza') || nom.includes('sésamo') || nom.includes('sesamo')) return 'Semillas';
    if (cat.includes('fruta') || nom.includes('piña') || nom.includes('pina') || nom.includes('manzana') || nom.includes('limón') || nom.includes('limon') || nom.includes('betarraga') || nom.includes('frut') || nom.includes('mango') || nom.includes('platano') || nom.includes('plátano')) return 'Frutas';
    if (cat.includes('vegetal') || cat.includes('verdura') || nom.includes('espinaca') || nom.includes('apio') || nom.includes('zanahoria') || nom.includes('acelga') || nom.includes('pepino')) return 'Vegetales';
    if (cat.includes('especia') || nom.includes('canela') || nom.includes('jengibre') || nom.includes('cúrcuma') || nom.includes('curcuma') || nom.includes('pimienta') || nom.includes('clavo')) return 'Especias';
    if (cat.includes('endulzante') || cat.includes('miel') || nom.includes('stevia') || nom.includes('estevia') || nom.includes('miel') || nom.includes('agave') || nom.includes('azúcar') || nom.includes('azucar')) return 'Endulzantes';
    if (cat.includes('estabilizante') || nom.includes('goma') || nom.includes('xantana') || nom.includes('pectina') || nom.includes('agar')) return 'Estabilizantes';
    if (cat.includes('grasa') || nom.includes('palta') || nom.includes('mantequilla') || nom.includes('cacao')) return 'Grasas';
    if (cat.includes('proteína') || cat.includes('proteina') || nom.includes('whey') || nom.includes('proteina') || nom.includes('proteína')) return 'Proteínas';
    if (cat.includes('cereal') || nom.includes('avena') || nom.includes('quinoa') || nom.includes('quinua') || nom.includes('arroz') || nom.includes('mandioca')) return 'Cereales';
    if (cat.includes('suplemento') || nom.includes('espirulina') || nom.includes('maca') || nom.includes('aceite') || nom.includes('colágeno')) return 'Suplementos';
    if (cat.includes('seco') || nom.includes('maní') || nom.includes('mani') || nom.includes('nuez') || nom.includes('nueces') || nom.includes('almendra')) return 'Frutos Secos';
    return 'Vegetales';
}

var CATALOGO_IMAGENES_INGREDIENTES = {
    'pina': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=350&q=80',
    'piña': 'https://images.unsplash.com/photo-1550258987-190a2d41a8ba?auto=format&fit=crop&w=350&q=80',
    'aloe': 'https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=350&q=80',
    'chia': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=350&q=80',
    'chía': 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=350&q=80',
    'mucilago': 'https://images.unsplash.com/photo-1589135233689-d56128fa7cbf?auto=format&fit=crop&w=350&q=80',
    'stevia': 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=350&q=80',
    'betarraga': 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=350&q=80',
    'remolacha': 'https://images.unsplash.com/photo-1593105544559-ecb03bf76f82?auto=format&fit=crop&w=350&q=80',
    'manzana roja': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=350&q=80',
    'manzana verde': 'https://images.unsplash.com/photo-1619546813926-a78fa6372cd2?auto=format&fit=crop&w=350&q=80',
    'manzana': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=350&q=80',
    'palta': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=350&q=80',
    'aguacate': 'https://images.unsplash.com/photo-1523049673857-eb18f1d7b578?auto=format&fit=crop&w=350&q=80',
    'nuez': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=350&q=80',
    'nueces': 'https://images.unsplash.com/photo-1563245372-f21724e3856d?auto=format&fit=crop&w=350&q=80',
    'canela': 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=350&q=80',
    'zanahoria': 'https://images.unsplash.com/photo-1598170845058-32b9d6a5da37?auto=format&fit=crop&w=350&q=80',
    'calabaza': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=350&q=80',
    'zapallo': 'https://images.unsplash.com/photo-1508061253366-f7da158b6d46?auto=format&fit=crop&w=350&q=80',
    'coco': 'https://images.unsplash.com/photo-1526947425960-945c6e72858f?auto=format&fit=crop&w=350&q=80',
    'linaza': 'https://images.unsplash.com/photo-1589135233689-d56128fa7cbf?auto=format&fit=crop&w=350&q=80',
    'clavo': 'https://images.unsplash.com/photo-1599940824399-b87987ceb72a?auto=format&fit=crop&w=350&q=80',
    'limon': 'https://images.unsplash.com/photo-1533082602674-463fb1674274?auto=format&fit=crop&w=350&q=80',
    'limón': 'https://images.unsplash.com/photo-1533082602674-463fb1674274?auto=format&fit=crop&w=350&q=80',
    'cilantro': 'https://images.unsplash.com/photo-1509358271058-acd22cc93898?auto=format&fit=crop&w=350&q=80',
    'espirulina': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=350&q=80',
    'cereal': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=350&q=80',
    'avena': 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=350&q=80',
    'mani': 'https://images.unsplash.com/photo-1568283096533-078a24930eb8?auto=format&fit=crop&w=350&q=80',
    'maní': 'https://images.unsplash.com/photo-1568283096533-078a24930eb8?auto=format&fit=crop&w=350&q=80',
    'maca': 'https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&w=350&q=80',
    'leche': 'https://images.unsplash.com/photo-1563636619-e9143da7973b?auto=format&fit=crop&w=350&q=80',
    'espinaca': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&w=350&q=80',
    'platano': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=350&q=80',
    'plátano': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=350&q=80',
    'banana': 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=350&q=80',
    'frutilla': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=350&q=80',
    'fresa': 'https://images.unsplash.com/photo-1464965911861-746a04b4bca6?auto=format&fit=crop&w=350&q=80',
    'arandano': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=350&q=80',
    'arándano': 'https://images.unsplash.com/photo-1498557850523-fd3d118b962e?auto=format&fit=crop&w=350&q=80',
    'jengibre': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=350&q=80',
    'curcuma': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=350&q=80',
    'cúrcuma': 'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?auto=format&fit=crop&w=350&q=80',
    'miel': 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&w=350&q=80',
    'proteina': 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=350&q=80',
    'proteína': 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=350&q=80',
    'whey': 'https://images.unsplash.com/photo-1579758629938-03607ccdbaba?auto=format&fit=crop&w=350&q=80'
};

function obtenerImagenIngrediente(ins) {
    if (ins.imagen && ins.imagen.trim() !== '') return ins.imagen.trim();
    var nomLimpio = normalizarStr(ins.nombre || '');
    var prodMatch = (productos || []).find(function(p) {
        return p.imagen && p.imagen.trim() !== '' && (normalizarStr(p.nombre).includes(nomLimpio) || nomLimpio.includes(normalizarStr(p.nombre)));
    });
    if (prodMatch && prodMatch.imagen) return prodMatch.imagen;

    var keys = Object.keys(CATALOGO_IMAGENES_INGREDIENTES);
    for (var k = 0; k < keys.length; k++) {
        var clave = keys[k];
        if (nomLimpio.includes(clave)) return CATALOGO_IMAGENES_INGREDIENTES[clave];
    }
    return FALLBACK_SMOOTHIE_IMG;
}

function obtenerDescripcionInsumo(ins) {
    if (ins.descripcion && ins.descripcion.trim() !== '') {
        return ins.descripcion.replace(/\n/g, '<br>');
    }
    var nom = (ins.nombre || '').toLowerCase();
    var sub = (ins.subcategoria || obtenerSubcategoriaInsumo(ins)).toLowerCase();
    if (sub.includes('fruta') || nom.includes('piña') || nom.includes('fresa') || nom.includes('frutilla') || nom.includes('arándano') || nom.includes('platano') || nom.includes('mango') || nom.includes('manzana')) {
        return "Fruta seleccionada en su punto óptimo de maduración natural. Aporta azúcares bio-compatibles de absorción gradual, alta concentración de vitamina C, polifenoles antioxidantes y fibra soluble para equilibrar la microbiota y potenciar el sabor de tu elíxir.";
    }
    if (sub.includes('vegetal') || nom.includes('espinaca') || nom.includes('apio') || nom.includes('pepino') || nom.includes('zanahoria') || nom.includes('remolacha') || nom.includes('betarraga')) {
        return "Vegetal fresco prensado en frío de cultivo libre de pesticidas. Rico en clorofila viva, nitratos vasodilatadores naturales, potasio y micronutrientes alcalinizantes que favorecen la oxigenación celular, la detoxificación hepática y la vitalidad.";
    }
    if (sub.includes('semilla') || nom.includes('chía') || nom.includes('chia') || nom.includes('linaza') || nom.includes('sésamo')) {
        return "Semilla bio-activa rica en ácidos grasos esenciales Omega 3 (ALA), fibra soluble formadora de mucílago prebiótico y calcio de origen vegetal. Apoya el tránsito digestivo regular y la salud cardiovascular.";
    }
    if (sub.includes('suplemento') || nom.includes('espirulina') || nom.includes('maca') || nom.includes('colágeno')) {
        return "Superalimento funcional de alta densidad nutricional y biodisponibilidad. Brinda soporte adaptógeno contra la fatiga mental y física, antioxidantes enzimáticos y aminoácidos esenciales para la vitalidad diaria.";
    }
    if (sub.includes('proteína') || nom.includes('whey') || nom.includes('proteina')) {
        return "Aislado proteico de rápida asimilación con perfil completo de aminoácidos ramificados (BCAA). Ideal para la regeneración miofibrilar, saciedad prolongada y síntesis tisular post-esfuerzo.";
    }
    if (sub.includes('seco') || nom.includes('nuez') || nom.includes('almendra') || nom.includes('maní')) {
        return "Fruto seco de primera selección tostado suavemente sin aditivos. Fuente insustituible de grasas monoinsaturadas cardiosaludables, vitamina E liposoluble, magnesio y energía limpia de larga duración.";
    }
    if (sub.includes('especia') || nom.includes('jengibre') || nom.includes('cúrcuma') || nom.includes('canela')) {
        return "Especia medicinal de acción termogénica y antiinflamatoria sistémica. Contiene fitoquímicos bio-activos que estimulan el fuego digestivo, modulan la respuesta inmune y revitalizan el metabolismo basal.";
    }
    if (sub.includes('base') || nom.includes('leche') || nom.includes('agua') || nom.includes('aloe')) {
        return "Base bio-líquida pura y equilibrada. Garantiza la textura suave, la emulsión perfecta de los ingredientes y una hidratación profunda a nivel celular con electrolitos naturales.";
    }
    return "Ingrediente 100% puro y bio-seleccionado para tu formulación personalizada. Aporta pureza, frescura y sinergia nutricional a tu batido en RAÍCES.";
}

function obtenerColorParaInsumo(nombre, subcat) {
    var n = normalizarStr(nombre);
    var s = normalizarStr(subcat);
    if (n.includes('espinaca') || n.includes('clorofila') || n.includes('menta') || n.includes('matcha')) return '#22c55e';
    if (n.includes('zanahoria') || n.includes('naranja')) return '#f97316';
    if (n.includes('betarraga') || n.includes('remolacha') || n.includes('frutilla') || n.includes('fresa') || n.includes('mora') || n.includes('pitahaya') || n.includes('arandano') || n.includes('acai')) return '#e11d48';
    if (n.includes('pina') || n.includes('platano') || n.includes('maracuya') || n.includes('mango') || n.includes('limon')) return '#eab308';
    if (n.includes('chia') || n.includes('linaza') || n.includes('calabaza') || n.includes('sesamo') || n.includes('semilla')) return '#94a3b8';
    if (n.includes('palta') || n.includes('aguacate') || n.includes('aloe')) return '#84cc16';
    if (n.includes('espirulina')) return '#059669';
    if (n.includes('maca') || n.includes('canela') || n.includes('cacao') || n.includes('mani') || n.includes('nuez') || n.includes('avena')) return '#b45309';
    if (n.includes('proteina') || n.includes('coco') || n.includes('whey')) return '#fef08a';
    if (n.includes('miel')) return '#f59e0b';
    if (n.includes('leche') || n.includes('almendra')) return '#f0e4d0';
    if (s.includes('base')) return '#e3f3ea';
    if (s.includes('fruta')) return '#f59e0b';
    if (s.includes('vegetal')) return '#10b981';
    if (s.includes('semilla')) return '#64748b';
    if (s.includes('suplemento')) return '#06b6d4';
    if (s.includes('prote')) return '#a855f7';
    if (s.includes('grasa')) return '#84cc16';
    if (s.includes('cereal')) return '#facc15';
    if (s.includes('fruto')) return '#d97706';
    if (s.includes('endulzan')) return '#fbbf24';
    if (s.includes('especia')) return '#fb7185';
    return '#10b981';
}

function procesarInsumosBodegaArmado(insumosBase) {
    var insumosArmado = [];
    (insumosBase || []).forEach(function(ins) {
        if (!ins || !ins.nombre) return;
        var cat = normalizarStr(ins.categoria || '');
        if (cat.includes('arma') || cat.includes('porcion')) {
            var porcionDosis = (ins.cantidadPorcion && ins.cantidadPorcion > 0) ? ins.cantidadPorcion : 1;
            var medidaIns = (ins.medida || 'gr').toLowerCase();
            var precioPorc = (ins.precioVenta && Number(ins.precioVenta) > 0) ? Number(ins.precioVenta) : (Number(ins.precio) || 0);
            if (precioPorc <= 0 && ins.precioKilo && Number(ins.precioKilo) > 0) {
                var pKilo = Number(ins.precioKilo);
                if (pKilo > 0 && pKilo <= 100) pKilo *= 1000;
                precioPorc = (medidaIns === 'gr' || medidaIns === 'mls') ? Math.round((pKilo / 1000) * porcionDosis) : Math.round(pKilo * porcionDosis);
            }

            var nomLimpio = normalizarStr(ins.nombre);
            var prodMatch = (productos || []).find(function(p) { return normalizarStr(p.nombre) === nomLimpio; });
            var stockVal = (ins.unidadActual !== undefined && ins.unidadActual !== null) ? Number(ins.unidadActual) : 0;
            var dtoVal = Number(ins.descuento) || 0;
            var precioVal = Math.round(precioPorc);
            var imgVal = ins.imagen || '';

            if (prodMatch) {
                if (prodMatch.stock !== undefined && prodMatch.stock !== null) {
                    var stockProd = Number(prodMatch.stock);
                    if (stockVal <= 0 || stockProd > stockVal) {
                        stockVal = stockProd;
                    }
                }
                if (prodMatch.descuento !== undefined && prodMatch.descuento !== null && prodMatch.descuento > 0) {
                    dtoVal = Number(prodMatch.descuento);
                }
                if (prodMatch.precio !== undefined && prodMatch.precio !== null && Number(prodMatch.precio) > 0) {
                    precioVal = Math.round(Number(prodMatch.precio));
                }
                if (prodMatch.imagen && prodMatch.imagen.trim() !== '') {
                    imgVal = prodMatch.imagen.trim();
                }
            }
            if (stockVal < 0) stockVal = 0;

            var subcatFinal = ins.subcategoria || obtenerSubcategoriaInsumo(ins);
            insumosArmado.push({
                idInsumo: ins.idInsumo || ins.id,
                nombre: ins.nombre,
                subcategoria: subcatFinal,
                categoria: ins.categoria,
                precio: precioVal,
                descuento: dtoVal,
                unidadActual: stockVal,
                sizePorcion: porcionDosis,
                medida: ins.medida || 'gr',
                imagen: imgVal,
                descripcion: ins.descripcion || '',
                color: obtenerColorParaInsumo(ins.nombre, subcatFinal)
            });
        }
    });
    globalInsumosArmado = insumosArmado;
    return insumosArmado;
}

function cargarInsumosReales(sucursal) {
    var nodo = sucursal || ($('sucursal-activa') ? $('sucursal-activa').value : 'Colombia');
    try {
        var cachedIns = localStorage.getItem(CACHE_EXPRESS_INSUMOS + nodo);
        if (cachedIns) {
            insumosReales = JSON.parse(cachedIns);
            procesarInsumosBodegaArmado(insumosReales);
        }
    } catch (e) {}

    fetch('/api/insumos/sucursal/' + encodeURIComponent(nodo) + '?_t=' + Date.now(), { cache: 'no-store' })
        .then(function(r) { return r.ok ? r.json() : []; })
        .then(function(data) {
            if (data && data.length > 0) return data;
            return fetch('/api/insumos/todos?_t=' + Date.now(), { cache: 'no-store' }).then(function(r2) { return r2.ok ? r2.json() : []; });
        })
        .then(function(insumosBase) {
            if (Array.isArray(insumosBase) && insumosBase.length > 0) {
                insumosReales = insumosBase;
                try { localStorage.setItem(CACHE_EXPRESS_INSUMOS + nodo, JSON.stringify(insumosBase)); } catch (e) {}
                procesarInsumosBodegaArmado(insumosBase);
                if (categoriaActual === 'Armar') {
                    pintarVistaArmaTuBatido();
                }
            }
        })
        .catch(function(err) {
            console.warn('Error cargando Bodega Arma tu Batido:', err);
        });
}

function renderFallbackCatalogo() {
    productos = [
        { id: 1, nombre: 'Elixir Verde Clorofila', categoria: '500 mls', precio: 18000, imagen: 'batido-verde.png', descripcion: 'Espinaca, aloe vera, jengibre y manzana verde. Oxigenación inmediata.' },
        { id: 2, nombre: 'Shot Rubí Vital (Pack x6)', categoria: '500 mls', precio: 32000, imagen: 'shot-rubi.png', descripcion: 'Viales de 60 ml (2×16 cm) con remolacha, rábano, limón alcalino y chía.' },
        { id: 3, nombre: 'Pack Detox Semanal', categoria: 'Packs', precio: 95000, imagen: 'pack-detox.png', descripcion: '6 elixires congelados al vacío de 500 ml con protocolo fitoquímico.' },
        { id: 4, nombre: 'Pitahaya & Maracuyá', categoria: 'Exóticos', precio: 21000, imagen: 'batido-exotico.png', descripcion: 'Pitahaya roja, maracuyá, hierbabuena y agua de coco. Sin azúcar añadida.' },
        { id: 5, nombre: 'Copoazú Amazónico', categoria: 'Exóticos', precio: 23000, imagen: 'batido-exotico.png', descripcion: 'Pulpa de copoazú, lulo y jengibre de raíz, prensados el mismo día.' }
    ];
    renderCatalogo();
}
function filtrar(cat, btn) {
    categoriaActual = cat;
    document.querySelectorAll('.cat').forEach(function(b) { b.classList.remove('active'); });
    btn.classList.add('active');
    renderCatalogo();
}
var NOMBRES_INSUMOS_CRUDOS_MENU = [
    'agua de coco', 'espinaca', 'apio', 'pepino', 'manzana verde', 'limon', 'limón', 'jengibre', 'menta', 'piña',
    'semillas de calabaza', 'papaya', 'ajo', 'betarraga', 'zanahoria', 'naranja', 'platano', 'plátano', 'avena',
    'mantequilla de mani', 'mantequilla de maní', 'cilantro', 'perejil', 'espirulina', 'chlorella',
    'vaso biodegradable 500ml', 'tapa domo compostable', 'bombilla de bambu / polipapel', 'bombilla de bambú / polipapel', 'bolsa kraft ecologica', 'bolsa kraft ecológica',
    'caldo de huesos', 'jengibre concentrado', 'curcuma concentrada', 'cúrcuma concentrada', 'pimienta negra', 'limon concentrado', 'limón concentrado', 'berries prensados', 'botellita shot 60ml', 'tapa botellita 60ml',
    'pulpa de pitahaya dragon', 'pulpa de pitahaya dragón', 'acai puro del amazonas', 'açai puro del amazonas', 'camu camu silvestre', 'guarana en polvo', 'guaraná en polvo', 'leche de coco cremosa', 'botella cristal exoticos 350ml', 'botella cristal exóticos 350ml', 'tapa dorada hermetica', 'tapa dorada hermética',
    'porcion proteina vegana', 'porción proteína vegana', 'porcion creatina creapure', 'porción creatina creapure', 'porcion semillas de chia', 'porción semillas de chía', 'porcion colageno hidrolizado', 'porción colágeno hidrolizado', 'porcion frutos rojos silvestres', 'porción frutos rojos silvestres', 'porcion cacao organico', 'porción cacao orgánico'
];

function esInsumoCrudoMenu(nombre) {
    if (!nombre) return false;
    var norm = normalizarStr(nombre);
    if (norm.indexOf('porcion') === 0 || norm.includes('insumo') || norm.includes('packaging') || norm.includes('vaso') || norm.includes('tapa ') || norm.includes('botellita') || norm.includes('bombilla') || norm.includes('bolsa ')) return true;
    for (var k = 0; k < NOMBRES_INSUMOS_CRUDOS_MENU.length; k++) {
        var insNorm = normalizarStr(NOMBRES_INSUMOS_CRUDOS_MENU[k]);
        if (norm === insNorm || (norm.indexOf(insNorm) === 0 && !norm.includes('pulpas') && !norm.includes('pack') && !norm.includes('imperial'))) {
            return true;
        }
    }
    return false;
}

function renderCatalogo() {
    var grid = $('grid-menu'), q = ($('buscador').value || '').trim().toLowerCase(), v = categoriaActual;
    $('barra-busqueda').style.display = (v === '500 mls' || v === 'Packs' || v === 'Exoticos' || v === 'Shots') ? 'flex' : 'none';
    if (v === 'Armar') return renderBuilder();
    if (v === 'Comunidad') return renderComunidad();

    var f = normalizarStr(v);
    var lista = (productos || []).filter(function(p) {
        if (!p || !p.nombre) return false;
        var cat = normalizarStr(p.categoria || '');
        var nom = normalizarStr(p.nombre || '');
        if (esInsumoCrudoMenu(p.nombre)) return false;
        if (cat.includes('arma') || cat.includes('batido') || cat.includes('porcion') || nom.includes('porcion') || nom.includes('porción')) return false;

        var esExotico = cat.includes('exot') || nom.includes('exot') || nom.includes('pitahaya') || nom.includes('dragon');
        var esPulpa = nom.indexOf('pulpas ') === 0 || nom.includes('pack') || nom.includes('pulpas');
        var esPack = cat.includes('pack') || esPulpa;
        var esShot = cat.includes('shot') || nom.includes('shot');

        var okCat = false;
        if (f.includes('exot')) okCat = esExotico;
        else if (f.includes('pack') || f.includes('pulpa')) okCat = esPack && !esExotico && !esShot;
        else if (f.includes('shot')) okCat = esShot && !esPack && !esExotico;
        else okCat = !esPack && !esShot && !esExotico;

        return okCat && (!q || p.nombre.toLowerCase().includes(q));
    });

    var vistosMenu = {};
    var filtrados = lista.filter(function(p) {
        var key = normalizarStr(p.nombre);
        if (vistosMenu[key]) return false;
        vistosMenu[key] = true;
        return true;
    });

    if (v === 'Shots' && !filtrados.length && !q) return renderShots();
    if (!filtrados.length) { grid.innerHTML = '<p class="col-span-full text-center text-slate-400 py-16">No encontramos elixires con ese nombre. Prueba con otra palabra o cambia de categoría.</p>'; return; }
    grid.innerHTML = filtrados.map(function(p, i) {
        var fb = "this.src='https://images.unsplash.com/photo-1610970881699-44a5587cabec?w=400&auto=format&fit=crop&q=80'";
        var V = FC[String(p.categoria).toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').indexOf('xotic') > -1 ? 2 : i % 2],
            fl = { b: '<div class="cfl">' + leafHtml(V.b) + '</div>', f: '<div class="cfl fg">' + leafHtml(V.f) + '</div>', k: '<div class="cfl" style="opacity:.42">' + leafHtml(V.k) + '</div>' };
        return '<div class="reveal" style="--i:' + i + '"><div class="card-escena" onclick="this.classList.toggle(\'flipped\')"><div class="card-flipper">' +
        '<div class="card-front spot rim">' + fl.b + '<div><div class="flex justify-between items-center mb-2"><span class="text-xs font-semibold text-emerald-300 bg-emerald-950/60 border border-emerald-500/30 px-3 py-1 rounded-full">Prensado en frío</span><span class="text-xs text-slate-400">500 ml</span></div><h3 class="font-cinzel text-xl font-bold">' + esc(p.nombre) + '</h3></div>' +
        '<div class="img-zona"><img src="' + esc(p.imagen || 'batido-verde.png') + '" alt="' + esc(p.nombre) + '" class="img-batido" loading="lazy" onerror="' + fb + '"></div>' +
        '<div class="cfoot flex justify-between items-center"><div><span class="text-xs text-slate-400 block">Precio</span><span class="font-cinzel text-2xl font-bold text-yellow-400">' + money(p.precio) + '</span></div>' +
        '<button class="btn btn-leaf px-5 py-3" onclick="event.stopPropagation();agregarAlCarrito(' + Number(p.id) + ')"><i class="bi bi-plus-lg"></i>Agregar</button></div>' + fl.f + '</div>' +
        '<div class="card-back">' + fl.k + '<h4 class="font-cinzel text-lg font-bold text-emerald-300 mb-2">' + esc(p.nombre) + '</h4><p class="text-sm text-slate-300 leading-relaxed font-light mb-4">' + esc(p.descripcion) + '</p>' +
        '<div class="space-y-3 text-sm border-y border-white/10 py-4 my-auto"><div class="flex justify-between"><span class="text-slate-400">Azúcares añadidos</span><span class="text-emerald-400 font-bold">0.0 g</span></div><div class="flex justify-between"><span class="text-slate-400">Conservantes</span><span class="text-emerald-400 font-bold">0%</span></div><div class="flex justify-between"><span class="text-slate-400">Conservar a</span><span class="font-bold">4 °C</span></div></div>' +
        '<button class="btn btn-leaf w-full py-3.5 mt-4" onclick="event.stopPropagation();agregarAlCarrito(' + Number(p.id) + ')">Agregar a mi orden</button></div>' +
        '</div></div></div>';
    }).join('');
    observeReveals();
}
function agregarAlCarrito(id) {
    var prod = productos.find(function(p) { return p.id === id; });
    if (!prod) return;
    var ex = carrito.find(function(i) { return i.id === id; });
    if (ex) ex.cantidad++; else carrito.push(Object.assign({}, prod, { cantidad: 1 }));
    if (cashSound && AJUSTES.efectoAudioFondo) { cashSound.currentTime = 0; cashSound.play().catch(function() {}); }
    if (navigator.vibrate) navigator.vibrate(18);
    trackEvent('AddToCart', { content_name: prod.nombre, content_ids: [prod.id], content_type: 'product', value: prod.precio, currency: 'COP' });
    toast('Agregado: ' + prod.nombre);
    actualizarBarraCarrito();
}
function totalCarrito() { return carrito.reduce(function(a, c) { return a + c.precio * c.cantidad; }, 0); }
function actualizarBarraCarrito() {
    var n = carrito.reduce(function(a, c) { return a + c.cantidad; }, 0);
    $('barra-carrito').style.display = n > 0 ? 'flex' : 'none';
    $('cantidad-items-bar').innerText = n + (n === 1 ? ' elixir listo' : ' elixires listos');
    $('total-precio-bar').innerText = money(totalCarrito());
}
function abrirCheckoutModal() {
    trackEvent('InitiateCheckout', { value: totalCarrito(), currency: 'COP', num_items: carrito.reduce(function(a, c) { return a + c.cantidad; }, 0) });
    document.body.classList.add('open');
}
function cerrarDrawer() { document.body.classList.remove('open'); }
document.addEventListener('keydown', function(e) { if (e.key === 'Escape') cerrarDrawer(); });

function cambiarCant(id, d) {
    var it = carrito.find(function(i) { return i.id === id; });
    if (!it) return;
    it.cantidad += d;
    if (it.cantidad <= 0) carrito = carrito.filter(function(i) { return i.id !== id; });
    actualizarBarraCarrito();
    if (!carrito.length) { cerrarDrawer(); retrocederAPaso1(); return; }
    pintarResumen();
}
function pintarResumen() {
    $('lista-carrito-modal').innerHTML = carrito.map(function(i) {
        return '<div class="flex items-center justify-between gap-3 py-2.5 border-b border-white/5"><div class="min-w-0"><div class="text-sm font-semibold truncate">' + esc(i.nombre) + '</div><div class="text-xs text-emerald-400">' + money(i.precio * i.cantidad) + '</div></div>' +
        '<div class="flex items-center gap-2"><button class="qty" aria-label="Quitar uno" onclick="cambiarCant(' + Number(i.id) + ',-1)">−</button><span class="w-5 text-center text-sm font-bold">' + i.cantidad + '</span><button class="qty" aria-label="Agregar uno" onclick="cambiarCant(' + Number(i.id) + ',1)">+</button></div></div>';
    }).join('');
    $('total-modal-caja').innerText = money(totalCarrito());
}
function avanzarAPaso2() {
    if (!$('nombreCliente').value.trim() || !$('direccionCliente').value.trim() || !$('telefonoCliente').value.trim()) {
        toast('Completa nombre, dirección y teléfono para continuar');
        return;
    }
    $('checkout-paso-1').style.display = 'none';
    $('checkout-paso-2').style.display = 'block';
    pintarResumen();
    $('contenedor-botones-pago').innerHTML = '<div class="flex flex-col gap-3">' +
        '<button class="btn w-full py-3.5 text-xs font-bold shadow-lg" style="background:linear-gradient(135deg, #20002c, #7b1fa2); border:1px solid #e040fb; color:#fff;" onclick="procesarPago(\'Nequi\')"><i class="bi bi-phone-vibrate text-sm"></i>Pagar con Nequi</button>' +
        '<button class="btn w-full py-3.5 text-xs font-bold shadow-lg" style="background:linear-gradient(135deg, #b71c1c, #e53935); border:1px solid #ff7961; color:#fff;" onclick="procesarPago(\'Daviplata\')"><i class="bi bi-wallet2 text-sm"></i>Pagar con Daviplata</button>' +
        '<button class="btn btn-leaf w-full py-3.5 text-xs font-bold" onclick="procesarPago(\'Contraentrega\')"><i class="bi bi-cash-coin text-sm"></i>Pagar en efectivo al recibir</button></div>';
}
function retrocederAPaso1() { $('checkout-paso-2').style.display = 'none'; $('checkout-paso-1').style.display = 'block'; }
function procesarPago(metodo) {
    var total = totalCarrito();
    trackEvent('Purchase', { value: total, currency: 'COP', content_type: 'product', payment_type: metodo });
    var waNum = AJUSTES.whatsappNumero || '573177651016';
    var m = '*¡HOLA RAÍCES! NUEVA ORDEN BOTÁNICA* 🌿%0A' +
        '*Cliente:* ' + encodeURIComponent($('nombreCliente').value.trim()) + '%0A' +
        '*Teléfono:* ' + encodeURIComponent($('telefonoCliente').value.trim()) + '%0A' +
        '*Dirección:* ' + encodeURIComponent($('direccionCliente').value.trim()) + ', ' + encodeURIComponent($('ciudadCliente').value.trim()) + '%0A' +
        '*Método de Pago:* ' + encodeURIComponent(metodo) + '%0A%0A*DETALLE DE ELIXIRES:*%0A';
    carrito.forEach(function(i) { m += '• ' + encodeURIComponent(i.nombre) + ' x' + i.cantidad + ' - ' + money(i.precio * i.cantidad) + '%0A'; });
    m += '%0A*TOTAL A PAGAR:* ' + money(total);
    window.open('https://wa.me/' + waNum + '?text=' + m, '_blank');
}

/* 7. Voz */
function _rec(onres, onend) {
    var S = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!S) { toast('Tu navegador no soporta reconocimiento de voz'); return; }
    var r = new S();
    r.lang = 'es-CO';
    r.onresult = function(e) { onres(e.results[0][0].transcript.toLowerCase()); };
    r.onerror = onend; r.onend = onend;
    r.start();
}
function iniciarVozGlobal() {
    var b = $('btn-mic-global');
    b.classList.add('escuchando');
    _rec(function(t) {
        var h = productos.find(function(p) { return t.includes(p.nombre.toLowerCase()) || t.includes('verde') || t.includes('rubi') || t.includes('rubí') || t.includes('pack'); });
        if (h) agregarAlCarrito(h.id);
        else toast('Escuché "' + t + '", pero no reconocí ningún elixir');
    }, function() { b.classList.remove('escuchando'); });
}
function iniciarVozModal() {
    var d = $('direccionCliente'), n = $('nombreCliente');
    _rec(function(t) { if (!d.value) d.value = t; else n.value = t; }, function() {});
}

/* 8. Vegetación exótica generada en SVG */
var _s = 7, _u = 0;
function rnd() { _s = (_s * 16807) % 2147483647; return (_s - 1) / 2147483646; }
function dews(n, w, hh, x0, y0) {
    var o = '';
    for (var i = 0; i < n; i++) { var x = x0 + rnd() * w, y = y0 + rnd() * hh, r = 2.5 + rnd() * 4; o += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + r.toFixed(1) + '" fill="url(#dew)"/><circle cx="' + (x - r * .3).toFixed(1) + '" cy="' + (y - r * .35).toFixed(1) + '" r="' + (r * .28).toFixed(1) + '" fill="#fff" opacity=".9"/>'; }
    return o;
}
function monstera() {
    var id = 'mk' + (++_u), body = 'M0 8C-30 -14 -96 -6 -112 62C-124 118 -84 184 -8 200Q0 203 8 200C84 184 124 118 112 62C96 -6 30 -14 0 8Z', sl = '', vn = '';
    for (var k = 0; k < 6; k++) {
        var t = .12 + k * .14, y = 8 + t * 192, ex = 108 * Math.sin(Math.PI * (t * .85 + .08));
        for (var sd = -1; sd <= 1; sd += 2) {
            vn += '<path d="M0 ' + y.toFixed(1) + 'Q' + (sd * ex * .5).toFixed(1) + ' ' + (y - 6).toFixed(1) + ' ' + (sd * ex * .97).toFixed(1) + ' ' + (y + 24).toFixed(1) + '"/>';
            if (k < 5) sl += '<path d="M' + (sd * ex * 1.15).toFixed(1) + ' ' + (y + 40).toFixed(1) + 'L' + (sd * ex * .55).toFixed(1) + ' ' + (y + 16).toFixed(1) + '"/>';
        }
    }
    return '<svg viewBox="-125 -30 250 245"><defs><mask id="' + id + '"><rect x="-130" y="-30" width="260" height="250" fill="#fff"/><g stroke="#000" stroke-width="4" stroke-linecap="round" fill="none">' + sl + '</g></mask></defs>' +
        '<path d="M0 8Q-5 -12 6 -30" stroke="#1d5a2b" stroke-width="5" fill="none" stroke-linecap="round"/><g mask="url(#' + id + ')"><path d="' + body + '" fill="url(#lg)" filter="url(#tex)"/><path d="' + body + '" fill="url(#hl)"/>' +
        '<g fill="none" stroke="rgba(200,245,160,.28)" stroke-width="1.3">' + vn + '<path d="M0 8Q3 100 0 200" stroke="rgba(210,250,170,.5)" stroke-width="2.4"/></g></g>' + dews(5, 150, 120, -75, 50) + '</svg>';
}
function frond() {
    var P0 = [10, 290], P1 = [30, 70], P2 = [290, 30], lf = '', N = 24;
    for (var i = 0; i < N; i++) {
        var t = .06 + i / N * .92, u = 1 - t;
        var x = u * u * P0[0] + 2 * u * t * P1[0] + t * t * P2[0], y = u * u * P0[1] + 2 * u * t * P1[1] + t * t * P2[1];
        var dx = 2 * u * (P1[0] - P0[0]) + 2 * t * (P2[0] - P1[0]), dy = 2 * u * (P1[1] - P0[1]) + 2 * t * (P2[1] - P1[1]);
        var ang = Math.atan2(dy, dx) * 57.2958, L = (78 * Math.pow(Math.sin(Math.PI * (t * .92 + .04)), .8) + 16) * (.9 + rnd() * .2);
        for (var sd = -1; sd <= 1; sd += 2) {
            var w = L * .1 + 2, e = sd * 9, Lh = (L * .5).toFixed(1), Ls = L.toFixed(1);
            lf += '<g transform="translate(' + x.toFixed(1) + ' ' + y.toFixed(1) + ') rotate(' + (ang + sd * (46 + t * 16) + (rnd() - .5) * 10).toFixed(1) + ')" opacity="' + (.82 + rnd() * .18).toFixed(2) + '"><path d="M0 0Q' + Lh + ' -' + w.toFixed(1) + ' ' + Ls + ' ' + e + 'Q' + Lh + ' ' + w.toFixed(1) + ' 0 0Z" fill="url(#lg)"/><path d="M0 0L' + Ls + ' ' + e + '" stroke="rgba(210,250,170,.35)" stroke-width=".8" fill="none"/></g>';
        }
    }
    return '<svg viewBox="0 0 300 300"><path d="M10 290Q30 70 290 30" stroke="#143d20" stroke-width="4" fill="none"/>' + lf + '</svg>';
}
function helic() {
    var o = '<svg viewBox="-90 -100 180 360"><path d="M0 270Q-8 160 0 40" stroke="#2d6a2f" stroke-width="7" fill="none"/>';
    for (var i = 0; i < 6; i++) {
        var s = 1 - i * .1, sd = i % 2 ? 1 : -1;
        o += '<g transform="translate(0 ' + (230 - i * 36) + ') rotate(' + (sd * (34 + i * 3)) + ') scale(' + s + ')"><path d="M0 0C-24 -10 -38 -52 -8 -92C2 -58 14 -24 0 0Z" fill="url(#hg)" stroke="#fbbf24" stroke-width="2.6" stroke-linejoin="round"/><path d="M-6 -10C-16 -34 -14 -56 -8 -78" stroke="rgba(255,255,255,.35)" stroke-width="2" fill="none"/></g>';
    }
    return o + '</svg>';
}
var ORIG = { m: '50% 2%', f: '3% 97%', h: '50% 92%' };
var FLORA = {
    hero: [],
    catalogo: [ ['m', 'right:-7%;top:2%;--s:26;--rot:-18;--fx:-1;--py:-90;--pr:6;--d:11s'], ['f', 'left:-9%;top:30%;--s:30;--rot:-20;--py:-120;--d:9s'], ['h', 'right:3%;bottom:6%;--s:9;--rot:6;--py:-60;--d:7s'] ],
    ingredientes: [ ['m', 'left:-8%;top:8%;--s:26;--rot:14;--py:-100;--pr:-6;--d:10s'], ['f', 'right:-8%;bottom:-6%;--s:34;--fx:-1;--rot:10;--py:-110;--d:9s'] ],
    beneficios: [ ['f', 'left:-8%;bottom:-8%;--s:32;--rot:-8;--py:-100;--d:8s'], ['m', 'right:-7%;top:4%;--s:24;--rot:-28;--fx:-1;--py:-80;--d:12s'], ['h', 'left:8%;top:6%;--s:8;--rot:-10;--py:-50;--d:6s'] ]
};
function buildFlora(box, list, soft) {
    if (!box || !list || !list.length) return;
    box.innerHTML = list.map(function(it) {
        var svg = (it[0] === 'm' ? monstera() : it[0] === 'f' ? frond() : helic()).replace('<svg ', '<svg style="transform-origin:' + ORIG[it[0] ] + '" ');
        return '<div class="fl" style="' + it[1] + (soft ? ';--o:.5' : '') + '">' + svg + '</div>';
    }).join('');
}
var floraBoxes = [];
function initFlora() {
    if ($('flora-hero')) buildFlora($('flora-hero'), FLORA.hero, false);
    ['catalogo'].forEach(function(id) {
        var sec = $(id);
        if (!sec) return;
        var box = document.createElement('div');
        box.className = 'flora'; sec.insertBefore(box, sec.firstChild);
        buildFlora(box, FLORA[id], true);
    });
    floraBoxes = Array.prototype.slice.call(document.querySelectorAll('.flora'));
    var ae = document.querySelector('.aurora');
    if (ae) {
        for (var i = 0; i < 16; i++) ae.insertAdjacentHTML('beforeend', '<b class="fy" style="left:' + (rnd() * 100).toFixed(1) + '%;top:' + (rnd() * 100).toFixed(1) + '%;--d:' + (6 + rnd() * 8).toFixed(1) + 's;animation-delay:-' + (rnd() * 9).toFixed(1) + 's"></b>');
    }
    floraTick();
}
function floraTick() {
    floraBoxes.forEach(function(c) {
        var p = c.getAttribute('data-h') ? scrollProgress : clamp((window.innerHeight - c.getBoundingClientRect().top) / (c.offsetHeight + window.innerHeight));
        c.style.setProperty('--p', p.toFixed(3));
    });
}

/* Vegetación de tarjetas: sprites generados una vez y reutilizados */
var SPR = null;
function leafHtml(list) {
    if (!SPR) SPR = { m: [monstera(), monstera(), monstera()], f: [frond(), frond(), frond()], h: [helic()] };
    return list.map(function(it, k) {
        var s = SPR[it[0] ][k % SPR[it[0] ].length].replace('<svg ', '<svg style="transform-origin:' + ORIG[it[0] ] + '" ');
        return '<div class="fl" style="' + it[1] + '">' + s + '</div>';
    }).join('');
}
var FC = [
    { b: [ ['f', 'left:-14%;bottom:12%;--w:80;--rot:-4;--px:10;--py:-14;--d:7s'], ['m', 'right:-22%;top:-14%;--w:50;--rot:-22;--fx:-1;--px:-8;--py:8;--d:9s'] ], f: [ ['m', 'left:-26%;top:42%;--w:42;--rot:100;--bl:2.5px;--px:12;--py:-10;--d:8s'] ], k: [ ['f', 'right:-20%;bottom:-8%;--w:85;--fx:-1;--d:8s'] ] },
    { b: [ ['m', 'left:-24%;top:-16%;--w:52;--rot:24;--px:8;--py:10;--d:9s'], ['f', 'right:-16%;bottom:12%;--w:78;--fx:-1;--rot:4;--px:-10;--py:-14;--d:8s'] ], f: [ ['f', 'right:-30%;top:40%;--w:55;--fx:-1;--rot:-30;--bl:2px;--py:-10;--d:7s'] ], k: [ ['f', 'left:-20%;bottom:-8%;--w:85;--d:9s'] ] },
    { b: [ ['h', 'left:-2%;bottom:-2%;--w:24;--rot:-6;--py:-10;--d:6s'], ['f', 'right:-14%;bottom:14%;--w:78;--fx:-1;--py:-12;--d:8s'], ['m', 'left:-22%;top:-16%;--w:44;--rot:18;--d:10s'] ], f: [ ['m', 'left:-24%;top:34%;--w:40;--rot:110;--bl:2px;--py:-10;--d:9s'] ], k: [ ['h', 'right:6%;bottom:-6%;--w:22;--rot:6;--d:6s'] ] }
];
function panelFlora() {
    return '<div class="cfl" style="opacity:.85">' + leafHtml([ ['f', 'left:-4%;bottom:-24%;--w:26;--rot:-4;--d:8s'], ['f', 'right:-4%;bottom:-24%;--w:26;--fx:-1;--d:9s'], ['m', 'left:-6%;top:-20%;--w:15;--rot:22;--d:10s'], ['h', 'right:9%;bottom:-8%;--w:6;--d:6s'] ]) + '</div>';
}

/* 9. Arma tu batido (Bodega de Porciones + Licuadora SVG procedural) - Sincronizado 100% con menu-clasico y Admin */
var bN = 0, bState = 'idle', bRaf = 0, bT0 = 0, bApe = null;
var BLEND_MS = 4300;
function bClamp(v) { return Math.max(0, Math.min(1, v)); }
function bSm(v) { v = bClamp(v); return v * v * (3 - 2 * v); }
function bHex(h) { h = (h || '#22c55e').replace('#', ''); return [parseInt(h.substr(0, 2), 16) || 0, parseInt(h.substr(2, 2), 16) || 0, parseInt(h.substr(4, 2), 16) || 0]; }
function bRgb(c) { return 'rgb(' + Math.round(c[0]) + ',' + Math.round(c[1]) + ',' + Math.round(c[2]) + ')'; }
function bLerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
function bRnd(seed) { var s = seed * 9301 + 49297; return function() { s = (s * 9301 + 49297) % 233280; return s / 233280; }; }

function obtenerItemsSeleccionadosBlender() {
    var items = [];
    for (var id in porcionesArmado) {
        var cant = porcionesArmado[id];
        if (cant > 0 && insumosInfoMap[id]) {
            var info = insumosInfoMap[id];
            var col = info.color || obtenerColorParaInsumo(info.nombre, info.subcategoria || '');
            for (var c = 0; c < Math.min(cant, 4); c++) {
                items.push({ id: id, nombre: info.nombre, color: col, cant: cant });
            }
        }
    }
    return items;
}

function bMix() {
    var selItems = obtenerItemsSeleccionadosBlender();
    if (!selItems.length) return [34, 197, 94];
    var W = 0, ar = [0, 0, 0], lg = [0, 0, 0];
    selItems.forEach(function(o) {
        var c = bHex(o.color);
        W += 1;
        for (var k = 0; k < 3; k++) { ar[k] += c[k]; lg[k] += Math.log(c[k] + 1); }
    });
    return [0, 1, 2].map(function(k) { return .45 * (ar[k] / W) + .55 * (Math.exp(lg[k] / W) - 1); });
}

function bTotal() {
    var total = 0;
    for (var id in porcionesArmado) {
        var cant = porcionesArmado[id];
        if (cant > 0 && insumosInfoMap[id]) {
            total += (cant * insumosInfoMap[id].precio);
        }
    }
    return total;
}

function blenderSVG() {
    var ticks = '', bub = '', drops = '', marks = '', k, R = bRnd(5);
    for (k = 0; k < 7; k++) { var a = (-120 + k * 40) * Math.PI / 180; ticks += '<line x1="' + (118 + 21 * Math.sin(a)).toFixed(1) + '" y1="' + (363 - 21 * Math.cos(a)).toFixed(1) + '" x2="' + (118 + 24.5 * Math.sin(a)).toFixed(1) + '" y2="' + (363 - 24.5 * Math.cos(a)).toFixed(1) + '" stroke="#6b756e" stroke-width="1.4" stroke-linecap="round"/>'; }
    for (k = 0; k < 16; k++) bub += '<circle class="bub" cx="' + (78 + R() * 104).toFixed(1) + '" cy="' + (262 + R() * 18).toFixed(1) + '" r="' + (1.4 + R() * 2.4).toFixed(1) + '" style="animation-duration:' + (1.3 + R() * 1.4).toFixed(2) + 's;animation-delay:-' + (R() * 2.5).toFixed(2) + 's"/>';
    for (k = 0; k < 12; k++) { var y = 60 + R() * 150, lx = 58 + (y - 52) * .1055, side = R() < .5; drops += '<circle class="drop" cx="' + (side ? lx + 3 + R() * 6 : 260 - lx - 3 - R() * 6).toFixed(1) + '" cy="' + y.toFixed(1) + '" r="' + (1.1 + R() * 1.6).toFixed(1) + '" style="animation-delay:-' + (R() * 1.6).toFixed(2) + 's"/>'; }
    [ [225.5, '250'], [167, '500'], [108.5, '750'] ].forEach(function(m) { var x = 58 + (m[0] - 52) * .1055 + 2; marks += '<line x1="' + x.toFixed(1) + '" y1="' + m[0] + '" x2="' + (x + 9).toFixed(1) + '" y2="' + m[0] + '" stroke="rgba(255,255,255,.6)" stroke-width="1"/><text x="' + (x + 12).toFixed(1) + '" y="' + (m[0] + 2.5) + '" font-size="7" font-family="Plus Jakarta Sans,sans-serif" font-weight="600" fill="rgba(255,255,255,.6)">' + m[1] + '</text>'; });
    var JAR = 'M52 46L208 46L184 272Q182 290 166 290H94Q78 290 76 272Z', INNER = 'M58 52L202 52L179 270Q177 284 164 284H96Q83 284 81 270Z', BASE = 'M38 302H222Q238 302 240 322L244 388Q244 404 228 404H32Q16 404 16 388L20 322Q22 302 38 302Z';
    return '<svg id="bl-svg" viewBox="0 0 260 420" role="img" aria-label="Licuadora con tu batido"><defs>' +
        '<clipPath id="bl-clip"><path d="' + INNER + '"/></clipPath>' +
        '<linearGradient id="bl-glass" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".26"/><stop offset=".22" stop-color="#fff" stop-opacity=".05"/><stop offset=".7" stop-color="#fff" stop-opacity=".02"/><stop offset="1" stop-color="#fff" stop-opacity=".2"/></linearGradient>' +
        '<linearGradient id="bl-shade" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".4"/><stop offset=".2" stop-color="#fff" stop-opacity=".14"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".46"/></linearGradient>' +
        '<linearGradient id="bl-body" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#46504a"/><stop offset=".12" stop-color="#232925"/><stop offset="1" stop-color="#0a0c0b"/></linearGradient>' +
        '<linearGradient id="bl-bodyx" x1="0" x2="1"><stop offset="0" stop-color="#000" stop-opacity=".5"/><stop offset=".25" stop-color="#fff" stop-opacity=".07"/><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></linearGradient>' +
        '<linearGradient id="bl-chrome" x1="0" x2="1"><stop offset="0" stop-color="#555c57"/><stop offset=".25" stop-color="#e4e9e5"/><stop offset=".5" stop-color="#8a918c"/><stop offset=".78" stop-color="#d3d9d4"/><stop offset="1" stop-color="#4b514d"/></linearGradient>' +
        '<linearGradient id="bl-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2d3430"/><stop offset="1" stop-color="#0d100e"/></linearGradient>' +
        '<radialGradient id="bl-knob" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#6a726c"/><stop offset="1" stop-color="#171b18"/></radialGradient>' +
        '<filter id="bl-blur"><feGaussianBlur stdDeviation="3"/></filter></defs>' +
        '<ellipse cx="130" cy="410" rx="112" ry="7" fill="#000" opacity=".55" filter="url(#bl-blur)"/>' +
        '<path d="' + BASE + '" fill="url(#bl-body)"/><path d="' + BASE + '" fill="url(#bl-bodyx)"/>' +
        '<path d="M38 302H222Q236 302 239 316H21Q24 302 38 302Z" fill="#fff" opacity=".1"/><path d="M20 330H240" stroke="#22c55e" stroke-width="1.6" opacity=".75"/>' +
        '<rect x="34" y="404" width="30" height="5" rx="2" fill="#050605"/><rect x="196" y="404" width="30" height="5" rx="2" fill="#050605"/>' +
        '<rect x="40" y="338" width="180" height="50" rx="14" fill="#070908" stroke="rgba(255,255,255,.09)"/>' +
        '<circle id="bl-led" cx="64" cy="363" r="4.5" fill="#4ade80" style="filter:drop-shadow(0 0 5px #4ade80)"/>' + ticks +
        '<circle cx="118" cy="363" r="17" fill="url(#bl-knob)" stroke="#000" stroke-width="1.5"/>' +
        '<g id="bl-dial" style="transform:rotate(-55deg)"><circle cx="118" cy="363" r="13" fill="url(#bl-chrome)" opacity=".9"/><path d="M118 363V352" stroke="#e60049" stroke-width="2.6" stroke-linecap="round"/></g>' +
        '<text x="180" y="360" text-anchor="middle" font-family="Cinzel,Georgia,serif" font-weight="900" font-size="13" fill="#4ade80" letter-spacing="1.5">RAÍCES</text>' +
        '<text x="180" y="373" text-anchor="middle" font-family="Plus Jakarta Sans,sans-serif" font-weight="700" font-size="5" fill="#9aa59d" letter-spacing="1.4">PRENSADO · 1200 W</text>' +
        '<path d="M206 70C244 64 250 110 243 156C238 198 220 224 190 236" fill="none" stroke="#10140f" stroke-width="12" stroke-linecap="round"/><path d="M204 68C242 62 248 108 241 154C236 196 218 222 188 234" fill="none" stroke="#5b665e" stroke-width="2" stroke-linecap="round" opacity=".6"/>' +
        '<g clip-path="url(#bl-clip)"><g id="bl-bands"></g><g id="bl-chunks"></g><path id="bl-foam" fill="none" stroke-linecap="round" stroke-linejoin="round" opacity="0"/><g id="bl-bub">' + bub + '</g>' +
        '<g opacity=".6"><g transform="translate(130 278) scale(1 .3)"><g id="bl-blades"><path d="M0 0L-30 -5Q-34 0 -30 6Z" fill="url(#bl-chrome)"/><path d="M0 0L30 -5Q34 0 30 6Z" fill="url(#bl-chrome)"/><path d="M0 0L-5 -26Q0 -30 6 -26Z" fill="url(#bl-chrome)"/><path d="M0 0L-5 26Q0 30 6 26Z" fill="url(#bl-chrome)"/><circle r="5" fill="#9aa39d"/></g></g></g>' +
        '<ellipse id="bl-disc" cx="130" cy="278" rx="36" ry="8" fill="#fff" opacity="0"/></g>' +
        '<path d="' + JAR + '" fill="url(#bl-glass)" stroke="rgba(255,255,255,.55)" stroke-width="1.6"/>' +
        '<path d="M76 272Q78 290 94 290H166Q182 290 184 272Q180 281 164 281H96Q80 281 76 272Z" fill="#fff" opacity=".13"/>' + marks +
        '<path d="M64 62L88 262" stroke="rgba(255,255,255,.38)" stroke-width="3" stroke-linecap="round"/><path d="M197 72L180 214" stroke="rgba(255,255,255,.16)" stroke-width="2.4" stroke-linecap="round"/>' +
        '<g id="bl-drops">' + drops + '</g>' +
        '<rect x="72" y="286" width="116" height="16" rx="5" fill="url(#bl-chrome)"/><rect x="72" y="286" width="116" height="16" rx="5" fill="url(#bl-bodyx)"/><path d="M76 296H184" stroke="#000" opacity=".35"/>' +
        '<path d="M47 47Q47 30 66 28H194Q213 30 213 47Z" fill="url(#bl-lid)" stroke="#000"/><path d="M54 45H206" stroke="#fff" opacity=".16"/>' +
        '<rect x="108" y="14" width="44" height="15" rx="6" fill="url(#bl-chrome)"/><rect x="108" y="14" width="44" height="15" rx="6" fill="url(#bl-bodyx)"/></svg>';
}

function paintBlender(now, p) {
    var gb = $('bl-bands'); if (!gb) return false;
    var running = bState === 'blending', done = bState === 'done';
    var selItems = obtenerItemsSeleccionadosBlender();
    if (!selItems.length) {
        gb.innerHTML = '';
        if ($('bl-chunks')) $('bl-chunks').innerHTML = '';
        if ($('bl-foam')) $('bl-foam').setAttribute('opacity', '0');
        if ($('bl-disc')) $('bl-disc').setAttribute('opacity', '0');
        if ($('bl-dial')) $('bl-dial').style.transform = 'rotate(-55deg)';
        var led0 = $('bl-led');
        if (led0) { led0.setAttribute('fill', '#4ade80'); led0.style.filter = 'drop-shadow(0 0 5px #4ade80)'; }
        return true;
    }
    var mix = bMix(), m = done ? 1 : (running ? bSm((p - .08) / .72) : 0);
    var maxBands = selItems.slice(0, 8);
    var bandH = Math.min(0.16, 0.72 / maxBands.length);
    var bands = maxBands.map(function(it) { return { c: bHex(it.color), h: bandH, rawColor: it.color }; });
    var cum = 0; bands.forEach(function(b) { cum += b.h; b.top = 284 - cum * 234; });
    var amp = running ? 2.5 + 7 * Math.sin(Math.PI * bClamp(p)) : (done ? .9 : 0);
    var vd = running ? 34 * bSm(p / .18) * (1 - bSm((p - .82) / .18)) : 0;
    var spd = running ? 95 : 1100, last = bands.length - 1;
    function yAt(x, top, k) { return top + amp * Math.sin(x * .07 + now / spd + k * 1.7) + vd * Math.exp(-Math.pow((x - 130) / 30, 2)) * (k === last ? 1 : .55); }
    var html = '', topPts = '', k, x;
    for (k = last; k >= 0; k--) {
        var b = bands[k], d = '';
        for (x = 44; x <= 216; x += 8) d += (x === 44 ? 'M' : 'L') + x + ' ' + yAt(x, b.top, k).toFixed(1);
        if (k === last) topPts = d;
        d += 'L216 300L44 300Z';
        html += '<path d="' + d + '" fill="' + bRgb(bLerp(b.c, mix, m)) + '"/><path d="' + d + '" fill="url(#bl-shade)"/>';
    }
    gb.innerHTML = html;
    var foam = $('bl-foam'), fo = running ? bSm(p / .3) * .85 : (done ? .7 : 0);
    if (foam) {
        foam.setAttribute('d', topPts); foam.setAttribute('stroke-width', '4.5'); foam.setAttribute('opacity', fo.toFixed(2));
        foam.setAttribute('stroke', bRgb(bLerp(bLerp(bands[last].c, mix, m), [255, 255, 255], .42)));
    }
    var ch = '';
    if (!done) maxBands.forEach(function(it, n) {
        var b = bands[n], prevTop = n === 0 ? 284 : bands[n - 1].top;
        var yc = (b.top + prevTop) / 2, R2 = bRnd((n + 1) * 13 + 3), col = bRgb(bLerp(bHex(it.color), [0, 0, 0], .22));
        for (var c = 0; c < 6; c++) {
            var r0 = 8 + R2() * 44, a0 = R2() * 6.283, sz = 2.6 + R2() * 3, jy = (R2() - .5) * 5;
            var a = a0 + (running ? p * p * 40 : 0), r = r0 * (running ? 1 - .8 * bSm(p / .9) : 1), al = running ? 1 - bSm((p - .22) / .55) : 1;
            if (al <= .01) continue;
            var qx = 130 + r * Math.cos(a), qy = yc + jy + .22 * r * Math.sin(a);
            if (qy < yAt(qx, bands[last].top, last) + 2) continue;
            ch += '<circle cx="' + qx.toFixed(1) + '" cy="' + qy.toFixed(1) + '" r="' + (sz * (running ? 1 - .5 * bSm(p) : 1)).toFixed(1) + '" fill="' + col + '" opacity="' + al.toFixed(2) + '"/>';
        }
    });
    if ($('bl-chunks')) $('bl-chunks').innerHTML = ch;
    if ($('bl-disc')) $('bl-disc').setAttribute('opacity', (running ? .42 * bSm(p / .12) * (1 - bSm((p - .93) / .07)) : 0).toFixed(2));
    if ($('bl-dial')) $('bl-dial').style.transform = 'rotate(' + (running ? 95 : -55) + 'deg)';
    var led = $('bl-led'), lc = running ? '#ff4d6d' : '#4ade80';
    if (led) { led.setAttribute('fill', lc); led.style.filter = 'drop-shadow(0 0 5px ' + lc + ')'; }
    if ($('bl-svg')) $('bl-svg').style.setProperty('--mix', bRgb(mix));
    return true;
}

function bMsgHtml() {
    var n = 0, t = 'Tu batido está en preparación y en breve te lo enviamos';
    var w = t.split(' ').map(function(word) { return '<span class="bl-w">' + word.split('').map(function(c) { return '<span class="bl-ch" style="animation-delay:' + (n++ * 32 + 150) + 'ms">' + c + '</span>'; }).join('') + '</span>'; }).join(' ');
    return '<div class="bl-msg mt-4" role="status"><i class="bi bi-check-circle-fill"></i><p>' + w + '</p><small>Ya quedó en tu orden. Toca la barra inferior para confirmar la entrega.</small></div>';
}

function filtrarSubcategoriaArmaTuBatido(subcat) {
    subcategoriaFiltroActual = subcat;
    pintarVistaArmaTuBatido();
}

function renderBuilder() {
    var nodo = $('sucursal-activa') ? $('sucursal-activa').value : 'Colombia';
    renderizarArmaTuBatido(nodo);
}

function renderizarArmaTuBatido(nodo) {
    if (!nodo) nodo = $('sucursal-activa') ? $('sucursal-activa').value : 'Colombia';
    if (globalInsumosArmado && globalInsumosArmado.length > 0) {
        pintarVistaArmaTuBatido();
    } else if (insumosReales && insumosReales.length > 0) {
        procesarInsumosBodegaArmado(insumosReales);
        pintarVistaArmaTuBatido();
    } else {
        $('grid-menu').innerHTML = '<div class="col-span-full text-center py-16"><div class="inline-block w-9 h-9 border-2 border-yellow-400 border-t-transparent rounded-full animate-spin mb-3"></div><p class="font-cinzel text-sm text-yellow-400">Cargando Bodega Arma tu Batido...</p></div>';
    }
    // Sincronizar siempre en tiempo real con el servidor (igual que menu-clasico.html)
    fetch('/api/insumos/sucursal/' + encodeURIComponent(nodo) + '?_t=' + Date.now(), { cache: 'no-store' })
        .then(function(resI) { return resI.ok ? resI.json() : []; })
        .then(function(insumosBase) {
            if (!insumosBase || insumosBase.length === 0) {
                return fetch('/api/insumos/todos?_t=' + Date.now(), { cache: 'no-store' }).then(function(r2) { return r2.ok ? r2.json() : []; });
            }
            return insumosBase;
        })
        .then(function(insumosBase) {
            if (Array.isArray(insumosBase) && insumosBase.length > 0) {
                insumosReales = insumosBase;
                try { localStorage.setItem(CACHE_EXPRESS_INSUMOS + nodo, JSON.stringify(insumosBase)); } catch (e) {}
                procesarInsumosBodegaArmado(insumosBase);
                if (categoriaActual === 'Armar') {
                    pintarVistaArmaTuBatido();
                }
            } else if (!globalInsumosArmado || globalInsumosArmado.length === 0) {
                pintarVistaArmaTuBatido();
            }
        })
        .catch(function(e) {
            console.error('Error al obtener datos de Bodega Arma tu Batido:', e);
        });
}

var SUBCATEGORIAS_BODEGA_OFICIALES = [
    ['Todas', '✨ TODAS'],
    ['Base', '🥛 BASE'],
    ['Semillas', '🌱 SEMILLAS'],
    ['Frutas', '🍓 FRUTAS'],
    ['Vegetales', '🥬 VEGETALES'],
    ['Suplementos', '⚡ SUPLEMENTOS'],
    ['Frutos Secos', '🥜 FRUTOS SECOS'],
    ['Especias', '🌶️ ESPECIAS'],
    ['Endulzantes', '🍯 ENDULZANTES'],
    ['Estabilizantes', '🧪 ESTABILIZANTES'],
    ['Grasas', '🥑 GRASAS'],
    ['Proteínas', '💪 PROTEÍNAS'],
    ['Cereales', '🌾 CEREALES']
];

function pintarVistaArmaTuBatido() {
    var grid = $('grid-menu');
    if (!grid) return;
    var nodo = $('sucursal-activa') ? $('sucursal-activa').value : 'Colombia';
    var insumosArmado = globalInsumosArmado || [];

    if (insumosArmado.length === 0) {
        grid.innerHTML = '<div class="col-span-full spot rim rounded-[28px] p-10 text-center">' +
            '<i class="bi bi-info-circle text-4xl text-yellow-400 block mb-3"></i>' +
            '<h4 class="font-cinzel text-xl font-bold text-yellow-400 mb-2">SIN PORCIONES EN BODEGA ARMA TU BATIDO</h4>' +
            '<p class="text-sm text-slate-300 max-w-xl mx-auto">Aún no hay porciones registradas en la <b>Bodega Arma Tu Batido</b> para el NODO ' + esc(nodo.toUpperCase()) + '. Puedes agregarlas desde el Administrador en la pestaña Bodega -> Bodega de Porciones.</p>' +
            '</div>';
        return;
    }

    // Asegurar que insumosInfoMap tenga la info actualizada de cada insumo
    insumosArmado.forEach(function(ins) {
        var idKey = String(ins.idInsumo || ins.id || 'ins');
        var dtoPorc = (ins.descuento && ins.descuento > 0) ? Math.min(Math.round(ins.descuento), 100) : 0;
        var precioFinalPorc = dtoPorc > 0 ? Math.round((ins.precio || 0) * (1 - dtoPorc / 100)) : (ins.precio || 0);
        insumosInfoMap[idKey] = {
            nombre: ins.nombre,
            precio: precioFinalPorc,
            cantidad: porcionesArmado[idKey] || 0,
            sizePorcion: ins.sizePorcion || 1,
            subcategoria: ins.subcategoria,
            color: ins.color || obtenerColorParaInsumo(ins.nombre, ins.subcategoria)
        };
    });

    var run = bState === 'blending', done = bState === 'done';
    var btnAccion = run
        ? '<button id="btn-agregar-custom" class="btn btn-ruby w-full py-4 text-sm opacity-75" disabled><i class="bi bi-arrow-repeat bl-spin me-2"></i>LICUANDO TU FÓRMULA…</button>'
        : (done
            ? '<div class="flex flex-col sm:flex-row gap-3 justify-center"><button class="btn btn-leaf flex-1 py-3.5 text-xs font-bold" onclick="bReset()"><i class="bi bi-plus-circle me-1.5"></i>ARMAR OTRO BATIDO</button></div>'
            : '<button id="btn-agregar-custom" class="btn btn-leaf w-full py-4 text-sm font-extrabold shadow-[0_0_28px_rgba(34,197,94,0.45)]" onclick="bBlend()"><i class="bi bi-cart-plus-fill me-2"></i>LICUAR E INCLUIR BATIDO ARMADO AL CARRITO</button>');

    var botonesSubcatHtml = SUBCATEGORIAS_BODEGA_OFICIALES.map(function(par) {
        var sc = par[0], label = par[1];
        var activo = (subcategoriaFiltroActual.toLowerCase() === sc.toLowerCase());
        return '<button type="button" class="px-3.5 py-2 rounded-full text-xs font-bold tracking-wide transition-all border ' +
            (activo
                ? 'bg-yellow-400 text-black border-yellow-300 shadow-[0_0_16px_rgba(250,204,21,0.55)] scale-105'
                : 'bg-white/[0.04] text-slate-200 border-white/15 hover:border-yellow-400/60 hover:text-yellow-300 hover:bg-white/10') +
            '" onclick="filtrarSubcategoriaArmaTuBatido(\'' + esc(sc) + '\')">' + label + '</button>';
    }).join('');

    var insumosFiltrados = insumosArmado;
    if (subcategoriaFiltroActual !== 'Todas') {
        insumosFiltrados = insumosArmado.filter(function(i) {
            return normalizarStr(i.subcategoria || obtenerSubcategoriaInsumo(i)) === normalizarStr(subcategoriaFiltroActual);
        });
    }

    var cardsHtml = '';
    if (insumosFiltrados.length === 0) {
        cardsHtml = '<div class="col-span-full text-center text-slate-400 py-12 font-cinzel text-sm border border-dashed border-white/10 rounded-3xl">' +
            'No hay ingredientes disponibles en la subcategoría <b class="text-yellow-400">' + esc(subcategoriaFiltroActual.toUpperCase()) + '</b>.' +
            '</div>';
    } else {
        cardsHtml = insumosFiltrados.map(function(ins) {
            var idInsClean = String(ins.idInsumo || ins.id || 'ins').replace(/'/g, "\\'");
            var cantPorc = porcionesArmado[idInsClean] || porcionesArmado[ins.idInsumo] || 0;
            var precioBasePorc = ins.precio || 0;
            var dtoPorc = (ins.descuento && ins.descuento > 0) ? Math.min(Math.round(ins.descuento), 100) : 0;
            var precioFinalPorc = dtoPorc > 0 ? Math.round(precioBasePorc * (1 - dtoPorc / 100)) : precioBasePorc;
            var sizePorcion = (ins.sizePorcion && Number(ins.sizePorcion) > 0) ? Number(ins.sizePorcion) : 1;
            var stockRaw = (ins.unidadActual !== undefined && ins.unidadActual !== null) ? Number(ins.unidadActual) : 0;
            var porcionesDisponibles = (sizePorcion > 5 && stockRaw >= sizePorcion)
                ? Math.floor(stockRaw / sizePorcion)
                : Math.max(0, Math.floor(stockRaw));

            var esAgotado = porcionesDisponibles <= 0;
            var esUltimas = porcionesDisponibles > 0 && porcionesDisponibles <= 10;

            var porcTexto = sizePorcion + ' ' + (ins.medida || 'gr');
            var subcatLabel = (ins.subcategoria || obtenerSubcategoriaInsumo(ins)).toUpperCase();
            var nombreEscape = (ins.nombre || '').replace(/'/g, "\\'");
            var imgUrl = obtenerImagenIngrediente(ins);

            var ribbonDto = '';
            if (dtoPorc > 0) {
                ribbonDto = '<span class="absolute top-2 right-2 z-10 px-2 py-0.5 rounded-full bg-rose-600 border border-rose-400 text-white text-[10px] font-extrabold shadow-[0_0_12px_rgba(225,29,72,0.9)]">' +
                    '<i class="bi bi-tag-fill me-1"></i>-' + dtoPorc + '% OFF</span>';
            }

            var badgeStock = '';
            var borderCardCls = 'border-emerald-500/25 hover:border-emerald-400/60';
            var borderImgCls = 'border-emerald-500/30';
            var overlayImg = '';

            if (esAgotado) {
                badgeStock = '<div class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-500/60 text-rose-300 text-[10px] font-extrabold tracking-wide mb-2 w-full">' +
                    '<i class="bi bi-x-circle-fill"></i> AGOTADO (0 DISP)</div>';
                borderCardCls = 'border-rose-500/50 opacity-85';
                borderImgCls = 'border-rose-500/60';
                overlayImg = '<div class="absolute inset-0 bg-black/70 z-10 flex items-center justify-center">' +
                    '<span class="px-3 py-1 rounded-full bg-rose-600 text-white font-cinzel text-xs font-bold shadow-[0_0_12px_rgba(225,29,72,0.9)]">' +
                    '<i class="bi bi-slash-circle me-1"></i> AGOTADO</span></div>';
            } else if (esUltimas) {
                badgeStock = '<div class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400 text-amber-300 text-[10px] font-extrabold tracking-wide mb-2 w-full animate-pulse">' +
                    '<i class="bi bi-exclamation-triangle-fill"></i> ¡ÚLTIMAS ' + porcionesDisponibles + ' UNIDADES!</div>';
                borderCardCls = 'border-amber-400/80 shadow-[0_0_18px_rgba(251,191,36,0.22)]';
                borderImgCls = 'border-amber-400/70';
                overlayImg = '<span class="absolute bottom-2 right-2 z-10 px-2 py-0.5 rounded-full bg-amber-400 text-black text-[10px] font-extrabold shadow-md">' +
                    '¡QUEDAN ' + porcionesDisponibles + '!</span>';
            } else {
                badgeStock = '<div class="inline-flex items-center justify-center gap-1 px-2.5 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[10px] font-bold tracking-wide mb-2 w-full">' +
                    '<i class="bi bi-check-circle-fill"></i> EN STOCK</div>';
            }

            if (cantPorc > 0 && !esAgotado) {
                borderCardCls = 'border-yellow-400 shadow-[0_0_22px_rgba(250,204,21,0.35)] bg-emerald-950/30';
            }

            var disMinus = cantPorc <= 0 ? 'disabled' : '';
            var clsMinus = cantPorc > 0
                ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black cursor-pointer'
                : 'border-white/15 text-slate-500 opacity-50 cursor-not-allowed';

            var disPlus = (esAgotado || cantPorc >= porcionesDisponibles) ? 'disabled' : '';
            var clsPlus = (!esAgotado && cantPorc < porcionesDisponibles)
                ? 'bg-yellow-400 text-black border-yellow-300 hover:bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.4)] cursor-pointer'
                : 'bg-white/10 text-slate-500 border-white/10 opacity-50 cursor-not-allowed';
            var titlePlus = esAgotado ? 'Agotado en Bodega' : (cantPorc >= porcionesDisponibles ? 'Máximo stock alcanzado' : 'Añadir porción');

            var esVideoIng = imgUrl && /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(imgUrl.trim());
            var mediaIngTag = esVideoIng
                ? '<video src="' + esc(imgUrl) + '" autoplay loop muted playsinline class="w-full h-full object-cover ' + (esAgotado ? 'grayscale opacity-50' : '') + '"></video>'
                : '<img src="' + esc(imgUrl) + '" alt="' + esc(ins.nombre) + '" decoding="async" class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110 ' + (esAgotado ? 'grayscale opacity-50' : '') + '" onerror="this.src=\'' + FALLBACK_SMOOTHIE_IMG + '\'">';

            var precioHtml = (dtoPorc > 0)
                ? '<div class="mb-2"><span class="text-slate-400 line-through text-xs me-1.5">' + money(precioBasePorc) + '</span><span class="font-cinzel text-lg font-extrabold text-yellow-400">' + money(precioFinalPorc) + '</span></div>'
                : '<div class="font-cinzel text-lg font-extrabold text-yellow-400 mb-2">' + money(precioBasePorc) + '</div>';

            return '<div class="group rounded-2xl p-3.5 text-center flex flex-col justify-between relative bg-[#07110b]/90 border transition-all duration-300 hover:-translate-y-1 cursor-pointer ' + borderCardCls + '" onclick="abrirDetalleInsumo(\'' + idInsClean + '\')">' +
                '<div>' +
                    '<div class="relative mb-2.5 overflow-hidden rounded-xl border ' + borderImgCls + ' bg-black/60 h-32">' +
                        mediaIngTag +
                        '<span class="absolute top-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/80 border border-yellow-400/60 text-yellow-300 text-[10px] font-bold tracking-wider">' + esc(subcatLabel) + '</span>' +
                        '<span class="absolute bottom-2 left-2 z-10 px-2 py-0.5 rounded-md bg-black/75 border border-white/15 text-slate-200 text-[10px] font-semibold">' + esc(porcTexto) + '</span>' +
                        ribbonDto +
                        overlayImg +
                    '</div>' +
                    '<h5 class="font-bold text-white text-sm uppercase tracking-wide mb-1.5 truncate" title="' + esc(ins.nombre) + '">' + esc(ins.nombre) + '</h5>' +
                    badgeStock +
                    precioHtml +
                '</div>' +
                '<div class="flex items-center justify-center gap-2.5 mt-2 pt-2.5 border-t border-white/10" onclick="event.stopPropagation()">' +
                    '<button type="button" id="btn-minus-' + idInsClean + '" class="w-9 h-9 rounded-lg border font-extrabold text-base flex items-center justify-center transition-all ' + clsMinus + '" ' + disMinus + ' onclick="modificarPorcionInsumo(\'' + idInsClean + '\', -1, ' + precioFinalPorc + ', \'' + nombreEscape + '\', ' + porcionesDisponibles + ', ' + sizePorcion + ')">−</button>' +
                    '<span id="cant-porc-' + idInsClean + '" class="font-cinzel font-extrabold text-xl text-white min-w-[28px] text-center">' + cantPorc + '</span>' +
                    '<button type="button" id="btn-plus-' + idInsClean + '" class="w-9 h-9 rounded-lg border font-extrabold text-base flex items-center justify-center transition-all ' + clsPlus + '" ' + disPlus + ' title="' + esc(titlePlus) + '" onclick="modificarPorcionInsumo(\'' + idInsClean + '\', 1, ' + precioFinalPorc + ', \'' + nombreEscape + '\', ' + porcionesDisponibles + ', ' + sizePorcion + ')">+</button>' +
                '</div>' +
            '</div>';
        }).join('');
    }

    grid.innerHTML =
        '<div class="col-span-full spot rim rounded-[28px] p-6 md:p-10 overflow-hidden mb-4">' +
            panelFlora() +
            '<div class="grid lg:grid-cols-12 gap-8 items-center">' +
                '<div class="lg:col-span-7 text-left">' +
                    '<div class="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-400/15 border border-yellow-400/40 text-yellow-300 text-xs font-bold uppercase tracking-wider mb-3">' +
                        '<i class="bi bi-sliders"></i> Bodega de Porciones en Tiempo Real' +
                    '</div>' +
                    '<h3 class="font-cinzel text-2xl md:text-4xl font-black text-white mb-2 uppercase tracking-wide">' + esc(AJUSTES.licuadoraTitulo || 'ARMA TU BATIDO PERSONALIZADO') + '</h3>' +
                    '<p class="text-slate-300 text-sm mb-5 font-light">' + esc(AJUSTES.licuadoraSubtitulo || 'Selecciona la cantidad de porciones de cada ingrediente. Conexión en tiempo real con inventario y aviso de stock.') + '</p>' +
                    '<div class="p-5 rounded-2xl bg-black/60 border border-dashed border-emerald-400/50 shadow-inner">' +
                        '<div class="flex items-center justify-between mb-2">' +
                            '<span class="text-xs font-extrabold uppercase tracking-wider text-emerald-300"><i class="bi bi-cup-straw me-1.5"></i>INGREDIENTES SELECCIONADOS:</span>' +
                            '<button type="button" id="btn-limpiar-custom" class="text-xs text-rose-400 hover:text-rose-300 font-semibold hidden" onclick="limpiarSeleccionCustom()"><i class="bi bi-trash3 me-1"></i>Vaciar vaso</button>' +
                        '</div>' +
                        '<div id="resumen-ingredientes-custom" class="text-sm text-white font-semibold mb-3 min-h-[1.5rem]">Ningún ingrediente seleccionado aún</div>' +
                        '<div class="flex items-baseline justify-between pt-3 border-t border-white/10 mb-4">' +
                            '<span class="text-xs text-slate-400 uppercase tracking-wider">Valor Total del Batido:</span>' +
                            '<div class="font-cinzel text-3xl md:text-4xl font-black text-yellow-400" id="precio-total-custom">$0</div>' +
                        '</div>' +
                        btnAccion +
                        (done ? bMsgHtml() : '') +
                    '</div>' +
                '</div>' +
                '<div class="lg:col-span-5 relative pt-[95px] flex flex-col items-center">' +
                    '<div id="ape-slot"></div>' +
                    '<div class="w-full rounded-3xl bg-black/40 border border-white/10 p-5 text-center flex flex-col items-center">' +
                        '<div id="bl-wrap" class="w-full max-w-[260px] mx-auto ' + (run ? 'bl-run' : done ? 'bl-done' : '') + '">' + blenderSVG() + '</div>' +
                        '<p class="text-xs text-slate-400 mt-2">Toca <b class="text-yellow-400">+</b> en cualquier insumo de la bodega para agregarlo al vaso</p>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>' +
        '<div class="col-span-full mt-2">' +
            '<h4 class="font-cinzel text-center text-white text-xl md:text-2xl font-bold mb-4 tracking-wider uppercase"><i class="bi bi-grid-3x3-gap-fill text-yellow-400 me-2"></i>CATÁLOGO DE INGREDIENTES DISPONIBLES</h4>' +
            '<div class="flex flex-wrap justify-center gap-2 mb-6">' + botonesSubcatHtml + '</div>' +
            '<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">' + cardsHtml + '</div>' +
        '</div>';

    var slot = $('ape-slot');
    if (!bApe && AJUSTES.efectoSimiosActivo !== false) {
        var bx = document.createElement('div'); bx.className = 'ape-peek card'; bApe = mountApe(bx, 7, 'v2'); setTimeout(function() { bApe.el.classList.add('in'); playApeSound(); }, 400);
    }
    if (bApe && APES.indexOf(bApe) < 0) APES.push(bApe);
    if (bApe && slot) slot.parentNode.replaceChild(bApe.box, slot);

    actualizarResumenCustom();
    paintBlender(performance.now(), done ? 1 : 0);
    apeQueue();
}

function modificarPorcionInsumo(idInsumo, delta, precio, nombre, maxPorciones, sizePorcion) {
    if (bState === 'blending') return;
    if (bState === 'done') bState = 'idle';
    if (!sizePorcion) sizePorcion = 1;
    if (!porcionesArmado[idInsumo]) porcionesArmado[idInsumo] = 0;
    var actual = porcionesArmado[idInsumo];

    if (delta > 0) {
        if (maxPorciones <= 0) {
            toast('El ingrediente "' + nombre + '" se encuentra AGOTADO en inventario.');
            return;
        }
        if (actual >= maxPorciones) {
            toast('¡Reserva de inventario alcanzada! Solo quedan ' + maxPorciones + ' porciones disponibles de "' + nombre + '".');
            return;
        }
    }

    porcionesArmado[idInsumo] = Math.max(0, actual + delta);
    var insObj = (globalInsumosArmado || []).find(function(i) { return String(i.idInsumo || i.id) === String(idInsumo); });
    var subcat = insObj ? insObj.subcategoria : '';
    var col = insObj && insObj.color ? insObj.color : obtenerColorParaInsumo(nombre, subcat);

    insumosInfoMap[idInsumo] = {
        nombre: nombre,
        precio: precio,
        cantidad: porcionesArmado[idInsumo],
        sizePorcion: sizePorcion,
        subcategoria: subcat,
        color: col
    };

    var nuevaCant = porcionesArmado[idInsumo];
    var spanCant = $('cant-porc-' + idInsumo);
    if (spanCant) spanCant.innerText = nuevaCant;
    var spanCantModal = $('cant-porc-modal-' + idInsumo);
    if (spanCantModal) spanCantModal.innerText = nuevaCant;

    var btnMinus = $('btn-minus-' + idInsumo);
    if (btnMinus) {
        btnMinus.disabled = (nuevaCant <= 0);
        btnMinus.className = 'w-9 h-9 rounded-lg border font-extrabold text-base flex items-center justify-center transition-all ' +
            (nuevaCant > 0 ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black cursor-pointer' : 'border-white/15 text-slate-500 opacity-50 cursor-not-allowed');
    }
    var btnPlus = $('btn-plus-' + idInsumo);
    if (btnPlus) {
        btnPlus.disabled = (nuevaCant >= maxPorciones);
        btnPlus.className = 'w-9 h-9 rounded-lg border font-extrabold text-base flex items-center justify-center transition-all ' +
            (nuevaCant < maxPorciones ? 'bg-yellow-400 text-black border-yellow-300 hover:bg-yellow-300 shadow-[0_0_12px_rgba(250,204,21,0.4)] cursor-pointer' : 'bg-white/10 text-slate-500 border-white/10 opacity-50 cursor-not-allowed');
    }

    var btnMinusModal = $('btn-minus-modal-' + idInsumo);
    if (btnMinusModal) {
        btnMinusModal.disabled = (nuevaCant <= 0);
        btnMinusModal.className = 'w-10 h-10 rounded-xl border font-extrabold text-lg flex items-center justify-center transition-all ' +
            (nuevaCant > 0 ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black cursor-pointer' : 'border-white/15 text-slate-500 opacity-50 cursor-not-allowed');
    }
    var btnPlusModal = $('btn-plus-modal-' + idInsumo);
    if (btnPlusModal) {
        btnPlusModal.disabled = (nuevaCant >= maxPorciones);
        btnPlusModal.className = 'w-10 h-10 rounded-xl border font-extrabold text-lg flex items-center justify-center transition-all ' +
            (nuevaCant < maxPorciones ? 'bg-yellow-400 text-black border-yellow-300 hover:bg-yellow-300 cursor-pointer' : 'bg-white/10 text-slate-500 border-white/10 opacity-50 cursor-not-allowed');
    }

    actualizarResumenCustom();
    paintBlender(performance.now(), 0);
    if (delta > 0) apeDo(bApe, 'bounce', 550);
}

function limpiarSeleccionCustom() {
    if (bState === 'blending') return;
    bState = 'idle';
    porcionesArmado = {};
    pintarVistaArmaTuBatido();
}

function actualizarResumenCustom() {
    var resumenDiv = $('resumen-ingredientes-custom');
    var precioTotalSpan = $('precio-total-custom');
    var btnLimpiar = $('btn-limpiar-custom');
    if (!resumenDiv || !precioTotalSpan) return;

    var lista = [];
    var badgesHtml = [];
    var total = 0;

    for (var id in porcionesArmado) {
        var cant = porcionesArmado[id];
        if (cant > 0 && insumosInfoMap[id]) {
            var info = insumosInfoMap[id];
            lista.push(cant + 'x ' + info.nombre);
            total += (cant * info.precio);
            badgesHtml.push(
                '<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/90 border border-emerald-400/40 text-emerald-200 text-xs">' +
                '<span class="w-2 h-2 rounded-full" style="background:' + (info.color || '#22c55e') + '"></span>' +
                '<b>' + cant + 'x</b> ' + esc(info.nombre) +
                ' <small class="text-yellow-300 font-bold">(' + money(cant * info.precio) + ')</small>' +
                '</span>'
            );
        }
    }

    if (lista.length === 0) {
        resumenDiv.innerHTML = '<span class="text-slate-400 font-normal">Ningún ingrediente seleccionado aún</span>';
        precioTotalSpan.innerText = '$0';
        if (btnLimpiar) btnLimpiar.classList.add('hidden');
    } else {
        resumenDiv.innerHTML = '<div class="flex flex-wrap gap-1.5">' + badgesHtml.join('') + '</div>';
        precioTotalSpan.innerText = money(total);
        if (btnLimpiar) btnLimpiar.classList.remove('hidden');
    }
}

function cerrarModalAmpliado() {
    var modal = $('modal-detalle-insumo');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function abrirDetalleInsumo(idInsumo) {
    var ins = (globalInsumosArmado || []).find(function(i) { return String(i.idInsumo || i.id) === String(idInsumo); });
    if (!ins) return;

    var idInsClean = String(ins.idInsumo || ins.id || 'ins').replace(/'/g, "\\'");
    var cantPorc = porcionesArmado[idInsClean] || porcionesArmado[ins.idInsumo] || 0;
    var precioBasePorc = ins.precio || 0;
    var dtoPorc = (ins.descuento && ins.descuento > 0) ? Math.min(Math.round(ins.descuento), 100) : 0;
    var precioFinalPorc = dtoPorc > 0 ? Math.round(precioBasePorc * (1 - dtoPorc / 100)) : precioBasePorc;
    var sizePorcion = (ins.sizePorcion && Number(ins.sizePorcion) > 0) ? Number(ins.sizePorcion) : 1;
    var stockRaw = (ins.unidadActual !== undefined && ins.unidadActual !== null) ? Number(ins.unidadActual) : 0;
    var porcionesDisponibles = (sizePorcion > 5 && stockRaw >= sizePorcion)
        ? Math.floor(stockRaw / sizePorcion)
        : Math.max(0, Math.floor(stockRaw));

    var esAgotado = porcionesDisponibles <= 0;
    var esUltimas = porcionesDisponibles > 0 && porcionesDisponibles <= 10;
    var subcatLabel = (ins.subcategoria || obtenerSubcategoriaInsumo(ins)).toUpperCase();
    var porcTexto = sizePorcion + ' ' + (ins.medida || 'gr');
    var nombreEscape = (ins.nombre || '').replace(/'/g, "\\'");
    var imgUrl = obtenerImagenIngrediente(ins);

    var ribbonDto = (dtoPorc > 0)
        ? '<span class="px-2.5 py-1 rounded-full bg-rose-600 text-white text-xs font-bold"><i class="bi bi-tag-fill me-1"></i>-' + dtoPorc + '% OFF</span>'
        : '';

    var badgeStock = '';
    if (esAgotado) {
        badgeStock = '<span class="px-2.5 py-1 rounded-full bg-rose-950 border border-rose-500 text-rose-300 text-xs font-bold"><i class="bi bi-x-circle me-1"></i>AGOTADO (0 DISP)</span>';
    } else if (esUltimas) {
        badgeStock = '<span class="px-2.5 py-1 rounded-full bg-amber-400 text-black text-xs font-extrabold"><i class="bi bi-exclamation-triangle-fill me-1"></i>¡ÚLTIMAS ' + porcionesDisponibles + ' PORCIONES!</span>';
    } else {
        badgeStock = '<span class="px-2.5 py-1 rounded-full bg-emerald-950 border border-emerald-500/50 text-emerald-300 text-xs font-bold"><i class="bi bi-check-circle me-1"></i>EN STOCK (' + porcionesDisponibles + ' DISP)</span>';
    }

    var esVideoIng = imgUrl && /\.(mp4|webm|mov|m4v|ogv)(\?.*)?$/i.test(imgUrl.trim());
    var mediaIngTag = esVideoIng
        ? '<video src="' + esc(imgUrl) + '" autoplay loop muted playsinline class="w-full h-56 object-cover ' + (esAgotado ? 'grayscale opacity-50' : '') + '"></video>'
        : '<img src="' + esc(imgUrl) + '" alt="' + esc(ins.nombre) + '" decoding="async" class="w-full h-56 object-cover ' + (esAgotado ? 'grayscale opacity-50' : '') + '" onerror="this.src=\'' + FALLBACK_SMOOTHIE_IMG + '\'">';

    var precioHtmlInsumo = (dtoPorc > 0)
        ? '<div><span class="text-slate-400 line-through text-xs me-1">' + money(precioBasePorc) + '</span><span class="font-cinzel text-yellow-400 font-extrabold text-2xl">' + money(precioFinalPorc) + '</span><span class="text-slate-400 text-xs block">por porción</span></div>'
        : '<div><span class="font-cinzel text-yellow-400 font-extrabold text-2xl">' + money(precioBasePorc) + '</span><span class="text-slate-400 text-xs block">por porción</span></div>';

    var descInsumo = obtenerDescripcionInsumo(ins);

    var disMinus = cantPorc <= 0 ? 'disabled' : '';
    var clsMinus = cantPorc > 0
        ? 'border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black cursor-pointer'
        : 'border-white/15 text-slate-500 opacity-50 cursor-not-allowed';

    var disPlus = (esAgotado || cantPorc >= porcionesDisponibles) ? 'disabled' : '';
    var clsPlus = (!esAgotado && cantPorc < porcionesDisponibles)
        ? 'bg-yellow-400 text-black border-yellow-300 hover:bg-yellow-300 cursor-pointer'
        : 'bg-white/10 text-slate-500 border-white/10 opacity-50 cursor-not-allowed';

    var htmlContent =
        '<div class="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/50">' +
            '<div class="flex items-center gap-2 flex-wrap">' +
                '<span class="px-2.5 py-1 rounded-full bg-black border border-yellow-400/60 text-yellow-300 text-xs font-bold"><i class="bi bi-cup-straw me-1"></i>ARMA TU BATIDO</span>' +
                '<span class="px-2.5 py-1 rounded-full bg-black border border-cyan-400/50 text-cyan-300 text-xs font-bold">' + esc(subcatLabel) + '</span>' +
                ribbonDto +
                badgeStock +
            '</div>' +
            '<button type="button" onclick="cerrarModalAmpliado()" class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"><i class="bi bi-x-lg"></i></button>' +
        '</div>' +
        '<div class="overflow-y-auto p-5 space-y-4">' +
            '<div class="rounded-2xl overflow-hidden border border-yellow-400/30 bg-black/60">' + mediaIngTag + '</div>' +
            '<h2 class="font-cinzel text-2xl font-black text-white uppercase">' + esc(ins.nombre) + '</h2>' +
            '<div class="flex items-center justify-between p-3.5 rounded-2xl bg-black/60 border border-yellow-400/25">' +
                '<div><span class="text-slate-400 text-xs font-bold uppercase block">DOSIS / PORCIÓN:</span><span class="font-cinzel text-cyan-300 font-extrabold text-lg">' + esc(porcTexto) + '</span></div>' +
                '<div class="text-right">' + precioHtmlInsumo + '</div>' +
            '</div>' +
            '<div class="p-4 rounded-2xl bg-white/[0.03] border border-white/10">' +
                '<div class="flex items-center gap-2 mb-2 pb-2 border-b border-yellow-400/20">' +
                    '<i class="bi bi-flower1 text-yellow-400 text-lg"></i>' +
                    '<span class="font-cinzel font-bold text-yellow-400 text-sm tracking-wider">PROPIEDADES & APORTE VITAL</span>' +
                '</div>' +
                '<div class="text-slate-200 text-xs leading-relaxed font-light">' + descInsumo + '</div>' +
            '</div>' +
        '</div>' +
        '<div class="p-4 border-t border-white/10 bg-black/60 space-y-3">' +
            '<div class="flex items-center justify-between">' +
                '<span class="font-cinzel text-xs text-slate-300 uppercase tracking-wider">PORCIONES AÑADIDAS:</span>' +
                '<div class="flex items-center gap-3">' +
                    '<button type="button" id="btn-minus-modal-' + idInsClean + '" class="w-10 h-10 rounded-xl border font-extrabold text-lg flex items-center justify-center transition-all ' + clsMinus + '" ' + disMinus + ' onclick="modificarPorcionInsumo(\'' + idInsClean + '\', -1, ' + precioFinalPorc + ', \'' + nombreEscape + '\', ' + porcionesDisponibles + ', ' + sizePorcion + ')">−</button>' +
                    '<span id="cant-porc-modal-' + idInsClean + '" class="font-cinzel font-extrabold text-2xl text-white min-w-[32px] text-center">' + cantPorc + '</span>' +
                    '<button type="button" id="btn-plus-modal-' + idInsClean + '" class="w-10 h-10 rounded-xl border font-extrabold text-lg flex items-center justify-center transition-all ' + clsPlus + '" ' + disPlus + ' onclick="modificarPorcionInsumo(\'' + idInsClean + '\', 1, ' + precioFinalPorc + ', \'' + nombreEscape + '\', ' + porcionesDisponibles + ', ' + sizePorcion + ')">+</button>' +
                '</div>' +
            '</div>' +
            '<button type="button" class="btn btn-leaf w-full py-3 text-xs font-extrabold uppercase tracking-wider" onclick="cerrarModalAmpliado()"><i class="bi bi-check-lg me-1"></i> ACEPTAR Y CONTINUAR</button>' +
        '</div>';

    var contenedor = $('contenido-detalle-ampliado');
    var modal = $('modal-detalle-insumo');
    if (contenedor && modal) {
        contenedor.innerHTML = htmlContent;
        modal.classList.remove('hidden');
        modal.classList.add('flex');
    }
}

function bBlend() {
    if (bState !== 'idle') return;
    var selItems = obtenerItemsSeleccionadosBlender();
    if (!selItems.length || bTotal() <= 0) {
        toast('Por favor selecciona al menos una porción de ingrediente para armar tu batido.');
        apeDo(bApe, 'bounce', 500);
        return;
    }
    bState = 'blending'; bT0 = performance.now(); pintarVistaArmaTuBatido();
    playBlenderSound();
    if (bApe) { bApe.el.classList.add('shake', 'ooh'); bApe.lock = 'bl-svg'; apeSay(bApe, '¡Uuuh! ¡Cómo gira!'); }
    cancelAnimationFrame(bRaf);
    (function step(now) {
        var p = bClamp((now - bT0) / BLEND_MS);
        if (!paintBlender(now, p)) p = 1;
        apeQueue();
        if (p < 1) bRaf = requestAnimationFrame(step); else bFinish();
    })(performance.now());
}

function bFinish() {
    stopBlenderSound();
    bState = 'done';
    agregarBatidoCustomAlCarrito(true);
    pintarVistaArmaTuBatido();
    if (bApe) { bApe.el.classList.remove('shake', 'ooh'); bApe.lock = null; apeDo(bApe, 'cheer', 2600); apeDo(bApe, 'ooh', 2600); apeSay(bApe, '¡Listo! Eso huele a selva 🍹'); }
}

function bReset() {
    stopBlenderSound();
    bState = 'idle';
    porcionesArmado = {};
    pintarVistaArmaTuBatido();
}

function agregarBatidoCustomAlCarrito(fromBlender) {
    var lista = [];
    var lineasReceta = [];
    var total = 0;

    for (var id in porcionesArmado) {
        var cant = porcionesArmado[id];
        if (cant > 0 && insumosInfoMap[id]) {
            var info = insumosInfoMap[id];
            lista.push(cant + 'x ' + info.nombre);
            lineasReceta.push(info.nombre + ':' + cant);
            total += (cant * info.precio);
        }
    }

    if (lista.length === 0 || total === 0) {
        toast('Por favor selecciona al menos una porción de ingrediente para armar tu batido.');
        return;
    }

    var itemCustom = {
        id: 9000 + (++bN),
        nombre: 'Batido Armado 500cc: ' + lista.join(', '),
        categoria: 'Arma tu Batido',
        precio: total,
        cantidad: 1,
        recetaDetalle: lineasReceta.join('\n'),
        esCustom: true
    };

    carrito.push(itemCustom);
    if (cashSound && AJUSTES.efectoAudioFondo) { cashSound.currentTime = 0; cashSound.play().catch(function() {}); }
    trackEvent('AddToCart', { content_name: itemCustom.nombre, content_ids: [itemCustom.id], content_type: 'product', value: itemCustom.precio, currency: 'COP' });
    toast('Tu Batido Armado 500cc está en la orden');
    actualizarBarraCarrito();

    if (!fromBlender) {
        porcionesArmado = {};
        pintarVistaArmaTuBatido();
    }
}
var bAdd = agregarBatidoCustomAlCarrito;

function wa(t) {
    var num = AJUSTES.whatsappNumero || '573177651016';
    return 'https://wa.me/' + num + '?text=' + encodeURIComponent(t);
}

function renderShots() {
    $('grid-menu').innerHTML = '<div class="col-span-full spot rim rounded-[28px] p-8 md:p-14 text-center overflow-hidden" style="--c:#facc15">' + panelFlora() + '<svg viewBox="0 0 40 220" class="mx-auto h-44 mb-6"><rect x="12" y="2" width="16" height="16" rx="4" fill="#d1d5db"/><rect x="8" y="16" width="24" height="196" rx="12" fill="url(#hg)"/><rect x="13" y="28" width="4" height="150" rx="2" fill="rgba(255,255,255,.45)"/></svg>' +
        '<h3 class="font-cinzel text-3xl md:text-4xl font-bold mb-3">Shots Rubí Vital</h3><p class="text-slate-300 max-w-xl mx-auto mb-2">Viales de 60 ml con remolacha, citrulina natural y piña alcalina. Estamos afinando el primer lote.</p>' +
        '<p class="text-yellow-300 text-sm font-semibold mb-8">Próximamente</p><a class="btn btn-leaf px-8 py-4" target="_blank" rel="noopener" href="' + wa('Hola RAÍCES, quiero que me avisen cuando salgan los Shots Rubí Vital') + '" onclick="trackEvent(\'Lead\',{content_name:\'Shots\'})"><i class="bi bi-whatsapp"></i>Avísame cuando salgan</a></div>';
}

var pestanaComunidadActual = 'articulos';
var articulosBlogCache = [];
var comentariosComunidadCache = [];
var articuloActivoId = null;

function renderComunidad(pestana) {
    if (!pestana) pestana = pestanaComunidadActual || 'articulos';
    pestanaComunidadActual = pestana;
    var grid = $('grid-menu');
    if (!grid) return;
    
    if ($('barra-busqueda')) $('barra-busqueda').style.display = 'none';

    var badgeTexto = esc(AJUSTES.blogBadge || 'COMUNIDAD BIO-ACTIVA & BLOG');
    var tituloTexto = AJUSTES.blogTitulo || 'ESPACIO DE CONOCIMIENTO & CONEXIÓN VITAL';
    var subtituloTexto = esc(AJUSTES.blogSubtitulo || 'Descubre los fundamentos de la nutrición celular viva, novedades del laboratorio RAÍCES y comparte tus sugerencias y peticiones de nuevos sabores para construir la comunidad.');

    var navHtml = '<div class="col-span-full mb-8"><div class="spot rim rounded-[28px] p-6 md:p-8 text-center overflow-hidden">' +
        '<div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-400/50 shadow-[0_0_20px_rgba(34,197,94,0.3)] backdrop-blur-md mb-3 text-emerald-300 text-xs font-bold tracking-wider uppercase">' +
        '<i class="bi bi-broadcast"></i> <span id="comunidad-nav-badge">' + badgeTexto + '</span></div>' +
        '<h2 id="comunidad-nav-titulo" class="font-cinzel font-black text-2xl md:text-4xl text-white mb-2 uppercase">' + tituloTexto + '</h2>' +
        '<p id="comunidad-nav-subtitulo" class="text-slate-400 text-sm max-w-2xl mx-auto mb-6 font-light leading-relaxed">' + subtituloTexto + '</p>' +
        '<div class="flex justify-center gap-3 flex-wrap">' +
        '<button class="btn ' + (pestana === 'articulos' ? 'btn-leaf font-bold' : 'btn-ghost text-slate-300') + ' px-5 py-2.5 text-xs tracking-wider uppercase" onclick="renderComunidad(\'articulos\')"><i class="bi bi-newspaper me-1"></i> ARTÍCULOS &amp; GUÍAS</button>' +
        '<button class="btn ' + (pestana === 'buzon' ? 'btn-leaf font-bold' : 'btn-ghost text-slate-300') + ' px-5 py-2.5 text-xs tracking-wider uppercase" onclick="renderComunidad(\'buzon\')"><i class="bi bi-lightbulb-fill me-1"></i> BUZÓN &amp; PETICIONES</button>' +
        '<button class="btn ' + (pestana === 'escribir' ? 'btn-leaf font-bold' : 'btn-ghost text-slate-300') + ' px-5 py-2.5 text-xs tracking-wider uppercase" onclick="renderComunidad(\'escribir\')"><i class="bi bi-pencil-square me-1"></i> DEJAR PROPUESTA / IDEA</button>' +
        '</div></div></div>' +
        '<div id="contenedor-dinamico-comunidad" class="col-span-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"></div>';

    grid.innerHTML = navHtml;

    if (pestana === 'articulos') cargarArticulosBlogVista();
    else if (pestana === 'buzon') cargarBuzonComunidadVista('TODOS');
    else if (pestana === 'escribir') cargarFormularioPropuestaVista();
}

function cargarArticulosHome() {
    var cont = $('grid-articulos-home');
    if (!cont) return;
    fetch('/api/blog/articulos?_t=' + Date.now())
        .then(function(r) { return r.ok ? r.json() : []; })
        .then(function(arts) {
            articulosBlogCache = arts;
            if (!arts || !arts.length) {
                cont.innerHTML = '<div class="col-span-full text-center py-12"><i class="bi bi-journal-x text-3xl text-emerald-400/60 block mb-2"></i><p class="text-xs text-slate-400">Pronto publicaremos nuevos artículos y notas del laboratorio.</p></div>';
                return;
            }
            cont.innerHTML = arts.slice(0, 3).map(function(art) {
                var img = (art.imagen && art.imagen.trim()) ? art.imagen.trim() : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80';
                var esVideo = /\.(mp4|webm|mov)/i.test(img);
                var media = esVideo
                    ? '<video src="' + esc(img) + '" autoplay loop muted playsinline class="w-full h-44 object-cover"></video>'
                    : '<img src="' + esc(img) + '" alt="' + esc(art.titulo) + '" class="w-full h-44 object-cover" onerror="this.src=\'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80\'">';
                
                return '<div class="spot rim rounded-[28px] overflow-hidden flex flex-col justify-between cursor-pointer group transition-all duration-300 hover:-translate-y-1.5" onclick="abrirModalArticulo(' + Number(art.id) + ')">' +
                    '<div><div class="relative overflow-hidden">' + media +
                    '<span class="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-emerald-400/50 text-emerald-300"><i class="bi bi-tag-fill me-1"></i>' + esc((art.categoria || 'Nutrición').toUpperCase()) + '</span></div>' +
                    '<div class="p-6"><h3 class="font-cinzel text-xl font-bold mb-2 text-white group-hover:text-emerald-300 transition-colors line-clamp-2 uppercase">' + esc(art.titulo) + '</h3>' +
                    '<p class="text-slate-300 text-xs font-light leading-relaxed line-clamp-3 mb-4">' + esc(art.resumen || art.contenido || '') + '</p></div></div>' +
                    '<div class="px-6 pb-6 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">' +
                    '<span><i class="bi bi-person me-1"></i>' + esc(art.autor || 'Equipo RAÍCES') + '</span>' +
                    '<span class="text-ruby-400 font-semibold flex items-center gap-1"><i class="bi bi-heart-fill"></i> ' + (art.likes || 0) + '</span>' +
                    '</div></div>';
            }).join('');
        })
        .catch(function(err) {
            console.warn('Error cargando artículos home:', err);
            cont.innerHTML = '<div class="col-span-full text-center py-8 text-xs text-slate-400">No se pudieron cargar los artículos del laboratorio.</div>';
        });
}

function irAComunidadTab(pestana) {
    var catBtn = $('cat-btn-comunidad');
    if (catBtn) filtrar('Comunidad', catBtn);
    var catSec = $('catalogo');
    if (catSec) catSec.scrollIntoView({ behavior: 'smooth' });
    setTimeout(function() {
        renderComunidad(pestana || 'articulos');
    }, 200);
}

function cargarArticulosBlogVista() {
    var cont = $('contenedor-dinamico-comunidad');
    if (!cont) return;
    cont.innerHTML = '<div class="col-span-full text-center py-12"><div class="inline-block w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3"></div><p class="text-xs text-slate-400">Cargando artículos del laboratorio...</p></div>';

    fetch('/api/blog/articulos?_t=' + Date.now())
        .then(function(r) { return r.ok ? r.json() : []; })
        .then(function(arts) {
            articulosBlogCache = arts;
            if (!arts || !arts.length) {
                cont.innerHTML = '<div class="col-span-full text-center py-16"><i class="bi bi-journal-x text-4xl text-emerald-400 block mb-3"></i><p class="text-slate-400 text-sm">Aún no hay artículos publicados en el blog. ¡Vuelve pronto!</p></div>';
                return;
            }
            cont.innerHTML = arts.map(function(art, i) {
                var img = (art.imagen && art.imagen.trim()) ? art.imagen.trim() : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80';
                var esVideo = /\.(mp4|webm|mov)/i.test(img);
                var media = esVideo
                    ? '<video src="' + esc(img) + '" autoplay loop muted playsinline class="w-full h-48 object-cover"></video>'
                    : '<img src="' + esc(img) + '" alt="' + esc(art.titulo) + '" class="w-full h-48 object-cover" onerror="this.src=\'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80\'">';
                
                return '<div class="spot rim rounded-[28px] overflow-hidden flex flex-col justify-between cursor-pointer group transition-transform hover:-translate-y-1.5" onclick="abrirModalArticulo(' + Number(art.id) + ')">' +
                    '<div><div class="relative overflow-hidden">' + media +
                    '<span class="absolute top-3 left-3 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-black/60 backdrop-blur-md border border-emerald-400/50 text-emerald-300"><i class="bi bi-tag-fill me-1"></i>' + esc((art.categoria || 'Nutrición').toUpperCase()) + '</span></div>' +
                    '<div class="p-6"><h3 class="font-cinzel text-xl font-bold mb-2 text-white group-hover:text-emerald-300 transition-colors uppercase">' + esc(art.titulo) + '</h3>' +
                    '<p class="text-slate-300 text-xs font-light leading-relaxed line-clamp-3 mb-4">' + esc(art.resumen || art.contenido || '') + '</p></div></div>' +
                    '<div class="px-6 pb-6 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">' +
                    '<span><i class="bi bi-person me-1"></i>' + esc(art.autor || 'Equipo RAÍCES') + '</span>' +
                    '<div class="flex items-center gap-2">' +
                    '<button class="px-3 py-1.5 rounded-full bg-ruby-500/10 border border-ruby-500/30 text-ruby-400 font-semibold flex items-center gap-1 hover:bg-ruby-500/20" onclick="event.stopPropagation(); darLikeArticulo(' + Number(art.id) + ')"><i class="bi bi-heart-fill"></i> ' + (art.likes || 0) + '</button>' +
                    '<span class="btn btn-ghost px-3 py-1.5 text-xs text-yellow-400 font-bold">LEER <i class="bi bi-arrow-right ms-1"></i></span>' +
                    '</div></div></div>';
            }).join('');
        })
        .catch(function(e) {
            console.warn('Error cargando artículos:', e);
            cont.innerHTML = '<div class="col-span-full text-center py-12 text-slate-400">Error al cargar artículos.</div>';
        });
}

function abrirModalArticulo(id) {
    articuloActivoId = id;
    var art = (articulosBlogCache || []).find(function(a) { return Number(a.id) === Number(id); });
    if (!art) return;
    
    var modal = $('modal-blog-articulo');
    if (!modal) return;
    
    var img = (art.imagen && art.imagen.trim()) ? art.imagen.trim() : 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80';
    var esVideo = /\.(mp4|webm|mov)/i.test(img);
    $('blog-modal-media').innerHTML = esVideo
        ? '<video src="' + esc(img) + '" autoplay loop muted playsinline class="w-full h-full object-cover"></video>'
        : '<img src="' + esc(img) + '" class="w-full h-full object-cover" onerror="this.src=\'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80\'">';
    
    $('blog-modal-badges').innerHTML = '<span class="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-emerald-950/80 border border-emerald-400/50 text-emerald-300"><i class="bi bi-journal-text me-1"></i>' + esc(art.categoria || 'Blog') + '</span>' +
        '<span class="px-3 py-1 rounded-full text-xs font-semibold bg-white/5 border border-white/10 text-slate-300"><i class="bi bi-person me-1"></i>' + esc(art.autor || 'Equipo RAÍCES') + '</span>';
    
    $('blog-modal-titulo').innerText = art.titulo || '';
    $('blog-modal-autor').innerText = 'Publicación Oficial RAÍCES';
    $('blog-modal-like-btn').innerHTML = '<i class="bi bi-heart-fill"></i> ' + (art.likes || 0) + ' Aplausos';
    $('blog-modal-like-btn').onclick = function() { darLikeArticulo(art.id); };
    
    $('blog-modal-contenido').innerHTML = esc(art.contenido || art.resumen || '').replace(/\n/g, '<br><br>');
    
    cargarComentariosArticulo(art.id);
    modal.classList.remove('hidden');
    modal.classList.add('flex');
}

function cerrarModalArticulo() {
    var modal = $('modal-blog-articulo');
    if (modal) {
        modal.classList.add('hidden');
        modal.classList.remove('flex');
    }
}

function darLikeArticulo(id) {
    fetch('/api/blog/articulos/' + id + '/like', { method: 'POST' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(data) {
            if (data && isFinite(data.likes)) {
                var btn = $('blog-modal-like-btn');
                if (btn) btn.innerHTML = '<i class="bi bi-heart-fill"></i> ' + data.likes + ' Aplausos';
                var art = (articulosBlogCache || []).find(function(a) { return Number(a.id) === Number(id); });
                if (art) art.likes = data.likes;
                toast('¡Gracias por tu apoyo! ❤️');
            }
        });
}

function cargarComentariosArticulo(artId) {
    var cont = $('blog-modal-lista-comentarios');
    if (!cont) return;
    cont.innerHTML = '<p class="text-xs text-slate-400">Cargando comentarios...</p>';
    fetch('/api/blog/comentarios?articuloId=' + artId + '&_t=' + Date.now())
        .then(function(r) { return r.ok ? r.json() : []; })
        .then(function(comms) {
            if (!comms || !comms.length) {
                cont.innerHTML = '<p class="text-xs text-slate-500 italic">Aún no hay comentarios en este artículo. ¡Sé el primero en compartir tu opinión!</p>';
                return;
            }
            cont.innerHTML = comms.map(function(c) {
                return '<div class="p-3.5 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">' +
                    '<div class="flex items-center justify-between text-xs"><span class="font-bold text-emerald-300">' + esc(c.nombre || 'Explorador') + '</span><span class="text-slate-500">' + formatearFecha(c.fecha) + '</span></div>' +
                    '<p class="text-slate-300 text-xs leading-relaxed font-light">' + esc(c.mensaje) + '</p>' +
                    '</div>';
            }).join('');
        });
}

function comentarEnArticuloModal() {
    var inp = $('blog-comentario-input');
    if (!inp || !inp.value.trim() || !articuloActivoId) return;
    var msg = inp.value.trim();
    var nom = ($('nombreCliente') && $('nombreCliente').value.trim()) ? $('nombreCliente').value.trim() : 'Explorador RAÍCES';
    fetch('/api/blog/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ articuloId: articuloActivoId, nombre: nom, tipo: 'COMENTARIO', mensaje: msg })
    }).then(function(r) {
        if (r.ok) {
            inp.value = '';
            toast('Comentario publicado');
            cargarComentariosArticulo(articuloActivoId);
        } else {
            toast('No se pudo publicar el comentario');
        }
    });
}

function cargarBuzonComunidadVista(filtroTipo) {
    if (!filtroTipo) filtroTipo = 'TODOS';
    var cont = $('contenedor-dinamico-comunidad');
    if (!cont) return;
    cont.innerHTML = '<div class="col-span-full text-center py-12"><div class="inline-block w-8 h-8 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin mb-3"></div><p class="text-xs text-slate-400">Cargando buzón de propuestas...</p></div>';

    var url = '/api/blog/comentarios?_t=' + Date.now();
    if (filtroTipo !== 'TODOS') url += '&tipo=' + encodeURIComponent(filtroTipo);

    fetch(url)
        .then(function(r) { return r.ok ? r.json() : []; })
        .then(function(comms) {
            comentariosComunidadCache = comms;
            var filtrosHtml = '<div class="col-span-full mb-4 flex items-center justify-between gap-3 flex-wrap p-4 rounded-2xl bg-black/40 border border-white/10">' +
                '<div class="flex items-center gap-2 flex-wrap text-xs">' +
                '<span class="text-slate-400 font-semibold me-1">Filtrar:</span>' +
                '<button class="px-3 py-1 rounded-full border transition-all ' + (filtroTipo === 'TODOS' ? 'bg-emerald-500/20 border-emerald-400 text-emerald-300 font-bold' : 'border-white/10 text-slate-400 hover:text-white') + '" onclick="cargarBuzonComunidadVista(\'TODOS\')">Todos (' + comms.length + ')</button>' +
                '<button class="px-3 py-1 rounded-full border transition-all ' + (filtroTipo === 'SUGERENCIA' ? 'bg-amber-500/20 border-amber-400 text-amber-300 font-bold' : 'border-white/10 text-slate-400 hover:text-white') + '" onclick="cargarBuzonComunidadVista(\'SUGERENCIA\')">💡 Sugerencias</button>' +
                '<button class="px-3 py-1 rounded-full border transition-all ' + (filtroTipo === 'PETICIÓN' || filtroTipo === 'PETICION' ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300 font-bold' : 'border-white/10 text-slate-400 hover:text-white') + '" onclick="cargarBuzonComunidadVista(\'PETICIÓN\')">📋 Peticiones de sabor</button>' +
                '<button class="px-3 py-1 rounded-full border transition-all ' + (filtroTipo === 'COMENTARIO' ? 'bg-ruby-500/20 border-ruby-400 text-ruby-300 font-bold' : 'border-white/10 text-slate-400 hover:text-white') + '" onclick="cargarBuzonComunidadVista(\'COMENTARIO\')">💬 Comentarios</button>' +
                '</div>' +
                '<button class="btn btn-leaf px-4 py-2 text-xs" onclick="renderComunidad(\'escribir\')"><i class="bi bi-plus-circle me-1"></i> Dejar mi idea</button>' +
                '</div>';

            if (!comms || !comms.length) {
                cont.innerHTML = filtrosHtml + '<div class="col-span-full text-center py-16"><i class="bi bi-chat-square-dots text-4xl text-amber-400 block mb-3"></i><p class="text-slate-400 text-sm mb-4">Aún no hay propuestas en esta categoría. ¡Sé el primero en pedir un ingrediente o dejar tu sugerencia!</p><button class="btn btn-leaf px-6 py-3 text-xs" onclick="renderComunidad(\'escribir\')">Dejar propuesta ahora</button></div>';
                return;
            }

            var cardsHtml = comms.map(function(c) {
                var tipo = (c.tipo || 'COMENTARIO').toUpperCase();
                var badgeCls = tipo === 'SUGERENCIA' ? 'bg-amber-500/20 text-amber-300 border-amber-400/40' : (tipo === 'PETICIÓN' || tipo === 'PETICION') ? 'bg-cyan-500/20 text-cyan-300 border-cyan-400/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40';
                var icon = tipo === 'SUGERENCIA' ? 'bi-lightbulb-fill' : (tipo === 'PETICIÓN' || tipo === 'PETICION') ? 'bi-cup-straw' : 'bi-chat-dots-fill';

                return '<div class="spot rim rounded-[28px] p-6 flex flex-col justify-between text-left">' +
                    '<div><div class="flex items-center justify-between mb-3"><span class="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ' + badgeCls + '"><i class="bi ' + icon + ' me-1"></i>' + esc(tipo) + '</span><span class="text-xs text-slate-500">' + formatearFecha(c.fecha) + '</span></div>' +
                    '<h4 class="font-cinzel text-base font-bold text-white mb-2">' + esc(c.nombre || 'Explorador') + '</h4>' +
                    '<p class="text-slate-300 text-xs font-light leading-relaxed mb-4">' + esc(c.mensaje) + '</p></div>' +
                    '<div class="pt-3 border-t border-white/5 flex items-center justify-between"><button class="btn btn-ghost px-3.5 py-1.5 text-xs text-ruby-400 hover:text-ruby-300" onclick="darLikeComentario(' + Number(c.id) + ', this)"><i class="bi bi-heart-fill me-1.5"></i> Apoyar (' + (c.likes || 0) + ')</button></div>' +
                    '</div>';
            }).join('');

            cont.innerHTML = filtrosHtml + cardsHtml;
        });
}

function darLikeComentario(id, btn) {
    fetch('/api/blog/comentarios/' + id + '/like', { method: 'POST' })
        .then(function(r) { return r.ok ? r.json() : null; })
        .then(function(data) {
            if (data && isFinite(data.likes) && btn) {
                btn.innerHTML = '<i class="bi bi-heart-fill me-1.5"></i> Apoyar (' + data.likes + ')';
                toast('¡Propuesta apoyada!');
            }
        });
}

function cargarFormularioPropuestaVista() {
    var cont = $('contenedor-dinamico-comunidad');
    if (!cont) return;
    var nomGuardado = ($('nombreCliente') && $('nombreCliente').value.trim()) ? $('nombreCliente').value.trim() : '';

    cont.innerHTML = '<div class="col-span-full max-w-2xl mx-auto w-full"><div class="spot rim rounded-[32px] p-8 md:p-10">' +
        '<div class="flex items-center gap-3 mb-6 pb-4 border-b border-white/10"><i class="bi bi-chat-heart-fill text-2xl text-emerald-400"></i><div><h3 class="font-cinzel text-xl font-bold text-white">Buzón de Co-Creación RAÍCES</h3><p class="text-xs text-slate-400 font-light">Cuéntanos qué nuevo sabor, vegetal exótico o mejora te gustaría ver en el laboratorio.</p></div></div>' +
        '<form onsubmit="enviarPropuestaComunidad(event)" class="space-y-4">' +
        '<div><label class="label-bio">Tu nombre o apodo</label><input type="text" id="prop-nombre" required class="input-bio" value="' + esc(nomGuardado) + '" placeholder="Ej. Camila Alquimista"></div>' +
        '<div><label class="label-bio">Tipo de Aporte</label><div class="grid grid-cols-3 gap-2.5">' +
        '<label class="flex items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 cursor-pointer hover:border-emerald-500/40 text-xs font-semibold text-slate-300"><input type="radio" name="propTipo" value="SUGERENCIA" checked class="accent-emerald-500"> 💡 Sugerencia</label>' +
        '<label class="flex items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 cursor-pointer hover:border-emerald-500/40 text-xs font-semibold text-slate-300"><input type="radio" name="propTipo" value="PETICIÓN" class="accent-emerald-500"> 📋 Petición</label>' +
        '<label class="flex items-center gap-2 p-3 rounded-2xl bg-white/[0.03] border border-white/10 cursor-pointer hover:border-emerald-500/40 text-xs font-semibold text-slate-300"><input type="radio" name="propTipo" value="COMENTARIO" class="accent-emerald-500"> 💬 Mensaje</label>' +
        '</div></div>' +
        '<div><label class="label-bio">Tu propuesta o comentario en detalle</label><textarea id="prop-mensaje" required rows="4" class="input-bio resize-none" placeholder="Escribe aquí tu propuesta... Ej: Me gustaría que agreguen Pitahaya Dragón o Leche de Avena con Canela en Arma tu Batido."></textarea></div>' +
        '<div class="flex items-center justify-between pt-4 border-t border-white/10"><button type="button" class="btn btn-ghost px-5 py-3 text-xs" onclick="renderComunidad(\'buzon\')">Cancelar</button>' +
        '<button type="submit" id="btn-enviar-prop" class="btn btn-leaf px-8 py-3.5 text-xs"><i class="bi bi-send-fill me-1.5"></i> Publicar en la comunidad</button></div>' +
        '</form></div></div>';
}

function enviarPropuestaComunidad(e) {
    e.preventDefault();
    var nom = $('prop-nombre').value.trim() || 'Explorador RAÍCES';
    var msg = $('prop-mensaje').value.trim();
    var tipoRadio = document.querySelector('input[name="propTipo"]:checked');
    var tipo = tipoRadio ? tipoRadio.value : 'SUGERENCIA';
    var btn = $('btn-enviar-prop');
    if (btn) btn.disabled = true;

    fetch('/api/blog/comentarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nom, tipo: tipo, mensaje: msg })
    })
    .then(function(r) {
        if (r.ok) {
            toast('¡Tu propuesta fue publicada en el buzón!');
            renderComunidad('buzon');
        } else {
            toast('No se pudo publicar la propuesta');
            if (btn) btn.disabled = false;
        }
    })
    .catch(function() {
        toast('Error de red al enviar');
        if (btn) btn.disabled = false;
    });
}

function formatearFecha(fIso) {
    if (!fIso) return 'Reciente';
    try {
        var d = new Date(fIso), now = new Date(), diff = now - d;
        var min = Math.floor(diff / 60000);
        if (min < 2) return 'Hace un momento';
        if (min < 60) return 'Hace ' + min + ' min';
        var h = Math.floor(min / 60);
        if (h < 24) return 'Hace ' + h + ' h';
        var days = Math.floor(h / 24);
        if (days < 30) return 'Hace ' + days + ' días';
        return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
    } catch(e) { return 'Reciente'; }
}

/* 10. Chimpancé tomando un batido RAÍCES */
function initChimp() {
    var $c = function(i) { return document.getElementById(i); };
    var st = $c('cstage'), head = $c('cp-head'), body = $c('cp-body'), pup = $c('cp-pupils'), ears = $c('cp-ears'), gl = $c('cp-glasses'),
        big = $c('cbig'), sec = $c('chimpance'), cup = $c('cp-cup'), fa1 = $c('cp-fa1'), fa2 = $c('cp-fa2'), liq = $c('cp-liqr'), foam = $c('cp-foam'),
        cap = $c('ccap'), cta = $c('ccta'), tag = $c('ctag'), words = $c('cwords'), fl = $c('flora-chimp');
    if (!st || !sec) return;
    FLORA.chimp = [ ['m', 'left:-5%;top:-8%;--s:22;--rot:16;--px:-20;--py:-50;--d:10s'], ['f', 'right:-7%;bottom:-10%;--s:30;--fx:-1;--py:-60;--d:9s'], ['h', 'left:5%;bottom:-8%;--s:8;--py:-30;--d:6s'], ['m', 'right:3%;top:-10%;--s:17;--rot:-24;--fx:-1;--py:-40;--d:11s'] ];
    buildFlora(fl, FLORA.chimp, true);
    var cv = $c('cfx'), cx = cv ? cv.getContext('2d') : null, P = [], W = 0, Hh = 0, dpr = Math.min(2, devicePixelRatio || 1), tip = [233, 345];
    var noFx = matchMedia('(prefers-reduced-motion: reduce)').matches, FX = noFx ? 0 : (innerWidth < 820 ? .6 : 1);
    if (AJUSTES.efectoParticulasChimp === false) FX = 0;

    var au = $c('caura'), b2 = $c('cbig2'), ring = $c('cring');
    if (innerWidth < 820 || (navigator.hardwareConcurrency || 8) <= 4) {
        Array.prototype.forEach.call(st.querySelectorAll('[filter]'), function(el) { var f = el.getAttribute('filter'); if (f.indexOf('cp-rough') > -1 || f.indexOf('cp-soft') > -1) el.removeAttribute('filter'); });
    }
    function fit() { if (!cv) return; var r = cv.getBoundingClientRect(); W = r.width; Hh = r.height; cv.width = W * dpr; cv.height = Hh * dpr; if (cx) cx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    addEventListener('resize', fit); fit();
    function G(gx, gy) { if (!cv) return [0, 0]; var rs = st.getBoundingClientRect(), rc = cv.getBoundingClientRect(), sc = rs.width / 400; return [rs.left - rc.left + gx * sc, rs.top - rc.top + gy * sc]; }
    function emit(n, x, y, o) {
        if (!FX) return;
        n = Math.round(n * FX);
        for (var i = 0; i < n && P.length < 260; i++) {
            var a = o.a0 + Math.random() * (o.a1 - o.a0), s = o.s0 + Math.random() * (o.s1 - o.s0);
            P.push({ x: x, y: y, vx: Math.cos(a) * s, vy: Math.sin(a) * s, g: o.g, life: 1, dec: .008 + Math.random() * .012, r: o.r0 + Math.random() * (o.r1 - o.r0), c: o.c[(Math.random() * o.c.length) | 0], t: o.t, rot: Math.random() * 6.28, vr: (Math.random() - .5) * .2 });
        }
    }
    function drawFx() {
        if (!cx || !W) return;
        cx.clearRect(0, 0, W, Hh); cx.globalCompositeOperation = 'lighter';
        for (var i = P.length - 1; i >= 0; i--) {
            var q = P[i]; q.vy += q.g; q.x += q.vx; q.y += q.vy; q.vx *= .992; q.rot += q.vr; q.life -= q.dec;
            if (q.life <= 0 || q.y > Hh + 40) { P.splice(i, 1); continue; }
            cx.globalAlpha = Math.min(1, q.life * 1.6); cx.fillStyle = q.c; cx.save(); cx.translate(q.x, q.y); cx.rotate(q.rot); cx.beginPath();
            if (q.t === 'leaf') cx.ellipse(0, 0, q.r * 1.9, q.r * .8, 0, 0, 6.283);
            else if (q.t === 'spark') { var s = q.r * (.6 + q.life); cx.moveTo(0, -s * 2); cx.lineTo(s * .35, -s * .35); cx.lineTo(s * 2, 0); cx.lineTo(s * .35, s * .35); cx.lineTo(0, s * 2); cx.lineTo(-s * .35, s * .35); cx.lineTo(-s * 2, 0); cx.lineTo(-s * .35, -s * .35); cx.closePath(); }
            else cx.arc(0, 0, q.r, 0, 6.283);
            cx.fill(); cx.restore();
        }
        cx.globalAlpha = 1; cx.globalCompositeOperation = 'source-over';
    }
    var SPK = ['#fde68a', '#bef264', '#ffffff'], LEAF = ['#4ade80', '#a3e635', '#fbbf24', '#ff4d6d', '#fde68a'];
    function burst(ph) {
        if (!FX) return;
        if (ph === 1) { var g = G(300, 400); emit(18, g[0], g[1], { a0: 0, a1: 6.28, s0: 1, s1: 4, g: .02, r0: 2, r1: 4, c: SPK, t: 'spark' }); }
        if (ph === 4) {
            var h2 = G(200, 150); emit(80, h2[0], h2[1], { a0: -3.1, a1: -.05, s0: 4, s1: 11, g: .16, r0: 3, r1: 6.5, c: LEAF, t: 'leaf' });
            emit(34, h2[0], h2[1], { a0: 0, a1: 6.28, s0: 2, s1: 8, g: .05, r0: 2, r1: 4.5, c: SPK, t: 'spark' });
            if (ring) { ring.classList.remove('go'); void ring.offsetWidth; ring.classList.add('go'); }
            if (navigator.vibrate) navigator.vibrate(40);
        }
    }
    var sd = 7, NS = 'http://www.w3.org/2000/svg';
    function R() { sd = (sd * 16807) % 2147483647; return sd / 2147483647; }
    function fur(g, n, pt) {
        if (!g) return;
        var cols = ['#0d0806', '#2b1e17', '#4b382c'], ds = ['', '', ''];
        for (var i = 0; i < n; i++) { var q = pt(), a = q[2], l = 10 + R() * 20, c = (R() - .5) * 10, k = i % 3; ds[k] += 'M' + (q[0] | 0) + ' ' + (q[1] | 0) + 'q' + ((Math.cos(a) * l / 2 + c) | 0) + ' ' + ((Math.sin(a) * l / 2) | 0) + ' ' + ((Math.cos(a) * l) | 0) + ' ' + ((Math.sin(a) * l) | 0); }
        cols.forEach(function(c, k) { var p = document.createElementNS(NS, 'path'); p.setAttribute('d', ds[k]); p.setAttribute('stroke', c); p.setAttribute('stroke-width', 1.6 + k * .3); p.setAttribute('fill', 'none'); p.setAttribute('stroke-linecap', 'round'); g.appendChild(p); });
    }
    fur($c('cp-sh'), 320, function() { var t = Math.PI * (.9 + R() * 1.2); return [200 + 130 * .94 * Math.cos(t), 205 + 142 * .94 * Math.sin(t), t + (R() - .5) * .6]; });
    fur($c('cp-sb'), 420, function() { var px = -10 + R() * 420, top = 346 + 56 * Math.pow((px - 200) / 210, 2); return [px, top + R() * 100, -Math.PI / 2 + (px - 200) / 260 + (R() - .5) * .9]; });

    var HL = { sorbo: '#ff4d6d', 'raíz': '#4ade80', espinaca: '#4ade80', aloe: '#a3e635', jengibre: '#f59e0b', 'cúrcuma': '#fbbf24', selva: '#4ade80' };
    var spans = [];
    window.__rebuildChimpWords = function() {
        if (!words) return;
        var raw = words.textContent.trim().split(/\s+/).filter(Boolean);
        words.innerHTML = raw.map(function(w) { var c = HL[w.toLowerCase().replace(/[.,:]/g, '')]; return '<span' + (c ? ' class="hl" style="--hc:' + c + '"' : '') + '>' + w + '</span>'; }).join('');
        spans = Array.prototype.slice.call(words.querySelectorAll('span'));
    };
    window.__rebuildChimpWords();
    var tx = 0, ty = 0, x = 0, y = 0, last = performance.now(), vis = false, phase = -1;
    var CAPS = ['Mira lo que traje', 'Un sorbito…', 'Despacio…', 'Ya casi…', '¡Ahhh!'];
    var chimpTriggered = false;
    new IntersectionObserver(function(es) {
        vis = es[0].isIntersecting;
        if (vis && !chimpTriggered) {
            chimpTriggered = true;
            playApeSound();
        } else if (!vis) {
            chimpTriggered = false;
        }
    }, { threshold: 0.15, rootMargin: '0px' }).observe(sec);
    addEventListener('pointermove', function(e) { tx = (e.clientX / innerWidth - .5) * 2; ty = (e.clientY / innerHeight - .5) * 2; last = performance.now(); });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(function(n) { st.addEventListener(n, function() { st.classList.remove('ooh'); }); });
    st.addEventListener('pointerdown', function(e) { st.classList.add('ooh'); playApeSound(true); if (cv) { var rc = cv.getBoundingClientRect(); emit(14, e.clientX - rc.left, e.clientY - rc.top, { a0: 0, a1: 6.28, s0: 1, s1: 5, g: .06, r0: 2, r1: 4, c: SPK, t: 'spark' }); } });
    addEventListener('touchmove', function(e) { var t = e.touches[0]; if (t) { tx = (t.clientX / innerWidth - .5) * 2; ty = (t.clientY / innerHeight - .5) * 2; last = performance.now(); } }, { passive: true });
    function s2(a, b, v) { var t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); }
    function lp(a, b, k) { return a + (b - a) * k; }
    function frame(t) {
        requestAnimationFrame(frame);
        if (!vis) return;
        var r = sec.getBoundingClientRect(), p = clamp(-r.top / (sec.offsetHeight - innerHeight));
        if (t - last > 3500) { tx = Math.sin(t / 1500) * .9; ty = Math.sin(t / 2400) * .25; }
        x += (tx - x) * .08; y += (ty - y) * .08;
        var raise = s2(.12, .30, p), lower = s2(.86, .97, p), k = raise * (1 - lower * .75), sip = s2(.32, .4, p) * (1 - s2(.8, .86, p)), lvl = 1 - .88 * s2(.32, .82, p), w = 1 - .7 * k;
        var happy = s2(.86, .92, p), bounce = happy * Math.abs(Math.sin(t / 190)) * 7;
        head.style.transform = 'translate(' + (x * 22 * w) + 'px,' + (y * 12 * w - bounce) + 'px) rotate(' + (x * 5 * w - 5 * sip + happy * Math.sin(t / 380) * 3) + 'deg)';
        ears.style.transform = 'translate(' + (-x * 3) + 'px,0)';
        body.style.transform = 'translate(' + (x * 8) + 'px,' + (-y * 3) + 'px)';
        pup.style.transform = 'translate(' + (x * 6 * w) + 'px,' + (y * 4.5 * w - 3 * k) + 'px)';
        gl.style.transform = 'translate(' + (x * 3) + 'px,' + (y * 2) + 'px)';
        big.style.transform = 'translate(' + (-x * 42) + 'px,' + (-y * 18) + 'px)';
        var cupScale = 1.38;
        var hx = lp(305, 233, k), hy = lp(442, 459, k) - Math.sin(Math.PI * k) * 28 + (sip > .5 ? Math.sin(t / 260) * 1.6 : 0), rot = lp(8, -14, k), a = rot * Math.PI / 180;
        cup.setAttribute('transform', 'translate(' + hx.toFixed(1) + ' ' + hy.toFixed(1) + ') rotate(' + rot.toFixed(1) + ') scale(' + cupScale + ')');
        tip[0] = hx + (-Math.cos(a) * 2 + Math.sin(a) * 88) * cupScale; tip[1] = hy + (-Math.sin(a) * 2 - Math.cos(a) * 88) * cupScale;
        var ex = hx + (Math.cos(a) * 24 - Math.sin(a) * 42) * cupScale, ey = hy + (Math.sin(a) * 24 + Math.cos(a) * 42) * cupScale;
        var d = 'M372 545Q' + ((372 + ex) / 2 + 28).toFixed(1) + ' ' + ((545 + ey) / 2 + 6).toFixed(1) + ' ' + ex.toFixed(1) + ' ' + ey.toFixed(1);
        fa1.setAttribute('d', d); fa2.setAttribute('d', d);
        var ly = 52 - lvl * 98; liq.setAttribute('y', ly.toFixed(1)); foam.setAttribute('cy', ly.toFixed(1));
        st.classList.toggle('sip', sip > .5);
        st.style.setProperty('--mo', st.classList.contains('ooh') ? 1 : (sip > .5 ? .3 : (happy > .5 ? .85 : 0)));
        st.classList.toggle('hype', happy > .5);
        fl.style.setProperty('--p', p.toFixed(3));
        if (au) {
            au.style.opacity = (.35 + .45 * s2(.1, .4, p) + .15 * sip * Math.sin(t / 250)).toFixed(3);
            au.style.transform = 'scale(' + (1 + .06 * sip * Math.sin(t / 300)).toFixed(3) + ')'; au.style.setProperty('--k', s2(.3, .9, p).toFixed(3));
        }
        if (b2) b2.style.transform = 'translate(' + (x * 30) + 'px,' + (y * 14) + 'px) scale(' + (1 + .12 * p).toFixed(3) + ')';
        st.style.transform = 'scale(' + (.88 + .12 * s2(0, .08, p)).toFixed(3) + ')';
        if (sip > .5 && Math.random() < .3 * FX) { var g = G(tip[0], tip[1]); emit(1, g[0], g[1], { a0: -2.2, a1: -.9, s0: .6, s1: 1.8, g: .03, r0: 1.5, r1: 3, c: ['#bef264', '#4ade80', '#fde68a'], t: 'drop' }); }
        drawFx();
        words.style.setProperty('--n', p);
        var n = Math.floor(clamp(p / .82) * spans.length);
        spans.forEach(function(s, i) {
            s.classList.toggle('on', i < n);
            s.classList.toggle('now', i === n - 1 && n < spans.length);
        });
        tag.style.transform = 'translateY(' + ((1 - Math.min(1, p * 6)) * 40) + 'px)'; tag.style.opacity = Math.min(1, p * 6);
        var ph = p < .14 ? 0 : p < .32 ? 1 : p < .62 ? 2 : p < .84 ? 3 : 4;
        if (ph !== phase) {
            phase = ph;
            cap.innerHTML = '<span>' + CAPS[ph] + '</span>';
            cap.style.display = 'inline-block';
            cap.classList.remove('pop'); void cap.offsetWidth; cap.classList.add('pop'); burst(ph);
        }
        cta.classList.toggle('on', p > .9);
    }
    requestAnimationFrame(frame);
}

/* 11. Simios que se asoman por los bordes de la página */
var APES = [], APE_M = { x: window.innerWidth / 2, y: window.innerHeight / 2 }, apeRaf = 0, apeIO = null;
var APE_SAY = ['¡Uh uh! 🍌', 'Yo pediría el Rubí Vital', 'Más espinaca, por favor', 'Pura raíz, cero azúcar', '¿Me regalas un sorbo?', 'Esa remolacha se ve buenísima', 'Prensado en frío, como debe ser'];
function apeRnd(seed) { var s = seed * 7919 + 13; return function() { s = (s * 16807) % 2147483647; return s / 2147483647; }; }
function apeSVG(seed) {
    var R = apeRnd(seed), fur = '', hi = '', i, tones = ['#1c120d', '#2b1c14', '#3a271b', '#140b08'];
    for (i = 0; i < 260; i++) {
        var a = Math.PI * (.84 + R() * 1.32), ox = Math.cos(a), oy = Math.sin(a), cx = 100 + ox * 56, cy = 74 + oy * 59;
        if (cy > 122) continue;
        var len = 3 + R() * 6.5, bend = (R() - .5) * 5, px = -oy, py = ox;
        fur += '<path d="M' + (cx - ox * 5).toFixed(1) + ' ' + (cy - oy * 5).toFixed(1) + 'Q' + (cx + ox * len * .4 + px * bend * 1.6).toFixed(1) + ' ' + (cy + oy * len * .4 + py * bend * 1.6).toFixed(1) + ' ' + (cx + ox * len + px * bend).toFixed(1) + ' ' + (cy + oy * len + py * bend).toFixed(1) + '" stroke="' + tones[Math.floor(R() * 4)] + '" stroke-width="' + (.9 + R() * .9).toFixed(1) + '" fill="none" stroke-linecap="round" opacity=".9"/>';
    }
    for (i = 0; i < 70; i++) {
        var b = Math.PI * (1.04 + R() * .92), rr = 30 + R() * 24, bx = 100 + Math.cos(b) * rr, by = 74 + Math.sin(b) * rr * 1.05, bl = 5 + R() * 6;
        hi += '<path d="M' + bx.toFixed(1) + ' ' + by.toFixed(1) + 'l' + (Math.cos(b) * bl).toFixed(1) + ' ' + (Math.sin(b) * bl).toFixed(1) + '" stroke="' + (R() < .5 ? '#5a4234' : '#120a07') + '" stroke-width="1.1" opacity=".45" stroke-linecap="round"/>';
    }
    var FACE = 'M100 56C74 56 60 74 60 98C60 122 78 138 100 138C122 138 140 122 140 98C140 74 126 56 100 56Z';
    function hand(x, cls) {
        return '<g class="ahands ' + cls + '"><g transform="translate(' + x + ' 0)"><path d="M0 170V132" stroke="url(#ap-fur)" stroke-width="26" stroke-linecap="round"/><ellipse cx="0" cy="132" rx="17" ry="11" fill="url(#ap-fur)"/>' +
            [-10, -3.4, 3.4, 10].map(function(k) { return '<circle cx="' + k + '" cy="138" r="3.6" fill="url(#ap-skin)" stroke="#6e4733" stroke-width=".6"/>'; }).join('') + '</g></g>';
    }
    return '<svg viewBox="0 0 200 140" aria-hidden="true" focusable="false"><g class="ahead">' +
        '<circle cx="46" cy="86" r="15" fill="url(#ap-skin)"/><circle cx="46" cy="86" r="8" fill="#8a5d45"/><circle cx="154" cy="86" r="15" fill="url(#ap-skin)"/><circle cx="154" cy="86" r="8" fill="#8a5d45"/>' +
        '<ellipse cx="100" cy="74" rx="57" ry="60" fill="url(#ap-fur)"/>' + fur +
        '<path d="' + FACE + '" fill="url(#ap-skin)"/><path d="' + FACE + '" fill="url(#ap-shade)"/>' +
        '<path d="M62 70Q82 60 98 70L98 75Q80 67 62 77Z" fill="#4a2f22" opacity=".55" filter="url(#ap-soft)"/><path d="M138 70Q118 60 102 70L102 75Q120 67 138 77Z" fill="#4a2f22" opacity=".55" filter="url(#ap-soft)"/>' +
        '<ellipse cx="82" cy="78" rx="8.6" ry="5.6" fill="#dccbad"/><ellipse cx="118" cy="78" rx="8.6" ry="5.6" fill="#dccbad"/>' +
        '<g class="apup"><circle cx="82" cy="78" r="4.4" fill="url(#ap-iris)"/><circle cx="82" cy="78" r="2.3" fill="#000"/><circle cx="80.6" cy="76.6" r="1.1" fill="#fff"/><circle cx="118" cy="78" r="4.4" fill="url(#ap-iris)"/><circle cx="118" cy="78" r="2.3" fill="#000"/><circle cx="116.6" cy="76.6" r="1.1" fill="#fff"/></g>' +
        '<ellipse class="alid" cx="82" cy="78" rx="9.6" ry="6.4" fill="#9c6c50"/><ellipse class="alid" cx="118" cy="78" rx="9.6" ry="6.4" fill="#9c6c50"/>' +
        '<ellipse cx="100" cy="113" rx="29" ry="21" fill="url(#ap-muz)"/><ellipse cx="100" cy="124" rx="22" ry="10" fill="#b98a6c" opacity=".25" filter="url(#ap-soft)"/>' +
        '<ellipse cx="93" cy="105" rx="2.4" ry="1.5" fill="#4a2c20" transform="rotate(-20 93 105)"/><ellipse cx="107" cy="105" rx="2.4" ry="1.5" fill="#4a2c20" transform="rotate(20 107 105)"/><path d="M100 107V116" stroke="#7d5640" stroke-width="1.4" fill="none"/>' +
        '<path d="M82 122Q100 131 118 122" stroke="#3f261b" stroke-width="1.9" fill="none" stroke-linecap="round"/>' +
        '<g class="amouth"><path d="M84 123Q100 127 116 123Q112 139 100 139Q88 139 84 123Z" fill="#33140f"/><ellipse cx="100" cy="134" rx="7" ry="3" fill="#b0504a"/></g>' +
        '<path d="M44 88C38 28 162 28 156 88C142 66 122 60 100 62C78 60 58 66 44 88Z" fill="url(#ap-fur)"/>' + hi +
        '<g class="cneon" filter="url(#ap-glow)"><g fill="none" stroke="url(#ap-neon)" stroke-width="4"><rect x="66" y="65" width="32" height="26" rx="11"/><rect x="102" y="65" width="32" height="26" rx="11"/></g></g>' +
        '<rect x="66" y="65" width="32" height="26" rx="11" fill="url(#ap-lens)"/><rect x="102" y="65" width="32" height="26" rx="11" fill="url(#ap-lens)"/>' +
        '<g fill="none" stroke="url(#ap-neon)" stroke-width="2.2" stroke-linecap="round"><rect x="66" y="65" width="32" height="26" rx="11"/><rect x="102" y="65" width="32" height="26" rx="11"/><path d="M98 73Q100 69 102 73M66 73L54 77M134 73L146 77"/></g>' +
        '<path d="M72 68L84 68L76 88L70 88Z" fill="#fff" opacity=".14"/><path d="M108 68L120 68L112 88L106 88Z" fill="#fff" opacity=".14"/></g>' +
        hand(20, 'l') + hand(180, 'r') + '</svg>';
}
function mountApe(box, seed, v) {
    var el = document.createElement('div'); el.className = 'ape ' + (v || '');
    el.innerHTML = apeSVG(seed); box.appendChild(el);
    var a = { el: el, box: box, svg: el.firstChild, lock: null }; box._ape = a;
    APES.push(a); el.addEventListener('click', function() { apeClick(a); });
    if (apeIO && box.hasAttribute('data-ape')) apeIO.observe(box);
    return a;
}
function apeDo(a, cls, ms) { if (!a) return; a.el.classList.add(cls); clearTimeout(a['t' + cls]); a['t' + cls] = setTimeout(function() { a.el.classList.remove(cls); }, ms); }
function apeSay(a, txt) {
    var b = $('ape-bubble'); if (!b) { b = document.createElement('div'); b.id = 'ape-bubble'; document.body.appendChild(b); }
    var r = a.box.getBoundingClientRect(), x = Math.max(90, Math.min(window.innerWidth - 90, r.left + r.width / 2));
    b.textContent = txt; b.style.left = x + 'px'; b.style.top = Math.max(72, r.top + 4) + 'px'; b.classList.add('show');
    clearTimeout(apeSay._t); apeSay._t = setTimeout(function() { b.classList.remove('show'); }, 2300);
}
function apeClick(a) { apeDo(a, 'bounce', 550); apeDo(a, 'ooh', 1000); playApeSound(true); apeSay(a, APE_SAY[Math.floor(Math.random() * APE_SAY.length)]); }
function apesCheer() { playApeSound(); APES.forEach(function(a) { if (a.el.classList.contains('in') && a.el.isConnected) { apeDo(a, 'cheer', 1500); apeDo(a, 'ooh', 1500); } }); }
function apeQueue() { if (!apeRaf) apeRaf = requestAnimationFrame(apeLook); }
function apeLook() {
    apeRaf = 0;
    APES.forEach(function(a) {
        if (!a.el.isConnected) return;
        var r = a.svg.getBoundingClientRect(); if (r.bottom < -50 || r.top > window.innerHeight + 50) return;
        var tx = APE_M.x, ty = APE_M.y;
        if (a.lock) { var L = $(a.lock); if (L) { var lr = L.getBoundingClientRect(); tx = lr.left + lr.width / 2; ty = lr.top + lr.height * .55; } }
        var ex = r.left + r.width * .5, ey = r.top + r.height * .46, dx = tx - ex, dy = ty - ey, d = Math.hypot(dx, dy) || 1, k = Math.min(1, d / 220), s = a.svg.style;
        s.setProperty('--px', (dx / d * 3.6 * k).toFixed(2)); s.setProperty('--py', (dy / d * 2.6 * k).toFixed(2));
        s.setProperty('--hx', (dx / d * 2.2 * k).toFixed(2)); s.setProperty('--hy', (Math.max(-1, dy / d) * 1.2 * k).toFixed(2));
        s.setProperty('--tl', (Math.max(-1, Math.min(1, dx / 400)) * 5).toFixed(2));
    });
}
function initApes() {
    if (AJUSTES.efectoSimiosActivo === false) return;
    var defs = document.createElement('div');
    defs.innerHTML = '<svg width="1" height="1" style="position:absolute;overflow:hidden" aria-hidden="true" focusable="false"><defs>' +
        '<radialGradient id="ap-fur" cx="50%" cy="28%" r="80%"><stop offset="0" stop-color="#4a372d"/><stop offset="1" stop-color="#0f0907"/></radialGradient>' +
        '<radialGradient id="ap-skin" cx="50%" cy="38%" r="68%"><stop offset="0" stop-color="#e2b999"/><stop offset="1" stop-color="#a97759"/></radialGradient>' +
        '<radialGradient id="ap-muz" cx="50%" cy="35%" r="70%"><stop offset="0" stop-color="#f1d4bb"/><stop offset="1" stop-color="#c79778"/></radialGradient>' +
        '<radialGradient id="ap-iris" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#8a5a32"/><stop offset="1" stop-color="#241208"/></radialGradient>' +
        '<radialGradient id="ap-shade" cx="50%" cy="48%" r="60%"><stop offset=".55" stop-color="#2a140a" stop-opacity="0"/><stop offset="1" stop-color="#2a140a" stop-opacity=".55"/></radialGradient>' +
        '<linearGradient id="ap-neon" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4ade80"/><stop offset="1" stop-color="#ff4d6d"/></linearGradient>' +
        '<linearGradient id="ap-lens" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#4ade80" stop-opacity=".3"/><stop offset=".5" stop-color="#0a0f2a" stop-opacity=".55"/><stop offset="1" stop-color="#ff4d6d" stop-opacity=".32"/></linearGradient>' +
        '<filter id="ap-soft"><feGaussianBlur stdDeviation="1.3"/></filter><filter id="ap-glow" x="-30%" y="-40%" width="160%" height="180%"><feGaussianBlur stdDeviation="2.4"/></filter></defs></svg>';
    document.body.appendChild(defs.firstChild);
    apeIO = new IntersectionObserver(function(es) { es.forEach(function(e) { if (e.isIntersecting && e.target._ape) { e.target._ape.el.classList.add('in'); apeIO.unobserve(e.target); playApeSound(); } }); }, { threshold: .4, rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.ape-peek[data-ape]').forEach(function(box) { mountApe(box, +box.getAttribute('data-ape') * 11, box.getAttribute('data-v') || ''); });
    window.addEventListener('pointermove', function(e) { APE_M.x = e.clientX; APE_M.y = e.clientY; apeQueue(); }, { passive: true });
    window.addEventListener('scroll', function() { apeQueue(); $('ape-bubble') && $('ape-bubble').classList.remove('show'); }, { passive: true });
    window.addEventListener('resize', apeQueue);
    apeQueue();
}
var _agrOrig = agregarAlCarrito;
agregarAlCarrito = function() { var r = _agrOrig.apply(this, arguments); apesCheer(); return r; };

function iniciarMenuRaices() {
    if (window.__raicesMenuIniciado) return;
    window.__raicesMenuIniciado = true;
    actualizarHeaderOffset();
    toggleNavOnScroll();
    cargarAjustesDesdeBackend();
    initFlora();
    initChimp();
    initNodo();
    initApes();
    updateScrollProgress();
    cargarArticulosHome();
    intentarReproducirAudioFondo();
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('/sw.js').catch(function() {});
    }
}

if (document.readyState === 'loading') {
    window.addEventListener('DOMContentLoaded', iniciarMenuRaices);
} else {
    iniciarMenuRaices();
}
