package com.gomezsystems.minierp.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.gomezsystems.minierp.config.AiCredentialsResolver;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Servicio de Voz Humana Expresiva para el Kiosquero 3D de RAÍCES.
 *
 * Cuando OPENAI_API_KEY está activa usa gpt-4o-mini-tts (voz 'ash' con dirección actoral de barista humano)
 * y fallback a tts-1 ('onyx'), entregando audio MP3 en Base64 para lip-sync exacto en WebAudio.
 */
@Service
public class VozHumanaTTSService {

    private final AiCredentialsResolver credentialsResolver;
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(5))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private final ObjectMapper mapper = new ObjectMapper();
    private final Map<String, String> audioCache = new ConcurrentHashMap<>();

    @Value("${ai.openai.tts.voice:ash}")
    private String openAiVoice;

    @Value("${ai.elevenlabs.voice.id:pNInz6obpgDQGcFmaJgB}")
    private String elevenLabsVoiceId;

    public VozHumanaTTSService(AiCredentialsResolver credentialsResolver) {
        this.credentialsResolver = credentialsResolver;
    }

    public String sintetizarBase64(String texto) {
        if (texto == null || texto.isBlank()) return null;

        String textoLimpio = limpiarTextoParaVoz(texto);
        if (textoLimpio.isEmpty()) return null;

        String openAiKey = credentialsResolver != null ? credentialsResolver.getOpenAiKey() : null;
        String elevenKey = credentialsResolver != null ? credentialsResolver.getElevenLabsKey() : null;

        String motorTag = (elevenKey != null) ? "eleven" : (openAiKey != null ? "openai" : "neural-std");
        String cacheKey = motorTag + "::" + textoLimpio;

        String cached = audioCache.get(cacheKey);
        if (cached != null) return cached;

        byte[] mp3Bytes = null;

        if (elevenKey != null) {
            mp3Bytes = sintetizarConElevenLabs(textoLimpio, elevenKey);
        }

        if (mp3Bytes == null && openAiKey != null) {
            mp3Bytes = sintetizarConOpenAiExpresivo(textoLimpio, openAiKey);
        }

        if (mp3Bytes == null) {
            mp3Bytes = sintetizarVozNeuralIntegrada(textoLimpio);
        }

        if (mp3Bytes != null && mp3Bytes.length > 256) {
            String b64 = Base64.getEncoder().encodeToString(mp3Bytes);
            if (audioCache.size() > 300) {
                audioCache.clear();
            }
            audioCache.put(cacheKey, b64);
            return b64;
        }

        return null;
    }

    private byte[] sintetizarConOpenAiExpresivo(String texto, String apiKey) {
        String voiceName = (openAiVoice != null && !openAiVoice.isBlank()) ? openAiVoice.trim() : "ash";

        // Intento 1: tts-1 optimizado para baja latencia en tiempo real con voz cálida y ritmo ágil
        try {
            Map<String, Object> bodyTts1 = Map.of(
                    "model", "tts-1",
                    "voice", "echo",
                    "input", texto,
                    "speed", 1.28
            );
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/audio/speech"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(5))
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(bodyTts1)))
                    .build();
            HttpResponse<byte[]> res = httpClient.send(req, HttpResponse.BodyHandlers.ofByteArray());
            if (res.statusCode() == 200 && res.body() != null && res.body().length > 256) {
                return res.body();
            }
        } catch (Exception ignored) {}

        // Intento 2: respaldo con gpt-4o-mini-tts
        try {
            Map<String, Object> body4o = new HashMap<>();
            body4o.put("model", "gpt-4o-mini-tts");
            body4o.put("voice", voiceName);
            body4o.put("input", texto);
            body4o.put("response_format", "mp3");
            body4o.put("speed", 1.28);
            body4o.put("instructions", "Habla en español latinoamericano con voz muy cálida, amigable, sonriente, cercana y ágil de mostrador, sin pausas largas.");

            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/audio/speech"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(6))
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body4o)))
                    .build();
            HttpResponse<byte[]> res = httpClient.send(req, HttpResponse.BodyHandlers.ofByteArray());
            if (res.statusCode() == 200 && res.body() != null && res.body().length > 256) {
                return res.body();
            }
        } catch (Exception ignored) {}

        return null;
    }

    private byte[] sintetizarConElevenLabs(String texto, String apiKey) {
        try {
            Map<String, Object> body = Map.of(
                    "text", texto,
                    "model_id", "eleven_multilingual_v2",
                    "voice_settings", Map.of("stability", 0.45, "similarity_boost", 0.80, "style", 0.35)
            );
            HttpRequest req = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.elevenlabs.io/v1/text-to-speech/" + elevenLabsVoiceId))
                    .header("xi-api-key", apiKey)
                    .header("Content-Type", "application/json")
                    .header("Accept", "audio/mpeg")
                    .timeout(Duration.ofSeconds(7))
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(body)))
                    .build();
            HttpResponse<byte[]> res = httpClient.send(req, HttpResponse.BodyHandlers.ofByteArray());
            if (res.statusCode() == 200 && res.body() != null && res.body().length > 256) {
                return res.body();
            }
        } catch (Exception ignored) {}
        return null;
    }

    private byte[] sintetizarVozNeuralIntegrada(String texto) {
        try {
            List<String> fragmentos = dividirEnFrasesCortas(texto, 175);
            ByteArrayOutputStream out = new ByteArrayOutputStream();
            for (String frag : fragmentos) {
                String encoded = URLEncoder.encode(frag, StandardCharsets.UTF_8);
                String url = "https://translate.googleapis.com/translate_tts?ie=UTF-8&client=tw-ob&tl=es-US&q=" + encoded;
                HttpRequest req = HttpRequest.newBuilder()
                        .uri(URI.create(url))
                        .header("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)")
                        .timeout(Duration.ofSeconds(4))
                        .GET()
                        .build();
                HttpResponse<byte[]> res = httpClient.send(req, HttpResponse.BodyHandlers.ofByteArray());
                if (res.statusCode() == 200 && res.body() != null && res.body().length > 128) {
                    out.write(res.body());
                } else {
                    return null;
                }
            }
            return out.size() > 256 ? out.toByteArray() : null;
        } catch (Exception ignored) {
            return null;
        }
    }

    private List<String> dividirEnFrasesCortas(String texto, int maxLen) {
        if (texto.length() <= maxLen) return List.of(texto);
        List<String> partes = new ArrayList<>();
        String[] oraciones = texto.split("(?<=[.!?¡¿,;:])\\s+");
        StringBuilder actual = new StringBuilder();
        for (String oracion : oraciones) {
            if (actual.length() + oracion.length() + 1 <= maxLen) {
                if (!actual.isEmpty()) actual.append(" ");
                actual.append(oracion);
            } else {
                if (!actual.isEmpty()) {
                    partes.add(actual.toString());
                    actual.setLength(0);
                }
                if (oracion.length() <= maxLen) {
                    actual.append(oracion);
                } else {
                    for (int i = 0; i < oracion.length(); i += maxLen) {
                        partes.add(oracion.substring(i, Math.min(oracion.length(), i + maxLen)));
                    }
                }
            }
        }
        if (!actual.isEmpty()) partes.add(actual.toString());
        return partes;
    }

    private String limpiarTextoParaVoz(String raw) {
        return raw
                .replaceAll("\\$(\\d{1,3})\\.(\\d{3})", "$1$2 pesos")
                .replaceAll("\\$(\\d+)", "$1 pesos")
                .replace("500cc", "quinientos ml")
                .replace("500 ml", "quinientos ml")
                .replace("500 mls", "quinientos ml")
                .replace("QR", "cu erre")
                .replaceAll("[^\\p{L}\\p{N}\\s,.:;!?¡¿'-]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }
}
