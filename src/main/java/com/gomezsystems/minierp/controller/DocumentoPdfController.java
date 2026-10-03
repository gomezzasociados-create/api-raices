package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.DocumentoPdf;
import com.gomezsystems.minierp.repository.DocumentoPdfRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/documentos")
@CrossOrigin(origins = "*")
public class DocumentoPdfController {

    @Autowired
    private DocumentoPdfRepository documentoPdfRepository;

    @GetMapping
    public List<Map<String, Object>> listarDocumentos() {
        return documentoPdfRepository.listarCabeceras();
    }

    @GetMapping("/sucursal/{sucursal}")
    public List<Map<String, Object>> listarPorSucursal(@PathVariable String sucursal) {
        List<Map<String, Object>> lista = documentoPdfRepository.listarCabecerasPorSucursal(sucursal);
        if (lista.isEmpty()) {
            lista = documentoPdfRepository.listarCabeceras();
        }
        return lista;
    }

    @PostMapping("/subir")
    public ResponseEntity<String> subirDocumento(
            @RequestParam("file") MultipartFile file,
            @RequestParam(value = "nombre", required = false) String nombre,
            @RequestParam(value = "categoria", required = false) String categoria,
            @RequestParam(value = "sucursal", required = false) String sucursal) {

        if (file.isEmpty()) {
            return ResponseEntity.badRequest().body("El archivo proporcionado está vacío.");
        }

        try {
            DocumentoPdf doc = new DocumentoPdf();
            
            String nombreArchivo = (nombre != null && !nombre.trim().isEmpty()) 
                    ? nombre.trim() 
                    : file.getOriginalFilename();
            if (!nombreArchivo.toLowerCase().endsWith(".pdf")) {
                nombreArchivo += ".pdf";
            }

            doc.setNombre(nombreArchivo);
            doc.setCategoria(categoria != null && !categoria.trim().isEmpty() ? categoria.trim() : "Recetas");
            doc.setSucursal(sucursal != null && !sucursal.trim().isEmpty() ? sucursal.trim() : "Antofagasta");
            doc.setFechaSubida(LocalDateTime.now());
            doc.setTipoContenido(file.getContentType() != null ? file.getContentType() : "application/pdf");
            doc.setTamanoBytes(file.getSize());
            doc.setDatos(file.getBytes());

            documentoPdfRepository.save(doc);

            return ResponseEntity.ok("Documento '" + nombreArchivo + "' almacenado con éxito en la base de datos.");
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body("Error al guardar el archivo PDF: " + e.getMessage());
        }
    }

    @GetMapping("/{id}/ver")
    public ResponseEntity<byte[]> verPdf(@PathVariable Long id) {
        Optional<DocumentoPdf> docOpt = documentoPdfRepository.findById(id);
        if (docOpt.isPresent()) {
            DocumentoPdf doc = docOpt.get();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + doc.getNombre() + "\"");
            headers.setContentLength(doc.getDatos() != null ? doc.getDatos().length : 0);

            return new ResponseEntity<>(doc.getDatos(), headers, HttpStatus.OK);
        }
        return ResponseEntity.notFound().build();
    }

    @GetMapping("/{id}/descargar")
    public ResponseEntity<byte[]> descargarPdf(@PathVariable Long id) {
        Optional<DocumentoPdf> docOpt = documentoPdfRepository.findById(id);
        if (docOpt.isPresent()) {
            DocumentoPdf doc = docOpt.get();
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_PDF);
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + doc.getNombre() + "\"");
            headers.setContentLength(doc.getDatos() != null ? doc.getDatos().length : 0);

            return new ResponseEntity<>(doc.getDatos(), headers, HttpStatus.OK);
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> eliminarDocumento(@PathVariable Long id) {
        if (documentoPdfRepository.existsById(id)) {
            documentoPdfRepository.deleteById(id);
            return ResponseEntity.ok("Documento eliminado de la base de datos.");
        }
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body("Documento no encontrado.");
    }
}
