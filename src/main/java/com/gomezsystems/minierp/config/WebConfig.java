package com.gomezsystems.minierp.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.CacheControl;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import java.io.File;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.concurrent.TimeUnit;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    @Value("${media.upload.dir:uploads/media}")
    private String mediaUploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        Path uploadPath = Paths.get(mediaUploadDir).toAbsolutePath().normalize();
        File uploadFolder = uploadPath.toFile();
        if (!uploadFolder.exists()) {
            uploadFolder.mkdirs();
        }

        String location = uploadPath.toUri().toString();
        if (!location.endsWith("/")) {
            location += "/";
        }

        // Mapeo público de archivos estáticos (/uploads/media/**) con caché HTTP de 365 días
        // Soporta nativamente HTTP Range requests (206 Partial Content) para reproducción fluida de video
        registry.addResourceHandler("/uploads/media/**")
                .addResourceLocations(location)
                .setCacheControl(CacheControl.maxAge(365, TimeUnit.DAYS).cachePublic().immutable());

        // Mapeo de recursos estáticos del sistema (imágenes, CSS, JS, audio, video) con caché de 30 días
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/")
                .setCacheControl(CacheControl.maxAge(30, TimeUnit.DAYS).cachePublic());
    }

    @Override
    public void addInterceptors(org.springframework.web.servlet.config.annotation.InterceptorRegistry registry) {
        // Desactivar caché HTTP para TODOS los endpoints de la API (/api/**) y el Service Worker (/sw.js)
        // Garantiza que cualquier cambio realizado desde el ordenador o móvil se refleje inmediatamente en todos los dispositivos
        registry.addInterceptor(new org.springframework.web.servlet.HandlerInterceptor() {
            @Override
            public boolean preHandle(jakarta.servlet.http.HttpServletRequest request, jakarta.servlet.http.HttpServletResponse response, Object handler) {
                String uri = request.getRequestURI();
                if (uri.startsWith("/api/") || uri.endsWith("/sw.js")) {
                    response.setHeader("Cache-Control", "no-cache, no-store, max-age=0, must-revalidate");
                    response.setHeader("Pragma", "no-cache");
                    response.setHeader("Expires", "0");
                }
                return true;
            }
        });
    }
}
