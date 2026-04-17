package com.gomezsystems.minierp.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "ventas")
public class Venta {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDateTime fecha;
    private Double total;
    private String origen; // WEB o POS
    private String pais;   // Actúa como sucursal principal
    private String estado;
    private String medioPago;

    // Nuevo campo: Relación al cliente (Opcional por ahora)
    private String nombreCliente;

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean archivada = false;

    @OneToMany(mappedBy = "venta", cascade = CascadeType.ALL, orphanRemoval = true)
    private List<DetalleVenta> detalles = new ArrayList<>();

    // Propiedad transitoria (no se guarda en DB) para mantener compatibilidad 
    // con el JSON del frontend o devoluciones REST antiguas si fuera necesario.
    @Transient
    @JsonIgnoreProperties
    private List<Producto> productosCompatibles;

    public void addDetalle(DetalleVenta detalle) {
        detalles.add(detalle);
        detalle.setVenta(this);
    }

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public Double getTotal() { return total; }
    public void setTotal(Double total) { this.total = total; }

    public String getOrigen() { return origen; }
    public void setOrigen(String origen) { this.origen = origen; }

    public String getPais() { return pais; }
    public void setPais(String pais) { this.pais = pais; }

    public String getEstado() { return estado; }
    public void setEstado(String estado) { this.estado = estado; }

    public String getMedioPago() { return medioPago; }
    public void setMedioPago(String medioPago) { this.medioPago = medioPago; }

    public String getNombreCliente() { return nombreCliente; }
    public void setNombreCliente(String nombreCliente) { this.nombreCliente = nombreCliente; }

    public List<DetalleVenta> getDetalles() { return detalles; }
    public void setDetalles(List<DetalleVenta> detalles) { this.detalles = detalles; }

    public boolean isArchivada() { return archivada; }
    public void setArchivada(boolean archivada) { this.archivada = archivada; }

    public List<Producto> getProductosCompatibles() { return productosCompatibles; }
    public void setProductosCompatibles(List<Producto> productosCompatibles) { this.productosCompatibles = productosCompatibles; }
}