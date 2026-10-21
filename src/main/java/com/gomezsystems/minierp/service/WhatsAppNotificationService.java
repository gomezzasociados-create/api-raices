package com.gomezsystems.minierp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.HashMap;
import java.util.Map;
import java.util.concurrent.CompletableFuture;

@Service
public class WhatsAppNotificationService {

    @Value("${evolution.api.url:https://api.gomezsystems.online}")
    private String evolutionUrl;

    @Value("${evolution.api.instance:Raices}")
    private String evolutionInstance;

    @Value("${evolution.api.token:7399A24922C5-40B0-A054-984C1A64DA4E}")
    private String evolutionToken;

    @Value("${admin.whatsapp.number:56953976456}")
    private String adminWhatsappNumber;

    private final HttpClient httpClient;
    private final ObjectMapper objectMapper;

    public WhatsAppNotificationService() {
        this.httpClient = HttpClient.newBuilder()
                .connectTimeout(Duration.ofSeconds(4))
                .build();
        this.objectMapper = new ObjectMapper();
    }

    /**
     * Envía alerta inmediata al Administrador cuando un insumo de la Bodega de Vasos 500 mls
     * queda en o bajo el umbral crítico (10 unidades).
     */
    public CompletableFuture<Boolean> enviarAlertaUmbralBajoVasos(String insumoNombre, double stockActual, String unidadMedida, String sucursal) {
        String sucursalStr = (sucursal != null && !sucursal.isBlank()) ? sucursal : "Casa Matriz";
        String medidaStr = (unidadMedida != null && !unidadMedida.isBlank()) ? unidadMedida : "und";

        String mensaje = String.format(
            "🚨 *ALERTA RAÍCES // BODEGA VASOS 500 MLS*\n\n" +
            "Se detectó un stock crítico por debajo o igual al umbral (10):\n" +
            "📦 *Insumo:* %s\n" +
            "📉 *Stock restante:* %.0f %s\n" +
            "📍 *Sucursal:* %s\n\n" +
            "⚠️ Por favor reabastecer este insumo en el sistema a la brevedad.",
            insumoNombre, stockActual, medidaStr, sucursalStr
        );

        return enviarMensaje(adminWhatsappNumber, mensaje);
    }

    /**
     * Despacho asíncrono hacia Evolution API para no bloquear ventas ni transacciones de BD.
     */
    public CompletableFuture<Boolean> enviarMensaje(String numero, String texto) {
        return CompletableFuture.supplyAsync(() -> {
            try {
                if (evolutionUrl == null || evolutionUrl.isBlank() ||
                    evolutionToken == null || evolutionToken.isBlank() ||
                    numero == null || numero.isBlank()) {
                    System.err.println("⚠️ [Evolution API] Credenciales o número de teléfono no configurados.");
                    return false;
                }

                String cleanUrl = evolutionUrl.replaceAll("/+$", "");
                String endpoint = String.format("%s/message/sendText/%s", cleanUrl, evolutionInstance);

                Map<String, String> payload = new HashMap<>();
                payload.put("number", numero.trim());
                payload.put("text", texto);

                String jsonPayload = objectMapper.writeValueAsString(payload);

                HttpRequest request = HttpRequest.newBuilder()
                        .uri(URI.create(endpoint))
                        .timeout(Duration.ofSeconds(8))
                        .header("Content-Type", "application/json")
                        .header("apikey", evolutionToken)
                        .POST(HttpRequest.BodyPublishers.ofString(jsonPayload))
                        .build();

                HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());

                if (response.statusCode() >= 200 && response.statusCode() < 300) {
                    System.out.println("✅ [Evolution API - WhatsApp] Alerta enviada con éxito a " + numero);
                    return true;
                } else {
                    System.err.println("❌ [Evolution API - WhatsApp] Respuesta inesperada HTTP " + response.statusCode() + ": " + response.body());
                    return false;
                }
            } catch (Exception e) {
                System.err.println("❌ [Evolution API - WhatsApp] Excepción al enviar mensaje: " + e.getMessage());
                return false;
            }
        });
    }

    public String getAdminWhatsappNumber() {
        return adminWhatsappNumber;
    }

    public void setAdminWhatsappNumber(String adminWhatsappNumber) {
        this.adminWhatsappNumber = adminWhatsappNumber;
    }

    public String getEvolutionUrl() {
        return evolutionUrl;
    }

    public String getEvolutionInstance() {
        return evolutionInstance;
    }
}
