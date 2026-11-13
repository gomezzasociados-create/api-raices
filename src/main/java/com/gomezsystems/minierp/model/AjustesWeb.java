package com.gomezsystems.minierp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ajustes_web")
public class AjustesWeb {

    @Id
    private Long id = 1L;

    // --- 0. BARRA SUPERIOR DE ANUNCIO & ENCABEZADO / NAVBAR ---
    private Boolean bannerPromoActivo = true;
    @Column(length = 1000)
    private String bannerPromoTexto = "🌿 Cosecha directa de productores sostenibles · Entregas hoy en Tuluá y Valle";

    @Column(length = 200)
    private String navBrandNombre = "RAÍCES";
    @Column(length = 200)
    private String navBrandTagline = "Elixir botánico";
    @Column(length = 100)
    private String navLink1 = "Experiencia";
    @Column(length = 100)
    private String navLink2 = "Catálogo";
    @Column(length = 100)
    private String navLink3 = "Ingredientes";
    @Column(length = 100)
    private String navLink4 = "Protocolo";
    @Column(length = 100)
    private String navBotonModo = "Ver continuo";
    @Column(length = 100)
    private String navBotonPedir = "Pedir ahora";

    // --- 1. HERO & EXPERIENCIA CINEMATOGRÁFICA ---
    @Column(length = 500)
    private String heroBadge = "Elixir Botánico · Prensado en Frío";

    @Column(length = 500)
    private String heroTitulo = "RAÍCES";

    @Column(length = 2000)
    private String heroSubtitulo = "Nutrición celular viva, sin pasteurizar y sin azúcar añadida.";

    @Column(length = 500)
    private String heroScrollCta = "Desliza para ver la experiencia";

    // --- 2. ESCENAS SOBRE EL VIDEO CINEMATOGRÁFICO (ESQUINAS) ---
    // Escena 1 (Esquina Inferior Izquierda)
    @Column(length = 300)
    private String videoEscena1Tag = "Prensado en Frío · 14°C";
    @Column(length = 300)
    private String videoEscena1Titulo = "Extracción Hidráulica";
    @Column(length = 100)
    private String videoEscena1Cifra = "98.6%";
    @Column(length = 300)
    private String videoEscena1CifraLabel = "Enzimas Vivas Activas";
    @Column(length = 1500)
    private String videoEscena1Desc = "Presión suave y continua sin calor ni cuchillas térmicas. Preserva la estructura molecular de cada fitonutriente.";

    // Escena 2 (Esquina Inferior Derecha)
    @Column(length = 300)
    private String videoEscena2Tag = "Pureza Botánica 100%";
    @Column(length = 300)
    private String videoEscena2Titulo = "Cero Agua Añadida";
    @Column(length = 100)
    private String videoEscena2Cifra = "0.0%";
    @Column(length = 300)
    private String videoEscena2CifraLabel = "Azúcar · Sin Químicos";
    @Column(length = 1500)
    private String videoEscena2Desc = "Solo la savia y extracto denso de raíces vivas cosechadas de agricultores sostenibles en menos de 24 horas.";

    // Escena 3 (Esquina Inferior Izquierda)
    @Column(length = 300)
    private String videoEscena3Tag = "Bioasimilación Inmediata";
    @Column(length = 300)
    private String videoEscena3Titulo = "Nutrición Celular";
    @Column(length = 100)
    private String videoEscena3Cifra = "< 20 min";
    @Column(length = 300)
    private String videoEscena3CifraLabel = "Absorción Digestiva";
    @Column(length = 1500)
    private String videoEscena3Desc = "Oxigenación inmediata y recarga limpia de tus mitocondrias sin fermentación ni pesadez estomacal.";

    // Escena 4 (Esquina Inferior Derecha - Cierre y CTA)
    @Column(length = 300)
    private String videoEscena4Tag = "Colección Viva 2026";
    @Column(length = 300)
    private String videoEscena4Titulo = "Despierta tu Vitalidad";
    @Column(length = 1500)
    private String videoEscena4Desc = "Explora nuestros elíxires individuales, packs fitoquímicos semanales o crea tu fórmula en 'Arma tu Batido'.";
    @Column(length = 300)
    private String videoEscena4Boton = "Ver Catálogo Completo";

    // --- 3. MARQUESINA Y TICKER ---
    @Column(length = 2000)
    private String marquesinaTexto = "Prensado en frío | Sin azúcar añadida | Sin conservantes | Cosecha de menos de 24 horas | Despacho el mismo día | Pide por voz";

    // --- 4. SECCIÓN CATÁLOGO ---
    @Column(length = 300)
    private String catalogoTitulo = "Elixires recién prensados";
    @Column(length = 1000)
    private String catalogoSubtitulo = "Toca una botella para ver su ficha. Todo se prensa en las últimas 24 horas.";

    // --- 5. SECCIÓN SEIS RAÍCES ---
    @Column(length = 300)
    private String ingredientesTitulo = "Seis raíces, cero relleno";
    @Column(length = 1000)
    private String ingredientesSubtitulo = "Las elegimos por su densidad enzimática y la compramos directo a agricultores sostenibles.";

    // --- 6. SECCIÓN PROTOCOLO (BENEFICIOS) ---
    @Column(length = 300)
    private String protocoloTitulo = "Protocolo en tres fases";
    @Column(length = 1000)
    private String protocoloSubtitulo = "Depura, activa y repara, en este orden.";

    // --- 7. SECCIÓN CHIMPANCÉ ---
    @Column(length = 300)
    private String chimpanceTag = "El chimpancé aprobó";
    @Column(length = 2500)
    private String chimpanceTexto = "Hasta el chimpancé lo sabe: un buen sorbo empieza en la raíz. Espinaca viva, aloe, jengibre y cúrcuma, prensados en frío y sin azúcar añadida. Cierra los ojos, bebe despacio y deja que la selva haga el resto.";
    @Column(length = 300)
    private String chimpanceBoton = "Pedir mi batido";

    // --- 8. SECCIÓN ARMA TU BATIDO (BUILDER) ---
    @Column(length = 300)
    private String licuadoraTitulo = "Arma tu batido";
    @Column(length = 1000)
    private String licuadoraSubtitulo = "Elige una base y hasta 4 ingredientes. Lo prensamos al momento.";

    // --- 9. DATOS DE CONTACTO Y MENSAJERÍA ---
    private String whatsappNumero = "573177651016";
    private String telefonoContacto = "3177651016";
    private String emailContacto = "contacto@raices.bio";

    // --- 10. PIE DE PÁGINA (FOOTER) ---
    @Column(length = 500)
    private String footerFrase = "Elixir botánico de alta densidad, prensado en frío.";
    @Column(length = 500)
    private String footerCopyright = "© 2026 RAÍCES BIO-SYSTEMS. Todos los derechos reservados.";
    @Column(length = 500)
    private String footerNorma = "Norma Sanitaria Internacional · Lote activo #418";

    // --- 11. SWITCHES DE EFECTOS ---
    private Boolean efectoSimiosActivo = true;
    private Boolean efectoFloraActivo = true;
    private Boolean efectoParticulasChimp = true;
    private Boolean efectoLicuadoraActivo = true;
    private Boolean efectoAudioFondo = true;

    public AjustesWeb() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getHeroBadge() { return heroBadge; }
    public void setHeroBadge(String heroBadge) { this.heroBadge = heroBadge; }

    public String getHeroTitulo() { return heroTitulo; }
    public void setHeroTitulo(String heroTitulo) { this.heroTitulo = heroTitulo; }

    public String getHeroSubtitulo() { return heroSubtitulo; }
    public void setHeroSubtitulo(String heroSubtitulo) { this.heroSubtitulo = heroSubtitulo; }

    public String getHeroScrollCta() { return heroScrollCta; }
    public void setHeroScrollCta(String heroScrollCta) { this.heroScrollCta = heroScrollCta; }

    public String getVideoEscena1Tag() { return videoEscena1Tag; }
    public void setVideoEscena1Tag(String videoEscena1Tag) { this.videoEscena1Tag = videoEscena1Tag; }

    public String getVideoEscena1Titulo() { return videoEscena1Titulo; }
    public void setVideoEscena1Titulo(String videoEscena1Titulo) { this.videoEscena1Titulo = videoEscena1Titulo; }

    public String getVideoEscena1Cifra() { return videoEscena1Cifra; }
    public void setVideoEscena1Cifra(String videoEscena1Cifra) { this.videoEscena1Cifra = videoEscena1Cifra; }

    public String getVideoEscena1CifraLabel() { return videoEscena1CifraLabel; }
    public void setVideoEscena1CifraLabel(String videoEscena1CifraLabel) { this.videoEscena1CifraLabel = videoEscena1CifraLabel; }

    public String getVideoEscena1Desc() { return videoEscena1Desc; }
    public void setVideoEscena1Desc(String videoEscena1Desc) { this.videoEscena1Desc = videoEscena1Desc; }

    public String getVideoEscena2Tag() { return videoEscena2Tag; }
    public void setVideoEscena2Tag(String videoEscena2Tag) { this.videoEscena2Tag = videoEscena2Tag; }

    public String getVideoEscena2Titulo() { return videoEscena2Titulo; }
    public void setVideoEscena2Titulo(String videoEscena2Titulo) { this.videoEscena2Titulo = videoEscena2Titulo; }

    public String getVideoEscena2Cifra() { return videoEscena2Cifra; }
    public void setVideoEscena2Cifra(String videoEscena2Cifra) { this.videoEscena2Cifra = videoEscena2Cifra; }

    public String getVideoEscena2CifraLabel() { return videoEscena2CifraLabel; }
    public void setVideoEscena2CifraLabel(String videoEscena2CifraLabel) { this.videoEscena2CifraLabel = videoEscena2CifraLabel; }

    public String getVideoEscena2Desc() { return videoEscena2Desc; }
    public void setVideoEscena2Desc(String videoEscena2Desc) { this.videoEscena2Desc = videoEscena2Desc; }

    public String getVideoEscena3Tag() { return videoEscena3Tag; }
    public void setVideoEscena3Tag(String videoEscena3Tag) { this.videoEscena3Tag = videoEscena3Tag; }

    public String getVideoEscena3Titulo() { return videoEscena3Titulo; }
    public void setVideoEscena3Titulo(String videoEscena3Titulo) { this.videoEscena3Titulo = videoEscena3Titulo; }

    public String getVideoEscena3Cifra() { return videoEscena3Cifra; }
    public void setVideoEscena3Cifra(String videoEscena3Cifra) { this.videoEscena3Cifra = videoEscena3Cifra; }

    public String getVideoEscena3CifraLabel() { return videoEscena3CifraLabel; }
    public void setVideoEscena3CifraLabel(String videoEscena3CifraLabel) { this.videoEscena3CifraLabel = videoEscena3CifraLabel; }

    public String getVideoEscena3Desc() { return videoEscena3Desc; }
    public void setVideoEscena3Desc(String videoEscena3Desc) { this.videoEscena3Desc = videoEscena3Desc; }

    public String getVideoEscena4Tag() { return videoEscena4Tag; }
    public void setVideoEscena4Tag(String videoEscena4Tag) { this.videoEscena4Tag = videoEscena4Tag; }

    public String getVideoEscena4Titulo() { return videoEscena4Titulo; }
    public void setVideoEscena4Titulo(String videoEscena4Titulo) { this.videoEscena4Titulo = videoEscena4Titulo; }

    public String getVideoEscena4Desc() { return videoEscena4Desc; }
    public void setVideoEscena4Desc(String videoEscena4Desc) { this.videoEscena4Desc = videoEscena4Desc; }

    public String getVideoEscena4Boton() { return videoEscena4Boton; }
    public void setVideoEscena4Boton(String videoEscena4Boton) { this.videoEscena4Boton = videoEscena4Boton; }

    public String getMarquesinaTexto() { return marquesinaTexto; }
    public void setMarquesinaTexto(String marquesinaTexto) { this.marquesinaTexto = marquesinaTexto; }

    public String getCatalogoTitulo() { return catalogoTitulo; }
    public void setCatalogoTitulo(String catalogoTitulo) { this.catalogoTitulo = catalogoTitulo; }

    public String getCatalogoSubtitulo() { return catalogoSubtitulo; }
    public void setCatalogoSubtitulo(String catalogoSubtitulo) { this.catalogoSubtitulo = catalogoSubtitulo; }

    public String getIngredientesTitulo() { return ingredientesTitulo; }
    public void setIngredientesTitulo(String ingredientesTitulo) { this.ingredientesTitulo = ingredientesTitulo; }

    public String getIngredientesSubtitulo() { return ingredientesSubtitulo; }
    public void setIngredientesSubtitulo(String ingredientesSubtitulo) { this.ingredientesSubtitulo = ingredientesSubtitulo; }

    public String getProtocoloTitulo() { return protocoloTitulo; }
    public void setProtocoloTitulo(String protocoloTitulo) { this.protocoloTitulo = protocoloTitulo; }

    public String getProtocoloSubtitulo() { return protocoloSubtitulo; }
    public void setProtocoloSubtitulo(String protocoloSubtitulo) { this.protocoloSubtitulo = protocoloSubtitulo; }

    public String getChimpanceTag() { return chimpanceTag; }
    public void setChimpanceTag(String chimpanceTag) { this.chimpanceTag = chimpanceTag; }

    public String getChimpanceTexto() { return chimpanceTexto; }
    public void setChimpanceTexto(String chimpanceTexto) { this.chimpanceTexto = chimpanceTexto; }

    public String getChimpanceBoton() { return chimpanceBoton; }
    public void setChimpanceBoton(String chimpanceBoton) { this.chimpanceBoton = chimpanceBoton; }

    public String getLicuadoraTitulo() { return licuadoraTitulo; }
    public void setLicuadoraTitulo(String licuadoraTitulo) { this.licuadoraTitulo = licuadoraTitulo; }

    public String getLicuadoraSubtitulo() { return licuadoraSubtitulo; }
    public void setLicuadoraSubtitulo(String licuadoraSubtitulo) { this.licuadoraSubtitulo = licuadoraSubtitulo; }

    public String getWhatsappNumero() { return whatsappNumero; }
    public void setWhatsappNumero(String whatsappNumero) { this.whatsappNumero = whatsappNumero; }

    public String getTelefonoContacto() { return telefonoContacto; }
    public void setTelefonoContacto(String telefonoContacto) { this.telefonoContacto = telefonoContacto; }

    public String getEmailContacto() { return emailContacto; }
    public void setEmailContacto(String emailContacto) { this.emailContacto = emailContacto; }

    public Boolean getBannerPromoActivo() { return bannerPromoActivo; }
    public void setBannerPromoActivo(Boolean bannerPromoActivo) { this.bannerPromoActivo = bannerPromoActivo; }

    public String getBannerPromoTexto() { return bannerPromoTexto; }
    public void setBannerPromoTexto(String bannerPromoTexto) { this.bannerPromoTexto = bannerPromoTexto; }

    public Boolean getEfectoSimiosActivo() { return efectoSimiosActivo; }
    public void setEfectoSimiosActivo(Boolean efectoSimiosActivo) { this.efectoSimiosActivo = efectoSimiosActivo; }

    public Boolean getEfectoFloraActivo() { return efectoFloraActivo; }
    public void setEfectoFloraActivo(Boolean efectoFloraActivo) { this.efectoFloraActivo = efectoFloraActivo; }

    public Boolean getEfectoParticulasChimp() { return efectoParticulasChimp; }
    public void setEfectoParticulasChimp(Boolean efectoParticulasChimp) { this.efectoParticulasChimp = efectoParticulasChimp; }

    public Boolean getEfectoLicuadoraActivo() { return efectoLicuadoraActivo; }
    public void setEfectoLicuadoraActivo(Boolean efectoLicuadoraActivo) { this.efectoLicuadoraActivo = efectoLicuadoraActivo; }

    public String getNavBrandNombre() { return navBrandNombre; }
    public void setNavBrandNombre(String navBrandNombre) { this.navBrandNombre = navBrandNombre; }

    public String getNavBrandTagline() { return navBrandTagline; }
    public void setNavBrandTagline(String navBrandTagline) { this.navBrandTagline = navBrandTagline; }

    public String getNavLink1() { return navLink1; }
    public void setNavLink1(String navLink1) { this.navLink1 = navLink1; }

    public String getNavLink2() { return navLink2; }
    public void setNavLink2(String navLink2) { this.navLink2 = navLink2; }

    public String getNavLink3() { return navLink3; }
    public void setNavLink3(String navLink3) { this.navLink3 = navLink3; }

    public String getNavLink4() { return navLink4; }
    public void setNavLink4(String navLink4) { this.navLink4 = navLink4; }

    public String getNavBotonModo() { return navBotonModo; }
    public void setNavBotonModo(String navBotonModo) { this.navBotonModo = navBotonModo; }

    public String getNavBotonPedir() { return navBotonPedir; }
    public void setNavBotonPedir(String navBotonPedir) { this.navBotonPedir = navBotonPedir; }

    public String getFooterFrase() { return footerFrase; }
    public void setFooterFrase(String footerFrase) { this.footerFrase = footerFrase; }

    public String getFooterCopyright() { return footerCopyright; }
    public void setFooterCopyright(String footerCopyright) { this.footerCopyright = footerCopyright; }

    public String getFooterNorma() { return footerNorma; }
    public void setFooterNorma(String footerNorma) { this.footerNorma = footerNorma; }

    public Boolean getEfectoAudioFondo() { return efectoAudioFondo; }
    public void setEfectoAudioFondo(Boolean efectoAudioFondo) { this.efectoAudioFondo = efectoAudioFondo; }
}
