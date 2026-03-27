package com.gomezsystems.minierp.model;

import jakarta.persistence.*;

@Entity
@Table(name = "recetas")
public class Receta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_receta")
    private Long idReceta;

    @Column(name = "id_producto", nullable = false)
    private Long idProducto; // El ID del Batido en tu sistema de ventas

    @Column(name = "id_insumo", nullable = false)
    private Long idInsumo;   // El ID de la fresa, el vaso, etc.

    @Column(name = "cantidad_necesaria", nullable = false)
    private Double cantidadNecesaria; // Cuántos gramos o unidades usa

    // Constructores
    public Receta() {
    }

    public Receta(Long idProducto, Long idInsumo, Double cantidadNecesaria) {
        this.idProducto = idProducto;
        this.idInsumo = idInsumo;
        this.cantidadNecesaria = cantidadNecesaria;
    }

    // Getters y Setters
    public Long getIdReceta() { return idReceta; }
    public void setIdReceta(Long idReceta) { this.idReceta = idReceta; }

    public Long getIdProducto() { return idProducto; }
    public void setIdProducto(Long idProducto) { this.idProducto = idProducto; }

    public Long getIdInsumo() { return idInsumo; }
    public void setIdInsumo(Long idInsumo) { this.idInsumo = idInsumo; }

    public Double getCantidadNecesaria() { return cantidadNecesaria; }
    public void setCantidadNecesaria(Double cantidadNecesaria) { this.cantidadNecesaria = cantidadNecesaria; }
}