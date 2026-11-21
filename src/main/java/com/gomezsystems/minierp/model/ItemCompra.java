package com.gomezsystems.minierp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "lista_compras")
public class ItemCompra {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private Long idInsumo;
    private String nombreInsumo;
    private String bodega;        // Ej: "Pulpas", "Vasos y Packaging", "Shots y Caldos", "Arma tu Batido", "Exóticos"
    private String categoriaOriginal;
    private String subcategoria;
    private String sucursal;
    private String medida;        // gr, mls, und
    private Double cantidadPorcion;

    private Double stockActualUnidades; // Unidades o porciones que dispararon la alerta (<= 3)
    private Double stockActualFisico;   // Stock bruto en unidadActual

    private Double cantidadAComprar;    // Cantidad a comprar (en Kilos, Litros, Unidades o Porciones)
    private String unidadCompra;        // "Kilos (1000 gr)", "Litros (1000 mls)", "Unidades", "Porciones"

    private Double precioKiloAnterior;
    private Double precioKiloNuevo;
    private Double precioPorcionAnterior;
    private Double precioPorcionNuevo;

    private Double costoTotalCompra;

    private String estado = "PENDIENTE"; // PENDIENTE, COMPRADO, NO_ENCONTRADO
    private Long idGastoTesoreria;       // Vinculado al gasto en Tesorería cuando se marca COMPRADO

    @Column(nullable = false)
    private boolean activoEnLista = true; // true = visible en la lista activa, false = borrado de la lista activa

    @Column(nullable = false)
    private boolean registradoEnHistorial = false; // true = persiste en el Historial de Precios y Compras

    private Boolean agregadoManual = false; // true si fue agregado manualmente aunque tuviera > 3 unidades

    private LocalDateTime fechaDeteccion;
    private LocalDateTime fechaCompra;
    private String proveedorNota;

    public ItemCompra() {}

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getIdInsumo() { return idInsumo; }
    public void setIdInsumo(Long idInsumo) { this.idInsumo = idInsumo; }

    public String getNombreInsumo() { return nombreInsumo; }
    public void setNombreInsumo(String nombreInsumo) { this.nombreInsumo = nombreInsumo; }

    public String getBodega() { return bodega; }
    public void setBodega(String bodega) { this.bodega = bodega; }

    public String getCategoriaOriginal() { return categoriaOriginal; }
    public void setCategoriaOriginal(String categoriaOriginal) { this.categoriaOriginal = categoriaOriginal; }

    public String getSubcategoria() { return subcategoria; }
    public void setSubcategoria(String subcategoria) { this.subcategoria = subcategoria; }

    public String getSucursal() { return sucursal; }
    public void setSucursal(String sucursal) { this.sucursal = sucursal; }

    public String getMedida() { return medida; }
    public void setMedida(String medida) { this.medida = medida; }

    public Double getCantidadPorcion() { return cantidadPorcion; }
    public void setCantidadPorcion(Double cantidadPorcion) { this.cantidadPorcion = cantidadPorcion; }

    public Double getStockActualUnidades() { return stockActualUnidades; }
    public void setStockActualUnidades(Double stockActualUnidades) { this.stockActualUnidades = stockActualUnidades; }

    public Double getStockActualFisico() { return stockActualFisico; }
    public void setStockActualFisico(Double stockActualFisico) { this.stockActualFisico = stockActualFisico; }

    public Double getCantidadAComprar() { return cantidadAComprar; }
    public void setCantidadAComprar(Double cantidadAComprar) { this.cantidadAComprar = cantidadAComprar; }

    public String getUnidadCompra() { return unidadCompra; }
    public void setUnidadCompra(String unidadCompra) { this.unidadCompra = unidadCompra; }

    public Double getPrecioKiloAnterior() { return precioKiloAnterior; }
    public void setPrecioKiloAnterior(Double precioKiloAnterior) { this.precioKiloAnterior = precioKiloAnterior; }

    public Double getPrecioKiloNuevo() { return precioKiloNuevo; }
    public void setPrecioKiloNuevo(Double precioKiloNuevo) { this.precioKiloNuevo = precioKiloNuevo; }

    public Double getPrecioPorcionAnterior() { return precioPorcionAnterior; }
    public void setPrecioPorcionAnterior(Double precioPorcionAnterior) { this.precioPorcionAnterior = precioPorcionAnterior; }

    public Double getPrecioPorcionNuevo() { return precioPorcionNuevo; }
    public void setPrecioPorcionNuevo(Double precioPorcionNuevo) { this.precioPorcionNuevo = precioPorcionNuevo; }

    public Double getCostoTotalCompra() { return costoTotalCompra; }
    public void setCostoTotalCompra(Double costoTotalCompra) { this.costoTotalCompra = costoTotalCompra; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public Long getIdGastoTesoreria() { return idGastoTesoreria; }
    public void setIdGastoTesoreria(Long idGastoTesoreria) { this.idGastoTesoreria = idGastoTesoreria; }

    public boolean isActivoEnLista() { return activoEnLista; }
    public void setActivoEnLista(boolean activoEnLista) { this.activoEnLista = activoEnLista; }

    public boolean isRegistradoEnHistorial() { return registradoEnHistorial; }
    public void setRegistradoEnHistorial(boolean registradoEnHistorial) { this.registradoEnHistorial = registradoEnHistorial; }

    public Boolean getAgregadoManual() { return agregadoManual != null && agregadoManual; }
    public void setAgregadoManual(Boolean agregadoManual) { this.agregadoManual = agregadoManual; }

    public LocalDateTime getFechaDeteccion() { return fechaDeteccion; }
    public void setFechaDeteccion(LocalDateTime fechaDeteccion) { this.fechaDeteccion = fechaDeteccion; }

    public LocalDateTime getFechaCompra() { return fechaCompra; }
    public void setFechaCompra(LocalDateTime fechaCompra) { this.fechaCompra = fechaCompra; }

    public String getProveedorNota() { return proveedorNota; }
    public void setProveedorNota(String proveedorNota) { this.proveedorNota = proveedorNota; }
}
