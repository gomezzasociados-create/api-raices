package com.gomezsystems.minierp.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "stock_congeladores_mayoristas")
public class StockCongeladorMayorista {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idCongelador;
    private Long idProducto;
    private String nombreProducto;
    private Integer stockPacks = 0;
    private Double precioMayorista = 0.0;
    private LocalDate fechaElaboracion;
    private LocalDate fechaVencimiento;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdCongelador() { return idCongelador; }
    public void setIdCongelador(Long idCongelador) { this.idCongelador = idCongelador; }

    public Long getIdProducto() { return idProducto; }
    public void setIdProducto(Long idProducto) { this.idProducto = idProducto; }

    public String getNombreProducto() { return nombreProducto; }
    public void setNombreProducto(String nombreProducto) { this.nombreProducto = nombreProducto; }

    public Integer getStockPacks() { return stockPacks; }
    public void setStockPacks(Integer stockPacks) { this.stockPacks = stockPacks; }

    public Double getPrecioMayorista() { return precioMayorista; }
    public void setPrecioMayorista(Double precioMayorista) { this.precioMayorista = precioMayorista; }

    public LocalDate getFechaElaboracion() { return fechaElaboracion; }
    public void setFechaElaboracion(LocalDate fechaElaboracion) { this.fechaElaboracion = fechaElaboracion; }

    public LocalDate getFechaVencimiento() { return fechaVencimiento; }
    public void setFechaVencimiento(LocalDate fechaVencimiento) { this.fechaVencimiento = fechaVencimiento; }
}
