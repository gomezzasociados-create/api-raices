package com.gomezsystems.minierp.controller;

import com.gomezsystems.minierp.model.Cliente;
import com.gomezsystems.minierp.repository.ClienteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;

@RestController
@RequestMapping("/api/clientes")
@CrossOrigin(origins = "*")
public class ClienteController {

    @Autowired private ClienteRepository clienteRepository;

    @GetMapping
    public List<Cliente> listarTodos() {
        return clienteRepository.findAll();
    }

    @GetMapping("/nodo/{nodo}")
    public List<Cliente> listarPorNodo(@PathVariable String nodo) {
        return clienteRepository.findByNodo(nodo);
    }

    @PostMapping
    public Cliente guardarCliente(@RequestBody Cliente cliente) {
        return clienteRepository.save(cliente);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Cliente> actualizarCliente(@PathVariable Long id, @RequestBody Cliente datosActualizados) {
        Optional<Cliente> opt = clienteRepository.findById(id);
        if (opt.isPresent()) {
            Cliente existente = opt.get();
            if (datosActualizados.getNombre() != null) existente.setNombre(datosActualizados.getNombre());
            if (datosActualizados.getTelefono() != null) existente.setTelefono(datosActualizados.getTelefono());
            if (datosActualizados.getDireccion() != null) existente.setDireccion(datosActualizados.getDireccion());
            if (datosActualizados.getNodo() != null) existente.setNodo(datosActualizados.getNodo());
            if (datosActualizados.getCorreo() != null) existente.setCorreo(datosActualizados.getCorreo());
            if (datosActualizados.getCumpleanos() != null) existente.setCumpleanos(datosActualizados.getCumpleanos());
            if (datosActualizados.getPuntosFidelizacion() != null) existente.setPuntosFidelizacion(datosActualizados.getPuntosFidelizacion());
            return ResponseEntity.ok(clienteRepository.save(existente));
        }
        return ResponseEntity.notFound().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<String> eliminarCliente(@PathVariable Long id) {
        if (clienteRepository.existsById(id)) {
            clienteRepository.deleteById(id);
            return ResponseEntity.ok("Cliente eliminado.");
        }
        return ResponseEntity.notFound().build();
    }
}
