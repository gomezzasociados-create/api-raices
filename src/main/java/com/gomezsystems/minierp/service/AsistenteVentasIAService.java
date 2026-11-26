package com.gomezsystems.minierp.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.gomezsystems.minierp.config.AiCredentialsResolver;
import com.gomezsystems.minierp.model.Insumo;
import com.gomezsystems.minierp.model.Producto;
import com.gomezsystems.minierp.repository.InsumoRepository;
import com.gomezsystems.minierp.repository.ProductoRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.text.Normalizer;
import java.time.Duration;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Cerebro Conversacional del Kiosquero 3D de RAÍCES impulsado por OpenAI (GPT-4o-mini + Function/JSON Actions)
 * con respaldo local autónomo instantáneo.
 */
@Service
public class AsistenteVentasIAService {

    public enum EtapaVenta {
        BIENVENIDA,
        ASESORIA,
        UPSELLING,
        PAGO_QR_ACTIVO,
        CHECKOUT_NOMBRE,
        CHECKOUT_DIRECCION,
        CHECKOUT_TELEFONO,
        CHECKOUT_PAGO,
        CHECKOUT_CONFIRMACION
    }

    public static class SesionConversacion {
        public EtapaVenta etapa = EtapaVenta.BIENVENIDA;
        public Producto ultimoProductoSugerido = null;
        public List<Producto> ultimosSugeridos = new ArrayList<>();
        public boolean upsellOfrecido = false;
        public String nombreCliente = "";
        public String direccionCliente = "";
        public String telefonoCliente = "";
        public String medioPago = "";
        public final List<Map<String, String>> historialOpenAi = new ArrayList<>();
        public long ultimaInteraccionMs = System.currentTimeMillis();

        public void registrarTurnoHistorial(String rol, String contenido) {
            if (contenido == null || contenido.isBlank()) return;
            historialOpenAi.add(Map.of("role", rol, "content", contenido));
            while (historialOpenAi.size() > 18) {
                historialOpenAi.remove(0);
            }
        }
    }

    public static class ItemOrdenado {
        public final Producto producto;
        public final int cantidad;

        public ItemOrdenado(Producto producto, int cantidad) {
            this.producto = producto;
            this.cantidad = cantidad;
        }
    }

    private final ProductoRepository productoRepository;
    private final InsumoRepository insumoRepository;
    private final VozHumanaTTSService ttsService;
    private final AiCredentialsResolver credentialsResolver;
    private final ObjectMapper mapper = new ObjectMapper();
    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(8))
            .build();

    private final Map<String, SesionConversacion> sesiones = new ConcurrentHashMap<>();

    @Value("${ai.openai.model:gpt-4o-mini}")
    private String openAiModel;

    private static final Map<String, Integer> NUMEROS_VOZ = Map.ofEntries(
            Map.entry("un", 1), Map.entry("uno", 1), Map.entry("una", 1),
            Map.entry("dos", 2), Map.entry("par", 2),
            Map.entry("tres", 3), Map.entry("cuatro", 4), Map.entry("cinco", 5),
            Map.entry("seis", 6), Map.entry("siete", 7), Map.entry("ocho", 8),
            Map.entry("nueve", 9), Map.entry("diez", 10)
    );

    private static final Map<String, String> DIGITOS_TELEFONO = Map.ofEntries(
            Map.entry("cero", "0"), Map.entry("uno", "1"), Map.entry("un", "1"),
            Map.entry("dos", "2"), Map.entry("tres", "3"), Map.entry("cuatro", "4"),
            Map.entry("cinco", "5"), Map.entry("seis", "6"), Map.entry("siete", "7"),
            Map.entry("ocho", "8"), Map.entry("nueve", "9")
    );

    public AsistenteVentasIAService(
            ProductoRepository productoRepository,
            InsumoRepository insumoRepository,
            VozHumanaTTSService ttsService,
            AiCredentialsResolver credentialsResolver) {
        this.productoRepository = productoRepository;
        this.insumoRepository = insumoRepository;
        this.ttsService = ttsService;
        this.credentialsResolver = credentialsResolver;
    }

    public Map<String, Object> procesarTurno(String sessionId, JsonNode req) {
        Map<String, Object> respuesta = calcularRespuestaConversacional(sessionId, req);
        respuesta.putIfAbsent("aiEngine", "local");
        adjuntarVozHumana(respuesta);
        return respuesta;
    }

    private void adjuntarVozHumana(Map<String, Object> resp) {
        if (resp == null || ttsService == null) return;
        Object txtObj = resp.get("text");
        if (txtObj instanceof String txt && !txt.isBlank()) {
            String audioB64 = ttsService.sintetizarBase64(txt);
            if (audioB64 != null) {
                resp.put("audioBase64", audioB64);
                resp.put("mimeType", "audio/mpeg");
            }
        }
    }

    private Map<String, Object> calcularRespuestaConversacional(String sessionId, JsonNode req) {
        SesionConversacion sesion = sesiones.computeIfAbsent(sessionId, k -> new SesionConversacion());
        sesion.ultimaInteraccionMs = System.currentTimeMillis();

        String textoRaw = req.has("text") ? req.get("text").asText("").trim() : "";
        String sucursal = req.has("sucursal") && !req.get("sucursal").asText().isBlank()
                ? req.get("sucursal").asText().trim()
                : "Antofagasta";

        List<Map<String, Object>> carritoCliente = leerCarritoCliente(req.get("cart"));
        sincronizarDatosClienteDesdeFrontend(sesion, req.get("customer"));

        List<Producto> catalogo = obtenerCatalogoComercial(sucursal);
        List<Insumo> insumosArmado = obtenerInsumosArmaTuBatido(sucursal);

        String cmd = normalizar(textoRaw);
        Map<String, Object> resp = baseResponse(sesion);

        // 1. Saludo inicial instantáneo al acercarse al mostrador
        if (cmd.equals("__saludo_inicial__")) {
            sesion.etapa = EtapaVenta.BIENVENIDA;
            String saludo = "¡Hola! Soy GM Guardián de Raíces. ¿Buscás energía limpia, detox o reforzar defensas hoy?";
            sesion.registrarTurnoHistorial("assistant", saludo);
            resp.put("state", "TALKING");
            resp.put("gesture", "WAVE");
            resp.put("text", saludo);
            resp.put("expectingReply", true);
            return resp;
        }

        if (cmd.isEmpty()) {
            resp.put("text", "Decime nomás, ¿qué te preparo hoy?");
            resp.put("expectingReply", true);
            return resp;
        }

        // 2. CEREBRO PRINCIPAL CON OPENAI API (GPT-4o-mini / GPT-4o con JSON estructurado y memoria real)
        if (credentialsResolver != null && credentialsResolver.hasOpenAiKey()) {
            Map<String, Object> respuestaOpenAi = procesarConCerebroOpenAI(
                    sesion, textoRaw, catalogo, insumosArmado, carritoCliente
            );
            if (respuestaOpenAi != null) {
                respuestaOpenAi.put("aiEngine", "openai");
                return respuestaOpenAi;
            }
        }

        // 3. MOTOR AUTÓNOMO LOCAL DE RESPALDO (si aún no se cargó OPENAI_API_KEY o si cae internet)
        Map<String, Object> respuestaLocal = procesarConMotorLocalRespaldo(sesion, textoRaw, cmd, catalogo, insumosArmado, carritoCliente);
        respuestaLocal.put("aiEngine", "local");
        return respuestaLocal;
    }

    // =========================================================================
    // CEREBRO PRINCIPAL OPENAI: CONVERSACIÓN HUMANA + EJECUCIÓN DE VENTA REAL
    // =========================================================================

    private Map<String, Object> procesarConCerebroOpenAI(
            SesionConversacion sesion,
            String textoUsuario,
            List<Producto> catalogo,
            List<Insumo> insumosArmado,
            List<Map<String, Object>> carritoCliente) {

        String apiKey = credentialsResolver.getOpenAiKey();
        if (apiKey == null || apiKey.isBlank()) return null;

        try {
            String catalogoPrompt = catalogo.stream()
                    .map(this::formatearFichaProductoParaPrompt)
                    .collect(Collectors.joining("\n"));

            String insumosPrompt = insumosArmado.stream()
                    .limit(60)
                    .map(i -> {
                        String sub = (i.getSubcategoria() != null && !i.getSubcategoria().isBlank()) ? i.getSubcategoria() : "Extra";
                        String porcion = (i.getCantidadPorcion() != null && i.getMedida() != null)
                                ? String.format(" (%s %s)", Math.round(i.getCantidadPorcion()), i.getMedida())
                                : "";
                        return String.format("[%s] %s%s: $%d CLP", sub, i.getNombre(), porcion, calcularPrecioPorcionInsumo(i));
                    })
                    .collect(Collectors.joining(" | "));

            String carritoPrompt;
            if (carritoCliente.isEmpty()) {
                carritoPrompt = "VACÍO ($0 CLP)";
            } else {
                StringBuilder sbCart = new StringBuilder();
                for (int idx = 0; idx < carritoCliente.size(); idx++) {
                    Map<String, Object> it = carritoCliente.get(idx);
                    sbCart.append(String.format("[idx:%d] %s ($%d) ", idx, it.get("nombre"), leerPrecioMapa(it)));
                }
                sbCart.append("| TOTAL ACTUAL: ").append(formatearPesos(calcularTotalCarrito(carritoCliente)));
                carritoPrompt = sbCart.toString();
            }

            String datosClientePrompt = String.format(
                    "Nombre='%s', Direccion='%s', Telefono='%s', MedioPago='%s', EtapaActual='%s'",
                    sesion.nombreCliente, sesion.direccionCliente, sesion.telefonoCliente, sesion.medioPago, sesion.etapa.name()
            );

            String systemPrompt = """
                    Sos GM Guardián de Raíces, el chimpancé anfitrión del mostrador interactivo 3D de RAÍCES en Antofagasta, Chile.
                    Sos un EXPERTO DE ÉLITE EN NEUROVENTAS, PERSUASIÓN ÉTICA Y NUTRICIÓN FUNCIONAL.

                    TU IDENTIDAD Y TONO DE VOZ (TTS):
                    - Hablás como un asesor cercano, carismático, rápido y apasionado por la salud real, con modismos chilenos/latinos naturales y cálidos (sin exagerar ni sonar robótico).
                    - Tu campo "reply" se pronuncia EN VOZ ALTA: usá frases fluidas, conversacionales, persuasivas y sin listas ni viñetas ni emojis ni markdown. Apuntá a 1 o 2 frases cortas de alto impacto (ideal entre 16 y 45 palabras).
                    - Entendés humor, dudas, cansancio, objetivos fitness, problemas digestivos o indecisión, y guiás siempre con naturalidad hacia la mejor elección y el cierre de compra.
                    - Cuando el cliente pregunte por SABORES, TIPOS DE BATIDOS, CATEGORÍAS o INGREDIENTES, respondé específicamente con las opciones reales del catálogo de abajo (nunca repitas la misma recomendación genérica ni ignores la pregunta). Si pregunta qué batidos o sabores hay, mencioná las líneas disponibles y 3 o 4 sabores reales concretos con su enfoque.

                    MAESTRÍA EN NEUROVENTAS Y PERSUASIÓN:
                    1. DIAGNÓSTICO EMOCIONAL Y SENSORIAL: Si el cliente duda o pide recomendación, conectá rápido con su estado o meta (ej: ¿energía limpia sin bajón, desinflamar la guata, blindar defensas, ganar músculo o detox profundo?).
                    2. VENDE EL RESULTADO, NO SOLO EL INGREDIENTE: Traducí cada ingrediente en un beneficio tangible y sensorial (ej: "la bromelina de la piña con clorofila de espinaca te desinflama y te deja liviano al toque", "nitratos de betarraga para circulación y rendimiento real").
                    3. DIFERENCIADOR RAÍCES (ELIMINAR OBJECIONES): Recordá cuando sume valor que todo es 100%% natural, prensado en frío hidráulico (conserva enzimas vivas y se absorbe en ~20 minutos), SIN azúcar añadida y endulzado con Stevia natural sin calorías.
                    4. CIERRE POR ALTERNATIVA (DOUBLE BIND): En vez de preguntar "¿querés algo?", ofrecé dos opciones ganadoras (ej: "¿Te sumo el Green Detox de 500 mls recién prensado o preferís llevarte el Pack de Pulpas para tener toda la semana?").
                    5. UPSELLING INTELIGENTE: Cuando el cliente ya eligió un batido de 500 mls y aún no tiene shot en el carrito, sugerí con naturalidad potenciarlo con un Shot funcional de $2.500 (ej: Ginger Detox o Cúrcuma & Inmunidad) o el Pack de Pulpas ($25.000) para ahorrar tiempo en casa. Si dice que no, respetalo al tiro y avanzá al cierre.
                    6. MANEJO DE OBJECIONES: Si dice que es caro, reencuadrá en costo-beneficio y nutrición celular real; si teme que sepa "muy verde o amargo", destacá el toque fresco de fruta natural y stevia cero calorías.
                    7. ÉTICA NUTRICIONAL: Hablá de apoyo funcional, bienestar, vitalidad, digestión y nutrición celular; nunca prometas curar enfermedades ni reemplaces criterio médico.

                    CONOCIMIENTO NUTRICIONAL BASE DE RAÍCES:
                    - Prensado en frío (Cold-Press): sin calor ni fricción térmica, protege vitaminas, antioxidantes y enzimas vivas para biodisponibilidad inmediata.
                    - Categoría "500 mls": batidos funcionales listos para tomar al instante.
                    - Categoría "Shots": dosis concentradas de alto impacto (60 mls) para activar metabolismo, inmunidad y antioxidantes.
                    - Categoría "Packs": packs de pulpas congeladas listas para licuar en casa y mantener el hábito toda la semana.
                    - Categoría "Exóticos": superalimentos amazónicos y exóticos de máxima densidad antioxidante.
                    - Categoría "Arma tu Batido": bio-personalización a medida eligiendo base, frutas, vegetales, proteínas, grasas saludables, semillas y adaptógenos.

                    CATÁLOGO OFICIAL EN TIEMPO REAL (ficha completa de productos, ingredientes y beneficios; usá SOLO estos IDs y precios reales):
                    %s

                    INGREDIENTES DISPONIBLES PARA "ARMA TU BATIDO" (500cc personalizado):
                    %s

                    CARRITO ACTUAL DEL CLIENTE:
                    %s

                    DATOS DEL CLIENTE EN SESIÓN:
                    %s

                    REGLAS DE ACCIONES AUTÓNOMAS (respondé SIEMPRE un único objeto JSON válido):
                    1. "ADD_ITEMS": ÚNICAMENTE cuando el cliente confirme explícitamente que quiere llevar o sumar el producto al carrito (ej: "sí", "dale", "sumalo", "agregame uno", "dame dos", "ese quiero"). NUNCA uses "ADD_ITEMS" cuando el cliente solo esté preguntando por un producto, su sabor, ingredientes, beneficios o precio (ej: "¿qué trae el Green Detox?", "¿cuánto cuesta?", "¿tienen de piña?"): en esos casos usá "NONE", respondé su consulta y preguntale si desea que lo sumes al carrito. Cuando sí confirme, llená "itemsToAdd": [{"productId": <ID numérico del catálogo>, "quantity": <entero>}]. Si pide y confirma un batido personalizado con ingredientes sueltos, llená "customSmoothieIngredients": ["nombre ingrediente 1", ...]. Poné "gesture": "POS_TAP" y "state": "CELEBRATING".
                    2. "REMOVE_ITEM": cuando pide sacar/quitar algo del carrito. Poné "removeCartIndex": <idx entero del carrito>.
                    3. "CLEAR_CART": cuando pide vaciar/borrar todo el carrito.
                    4. "FILTER_CATEGORY": si pide mirar una sección ("500 mls", "Shots", "Packs", "Exóticos", "Arma tu Batido", "Comunidad"), ponelo en "categoryFilter".
                    5. "SHOW_QR_PAYMENT": cuando hay productos en el carrito y el cliente dice "¿cómo pago?", "cobrame", "quiero pagar", "con QR", "eso es todo" o "cerrar pedido" (sin pedir envío a domicilio). Poné "paymentMethod": "MercadoPago" (o "Efectivo"/"Transferencia" si lo especificó) y decí algo fresco como "¡Fácil, con QR! Ya te lo dejo en pantalla, escaneá o decime confirmar."
                    6. "FILL_CHECKOUT": si el cliente quiere ENVÍO A DOMICILIO o te dicta su nombre, dirección o teléfono, guardá lo que te haya dicho en "checkoutFields": {"nombre": "...", "direccion": "...", "telefono": "...", "medioPago": "MercadoPago|Transferencia|Efectivo"} y pedile de forma breve y humana el siguiente dato faltante (Nombre -> Dirección -> Teléfono -> Medio de pago -> Confirmación).
                    7. "SUBMIT_ORDER": cuando el cliente YA tiene productos en el carrito y confirma el pago en el QR ("listo", "ya pagué", "confirmar", "dale", "enviar") o confirma el resumen final de su envío a domicilio. Poné "state": "CELEBRATING", "gesture": "CELEBRATE", "expectingReply": false, y despedite con buena onda agradeciendo la compra.
                    8. "NONE": para saludar, diagnosticar necesidad, responder preguntas sobre productos, sabores, ingredientes o precios, persuadir o hacer upselling antes de que el cliente confirme explícitamente que lo quiere sumar al carrito.

                    ESQUEMA JSON OBLIGATORIO DE SALIDA:
                    {
                      "reply": "texto corto, persuasivo y muy humano que GM Guardián de Raíces dirá en voz alta (sin emojis ni listas)",
                      "action": "NONE | ADD_ITEMS | REMOVE_ITEM | CLEAR_CART | FILTER_CATEGORY | SHOW_QR_PAYMENT | FILL_CHECKOUT | SUBMIT_ORDER",
                      "gesture": "NONE | WAVE | POS_TAP | CELEBRATE",
                      "state": "TALKING | CELEBRATING",
                      "expectingReply": true,
                      "itemsToAdd": [{"productId": 0, "quantity": 1}],
                      "customSmoothieIngredients": [],
                      "removeCartIndex": null,
                      "categoryFilter": null,
                      "paymentMethod": null,
                      "checkoutFields": {"nombre": null, "direccion": null, "telefono": null, "medioPago": null}
                    }
                    """.formatted(catalogoPrompt, insumosPrompt, carritoPrompt, datosClientePrompt);

            List<Map<String, String>> messages = new ArrayList<>();
            messages.add(Map.of("role", "system", "content", systemPrompt));
            messages.addAll(sesion.historialOpenAi);
            messages.add(Map.of("role", "user", "content", textoUsuario));

            Map<String, Object> reqBody = new HashMap<>();
            reqBody.put("model", (openAiModel != null && !openAiModel.isBlank()) ? openAiModel.trim() : "gpt-4o-mini");
            reqBody.put("messages", messages);
            reqBody.put("temperature", 0.6);
            reqBody.put("max_tokens", 450);
            reqBody.put("response_format", Map.of("type", "json_object"));

            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://api.openai.com/v1/chat/completions"))
                    .header("Authorization", "Bearer " + apiKey)
                    .header("Content-Type", "application/json")
                    .timeout(Duration.ofSeconds(20))
                    .POST(HttpRequest.BodyPublishers.ofString(mapper.writeValueAsString(reqBody)))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() != 200) {
                System.err.println("⚠️ Aviso OpenAI Chat (" + response.statusCode() + "): " + response.body());
                return null;
            }

            JsonNode root = mapper.readTree(response.body());
            String contentJson = root.path("choices").path(0).path("message").path("content").asText("").trim();
            if (contentJson.isEmpty()) return null;

            JsonNode aiDecision = mapper.readTree(contentJson);
            return traducirDecisionOpenAiARespuestaFrontend(
                    sesion, textoUsuario, aiDecision, catalogo, insumosArmado, carritoCliente
            );
        } catch (Exception e) {
            System.err.println("⚠️ Excepción consultando OpenAI: " + e.getMessage());
            return null;
        }
    }

    private Map<String, Object> traducirDecisionOpenAiARespuestaFrontend(
            SesionConversacion sesion,
            String textoUsuario,
            JsonNode ai,
            List<Producto> catalogo,
            List<Insumo> insumosArmado,
            List<Map<String, Object>> carritoCliente) {

        Map<String, Object> resp = baseResponse(sesion);

        String reply = ai.path("reply").asText("").trim();
        if (reply.isEmpty()) {
            reply = "¡De una! Decime cómo seguimos con tu pedido.";
        }

        String action = ai.path("action").asText("NONE").toUpperCase().trim();
        String gesture = ai.path("gesture").asText("NONE").toUpperCase().trim();
        String state = ai.path("state").asText("TALKING").toUpperCase().trim();
        boolean expectingReply = ai.path("expectingReply").asBoolean(true);

        sesion.registrarTurnoHistorial("user", textoUsuario);
        sesion.registrarTurnoHistorial("assistant", reply);

        resp.put("text", reply);
        resp.put("state", "CELEBRATING".equals(state) ? "CELEBRATING" : "TALKING");
        resp.put("expectingReply", expectingReply);
        if (!"NONE".equals(gesture) && !gesture.isEmpty()) {
            resp.put("gesture", gesture);
        }

        // Sincronizar campos de checkout si OpenAI extrajo alguno
        JsonNode cf = ai.path("checkoutFields");
        Map<String, String> checkoutUpdates = new HashMap<>();
        if (cf.isObject()) {
            String nom = textoLimpioJson(cf.get("nombre"));
            String dir = textoLimpioJson(cf.get("direccion"));
            String tel = textoLimpioJson(cf.get("telefono"));
            String mp = textoLimpioJson(cf.get("medioPago"));

            if (!nom.isEmpty()) { sesion.nombreCliente = nom; checkoutUpdates.put("nombre", nom); }
            if (!dir.isEmpty()) { sesion.direccionCliente = dir; checkoutUpdates.put("direccion", dir); }
            if (!tel.isEmpty()) { sesion.telefonoCliente = tel; checkoutUpdates.put("telefono", tel); }
            if (!mp.isEmpty()) { sesion.medioPago = mp; checkoutUpdates.put("medioPago", mp); }
        }

        Map<Long, Producto> prodPorId = catalogo.stream()
                .filter(p -> p.getId() != null)
                .collect(Collectors.toMap(Producto::getId, p -> p, (a, b) -> a));

        switch (action) {
            case "ADD_ITEMS" -> {
                List<Map<String, Object>> dtosAgregar = new ArrayList<>();

                // 1. Productos del catálogo por ID real validado contra PostgreSQL
                JsonNode itemsNode = ai.path("itemsToAdd");
                if (itemsNode.isArray()) {
                    for (JsonNode it : itemsNode) {
                        long pid = it.path("productId").asLong(-1);
                        int qty = Math.max(1, Math.min(20, it.path("quantity").asInt(1)));
                        Producto pReal = prodPorId.get(pid);
                        if (pReal != null) {
                            Map<String, Object> dto = construirDtoProducto(pReal);
                            for (int q = 0; q < qty; q++) dtosAgregar.add(dto);
                        }
                    }
                }

                // 2. Batido personalizado ("Arma tu Batido") si OpenAI llenó customSmoothieIngredients
                JsonNode customIngs = ai.path("customSmoothieIngredients");
                if (customIngs.isArray() && !customIngs.isEmpty()) {
                    List<Insumo> matchInsumos = new ArrayList<>();
                    for (JsonNode ingNode : customIngs) {
                        String buscado = normalizar(ingNode.asText(""));
                        if (buscado.isEmpty()) continue;
                        insumosArmado.stream()
                                .filter(ins -> ins.getNombre() != null && contieneTerminoFlexible(normalizar(ins.getNombre()), buscado))
                                .findFirst()
                                .ifPresent(matchInsumos::add);
                    }
                    if (!matchInsumos.isEmpty()) {
                        long totalCustom = 0;
                        List<String> noms = new ArrayList<>();
                        List<String> rec = new ArrayList<>();
                        for (Insumo ins : matchInsumos) {
                            totalCustom += calcularPrecioPorcionInsumo(ins);
                            noms.add("1x " + ins.getNombre());
                            rec.add(ins.getNombre() + ":1");
                        }
                        if (totalCustom <= 0) totalCustom = 4500;
                        Map<String, Object> customDto = new HashMap<>();
                        customDto.put("id", "custom_" + System.currentTimeMillis());
                        customDto.put("nombre", "Batido Armado 500cc: " + String.join(", ", noms));
                        customDto.put("categoria", "Arma tu Batido");
                        customDto.put("precio", totalCustom);
                        customDto.put("precioOriginal", totalCustom);
                        customDto.put("descuento", 0);
                        customDto.put("recetaDetalle", String.join("\n", rec));
                        customDto.put("esCustom", true);
                        dtosAgregar.add(customDto);
                    }
                }

                // Respaldo: si el LLM puso ADD_ITEMS pero omitió el ID numérico, inferir del texto del usuario
                if (dtosAgregar.isEmpty()) {
                    List<ItemOrdenado> inferidos = extraerItemsOrdenados(catalogo, normalizar(textoUsuario));
                    for (ItemOrdenado io : inferidos) {
                        Map<String, Object> dto = construirDtoProducto(io.producto);
                        for (int q = 0; q < io.cantidad; q++) dtosAgregar.add(dto);
                    }
                }

                if (!dtosAgregar.isEmpty()) {
                    resp.put("action", "ADD_ITEMS");
                    resp.put("items", dtosAgregar);
                    resp.put("product", dtosAgregar.get(0));
                    resp.put("state", "CELEBRATING");
                    resp.put("gesture", "POS_TAP");
                }
                sesion.etapa = EtapaVenta.ASESORIA;
            }

            case "REMOVE_ITEM" -> {
                int idx = ai.path("removeCartIndex").asInt(-1);
                if (idx < 0 && !carritoCliente.isEmpty()) {
                    idx = carritoCliente.size() - 1;
                }
                if (idx >= 0 && idx < carritoCliente.size()) {
                    resp.put("action", "REMOVE_ITEM");
                    resp.put("removeIndex", idx);
                    resp.put("gesture", "POS_TAP");
                }
            }

            case "CLEAR_CART" -> {
                resp.put("action", "CLEAR_CART");
                resp.put("gesture", "POS_TAP");
                sesion.etapa = EtapaVenta.ASESORIA;
            }

            case "FILTER_CATEGORY" -> {
                String cat = textoLimpioJson(ai.get("categoryFilter"));
                if (!cat.isEmpty()) {
                    resp.put("action", "FILTER_CATEGORY");
                    resp.put("category", cat);
                }
            }

            case "SHOW_QR_PAYMENT" -> {
                if (!carritoCliente.isEmpty()) {
                    String mp = textoLimpioJson(ai.get("paymentMethod"));
                    if (mp.isEmpty()) mp = sesion.medioPago.isBlank() ? "MercadoPago" : sesion.medioPago;
                    sesion.medioPago = mp;
                    sesion.etapa = EtapaVenta.PAGO_QR_ACTIVO;
                    resp.put("action", "SHOW_QR_PAYMENT");
                    resp.put("paymentMethod", mp);
                    resp.put("total", calcularTotalCarrito(carritoCliente));
                    resp.put("gesture", "POS_TAP");
                }
            }

            case "FILL_CHECKOUT" -> {
                sesion.etapa = EtapaVenta.CHECKOUT_CONFIRMACION;
                resp.put("action", "FILL_CHECKOUT");
                resp.put("checkoutData", checkoutUpdates);
            }

            case "SUBMIT_ORDER" -> {
                if (!carritoCliente.isEmpty()) {
                    String mp = !sesion.medioPago.isBlank()
                            ? sesion.medioPago
                            : (!textoLimpioJson(ai.get("paymentMethod")).isEmpty() ? textoLimpioJson(ai.get("paymentMethod")) : "MercadoPago");

                    Map<String, Object> orden = new HashMap<>();
                    orden.put("nombre", sesion.nombreCliente.isBlank() ? "Cliente Kiosco IA" : sesion.nombreCliente);
                    orden.put("direccion", sesion.direccionCliente.isBlank() ? "Retiro en Mostrador RAÍCES" : sesion.direccionCliente);
                    orden.put("telefono", sesion.telefonoCliente.isBlank() ? "Mostrador" : sesion.telefonoCliente);
                    orden.put("medioPago", mp);

                    resp.put("action", "SUBMIT_ORDER");
                    resp.put("orderData", orden);
                    resp.put("state", "CELEBRATING");
                    resp.put("gesture", "CELEBRATE");
                    resp.put("expectingReply", false);

                    sesion.etapa = EtapaVenta.BIENVENIDA;
                    sesion.medioPago = "";
                }
            }

            default -> {
                if (!checkoutUpdates.isEmpty()) {
                    resp.put("action", "FILL_CHECKOUT");
                    resp.put("checkoutData", checkoutUpdates);
                }
            }
        }

        resp.put("stage", sesion.etapa.name());
        return resp;
    }

    private String textoLimpioJson(JsonNode node) {
        if (node == null || node.isNull()) return "";
        String v = node.asText("").trim();
        return "null".equalsIgnoreCase(v) ? "" : v;
    }

    private String formatearFichaProductoParaPrompt(Producto p) {
        long pf = calcularPrecioFinal(p);
        String dtoStr = (p.getDescuento() != null && p.getDescuento() > 0)
                ? " (-" + Math.round(p.getDescuento()) + "% OFF, antes $" + Math.round(p.getPrecio()) + ")"
                : "";
        String stockStr = (p.getStock() != null && p.getStock() > 0)
                ? " | Stock:" + p.getStock()
                : "";
        String descLimpia = limpiarTextoFicha(p.getDescripcion());
        if (descLimpia.isEmpty()) {
            descLimpia = "100% natural prensado en frío, sin azúcar añadida, endulzado con stevia";
        }
        String recetaLimpia = limpiarTextoFicha(p.getRecetaDetalle());
        String recetaStr = recetaLimpia.isEmpty() ? "" : " | Fórmula:" + recetaLimpia;
        return String.format("ID:%d | %s | Cat:%s | $%d CLP%s%s | Info: %s%s",
                p.getId(), p.getNombre(), p.getCategoria(), pf, dtoStr, stockStr, descLimpia, recetaStr);
    }

    private String limpiarTextoFicha(String texto) {
        if (texto == null || texto.isBlank()) return "";
        return texto.replaceAll("[\\r\\n]+", " • ")
                .replaceAll("[^\\p{L}\\p{N}\\s,.;:%()•/+&-]", " ")
                .replaceAll("\\s+", " ")
                .trim();
    }

    // =========================================================================
    // MOTOR LOCAL AUTÓNOMO DE RESPALDO (CUANDO NO HAY LLAVE OPENAI AÚN)
    // =========================================================================

    private Map<String, Object> procesarConMotorLocalRespaldo(
            SesionConversacion sesion,
            String textoRaw,
            String cmd,
            List<Producto> catalogo,
            List<Insumo> insumosArmado,
            List<Map<String, Object>> carritoCliente) {

        Map<String, Object> resp = baseResponse(sesion);

        if (esComandoDetenerConversacion(cmd)) {
            resp.put("gesture", "WAVE");
            resp.put("text", "¡Dale, cualquier cosa me hablás! Acá te espero.");
            resp.put("expectingReply", false);
            return resp;
        }

        if (esComandoVaciarCarrito(cmd)) {
            sesion.etapa = EtapaVenta.ASESORIA;
            sesion.upsellOfrecido = false;
            resp.put("action", "CLEAR_CART");
            resp.put("gesture", "POS_TAP");
            resp.put("text", "Listo, dejé el carrito en cero. ¿Qué te gustaría llevar?");
            return resp;
        }

        if (esComandoQuitarItem(cmd)) {
            return manejarQuitarItem(sesion, cmd, carritoCliente);
        }

        if (sesion.etapa == EtapaVenta.PAGO_QR_ACTIVO) {
            if (contieneAlguno(cmd, "domicilio", "despacho", "envio", "enviar a")) {
                sesion.etapa = EtapaVenta.CHECKOUT_NOMBRE;
                resp.put("action", "CLOSE_QR");
                resp.put("text", "¡De una, te lo enviamos! ¿A nombre de quién va el pedido?");
                return resp;
            }
            if (esConfirmacionFinalVenta(cmd) || contieneAlguno(cmd, "ya pague", "listo", "pagado", "transferi", "efectivo")) {
                String metodo = contieneAlguno(cmd, "efectivo") ? "Efectivo"
                        : (sesion.medioPago == null || sesion.medioPago.isBlank() ? "MercadoPago" : sesion.medioPago);
                return cerrarVentaRapidaKiosco(sesion, metodo);
            }
            if (esSolicitudCancelarCheckout(cmd)) {
                sesion.etapa = EtapaVenta.ASESORIA;
                resp.put("action", "CLOSE_QR");
                resp.put("text", "¡Dale! Seguimos viendo el menú. ¿Qué más te sumo?");
                return resp;
            }
        }

        boolean enCheckoutDatos = sesion.etapa == EtapaVenta.CHECKOUT_NOMBRE
                || sesion.etapa == EtapaVenta.CHECKOUT_DIRECCION
                || sesion.etapa == EtapaVenta.CHECKOUT_TELEFONO
                || sesion.etapa == EtapaVenta.CHECKOUT_PAGO
                || sesion.etapa == EtapaVenta.CHECKOUT_CONFIRMACION;

        if (enCheckoutDatos) {
            return procesarPasoCheckoutLocal(sesion, textoRaw, cmd, carritoCliente);
        }

        if (esPreguntaComoPagoOPagoQR(cmd) || esComandoIniciarCheckout(cmd)) {
            return activarPagoQRInstantaneo(sesion, cmd, carritoCliente, catalogo);
        }

        if (sesion.ultimoProductoSugerido != null && esAfirmacionDirecta(cmd)) {
            int cant = extraerCantidadGeneral(cmd);
            return ejecutarAgregadoProductosLocal(sesion, List.of(new ItemOrdenado(sesion.ultimoProductoSugerido, cant)), carritoCliente, catalogo);
        }

        boolean esSoloPregunta = contieneAlguno(cmd, "que trae", "que tiene", "ingredientes", "cuanto vale", "cuanto cuesta", "precio", "como es", "a que sabe", "de que es", "beneficios", "sirve para", "tienen ");
        List<ItemOrdenado> itemsDetectados = extraerItemsOrdenados(catalogo, cmd);
        if (!itemsDetectados.isEmpty()) {
            if (esSoloPregunta) {
                Producto p = itemsDetectados.get(0).producto;
                sesion.ultimoProductoSugerido = p;
                String desc = limpiarTextoFicha(p.getDescripcion());
                String info = desc.isEmpty() ? "es 100% natural prensado en frío" : desc;
                resp.put("text", p.getNombre() + " cuesta " + formatearPesos(calcularPrecioFinal(p)) + " y " + info + ". ¿Te gustaría que lo sume al carrito?");
                return resp;
            }
            return ejecutarAgregadoProductosLocal(sesion, itemsDetectados, carritoCliente, catalogo);
        }

        if (contieneAlguno(cmd, "como estas", "como andas", "todo bien", "que tal")) {
            resp.put("gesture", "WAVE");
            resp.put("text", "¡Todo impecable por acá! Contame, ¿qué te sirvo hoy?");
            return resp;
        }

        Map<String, Object> consultaLocal = responderConsultaCatalogoLocal(sesion, cmd, catalogo, insumosArmado);
        if (consultaLocal != null) {
            return consultaLocal;
        }

        List<Producto> disponibles = catalogo.isEmpty() ? List.of() : catalogo;
        Producto sugerido = null;
        if (!disponibles.isEmpty()) {
            int idx = sesion.ultimoProductoSugerido == null
                    ? 0
                    : (disponibles.indexOf(sesion.ultimoProductoSugerido) + 1) % disponibles.size();
            sugerido = disponibles.get(Math.max(0, idx));
        }
        sesion.ultimoProductoSugerido = sugerido;
        resp.put("text", sugerido != null
                ? "Tengo varias opciones frescas, por ejemplo el " + sugerido.getNombre() + " a " + formatearPesos(calcularPrecioFinal(sugerido)) + ". ¿Te cuento los sabores o te sumo uno?"
                : "Decime qué batido, shot o sabor te tienta hoy.");
        return resp;
    }

    private Map<String, Object> responderConsultaCatalogoLocal(
            SesionConversacion sesion,
            String cmd,
            List<Producto> catalogo,
            List<Insumo> insumosArmado) {
        Map<String, Object> resp = baseResponse(sesion);

        // 1. Preguntas sobre sabores, tipos de batidos, carta o qué ofrecen
        if (contieneAlguno(cmd, "sabor", "sabores", "tipo", "tipos", "batido", "batidos", "menu", "carta", "que tienen", "cuales tienen", "que hay", "opciones", "variedad", "categorias")) {
            if (contieneAlguno(cmd, "shot", "shots")) {
                List<Producto> shots = filtrarPorCategoria(catalogo, "shot");
                if (!shots.isEmpty()) {
                    sesion.ultimoProductoSugerido = shots.get(0);
                    return respuestaListaProductos(resp, "En Shots funcionales tenemos " + resumirProductos(shots, 5) + ". ¿Cuál te sumamos?");
                }
            }
            if (contieneAlguno(cmd, "pack", "packs", "pulpa", "pulpas")) {
                List<Producto> packs = filtrarPorCategoria(catalogo, "pack");
                if (!packs.isEmpty()) {
                    sesion.ultimoProductoSugerido = packs.get(0);
                    return respuestaListaProductos(resp, "En Packs de pulpas para la casa tenemos " + resumirProductos(packs, 4) + ". ¿Cuál preferís?");
                }
            }
            if (contieneAlguno(cmd, "exotic", "exotico", "exoticos")) {
                List<Producto> exot = filtrarPorCategoria(catalogo, "exot");
                if (!exot.isEmpty()) {
                    sesion.ultimoProductoSugerido = exot.get(0);
                    return respuestaListaProductos(resp, "En la línea Exóticos tenemos " + resumirProductos(exot, 4) + ". ¿Te tienta alguno?");
                }
            }
            if (contieneAlguno(cmd, "arma", "armar", "personaliz", "ingrediente", "ingredientes")) {
                String ings = insumosArmado.stream()
                        .map(Insumo::getNombre)
                        .filter(Objects::nonNull)
                        .limit(6)
                        .collect(Collectors.joining(", "));
                String texto = ings.isEmpty()
                        ? "En Arma tu Batido podés combinar frutas, vegetales, proteínas y superalimentos a tu gusto."
                        : "En Arma tu Batido podés combinar ingredientes como " + ings + ", entre otros. ¿Qué base te gustaría?";
                return respuestaListaProductos(resp, texto);
            }

            List<Producto> batidos500 = filtrarPorCategoria(catalogo, "500");
            if (batidos500.isEmpty()) batidos500 = catalogo;
            if (!batidos500.isEmpty()) {
                sesion.ultimoProductoSugerido = batidos500.get(0);
                String resumen = resumirProductos(batidos500, 5);
                return respuestaListaProductos(resp,
                        "Manejamos batidos de 500 mls prensados en frío, Shots concentrados, Packs para la casa, línea Exóticos y Arma tu Batido. Entre los sabores destacados tenés " + resumen + ". ¿Qué objetivo buscás hoy?");
            }
        }

        // 2. Recomendación por objetivo / necesidad
        if (contieneAlguno(cmd, "energia", "cansad", "despertar", "pre entreno", "rendimiento", "deporte")) {
            return recomendarPorTerminos(resp, sesion, catalogo, "Para darte energía limpia te recomiendo ", "energy", "remolacha", "betarraga", "cacao", "matcha", "ginger", "acai");
        }
        if (contieneAlguno(cmd, "detox", "desinflamar", "guata", "digestion", "limpiar", "verde", "liviano")) {
            return recomendarPorTerminos(resp, sesion, catalogo, "Para detox y digestión liviana va perfecto ", "detox", "green", "espinaca", "pina", "apio", "ginger");
        }
        if (contieneAlguno(cmd, "defensa", "inmun", "resfrio", "vitamina", "antioxidante")) {
            return recomendarPorTerminos(resp, sesion, catalogo, "Para blindar tus defensas te conviene ", "inmun", "curcuma", "ginger", "citric", "naranja", "camu", "maqui");
        }
        if (contieneAlguno(cmd, "proteina", "musculo", "gym", "masa", "recuperacion")) {
            return recomendarPorTerminos(resp, sesion, catalogo, "Para recuperación y proteína te recomiendo ", "prot", "gainer", "platano", "mani", "cacao", "avena");
        }

        return null;
    }

    private List<Producto> filtrarPorCategoria(List<Producto> catalogo, String catFragment) {
        String frag = normalizar(catFragment);
        return catalogo.stream()
                .filter(p -> p.getCategoria() != null && normalizar(p.getCategoria()).contains(frag))
                .toList();
    }

    private String resumirProductos(List<Producto> lista, int max) {
        List<String> partes = new ArrayList<>();
        for (int i = 0; i < Math.min(max, lista.size()); i++) {
            Producto p = lista.get(i);
            partes.add(p.getNombre() + " a " + formatearPesos(calcularPrecioFinal(p)));
        }
        return unirConY(partes);
    }

    private Map<String, Object> respuestaListaProductos(Map<String, Object> resp, String texto) {
        resp.put("text", texto);
        resp.put("expectingReply", true);
        return resp;
    }

    private Map<String, Object> recomendarPorTerminos(
            Map<String, Object> resp,
            SesionConversacion sesion,
            List<Producto> catalogo,
            String prefijo,
            String... terminos) {
        List<Producto> matches = new ArrayList<>();
        for (Producto p : catalogo) {
            String blob = normalizar((p.getNombre() != null ? p.getNombre() : "") + " " + (p.getDescripcion() != null ? p.getDescripcion() : ""));
            for (String t : terminos) {
                if (blob.contains(t)) {
                    matches.add(p);
                    break;
                }
            }
        }
        if (matches.isEmpty() && !catalogo.isEmpty()) {
            matches.add(catalogo.get(0));
        }
        if (matches.isEmpty()) return null;
        sesion.ultimoProductoSugerido = matches.get(0);
        resp.put("text", prefijo + resumirProductos(matches, 3) + ". ¿Cuál te gustaría probar?");
        return resp;
    }

    private Map<String, Object> activarPagoQRInstantaneo(
            SesionConversacion sesion, String cmd, List<Map<String, Object>> carritoCliente, List<Producto> catalogo) {
        Map<String, Object> resp = baseResponse(sesion);
        if (carritoCliente.isEmpty()) {
            sesion.ultimoProductoSugerido = buscarPorNombreParcial(catalogo, "green detox");
            resp.put("text", "Todavía está vacío el carrito. ¿Te sumo un Green Detox primero?");
            return resp;
        }
        String mp = detectarMedioPago(cmd);
        sesion.medioPago = mp != null ? mp : "MercadoPago";
        sesion.etapa = EtapaVenta.PAGO_QR_ACTIVO;
        resp.put("action", "SHOW_QR_PAYMENT");
        resp.put("gesture", "POS_TAP");
        resp.put("paymentMethod", sesion.medioPago);
        resp.put("total", calcularTotalCarrito(carritoCliente));
        resp.put("text", "¡Fácil, con QR! Ya te lo genero acá en pantalla. Escaneá o decime 'confirmar'.");
        return resp;
    }

    private Map<String, Object> cerrarVentaRapidaKiosco(SesionConversacion sesion, String metodo) {
        Map<String, Object> resp = baseResponse(sesion);
        Map<String, Object> orden = new HashMap<>();
        orden.put("nombre", sesion.nombreCliente.isBlank() ? "Cliente Tótem Kiosco" : sesion.nombreCliente);
        orden.put("direccion", sesion.direccionCliente.isBlank() ? "Retiro en Mostrador RAÍCES" : sesion.direccionCliente);
        orden.put("telefono", sesion.telefonoCliente.isBlank() ? "Mostrador" : sesion.telefonoCliente);
        orden.put("medioPago", metodo);
        resp.put("action", "SUBMIT_ORDER");
        resp.put("orderData", orden);
        resp.put("state", "CELEBRATING");
        resp.put("gesture", "CELEBRATE");
        resp.put("text", "¡Espectacular, ya llegó! Ahí sale tu pedido. ¡Que lo disfrutes, gracias por la compra!");
        resp.put("expectingReply", false);
        sesion.etapa = EtapaVenta.BIENVENIDA;
        sesion.medioPago = "";
        return resp;
    }

    private Map<String, Object> ejecutarAgregadoProductosLocal(
            SesionConversacion sesion, List<ItemOrdenado> nuevosItems, List<Map<String, Object>> carritoActual, List<Producto> catalogo) {
        Map<String, Object> resp = baseResponse(sesion);
        List<Map<String, Object>> dtos = new ArrayList<>();
        List<String> frases = new ArrayList<>();
        long suma = 0;
        for (ItemOrdenado io : nuevosItems) {
            Map<String, Object> dto = construirDtoProducto(io.producto);
            long pr = Math.round(((Number) dto.get("precio")).doubleValue());
            for (int i = 0; i < io.cantidad; i++) { dtos.add(dto); suma += pr; }
            frases.add((io.cantidad > 1 ? io.cantidad + " " : "") + io.producto.getNombre());
        }
        resp.put("action", "ADD_ITEMS");
        resp.put("items", dtos);
        resp.put("state", "CELEBRATING");
        resp.put("gesture", "POS_TAP");
        resp.put("text", "¡Listo, ya te sumé " + unirConY(frases) + " al carrito! Vas en "
                + formatearPesos(calcularTotalCarrito(carritoActual) + suma) + ". ¿Algo más o te genero el QR?");
        sesion.ultimoProductoSugerido = null;
        return resp;
    }

    private Map<String, Object> manejarQuitarItem(SesionConversacion sesion, String cmd, List<Map<String, Object>> carritoActual) {
        Map<String, Object> resp = baseResponse(sesion);
        if (carritoActual.isEmpty()) {
            resp.put("text", "El carrito está vacío todavía.");
            return resp;
        }
        int idx = carritoActual.size() - 1;
        resp.put("action", "REMOVE_ITEM");
        resp.put("removeIndex", idx);
        resp.put("gesture", "POS_TAP");
        resp.put("text", "Listo, saqué el último producto del carrito. ¿Cómo seguimos?");
        return resp;
    }

    private Map<String, Object> procesarPasoCheckoutLocal(
            SesionConversacion sesion, String textoRaw, String cmd, List<Map<String, Object>> carritoCliente) {
        Map<String, Object> resp = baseResponse(sesion);
        if (sesion.etapa == EtapaVenta.CHECKOUT_NOMBRE) {
            sesion.nombreCliente = textoRaw.trim();
            sesion.etapa = EtapaVenta.CHECKOUT_DIRECCION;
            resp.put("action", "FILL_CHECKOUT");
            resp.put("checkoutData", Map.of("nombre", sesion.nombreCliente));
            resp.put("text", "¡Genial! ¿A qué dirección te lo mandamos?");
            return resp;
        }
        if (sesion.etapa == EtapaVenta.CHECKOUT_DIRECCION) {
            sesion.direccionCliente = textoRaw.trim();
            sesion.etapa = EtapaVenta.CHECKOUT_TELEFONO;
            resp.put("action", "FILL_CHECKOUT");
            resp.put("checkoutData", Map.of("direccion", sesion.direccionCliente));
            resp.put("text", "¡Anotado! ¿Me dictás tu WhatsApp?");
            return resp;
        }
        if (sesion.etapa == EtapaVenta.CHECKOUT_TELEFONO) {
            sesion.telefonoCliente = extraerTelefonoDeVoz(textoRaw, cmd);
            sesion.etapa = EtapaVenta.CHECKOUT_CONFIRMACION;
            resp.put("action", "FILL_CHECKOUT");
            resp.put("checkoutData", Map.of("telefono", sesion.telefonoCliente));
            resp.put("text", "¡Listo! Son " + formatearPesos(calcularTotalCarrito(carritoCliente)) + ". Decime 'confirmar' para enviarlo.");
            return resp;
        }
        if (esConfirmacionFinalVenta(cmd)) {
            return cerrarVentaRapidaKiosco(sesion, "Efectivo");
        }
        resp.put("text", "Decime 'confirmar' para cerrar el pedido.");
        return resp;
    }

    // =========================================================================
    // PARSING Y UTILIDADES DE CATÁLOGO
    // =========================================================================

    private List<ItemOrdenado> extraerItemsOrdenados(List<Producto> catalogo, String cmdNorm) {
        if (catalogo == null || catalogo.isEmpty() || cmdNorm.isEmpty()) return List.of();
        String cmdFon = normalizarFoneticaStt(cmdNorm);
        String[] segmentos = cmdFon.split("\\s+(?:y|mas|tambien|con|ademas)\\s+|,\\s*");
        Map<Long, Integer> acumulador = new LinkedHashMap<>();
        Map<Long, Producto> mapaProd = new HashMap<>();
        for (String seg : segmentos) {
            Producto encontrado = buscarMejorProductoEnFrase(catalogo, seg.trim());
            if (encontrado != null && encontrado.getId() != null) {
                acumulador.merge(encontrado.getId(), extraerCantidadGeneral(seg), Integer::sum);
                mapaProd.put(encontrado.getId(), encontrado);
            }
        }
        if (acumulador.isEmpty()) {
            Producto global = buscarMejorProductoEnFrase(catalogo, cmdFon);
            if (global != null && global.getId() != null) {
                acumulador.put(global.getId(), extraerCantidadGeneral(cmdFon));
                mapaProd.put(global.getId(), global);
            }
        }
        List<ItemOrdenado> res = new ArrayList<>();
        acumulador.forEach((id, c) -> res.add(new ItemOrdenado(mapaProd.get(id), Math.min(c, 20))));
        return res;
    }

    private Producto buscarMejorProductoEnFrase(List<Producto> catalogo, String fraseFon) {
        Producto mejor = null;
        int mejorScore = 0;
        for (Producto p : catalogo) {
            if (p.getNombre() == null || p.getNombre().isBlank()) continue;
            String nomProd = normalizarFoneticaStt(normalizar(p.getNombre()));
            int score = 0;
            if (fraseFon.contains(nomProd)) score = 100 + nomProd.length();
            else {
                String[] tks = nomProd.split("\\s+");
                int hits = 0, sig = 0;
                for (String tk : tks) {
                    if (tk.length() <= 2 || tk.equals("del")) continue;
                    sig++;
                    if (contieneTerminoFlexible(fraseFon, tk)) hits++;
                }
                if (sig > 0 && hits == sig) score = 85 + hits * 10;
                else if (sig >= 2 && hits >= 2) score = 65 + hits * 8;
            }
            if (score > mejorScore) { mejorScore = score; mejor = p; }
        }
        return mejorScore >= 60 ? mejor : null;
    }

    private String normalizarFoneticaStt(String s) {
        return s.replace("&", " y ").replace("grin", "green").replace("ditox", "detox")
                .replace("gueiner", "gainer").replace("ginjer", "ginger")
                .replaceAll("\\s+", " ").trim();
    }

    private int extraerCantidadGeneral(String frase) {
        Matcher mDig = Pattern.compile("\\b(\\d{1,2})\\b").matcher(frase);
        while (mDig.find()) {
            int val = Integer.parseInt(mDig.group(1));
            if (val >= 1 && val <= 20) return val;
        }
        for (String w : frase.split("\\s+")) {
            if (NUMEROS_VOZ.containsKey(w)) return NUMEROS_VOZ.get(w);
        }
        return 1;
    }

    private String extraerTelefonoDeVoz(String raw, String cmdNorm) {
        StringBuilder sb = new StringBuilder();
        for (String tk : cmdNorm.replaceAll("[^a-z0-9\\s]", " ").trim().split("\\s+")) {
            if (tk.matches("\\d+")) sb.append(tk);
            else if (DIGITOS_TELEFONO.containsKey(tk)) sb.append(DIGITOS_TELEFONO.get(tk));
        }
        return sb.toString();
    }

    private String detectarMedioPago(String cmd) {
        if (contieneAlguno(cmd, "efectivo", "cash")) return "Efectivo";
        if (contieneAlguno(cmd, "transferencia", "banco")) return "Transferencia";
        if (contieneAlguno(cmd, "qr", "cu erre", "tarjeta", "webpay", "mercadopago")) return "MercadoPago";
        return null;
    }

    private List<Producto> obtenerCatalogoComercial(String sucursal) {
        if (productoRepository == null) return List.of();
        List<Producto> base = productoRepository.findBySucursal(sucursal);
        if (base == null || base.isEmpty()) base = productoRepository.findAll();
        return base.stream()
                .filter(p -> p.getNombre() != null && !p.getNombre().isBlank())
                .filter(p -> p.getCategoria() == null || !p.getCategoria().equalsIgnoreCase("Personalizado"))
                .toList();
    }

    private List<Insumo> obtenerInsumosArmaTuBatido(String sucursal) {
        if (insumoRepository == null) return List.of();
        List<Insumo> base = insumoRepository.findBySucursal(sucursal);
        if (base == null || base.isEmpty()) base = insumoRepository.findAll();
        return base.stream()
                .filter(i -> i.getCategoria() != null && (normalizar(i.getCategoria()).contains("arma") || normalizar(i.getCategoria()).contains("porcion")))
                .filter(i -> i.getUnidadActual() == null || i.getUnidadActual() > 0)
                .toList();
    }

    private long calcularPrecioPorcionInsumo(Insumo ins) {
        double base = (ins.getPrecioVenta() != null && ins.getPrecioVenta() > 0)
                ? ins.getPrecioVenta() : (ins.getPrecio() != null ? ins.getPrecio() : 1000.0);
        double dto = ins.getDescuento() != null ? Math.min(Math.max(0.0, ins.getDescuento()), 100.0) : 0.0;
        return Math.round(dto > 0 ? base * (1.0 - dto / 100.0) : base);
    }

    private long calcularPrecioFinal(Producto p) {
        if (p == null || p.getPrecio() == null) return 0;
        double base = p.getPrecio();
        double dto = p.getDescuento() != null ? Math.min(Math.max(0.0, p.getDescuento()), 100.0) : 0.0;
        return Math.round(dto > 0 ? base * (1.0 - dto / 100.0) : base);
    }

    private Map<String, Object> construirDtoProducto(Producto p) {
        Map<String, Object> map = new HashMap<>();
        double precioBase = p.getPrecio() != null ? p.getPrecio() : 0.0;
        double dto = p.getDescuento() != null ? Math.min(Math.max(0.0, p.getDescuento()), 100.0) : 0.0;
        map.put("id", p.getId());
        map.put("nombre", p.getNombre());
        map.put("precio", calcularPrecioFinal(p));
        map.put("precioOriginal", Math.round(precioBase));
        map.put("descuento", dto);
        map.put("categoria", p.getCategoria());
        map.put("imagen", p.getImagen());
        return map;
    }

    private Producto buscarPorNombreParcial(List<Producto> catalogo, String fragmentoNorm) {
        for (Producto p : catalogo) {
            if (p.getNombre() != null && normalizar(p.getNombre()).contains(fragmentoNorm)) return p;
        }
        return null;
    }

    private List<Map<String, Object>> leerCarritoCliente(JsonNode cartNode) {
        List<Map<String, Object>> lista = new ArrayList<>();
        if (cartNode != null && cartNode.isArray()) {
            for (JsonNode n : cartNode) {
                Map<String, Object> item = new HashMap<>();
                item.put("id", n.path("id").asText(""));
                item.put("nombre", n.path("nombre").asText("Producto"));
                item.put("precio", n.path("precio").asDouble(0));
                item.put("categoria", n.path("categoria").asText(""));
                lista.add(item);
            }
        }
        return lista;
    }

    private void sincronizarDatosClienteDesdeFrontend(SesionConversacion sesion, JsonNode customerNode) {
        if (customerNode == null || !customerNode.isObject()) return;
        String nom = customerNode.path("nombre").asText("").trim();
        String dir = customerNode.path("direccion").asText("").trim();
        String tel = customerNode.path("telefono").asText("").trim();
        if (!nom.isEmpty() && sesion.nombreCliente.isBlank()) sesion.nombreCliente = nom;
        if (!dir.isEmpty() && sesion.direccionCliente.isBlank()) sesion.direccionCliente = dir;
        if (!tel.isEmpty() && sesion.telefonoCliente.isBlank()) sesion.telefonoCliente = tel;
    }

    private long calcularTotalCarrito(List<Map<String, Object>> carrito) {
        long sum = 0;
        for (Map<String, Object> item : carrito) sum += leerPrecioMapa(item);
        return sum;
    }

    private long leerPrecioMapa(Map<String, Object> item) {
        Object p = item.get("precio");
        if (p instanceof Number num) return Math.round(num.doubleValue());
        try { return Math.round(Double.parseDouble(String.valueOf(p))); } catch (Exception e) { return 0; }
    }

    private boolean esPreguntaComoPagoOPagoQR(String cmd) {
        return contieneAlguno(cmd, "como pago", "como te pago", "con qr", "cu erre", "generame el qr");
    }

    private boolean esComandoDetenerConversacion(String cmd) {
        return cmd.equals("adios") || cmd.equals("chao") || cmd.equals("silencio") || cmd.equals("pausa");
    }

    private boolean esComandoVaciarCarrito(String cmd) {
        return cmd.contains("vaciar") || cmd.contains("borrar todo");
    }

    private boolean esComandoQuitarItem(String cmd) {
        return cmd.startsWith("quita ") || cmd.startsWith("saca ") || cmd.startsWith("elimina ");
    }

    private boolean esComandoIniciarCheckout(String cmd) {
        return contieneAlguno(cmd, "quiero pagar", "cerrar pedido", "cerrar venta", "eso es todo", "cobrame", "pagar");
    }

    private boolean esSolicitudCancelarCheckout(String cmd) {
        return contieneAlguno(cmd, "volver", "seguir comprando", "cancelar");
    }

    private boolean esAfirmacionDirecta(String cmd) {
        return cmd.equals("si") || cmd.equals("dale") || cmd.equals("de una") || cmd.equals("ok") || cmd.startsWith("si ");
    }

    private boolean esConfirmacionFinalVenta(String cmd) {
        return esAfirmacionDirecta(cmd) || contieneAlguno(cmd, "confirmar", "confirmo", "listo");
    }

    private boolean contieneAlguno(String texto, String... claves) {
        for (String c : claves) if (texto.contains(c)) return true;
        return false;
    }

    private boolean contieneTerminoFlexible(String frase, String termino) {
        if (termino.isEmpty()) return false;
        if (frase.contains(termino)) return true;
        return termino.endsWith("s") && termino.length() > 4 && frase.contains(termino.substring(0, termino.length() - 1));
    }

    private Map<String, Object> baseResponse(SesionConversacion sesion) {
        Map<String, Object> resp = new HashMap<>();
        resp.put("type", "ASSISTANT_MESSAGE");
        resp.put("state", "TALKING");
        resp.put("stage", sesion.etapa.name());
        resp.put("expectingReply", true);
        return resp;
    }

    private static String formatearPesos(long monto) {
        return "$" + String.format(Locale.forLanguageTag("es-CL"), "%,d", monto).replace(',', '.');
    }

    private static String unirConY(List<String> elems) {
        if (elems == null || elems.isEmpty()) return "";
        if (elems.size() == 1) return elems.get(0);
        if (elems.size() == 2) return elems.get(0) + " y " + elems.get(1);
        return String.join(", ", elems.subList(0, elems.size() - 1)) + " y " + elems.get(elems.size() - 1);
    }

    public static String normalizar(String s) {
        if (s == null) return "";
        return Normalizer.normalize(s, Normalizer.Form.NFD)
                .replaceAll("\\p{InCombiningDiacriticalMarks}+", "")
                .toLowerCase()
                .trim();
    }
}
