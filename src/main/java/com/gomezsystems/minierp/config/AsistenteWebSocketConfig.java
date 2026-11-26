package com.gomezsystems.minierp.config;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gomezsystems.minierp.service.AsistenteVentasIAService;
import jakarta.servlet.ServletContext;
import jakarta.websocket.CloseReason;
import jakarta.websocket.Endpoint;
import jakarta.websocket.EndpointConfig;
import jakarta.websocket.MessageHandler;
import jakarta.websocket.Session;
import jakarta.websocket.server.ServerContainer;
import jakarta.websocket.server.ServerEndpointConfig;
import org.springframework.boot.web.servlet.ServletContextInitializer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Map;

/**
 * Endpoint WebSocket nativo (/ws/asistente) para el Tótem Conversacional 3D de RAÍCES.
 * Conecta en tiempo real la comunicación por voz del cliente con AsistenteVentasIAService
 * para atender, asesorar, gestionar el carrito y cerrar toda la venta de forma autónoma.
 */
@Configuration
public class AsistenteWebSocketConfig {

    private static AsistenteVentasIAService ventasIAServiceStatic;
    private static final ObjectMapper MAPPER = new ObjectMapper();

    public AsistenteWebSocketConfig(AsistenteVentasIAService asistenteVentasIAService) {
        AsistenteWebSocketConfig.ventasIAServiceStatic = asistenteVentasIAService;
    }

    @Bean
    public ServletContextInitializer registrarAsistenteWebSocket() {
        return (ServletContext servletContext) -> {
            Object attr = servletContext.getAttribute("jakarta.websocket.server.ServerContainer");
            if (attr instanceof ServerContainer serverContainer) {
                try {
                    ServerEndpointConfig config = ServerEndpointConfig.Builder
                            .create(AsistenteTotemEndpoint.class, "/ws/asistente")
                            .build();
                    serverContainer.addEndpoint(config);
                } catch (Exception e) {
                    System.out.println("Aviso WebSocket /ws/asistente: " + e.getMessage());
                }
            }
        };
    }

    public static class AsistenteTotemEndpoint extends Endpoint {

        @Override
        public void onOpen(Session session, EndpointConfig config) {
            session.setMaxIdleTimeout(600_000L);
            session.addMessageHandler(String.class, (MessageHandler.Whole<String>) rawMsg -> procesarMensaje(session, rawMsg));
        }

        @Override
        public void onClose(Session session, CloseReason closeReason) {
            // La clave clientSessionId mantiene memoria si hay reconexión breve en móvil
        }

        @Override
        public void onError(Session session, Throwable thr) {
            // Evitar trazas ruidosas por cierre abrupto de pestaña
        }

        private void procesarMensaje(Session session, String rawMsg) {
            try {
                if (ventasIAServiceStatic == null) return;
                JsonNode req = MAPPER.readTree(rawMsg);

                // Usar clientSessionId enviado por el navegador si existe para preservar memoria ante reconexiones WS
                String sessionKey = req.has("sessionId") && !req.get("sessionId").asText().isBlank()
                        ? req.get("sessionId").asText()
                        : session.getId();

                // Notificar al frontend que el asistente entró en estado THINKING mientras procesa
                if (session.isOpen()) {
                    session.getAsyncRemote().sendText("{\"type\":\"STATE_CHANGE\",\"state\":\"THINKING\"}");
                }

                Map<String, Object> resp = ventasIAServiceStatic.procesarTurno(sessionKey, req);
                if (session.isOpen() && resp != null) {
                    session.getAsyncRemote().sendText(MAPPER.writeValueAsString(resp));
                }
            } catch (Exception e) {
                // Ignorar tramas malformadas
            }
        }
    }
}
