package com.gomezsystems.minierp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "insumos")
public class Insumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idInsumo;

    private String nombre;
    private Integer unidadActual;
    private Integer cantidadPorcion;
    private String medida;

    // --- ETIQUETA MULTI-NODO ---
    private String sucursal;

    // Getters y Setters
    public Long getIdInsumo() { return idInsumo; }
    public void setIdInsumo(Long idInsumo) { this.idInsumo = idInsumo; }
    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }
    public Integer getUnidadActual() { return unidadActual; }
    public void setUnidadActual(Integer unidadActual) { this.unidadActual = unidadActual; }
    public Integer getCantidadPorcion() { return cantidadPorcion; }
    public void setCantidadPorcion(Integer cantidadPorcion) { this.cantidadPorcion = cantidadPorcion; }
    public String getMedida() { return medida; }
    public void setMedida(String medida) { this.medida = medida; }
    public String getSucursal() { return sucursal; }
    public void setSucursal(String sucursal) { this.sucursal = sucursal; }
}