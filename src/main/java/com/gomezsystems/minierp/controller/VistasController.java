package com.gomezsystems.minierp.controller;

import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class VistasController {

    @GetMapping("/index.html")
    public String index() {
        return "index";
    }

    @GetMapping("/admin.html")
    public String admin() {
        return "admin";
    }

    @GetMapping("/menu.html")
    public String menu() {
        return "menu";
    }
}