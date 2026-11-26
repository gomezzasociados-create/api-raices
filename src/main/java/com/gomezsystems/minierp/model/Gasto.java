package com.gomezsystems.minierp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "gastos")
public class Gasto {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String concepto;
    private String categoriaGasto; // Categoría común del gasto
    private String motivo;         // Motivo / detalle del gasto
    private Double monto;
    private String sucursal;
    private LocalDateTime fecha;
    private String tipoGasto = "OPEX"; // OPEX (operativo / COPEX) o CAPEX (inversión / capital)

    // Campos de depreciación para gastos CAPEX (inversión)
    private Integer vidaUtilPeriodos;      // Ej: 12 meses, 52 semanas, 365 días
    private String frecuenciaDepreciacion; // DIARIA, SEMANAL, MENSUAL
    private Double depreciacionPeriodo;    // Cuota de depreciación calculada por período

    @Column(nullable = false, columnDefinition = "boolean default false")
    private boolean archivada = false;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getConcepto() { return concepto; }
    public void setConcepto(String concepto) { this.concepto = concepto; }

    public Double getMonto() { return monto; }
    public void setMonto(Double monto) { this.monto = monto; }

    public String getSucursal() { return sucursal; }
    public void setSucursal(String sucursal) { this.sucursal = sucursal; }

    public LocalDateTime getFecha() { return fecha; }
    public void setFecha(LocalDateTime fecha) { this.fecha = fecha; }

    public boolean isArchivada() { return archivada; }
    public void setArchivada(boolean archivada) { this.archivada = archivada; }

    public String getTipoGasto() { return tipoGasto; }
    public void setTipoGasto(String tipoGasto) { this.tipoGasto = tipoGasto; }

    public String getCategoriaGasto() { return categoriaGasto; }
    public void setCategoriaGasto(String categoriaGasto) { this.categoriaGasto = categoriaGasto; }

    public String getMotivo() { return motivo; }
    public void setMotivo(String motivo) { this.motivo = motivo; }

    public Integer getVidaUtilPeriodos() { return vidaUtilPeriodos; }
    public void setVidaUtilPeriodos(Integer vidaUtilPeriodos) { this.vidaUtilPeriodos = vidaUtilPeriodos; }

    public String getFrecuenciaDepreciacion() { return frecuenciaDepreciacion; }
    public void setFrecuenciaDepreciacion(String frecuenciaDepreciacion) { this.frecuenciaDepreciacion = frecuenciaDepreciacion; }

    public Double getDepreciacionPeriodo() { return depreciacionPeriodo; }
    public void setDepreciacionPeriodo(Double depreciacionPeriodo) { this.depreciacionPeriodo = depreciacionPeriodo; }
}
