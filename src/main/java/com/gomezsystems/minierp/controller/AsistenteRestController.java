package com.gomezsystems.minierp.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.gomezsystems.minierp.config.AiCredentialsResolver;
import com.gomezsystems.minierp.service.AsistenteVentasIAService;
import com.gomezsystems.minierp.service.VozHumanaTTSService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

/**
 * Endpoints REST para el Kiosquero 3D de RAÍCES:
 * - GET  /api/asistente/status    : indica si OPENAI_API_KEY está conectada (sin revelar nunca la llave).
 * - POST /api/asistente/conversar : conversación completa con cerebro OpenAI + audio neural.
 * - POST /api/asistente/tts       : síntesis directa de voz humana.
 */
@RestController
@RequestMapping("/api/asistente")
@CrossOrigin(origins = "*")
public class AsistenteRestController {

    private final AsistenteVentasIAService ventasIAService;
    private final VozHumanaTTSService ttsService;
    private final AiCredentialsResolver credentialsResolver;

    public AsistenteRestController(
            AsistenteVentasIAService ventasIAService,
            VozHumanaTTSService ttsService,
            AiCredentialsResolver credentialsResolver) {
        this.ventasIAService = ventasIAService;
        this.ttsService = ttsService;
        this.credentialsResolver = credentialsResolver;
    }

    @GetMapping("/status")
    public Map<String, Object> status() {
        boolean openai = credentialsResolver != null && credentialsResolver.hasOpenAiKey();
        return Map.of(
                "openaiActive", openai,
                "engine", openai ? "openai-gpt-4o-mini" : "local-fallback"
        );
    }

    @PostMapping("/conversar")
    public Map<String, Object> conversar(@RequestBody JsonNode payload) {
        String sessionId = payload.has("sessionId") && !payload.get("sessionId").asText().isBlank()
                ? payload.get("sessionId").asText()
                : "http-default-session";
        return ventasIAService.procesarTurno(sessionId, payload);
    }

    @PostMapping("/tts")
    public Map<String, Object> sintetizarVoz(@RequestBody Map<String, String> body) {
        String texto = body != null ? body.getOrDefault("text", "") : "";
        String b64 = ttsService.sintetizarBase64(texto);
        Map<String, Object> res = new HashMap<>();
        res.put("audioBase64", b64);
        res.put("mimeType", "audio/mpeg");
        return res;
    }
}
