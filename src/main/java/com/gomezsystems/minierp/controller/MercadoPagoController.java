package com.gomezsystems.minierp.controller;

import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.client.RestTemplate;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/pagos")
@CrossOrigin(origins = "*")
public class MercadoPagoController {

    // 🔴 REEMPLAZA CON TU TOKEN DE ANTOFAGASTA
    private final String MP_ACCESS_TOKEN = "APP_USR-5751871946510432-080417-64053e5e178846a2dff9e962057f1032-735099817";

    @PostMapping("/mercadopago")
    public ResponseEntity<String> crearPreferencia(@RequestBody Map<String, Object> payload) {
        try {
            RestTemplate restTemplate = new RestTemplate();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            headers.setBearerAuth(MP_ACCESS_TOKEN);

            List<Map<String, Object>> carrito = (List<Map<String, Object>>) payload.get("items");

            // Recibimos la moneda desde la web (ej. "CLP")
            String moneda = payload.containsKey("moneda") ? payload.get("moneda").toString() : "CLP";

            List<Map<String, Object>> itemsMp = new ArrayList<>();

            for (Map<String, Object> producto : carrito) {
                Map<String, Object> item = new HashMap<>();
                item.put("title", producto.get("nombre"));
                item.put("quantity", 1);
                item.put("unit_price", Double.parseDouble(producto.get("precio").toString()));
                item.put("currency_id", moneda); // Ahora es dinámico y compatible con el token

                itemsMp.add(item);
            }

            Map<String, Object> body = new HashMap<>();
            body.put("items", itemsMp);

            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, headers);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    "https://api.mercadopago.com/checkout/preferences",
                    request,
                    Map.class
            );

            if (response.getBody() != null && response.getBody().containsKey("init_point")) {
                return ResponseEntity.ok(response.getBody().get("init_point").toString());
            } else {
                return ResponseEntity.internalServerError().body("Mercado Pago no devolvió el link.");
            }

        } catch (Exception e) {
            System.out.println("Error de Mercado Pago: " + e.getMessage());
            return ResponseEntity.internalServerError().body("Error al conectar con Mercado Pago.");
        }
    }
}