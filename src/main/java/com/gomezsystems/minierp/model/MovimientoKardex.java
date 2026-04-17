package com.gomezsystems.minierp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "kardex_inventario")
public class MovimientoKardex {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombreInsumo;
    private String categoria;
    private String sucursal;
    private LocalDateTime fechaHora;
    private String tipoMovimiento; // "Ingreso Manual", "Venta Sistema", "Merma"
    private Integer variacion; // ej: +1000, -50
    private String actor; // ej: "SUPREMO" o Administrador de Nodo

    // Getters
    public Long getId() { return id; }
    public String getNombreInsumo() { return nombreInsumo; }
    public String getCategoria() { return categoria; }
    public String getSucursal() { return sucursal; }
    public LocalDateTime getFechaHora() { return fechaHora; }
    public String getTipoMovimiento() { return tipoMovimiento; }
    public Integer getVariacion() { return variacion; }
    public String getActor() { return actor; }

    // Setters
    public void setId(Long id) { this.id = id; }
    public void setNombreInsumo(String nombreInsumo) { this.nombreInsumo = nombreInsumo; }
    public void setCategoria(String categoria) { this.categoria = categoria; }
    public void setSucursal(String sucursal) { this.sucursal = sucursal; }
    public void setFechaHora(LocalDateTime fechaHora) { this.fechaHora = fechaHora; }
    public void setTipoMovimiento(String tipoMovimiento) { this.tipoMovimiento = tipoMovimiento; }
    public void setVariacion(Integer variacion) { this.variacion = variacion; }
    public void setActor(String actor) { this.actor = actor; }
}
