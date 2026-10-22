package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.CategoriaBadge;
import com.gomezsystems.minierp.repository.CategoriaBadgeRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/categorias/badges")
@CrossOrigin(origins = "*")
public class CategoriaBadgeController {

    @Autowired
    private CategoriaBadgeRepository repository;

    @GetMapping
    public List<CategoriaBadge> listar() {
        List<CategoriaBadge> lista = repository.findAll();
        if (lista.isEmpty()) {
            lista = new ArrayList<>();
            lista.add(new CategoriaBadge("500 mls", "Elíxires", "", "neon-oro", true, true));
            lista.add(new CategoriaBadge("Packs", "Pack de Pulpas", "", "neon-oro", true, true));
            lista.add(new CategoriaBadge("Arma tu Batido", "Arma tu Batido", "", "neon-cyan", true, true));
            lista.add(new CategoriaBadge("Shots", "Shots", "PRÓXIMAMENTE", "neon-magenta", true, false));
            repository.saveAll(lista);
        }
        return lista;
    }

    @PostMapping
    public ResponseEntity<List<CategoriaBadge>> guardarTodos(@RequestBody List<CategoriaBadge> badges) {
        List<CategoriaBadge> guardados = repository.saveAll(badges);
        return ResponseEntity.ok(guardados);
    }

    @PutMapping("/{key}")
    public ResponseEntity<CategoriaBadge> actualizar(@PathVariable String key, @RequestBody CategoriaBadge badge) {
        badge.setCategoriaKey(key);
        CategoriaBadge guardado = repository.save(badge);
        return ResponseEntity.ok(guardado);
    }
}
