package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.Receta;
import com.gomezsystems.minierp.repository.RecetaRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/recetas")
@CrossOrigin(origins = "*")
public class RecetaController {

    @Autowired
    private RecetaRepository recetaRepository;

    // 🔥 1. NUEVO: ESTO ENVÍA LOS DATOS PARA LLENAR LA TABLA VISUAL
    @GetMapping
    public List<Receta> obtenerTodas() {
        return recetaRepository.findAll();
    }

    @PostMapping("/guardar")
    public Receta guardarReceta(@RequestBody Receta receta) {
        return recetaRepository.save(receta);
    }

    @GetMapping("/producto/{id}")
    public List<Receta> obtenerPorProducto(@PathVariable Long id) {
        return recetaRepository.findByIdProducto(id);
    }

    // 🔥 2. NUEVO: ESTO TE PERMITE ELIMINAR/ROMPER EL ENLACE CON LA PAPELERA
    @DeleteMapping("/borrar/{id}")
    public void borrarReceta(@PathVariable Long id) {
        recetaRepository.deleteById(id);
    }
}