package com.gomezsystems.minierp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "insumos")
public class Insumo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long idInsumo;

    private String nombre;
    private Double unidadActual;
    private Integer cantidadPorcion;
    private String medida;

    // --- ETIQUETA MULTI-NODO ---
    private String sucursal;

    // --- NUEVO: CLASIFICACIÓN DE BODEGA ---
    private String categoria;

    private Double precio; // <--- RESTAURADO: PRECIO POR KILO/UNIDAD

    // --- PARCHE DE COMPATIBILIDAD CON BD ANTIGUA ---
    @Column(name = "id_sucursal")
    private Long idSucursal = 1L;

    @Column(name = "stock_actual")
    private Double stockActualDummy = 0.0;

    @Transient
    private String actorAdmin; // Para registrar KARDEX desde Front-End

    // Getters y Setters
    public Long getIdInsumo() { return idInsumo; }
    public void setIdInsumo(Long idInsumo) { this.idInsumo = idInsumo; }

    public String getActorAdmin() { return actorAdmin; }
    public void setActorAdmin(String actorAdmin) { this.actorAdmin = actorAdmin; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public Double getUnidadActual() { return unidadActual; }
    public void setUnidadActual(Double unidadActual) { this.unidadActual = unidadActual; }

    public Integer getCantidadPorcion() { return cantidadPorcion; }
    public void setCantidadPorcion(Integer cantidadPorcion) { this.cantidadPorcion = cantidadPorcion; }

    public String getMedida() { return medida; }
    public void setMedida(String medida) { this.medida = medida; }

    public String getSucursal() { return sucursal; }
    public void setSucursal(String sucursal) { this.sucursal = sucursal; }

    public String getCategoria() { return categoria; }
    public void setCategoria(String categoria) { this.categoria = categoria; }

    public Double getPrecio() { return precio; }
    public void setPrecio(Double precio) { this.precio = precio; }
}