package com.gomezsystems.minierp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

/**
 * Lector seguro y en caliente de credenciales de IA (OPENAI_API_KEY, ELEVENLABS_API_KEY, GEMINI_API_KEY).
 * Detecta cambios en el archivo local .env automáticamente sin exponer llaves en logs ni en el frontend.
 */
@Component
public class AiCredentialsResolver {

    @Value("${ai.openai.api.key:}")
    private String openAiProp;

    @Value("${ai.elevenlabs.api.key:}")
    private String elevenLabsProp;

    @Value("${ai.gemini.api.key:}")
    private String geminiProp;

    private volatile long lastEnvMtime = -1L;
    private volatile Map<String, String> cachedDotEnv = Map.of();

    public String getOpenAiKey() {
        return resolve("OPENAI_API_KEY", openAiProp);
    }

    public String getElevenLabsKey() {
        return resolve("ELEVENLABS_API_KEY", elevenLabsProp);
    }

    public String getGeminiKey() {
        return resolve("GEMINI_API_KEY", geminiProp);
    }

    public boolean hasOpenAiKey() {
        String k = getOpenAiKey();
        return k != null && k.startsWith("sk-") && k.length() > 16;
    }

    private String resolve(String envVarName, String propFallback) {
        // 1. Variable de entorno del sistema / contenedor cloud (Railway / Render / Docker)
        String sys = System.getenv(envVarName);
        if (sys != null && !sys.isBlank()) {
            return limpiarValor(sys);
        }

        // 2. Archivo .env en la raíz del proyecto o directorio del usuario (recarga automática en caliente)
        Map<String, String> dotEnv = cargarDotEnvActualizado();
        String fromFile = dotEnv.get(envVarName);
        if (fromFile != null && !fromFile.isBlank()) {
            return limpiarValor(fromFile);
        }

        // 3. application.properties
        if (propFallback != null && !propFallback.isBlank()) {
            return limpiarValor(propFallback);
        }

        return null;
    }

    private Map<String, String> cargarDotEnvActualizado() {
        try {
            List<Path> candidatos = List.of(
                    Paths.get(".env"),
                    Paths.get(System.getProperty("user.dir", "."), ".env"),
                    Paths.get(System.getProperty("user.home", "."), ".env")
            );

            long mtimeCombinado = 0L;
            for (Path p : candidatos) {
                if (Files.isRegularFile(p) && Files.isReadable(p)) {
                    mtimeCombinado += Files.getLastModifiedTime(p).toMillis();
                }
            }

            if (mtimeCombinado == lastEnvMtime && mtimeCombinado > 0) {
                return cachedDotEnv;
            }

            Map<String, String> nuevo = new HashMap<>();
            for (Path p : candidatos) {
                if (Files.isRegularFile(p) && Files.isReadable(p)) {
                    for (String rawLine : Files.readAllLines(p, StandardCharsets.UTF_8)) {
                        String line = rawLine.trim();
                        if (line.isEmpty() || line.startsWith("#")) continue;
                        if (line.startsWith("export ")) line = line.substring(7).trim();
                        int eq = line.indexOf('=');
                        if (eq > 0) {
                            String key = line.substring(0, eq).trim();
                            String val = limpiarValor(line.substring(eq + 1));
                            if (!val.isEmpty() && !nuevo.containsKey(key)) {
                                nuevo.put(key, val);
                            }
                        }
                    }
                }
            }

            lastEnvMtime = mtimeCombinado;
            cachedDotEnv = Map.copyOf(nuevo);
            return cachedDotEnv;
        } catch (Exception ignored) {
            return cachedDotEnv;
        }
    }

    private String limpiarValor(String raw) {
        if (raw == null) return "";
        String s = raw.trim();
        // Remover BOM UTF-8 o comillas envolventes si las hubiera
        if (s.startsWith("\uFEFF")) s = s.substring(1).trim();
        if ((s.startsWith("\"") && s.endsWith("\"")) || (s.startsWith("'") && s.endsWith("'"))) {
            s = s.substring(1, s.length() - 1).trim();
        }
        return s;
    }
}
