package com.gomezsystems.minierp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "ajustes_web")
public class AjustesWeb {

    @Id
    private Long id = 1L;

    // --- PUBLICIDAD E INFORMACIÓN ---
    @Column(length = 2000)
    private String marquesinaTexto = "Prensado en frío | Sin azúcar añadida | Sin conservantes | Cosecha de menos de 24 horas | Despacho el mismo día | Pide por voz";

    @Column(length = 1000)
    private String heroTitulo = "RAÍCES";

    @Column(length = 2000)
    private String heroSubtitulo = "Espinaca silvestre, aloe vera, cúrcuma y jengibre, exprimidos a mano y en tu puerta el mismo día. Sin azúcar añadida.";

    private Boolean bannerPromoActivo = true;

    @Column(length = 1000)
    private String bannerPromoTexto = "🌿 Cosecha directa de productores sostenibles · Entregas hoy en Tuluá y Valle";

    private String whatsappNumero = "573177651016";

    private String telefonoContacto = "3177651016";

    private String emailContacto = "contacto@raices.bio";

    // --- EFECTOS QUE SALEN EN LA PÁGINA ---
    private Boolean efectoSimiosActivo = true;      // Simios asomados interactivos
    private Boolean efectoFloraActivo = true;       // Vegetación procedural en fondos y tarjetas
    private Boolean efectoParticulasChimp = true;   // Canvas de partículas y auras en el Chimpancé
    private Boolean efectoLicuadoraActivo = true;   // Físicas procedurales en la licuadora
    private Boolean efectoAudioFondo = true;        // Música ambiental y efectos FX

    public AjustesWeb() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getMarquesinaTexto() { return marquesinaTexto; }
    public void setMarquesinaTexto(String marquesinaTexto) { this.marquesinaTexto = marquesinaTexto; }

    public String getHeroTitulo() { return heroTitulo; }
    public void setHeroTitulo(String heroTitulo) { this.heroTitulo = heroTitulo; }

    public String getHeroSubtitulo() { return heroSubtitulo; }
    public void setHeroSubtitulo(String heroSubtitulo) { this.heroSubtitulo = heroSubtitulo; }

    public Boolean getBannerPromoActivo() { return bannerPromoActivo; }
    public void setBannerPromoActivo(Boolean bannerPromoActivo) { this.bannerPromoActivo = bannerPromoActivo; }

    public String getBannerPromoTexto() { return bannerPromoTexto; }
    public void setBannerPromoTexto(String bannerPromoTexto) { this.bannerPromoTexto = bannerPromoTexto; }

    public String getWhatsappNumero() { return whatsappNumero; }
    public void setWhatsappNumero(String whatsappNumero) { this.whatsappNumero = whatsappNumero; }

    public String getTelefonoContacto() { return telefonoContacto; }
    public void setTelefonoContacto(String telefonoContacto) { this.telefonoContacto = telefonoContacto; }

    public String getEmailContacto() { return emailContacto; }
    public void setEmailContacto(String emailContacto) { this.emailContacto = emailContacto; }

    public Boolean getEfectoSimiosActivo() { return efectoSimiosActivo; }
    public void setEfectoSimiosActivo(Boolean efectoSimiosActivo) { this.efectoSimiosActivo = efectoSimiosActivo; }

    public Boolean getEfectoFloraActivo() { return efectoFloraActivo; }
    public void setEfectoFloraActivo(Boolean efectoFloraActivo) { this.efectoFloraActivo = efectoFloraActivo; }

    public Boolean getEfectoParticulasChimp() { return efectoParticulasChimp; }
    public void setEfectoParticulasChimp(Boolean efectoParticulasChimp) { this.efectoParticulasChimp = efectoParticulasChimp; }

    public Boolean getEfectoLicuadoraActivo() { return efectoLicuadoraActivo; }
    public void setEfectoLicuadoraActivo(Boolean efectoLicuadoraActivo) { this.efectoLicuadoraActivo = efectoLicuadoraActivo; }

    public Boolean getEfectoAudioFondo() { return efectoAudioFondo; }
    public void setEfectoAudioFondo(Boolean efectoAudioFondo) { this.efectoAudioFondo = efectoAudioFondo; }
}
