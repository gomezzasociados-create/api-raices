package com.gomezsystems.minierp.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.*;

@RestController
@RequestMapping("/api/media")
@CrossOrigin(origins = "*")
public class MediaUploadController {

    @Value("${media.upload.dir:uploads/media}")
    private String mediaUploadDir;

    private static final Set<String> EXTENSIONES_IMAGEN = Set.of(
            "jpg", "jpeg", "png", "webp", "gif", "svg", "avif"
    );

    private static final Set<String> EXTENSIONES_VIDEO = Set.of(
            "mp4", "webm", "mov", "m4v", "ogv"
    );

    @PostMapping("/subir")
    public ResponseEntity<?> subirMultimedia(@RequestParam("file") MultipartFile file) {
        if (file == null || file.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "El archivo proporcionado está vacío."));
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            originalFilename = "archivo_multimedia";
        }

        String extension = "";
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex >= 0) {
            extension = originalFilename.substring(dotIndex + 1).toLowerCase();
        }

        boolean esImagen = EXTENSIONES_IMAGEN.contains(extension);
        boolean esVideo = EXTENSIONES_VIDEO.contains(extension);

        if (!esImagen && !esVideo) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(Map.of(
                    "error", "Formato no permitido. Solo se aceptan imágenes (jpg, png, webp, gif, svg) o videos (mp4, webm, mov)."
            ));
        }

        try {
            Path targetDir = Paths.get(mediaUploadDir).toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                Files.createDirectories(targetDir);
            }

            // Generar nombre seguro, corto y único con timestamp para caché óptimo
            String baseLimpia = originalFilename.replaceAll("[^a-zA-Z0-9._-]", "_");
            String sufijoUnico = UUID.randomUUID().toString().substring(0, 6);
            String nombreFinal = System.currentTimeMillis() + "_" + sufijoUnico + "_" + baseLimpia;

            Path destino = targetDir.resolve(nombreFinal);
            Files.copy(file.getInputStream(), destino, StandardCopyOption.REPLACE_EXISTING);

            // URL pública relativa estándar para carga ultra rápida y caching en el cliente
            String urlPublica = "/uploads/media/" + nombreFinal;

            Map<String, Object> respuesta = new HashMap<>();
            respuesta.put("url", urlPublica);
            respuesta.put("nombre", nombreFinal);
            respuesta.put("tipo", esVideo ? "video" : "image");
            respuesta.put("tamano", file.getSize());
            respuesta.put("contentType", file.getContentType());

            System.out.println("✅ [MULTIMEDIA PÚBLICA] Archivo guardado: " + destino + " -> URL: " + urlPublica);
            return ResponseEntity.ok(respuesta);

        } catch (IOException e) {
            System.err.println("❌ Error al guardar archivo multimedia: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "No se pudo guardar el archivo: " + e.getMessage()));
        }
    }

    @GetMapping("/listar")
    public ResponseEntity<List<Map<String, Object>>> listarArchivos() {
        try {
            Path targetDir = Paths.get(mediaUploadDir).toAbsolutePath().normalize();
            if (!Files.exists(targetDir)) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            File[] files = targetDir.toFile().listFiles();
            if (files == null) {
                return ResponseEntity.ok(Collections.emptyList());
            }

            List<Map<String, Object>> lista = new ArrayList<>();
            for (File f : files) {
                if (f.isFile()) {
                    String ext = "";
                    int dot = f.getName().lastIndexOf('.');
                    if (dot >= 0) ext = f.getName().substring(dot + 1).toLowerCase();

                    Map<String, Object> item = new HashMap<>();
                    item.put("nombre", f.getName());
                    item.put("url", "/uploads/media/" + f.getName());
                    item.put("tipo", EXTENSIONES_VIDEO.contains(ext) ? "video" : "image");
                    item.put("tamano", f.length());
                    item.put("fechaModificacion", f.lastModified());
                    lista.add(item);
                }
            }
            // Ordenar más recientes primero
            lista.sort((a, b) -> Long.compare((Long) b.get("fechaModificacion"), (Long) a.get("fechaModificacion")));
            return ResponseEntity.ok(lista);

        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).build();
        }
    }
}
