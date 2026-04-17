package com.gomezsystems.minierp.model;

import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "clientes")
public class Cliente {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String nombre;
    private String telefono;
    private String direccion;
    private String nodo;

    // Campos extendidos opcionales
    private String correo;
    private LocalDate cumpleanos;
    
    @Column(nullable = false, columnDefinition = "int default 0")
    private Integer puntosFidelizacion = 0;

    // Getters y Setters
    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getNombre() { return nombre; }
    public void setNombre(String nombre) { this.nombre = nombre; }

    public String getTelefono() { return telefono; }
    public void setTelefono(String telefono) { this.telefono = telefono; }

    public String getDireccion() { return direccion; }
    public void setDireccion(String direccion) { this.direccion = direccion; }

    public String getNodo() { return nodo; }
    public void setNodo(String nodo) { this.nodo = nodo; }

    public String getCorreo() { return correo; }
    public void setCorreo(String correo) { this.correo = correo; }

    public LocalDate getCumpleanos() { return cumpleanos; }
    public void setCumpleanos(LocalDate cumpleanos) { this.cumpleanos = cumpleanos; }

    public Integer getPuntosFidelizacion() { return puntosFidelizacion; }
    public void setPuntosFidelizacion(Integer puntosFidelizacion) { this.puntosFidelizacion = puntosFidelizacion; }
}
