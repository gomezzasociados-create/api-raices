package com.gomezsystems.minierp.controller;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import jakarta.servlet.http.HttpSession;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @PostMapping("/login")
    public ResponseEntity<Map<String, String>> login(@RequestBody Map<String, String> request, HttpSession session) {
        Map<String, String> respuesta = new HashMap<>();

        // Extraemos el PIN directamente del mapa que nos manda el navegador
        String pin = request.get("pin");

        // 👑 EL SUPREMO
        if ("7777".equals(pin)) {
            session.setAttribute("rol", "SUPREMO");
            respuesta.put("rol", "SUPREMO");
            return ResponseEntity.ok(respuesta);
        }

        // 🇨🇴 CAJERO TULUÁ
        else if ("1111".equals(pin)) {
            session.setAttribute("rol", "CAJERO");
            respuesta.put("rol", "CAJERO");
            respuesta.put("pais", "COP");
            respuesta.put("idSucursal", "1");
            respuesta.put("nombreSucursal", "TULUÁ");
            respuesta.put("idTarjeta", "tarjeta-caja-col");
            return ResponseEntity.ok(respuesta);
        }

        // 🇨🇱 CAJERO ANTOFAGASTA
        else if ("2222".equals(pin)) {
            session.setAttribute("rol", "CAJERO");
            respuesta.put("rol", "CAJERO");
            respuesta.put("pais", "CLP");
            respuesta.put("idSucursal", "2");
            respuesta.put("nombreSucursal", "ANTOFAGASTA");
            respuesta.put("idTarjeta", "tarjeta-caja-chi");
            return ResponseEntity.ok(respuesta);
        }

        // 🇪🇸 CAJERO MALLORCA
        else if ("3333".equals(pin)) {
            session.setAttribute("rol", "CAJERO");
            respuesta.put("rol", "CAJERO");
            respuesta.put("pais", "EUR");
            respuesta.put("idSucursal", "3");
            respuesta.put("nombreSucursal", "MALLORCA");
            respuesta.put("idTarjeta", "tarjeta-caja-esp");
            return ResponseEntity.ok(respuesta);
        }

        // Si mandan un PIN que no existe o es incorrecto
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
    }
}