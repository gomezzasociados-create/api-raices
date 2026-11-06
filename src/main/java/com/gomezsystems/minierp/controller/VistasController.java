package com.gomezsystems.minierp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class VistasController {

    @GetMapping({"/", "/index", "/index.html"})
    public String index() {
        return "index";
    }

    @GetMapping({"/admin", "/admin.html"})
    public String admin() {
        return "admin";
    }

    @GetMapping({"/menu", "/menu.html"})
    public String menu() {
        return "menu";
    }
}
