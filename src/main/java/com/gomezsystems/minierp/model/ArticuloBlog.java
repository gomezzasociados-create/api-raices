package com.gomezsystems.minierp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "articulos_blog")
public class ArticuloBlog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String titulo;

    @Column(columnDefinition = "TEXT")
    private String resumen;

    @Column(columnDefinition = "TEXT")
    private String contenido;

    @Column(columnDefinition = "TEXT")
    private String imagen;

    private String categoria; // e.g., "Nutrición & Vitalidad", "Bio-Alquimia", "Comunidad RAÍCES", "Novedades"
    private String autor = "Equipo RAÍCES";
    private LocalDateTime fechaCreacion = LocalDateTime.now();
    private Integer likes = 0;
    private Boolean fijado = false;

    public ArticuloBlog() {}

    public ArticuloBlog(String titulo, String resumen, String contenido, String imagen, String categoria, String autor) {
        this.titulo = titulo;
        this.resumen = resumen;
        this.contenido = contenido;
        this.imagen = imagen;
        this.categoria = categoria;
        this.autor = (autor != null && !autor.isBlank()) ? autor : "Equipo RAÍCES";
        this.fechaCreacion = LocalDateTime.now();
        this.likes = 0;
        this.fijado = false;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitulo() { return titulo; }
    public void setTitulo(String titulo) { this.titulo = titulo; }

    public String getResumen() { return resumen; }
    public void setResumen(String resumen) { this.resumen = resumen; }

    public String getContenido() { return contenido; }
    public void setContenido(String contenido) { this.contenido = contenido; }

    public String getImagen() { return imagen; }
    public void setImagen(String imagen) { this.imagen = imagen; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public String getAutor() { return autor; }
    public void setAutor(String autor) { this.autor = autor; }

    public LocalDateTime getFechaCreacion() { return fechaCreacion; }
    public void setFechaCreacion(LocalDateTime fechaCreacion) { this.fechaCreacion = fechaCreacion; }

    public Integer getLikes() { return likes != null ? likes : 0; }
    public void setLikes(Integer likes) { this.likes = likes != null ? likes : 0; }

    public Boolean getFijado() { return fijado != null ? fijado : false; }
    public void setFijado(Boolean fijado) { this.fijado = fijado != null ? fijado : false; }
}
