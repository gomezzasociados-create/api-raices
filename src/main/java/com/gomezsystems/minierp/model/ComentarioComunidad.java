package com.gomezsystems.minierp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "comentarios_comunidad")
public class ComentarioComunidad {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long articuloId; // Null o 0 si es comentario/petición general de la comunidad

    private String nombre; // Nombre del cliente que comenta
    private String tipo;   // "COMENTARIO", "SUGERENCIA", "PETICIÓN"

    @Column(columnDefinition = "TEXT")
    private String mensaje;

    private LocalDateTime fecha = LocalDateTime.now();
    private Integer likes = 0;
    private Boolean activo = true;

    public ComentarioComunidad() {}

    public ComentarioComunidad(Long articuloId, String nombre, String tipo, String mensaje) {
        this.articuloId = articuloId;
        this.nombre = (nombre != null && !nombre.isBlank()) ? nombre.trim() : "Explorador RAÍCES";
        this.tipo = (tipo != null && !tipo.isBlank()) ? tipo.trim().toUpperCase() : "COMENTARIO";
        this.mensaje = mensaje;
        this.fecha = LocalDateTime.now();
        this.likes = 0;
        this.activo = true;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getArticuloId() { return articuloId; }
    public void setArticuloId(Long articuloId) { this.articuloId = articuloId; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTipo() { return tipo; }
    public void setTipo(String tipo) { this.tipo = tipo; }

    public String getMensaje() { return mensaje; }
    public void setMensaje(String mensaje) { this.mensaje = mensaje; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public Integer getLikes() { return likes != null ? likes : 0; }
    public void setLikes(Integer likes) { this.likes = likes != null ? likes : 0; }

    public Boolean getActivo() { return activo != null ? activo : true; }
    public void setActivo(Boolean activo) { this.activo = activo != null ? activo : true; }
}
