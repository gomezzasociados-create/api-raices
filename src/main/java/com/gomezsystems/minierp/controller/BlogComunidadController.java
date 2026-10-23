package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.ArticuloBlog;
import com.gomezsystems.minierp.model.ComentarioComunidad;
import com.gomezsystems.minierp.repository.ArticuloBlogRepository;
import com.gomezsystems.minierp.repository.ComentarioComunidadRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/blog")
@CrossOrigin(origins = "*")
public class BlogComunidadController {

    private final ArticuloBlogRepository articuloRepository;
    private final ComentarioComunidadRepository comentarioRepository;

    public BlogComunidadController(ArticuloBlogRepository articuloRepository,
                                   ComentarioComunidadRepository comentarioRepository) {
        this.articuloRepository = articuloRepository;
        this.comentarioRepository = comentarioRepository;
    }

    // ==========================================
    // ENDPOINTS DE ARTÍCULOS DE BLOG
    // ==========================================

    @GetMapping("/articulos")
    public List<ArticuloBlog> listarArticulos() {
        return articuloRepository.findAllByOrderByFechaCreacionDesc();
    }

    @GetMapping("/articulos/{id}")
    public ResponseEntity<ArticuloBlog> obtenerArticulo(@PathVariable Long id) {
        return articuloRepository.findById(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/articulos")
    public ArticuloBlog guardarArticulo(@RequestBody ArticuloBlog articulo) {
        if (articulo.getFechaCreacion() == null) {
            articulo.setFechaCreacion(LocalDateTime.now());
        }
        if (articulo.getLikes() == null) {
            articulo.setLikes(0);
        }
        if (articulo.getFijado() == null) {
            articulo.setFijado(false);
        }
        return articuloRepository.save(articulo);
    }

    @DeleteMapping("/articulos/{id}")
    public ResponseEntity<?> eliminarArticulo(@PathVariable Long id) {
        if (articuloRepository.existsById(id)) {
            articuloRepository.deleteById(id);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("mensaje", "Artículo eliminado correctamente");
            return ResponseEntity.ok(resp);
        }
        return ResponseEntity.notFound().build();
    }

    @PostMapping("/articulos/{id}/like")
    public ResponseEntity<?> likeArticulo(@PathVariable Long id) {
        return articuloRepository.findById(id).map(art -> {
            art.setLikes(art.getLikes() + 1);
            articuloRepository.save(art);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("likes", art.getLikes());
            return ResponseEntity.ok(resp);
        }).orElse(ResponseEntity.notFound().build());
    }

    // ==========================================
    // ENDPOINTS DE COMENTARIOS, SUGERENCIAS Y PETICIONES
    // ==========================================

    @GetMapping("/comentarios")
    public List<ComentarioComunidad> listarComentarios(@RequestParam(required = false) Long articuloId,
                                                       @RequestParam(required = false) String tipo) {
        List<ComentarioComunidad> lista;
        if (articuloId != null && articuloId > 0) {
            lista = comentarioRepository.findByArticuloIdAndActivoTrueOrderByFechaDesc(articuloId);
        } else {
            lista = comentarioRepository.findByActivoTrueOrderByFechaDesc();
        }

        if (tipo != null && !tipo.isBlank() && !tipo.equalsIgnoreCase("TODOS")) {
            final String tipoFiltro = tipo.trim().toUpperCase();
            lista = lista.stream().filter(c -> tipoFiltro.equalsIgnoreCase(c.getTipo())).toList();
        }
        return lista;
    }

    @PostMapping("/comentarios")
    public ResponseEntity<ComentarioComunidad> guardarComentario(@RequestBody ComentarioComunidad comentario) {
        if (comentario.getMensaje() == null || comentario.getMensaje().trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }
        if (comentario.getNombre() == null || comentario.getNombre().trim().isEmpty()) {
            comentario.setNombre("Explorador RAÍCES");
        }
        if (comentario.getTipo() == null || comentario.getTipo().trim().isEmpty()) {
            comentario.setTipo("COMENTARIO");
        } else {
            comentario.setTipo(comentario.getTipo().trim().toUpperCase());
        }
        comentario.setFecha(LocalDateTime.now());
        comentario.setLikes(0);
        comentario.setActivo(true);
        ComentarioComunidad guardado = comentarioRepository.save(comentario);
        return ResponseEntity.ok(guardado);
    }

    @PostMapping("/comentarios/{id}/like")
    public ResponseEntity<?> likeComentario(@PathVariable Long id) {
        return comentarioRepository.findById(id).map(com -> {
            com.setLikes(com.getLikes() + 1);
            comentarioRepository.save(com);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("likes", com.getLikes());
            return ResponseEntity.ok(resp);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/comentarios/{id}")
    public ResponseEntity<?> eliminarComentario(@PathVariable Long id) {
        return comentarioRepository.findById(id).map(com -> {
            com.setActivo(false); // Eliminación suave (soft-delete)
            comentarioRepository.save(com);
            Map<String, Object> resp = new HashMap<>();
            resp.put("success", true);
            resp.put("mensaje", "Comentario eliminado");
            return ResponseEntity.ok(resp);
        }).orElse(ResponseEntity.notFound().build());
    }
}
