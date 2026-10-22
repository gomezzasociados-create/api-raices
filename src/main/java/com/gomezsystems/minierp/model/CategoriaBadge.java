package com.gomezsystems.minierp.model;

import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;

@Entity
@Table(name = "categoria_badges")
public class CategoriaBadge {

    @Id
    private String categoriaKey; // "500 mls", "Packs", "Arma tu Batido", "Shots"

    private String categoriaNombre; // "Elíxires", "Pack de Pulpas", "Arma tu Batido", "Shots"

    private String texto; // Frase personalizada ej: "PRÓXIMAMENTE", "OFERTA", etc.

    private String color = "neon-oro"; // "neon-magenta", "neon-cyan", "neon-oro", "neon-verde", "neon-rojo"

    private Boolean activo = true;

    private Boolean autoOferta = true; // Si está activo y texto está vacío, detecta ofertas automáticamente

    public CategoriaBadge() {}

    public CategoriaBadge(String categoriaKey, String categoriaNombre, String texto, String color, Boolean activo, Boolean autoOferta) {
        this.categoriaKey = categoriaKey;
        this.categoriaNombre = categoriaNombre;
        this.texto = texto;
        this.color = color;
        this.activo = activo;
        this.autoOferta = autoOferta;
    }

    public String getCategoriaKey() { return categoriaKey; }
    public void setCategoriaKey(String categoriaKey) { this.categoriaKey = categoriaKey; }

    public String getCategoriaNombre() { return categoriaNombre; }
    public void setCategoriaNombre(String categoriaNombre) { this.categoriaNombre = categoriaNombre; }

    public String getTexto() { return texto; }
    public void setTexto(String texto) { this.texto = texto; }

    public String getColor() { return color; }
    public void setColor(String color) { this.color = color; }

    public Boolean getActivo() { return activo; }
    public void setActivo(Boolean activo) { this.activo = activo; }

    public Boolean getAutoOferta() { return autoOferta; }
    public void setAutoOferta(Boolean autoOferta) { this.autoOferta = autoOferta; }
}
