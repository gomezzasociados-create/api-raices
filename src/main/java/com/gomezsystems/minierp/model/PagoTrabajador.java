package com.gomezsystems.minierp.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "pagos_trabajadores")
public class PagoTrabajador {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String sucursal;
    private LocalDateTime fechaPago;
    private String periodo; // Ej: 2026-11 o Semana 4
    private String nombreTrabajador;
    private String cargo; // Administrador, Cajero, Barista, Cocina, Mesero, Repartidor, Aseo, Otro

    private Double diasTrabajados;
    private Double valorDia;
    private Double horasExtras;
    private Double valorHoraExtra;
    private Double bonos;
    private Double incentivos;

    private Double descuentosLegales; // Retenciones legales del trabajador (AFP, Salud, etc.)
    private Double aporteGobierno;    // Pagos legales del empleador al gobierno (Leyes sociales / Mutual / Seguro)

    private Double totalHaberes;      // Ganancia bruta (dias*valorDia + horasExtras*valorHoraExtra + bonos + incentivos)
    private Double liquidoAPagar;     // totalHaberes - descuentosLegales
    private Double costoTotalEmpresa; // totalHaberes + aporteGobierno

    private String observacion;
    private Long idGastoAsociado;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getSucursal() { return sucursal; }
    public void setSucursal(String sucursal) { this.sucursal = sucursal; }

    public LocalDateTime getFechaPago() { return fechaPago; }
    public void setFechaPago(LocalDateTime fechaPago) { this.fechaPago = fechaPago; }

    public String getPeriodo() { return periodo; }
    public void setPeriodo(String periodo) { this.periodo = periodo; }

    public String getNombreTrabajador() { return nombreTrabajador; }
    public void setNombreTrabajador(String nombreTrabajador) { this.nombreTrabajador = nombreTrabajador; }

    public String getCargo() { return cargo; }
    public void setCargo(String cargo) { this.cargo = cargo; }

    public Double getDiasTrabajados() { return diasTrabajados; }
    public void setDiasTrabajados(Double diasTrabajados) { this.diasTrabajados = diasTrabajados; }

    public Double getValorDia() { return valorDia; }
    public void setValorDia(Double valorDia) { this.valorDia = valorDia; }

    public Double getHorasExtras() { return horasExtras; }
    public void setHorasExtras(Double horasExtras) { this.horasExtras = horasExtras; }

    public Double getValorHoraExtra() { return valorHoraExtra; }
    public void setValorHoraExtra(Double valorHoraExtra) { this.valorHoraExtra = valorHoraExtra; }

    public Double getBonos() { return bonos; }
    public void setBonos(Double bonos) { this.bonos = bonos; }

    public Double getIncentivos() { return incentivos; }
    public void setIncentivos(Double incentivos) { this.incentivos = incentivos; }

    public Double getDescuentosLegales() { return descuentosLegales; }
    public void setDescuentosLegales(Double descuentosLegales) { this.descuentosLegales = descuentosLegales; }

    public Double getAporteGobierno() { return aporteGobierno; }
    public void setAporteGobierno(Double aporteGobierno) { this.aporteGobierno = aporteGobierno; }

    public Double getTotalHaberes() { return totalHaberes; }
    public void setTotalHaberes(Double totalHaberes) { this.totalHaberes = totalHaberes; }

    public Double getLiquidoAPagar() { return liquidoAPagar; }
    public void setLiquidoAPagar(Double liquidoAPagar) { this.liquidoAPagar = liquidoAPagar; }

    public Double getCostoTotalEmpresa() { return costoTotalEmpresa; }
    public void setCostoTotalEmpresa(Double costoTotalEmpresa) { this.costoTotalEmpresa = costoTotalEmpresa; }

    public String getObservacion() { return observacion; }
    public void setObservacion(String observacion) { this.observacion = observacion; }

    public Long getIdGastoAsociado() { return idGastoAsociado; }
    public void setIdGastoAsociado(Long idGastoAsociado) { this.idGastoAsociado = idGastoAsociado; }
}
