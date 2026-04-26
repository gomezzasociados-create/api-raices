package com.gomezsystems.minierp.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "lotes_produccion")
public class LoteProduccion {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idProducto;
    private LocalDate fechaElaboracion;
    private LocalDate fechaVencimiento;
    private Integer vidaTotalDias;
    private String sucursal;

    public LoteProduccion() {}

    public LoteProduccion(Long idProducto, LocalDate fechaElaboracion, LocalDate fechaVencimiento, Integer vidaTotalDias, String sucursal) {
        this.idProducto = idProducto;
        this.fechaElaboracion = fechaElaboracion;
        this.fechaVencimiento = fechaVencimiento;
        this.vidaTotalDias = vidaTotalDias;
        this.sucursal = sucursal;
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdProducto() { return idProducto; }
    public void setIdProducto(Long idProducto) { this.idProducto = idProducto; }

    public LocalDate getFechaElaboracion() { return fechaElaboracion; }
    public void setFechaElaboracion(LocalDate fechaElaboracion) { this.fechaElaboracion = fechaElaboracion; }

    public LocalDate getFechaVencimiento() { return fechaVencimiento; }
    public void setFechaVencimiento(LocalDate fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }

    public Integer getVidaTotalDias() { return vidaTotalDias; }
    public void setVidaTotalDias(Integer vidaTotalDias) { this.vidaTotalDias = vidaTotalDias; }

    public String getSucursal() { return sucursal; }
    public void setSucursal(String sucursal) { this.sucursal = sucursal; }
}
