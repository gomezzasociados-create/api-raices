package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.AjustesWeb;
import com.gomezsystems.minierp.repository.AjustesWebRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ajustes-web")
@CrossOrigin(origins = "*")
public class AjustesWebController {

    @Autowired
    private AjustesWebRepository repository;

    @GetMapping
    public ResponseEntity<AjustesWeb> obtenerAjustes() {
        AjustesWeb ajustes = repository.findById(1L).orElseGet(() -> {
            AjustesWeb defecto = new AjustesWeb();
            defecto.setId(1L);
            return repository.save(defecto);
        });
        return ResponseEntity.ok(ajustes);
    }

    @PutMapping
    public ResponseEntity<AjustesWeb> guardarAjustes(@RequestBody AjustesWeb nuevosAjustes) {
        nuevosAjustes.setId(1L);
        AjustesWeb guardado = repository.save(nuevosAjustes);
        return ResponseEntity.ok(guardado);
    }
}
