package com.gomezsystems.minierp.service;

import com.gomezsystems.minierp.model.Producto;
import com.gomezsystems.minierp.repository.ProductoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

import com.gomezsystems.minierp.repository.InsumoRepository;

import com.gomezsystems.minierp.model.Insumo;
import java.util.List;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ProductoRepository repository;
    private final InsumoRepository insumoRepository;

    public DataInitializer(ProductoRepository repository, InsumoRepository insumoRepository) {
        this.repository = repository;
        this.insumoRepository = insumoRepository;
    }

    @Override
    public void run(String... args) {

        // MIGRAR PRODUCTOS EXISTENTES A ANTOFAGASTA Y CONVERTIR BOTÁNICO ANIMAL A SHOTS
        if (repository.count() > 0) {
            List<Producto> existentes = repository.findAll();
            for (Producto p : existentes) {
                boolean mod = false;
                if (p.getSucursal() == null || p.getSucursal().isEmpty() || !p.getSucursal().equals("Antofagasta")) {
                    p.setSucursal("Antofagasta");
                    mod = true;
                }
                if (p.getCategoria() != null && (p.getCategoria().toLowerCase().contains("botanico") || p.getCategoria().toLowerCase().contains("animal"))) {
                    p.setCategoria("Shots");
                    mod = true;
                }
                if (mod) repository.save(p);
            }
        }

        if (repository.count() == 0 || repository.findBySucursal("Antofagasta").isEmpty()) {

            // SUCURSAL ÚNICA: ANTOFAGASTA
            String[] sucursales = {"Antofagasta"};

            for (String sede : sucursales) {

                double precioBatido = 3500.0;
                double precioPulpa = 22000.0;

                // ==========================================
                // 🥤 1. BATIDOS ORIGINALES (500 mls)
                // ==========================================
                Producto p1 = new Producto();
                p1.setNombre("Green Detox");
                p1.setPrecio(precioBatido);
                p1.setCategoria("500 mls");
                p1.setSucursal(sede); // <--- ETIQUETA AUTOMÁTICA
                p1.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/vfleIZ0C3qCqps6UZvJi/pub/XhijMbEh1XqgPLr7zRhs.jpg");
                p1.setDescripcion("🥬 Batido Green Détox 🌱✨\nCombina ingredientes verdes y frutales que trabajan en conjunto para depurar, desinflamar y revitalizar el organismo. Su mezcla de fibra, clorofila, enzimas digestivas y antioxidantes lo convierte en un aliado ideal para quienes buscan limpieza interna y energía ligera.\n\n🥑 Ingredientes y beneficios:\n• Espinaca: Rica en clorofila, ayuda a eliminar toxinas, oxigena la sangre y aporta hierro y vitaminas A y C. Favorece la energía y la salud celular.\n• Apio: Potente diurético natural que reduce la retención de líquidos, limpia el sistema digestivo y aporta minerales alcalinos que equilibran el cuerpo.\n• Piña: Alta en bromelina, facilita la digestión, reduce la inflamación y aporta un sabor fresco y naturalmente dulce.\n• Aloe vera: Contribuye a la salud digestiva, calma el sistema gastrointestinal y apoya la depuración natural del organismo.\n• Chía: Fuente de fibra y omega-3 vegetales que mejoran la digestión, aportan saciedad y estabilizan la energía.\n• Stevia: Endulzante natural sin calorías que realza el sabor sin afectar el equilibrio metabólico.\n\n🌟 Ideal para:\n• 🔄 Depuración\n• 🍃 Digestión ligera\n• 💧 Reducción de inflamación\n• ⚡ Energía natural\n• 🌞 Bienestar diario");
                repository.save(p1);

                Producto p2 = new Producto();
                p2.setNombre("Desparasitante");
                p2.setPrecio(precioBatido);
                p2.setCategoria("500 mls");
                p2.setSucursal(sede);
                p2.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/vfleIZ0C3qCqps6UZvJi/pub/SUajizyFozHkVBp5Omh3.jpg");
                p2.setDescripcion("🥕 Batido Desparasitante 🌿✨\nCombina ingredientes naturales con propiedades digestivas, antiinflamatorias y depurativas que ayudan a limpiar el organismo de forma suave pero efectiva. Su mezcla de fibra, aceites esenciales y compuestos bioactivos favorece el equilibrio intestinal y el bienestar general.\n\n🌱 Ingredientes y beneficios:\n• Zanahoria: Rica en fibra y betacarotenos, apoya la salud intestinal, fortalece el sistema inmune y contribuye a una digestión más eficiente.\n• Aceite de coco: Contiene ácido láurico, reconocido por sus propiedades antimicrobianas y antiparasitarias naturales. Aporta energía limpia y favorece el equilibrio digestivo.\n• Clavo de olor: Potente especia con propiedades antiparasitarias, antioxidantes y antiinflamatorias. Ayuda a limpiar el tracto digestivo y a reducir molestias intestinales.\n• Apio: Diurético natural que ayuda a eliminar líquidos retenidos, depurar el sistema digestivo y aportar minerales alcalinos.\n• Limón: Rico en vitamina C y antioxidantes, apoya la desintoxicación hepática, mejora la digestión y aporta frescura natural.\n• Stevia: Endulzante natural sin calorías que realza el sabor sin afectar el equilibrio metabólico.\n\n🌟 Ideal para:\n• 🌀 Limpieza digestiva\n• 🛡️ Apoyo antiparasitario natural\n• 💧 Reducción de inflamación\n• 🌱 Bienestar intestinal");
                repository.save(p2);

                Producto p3 = new Producto();
                p3.setNombre("Cardio");
                p3.setPrecio(precioBatido);
                p3.setCategoria("500 mls");
                p3.setSucursal(sede);
                p3.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/vfleIZ0C3qCqps6UZvJi/pub/31wBwqSf8YTV8nGCOM9L.jpg");
                p3.setDescripcion("❤️ Batido Cardio 🍎🥑\nCombina ingredientes naturales ricos en antioxidantes, grasas saludables y compuestos bioactivos que favorecen la salud cardiovascular, la energía sostenida y el bienestar integral. Su mezcla de fibra, vitaminas y aceites esenciales ayuda a fortalecer el corazón y mejorar la circulación.\n\n🌱 Ingredientes y beneficios:\n• Betarraga: Fuente de nitratos naturales que mejoran la circulación sanguínea, aportan antioxidantes y apoyan la salud del corazón.\n• Manzana roja: Rica en fibra y polifenoles, ayuda a regular el colesterol, favorece la digestión y aporta dulzura natural.\n• Nuez: Contiene omega-3 y grasas saludables que protegen el sistema cardiovascular, reducen la inflamación y aportan energía sostenida.\n• Palta (aguacate): Excelente fuente de grasas monoinsaturadas, potasio y vitamina E. Favorece la salud arterial y aporta cremosidad natural.\n• Canela: Especia antioxidante que ayuda a regular los niveles de azúcar en sangre y aporta un toque cálido y aromático.\n• Stevia: Endulzante natural sin calorías que realza el sabor sin afectar el equilibrio metabólico.\n\n🌟 Ideal para:\n• ❤️ Fortalecer el corazón\n• 🔄 Mejorar la circulación\n• 💧 Reducir la inflamación\n• ⚡ Energía limpia y sostenida\n• 🌱 Bienestar diario");
                repository.save(p3);

                Producto p4 = new Producto();
                p4.setNombre("Quelante");
                p4.setPrecio(precioBatido);
                p4.setCategoria("500 mls");
                p4.setSucursal(sede);
                p4.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/vfleIZ0C3qCqps6UZvJi/pub/yfts77kUJ1A7faD1rdlz.jpg");
                p4.setDescripcion("🍏 Batido Quelante 🌿✨\nDiseñado para apoyar la eliminación de metales pesados y toxinas del organismo mediante ingredientes ricos en clorofila, antioxidantes y compuestos depurativos. Su mezcla verde y fresca favorece la limpieza interna, la energía celular y el equilibrio metabólico.\n\n🌱 Ingredientes y beneficios:\n• Espirulina: Superalga rica en clorofila, proteínas y antioxidantes. Conocida por su capacidad quelante natural, ayuda a capturar y eliminar metales pesados mientras aporta energía y vitalidad.\n• Cilantro: Potente depurador natural que apoya la eliminación de toxinas y metales pesados. Favorece la digestión y aporta un perfil antioxidante elevado.\n• Manzana verde: Rica en fibra y antioxidantes, mejora la digestión, regula el tránsito intestinal y aporta un sabor fresco y equilibrado.\n• Limón: Alto en vitamina C, apoya la desintoxicación hepática, mejora la digestión y potencia la acción depurativa del batido.\n• Acelga: Fuente de clorofila, fibra y minerales esenciales. Ayuda a oxigenar la sangre, mejorar la digestión y apoyar la limpieza interna.\n• Stevia: Endulzante natural sin calorías que realza el sabor sin afectar el equilibrio metabólico.\n\n🌟 Ideal para:\n• 🔄 Depuración profunda\n• 🧲 Eliminación de metales pesados\n• ⚡ Energía celular\n• 🌱 Bienestar digestivo");
                repository.save(p4);

                Producto p5 = new Producto();
                p5.setNombre("Gainer");
                p5.setPrecio(precioBatido);
                p5.setCategoria("500 mls");
                p5.setSucursal(sede);
                p5.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/vfleIZ0C3qCqps6UZvJi/pub/l3SS7cp87gX0NFW6lDhv.jpg");
                p5.setDescripcion("💪🏽 Batido Gainer ⚡🥜\nDiseñado para aportar energía densa, calorías de calidad y nutrientes que favorecen el aumento de masa muscular, la recuperación y la saciedad prolongada. Su combinación de carbohidratos complejos, proteínas naturales y grasas saludables lo convierte en un batido ideal para deportistas, personas con alto gasto energético o quienes buscan subir de peso de forma saludable.\n\n🌱 Ingredientes y beneficios:\n• Mandioca: Fuente de carbohidratos complejos que entregan energía sostenida. Aporta fibra y minerales que favorecen la digestión y el rendimiento físico.\n• Maca: Adaptógeno natural que mejora la energía, la resistencia y el equilibrio hormonal. Apoya la recuperación muscular y el bienestar general.\n• Leche de vaca: Aporta proteínas completas, calcio y grasas naturales que favorecen la construcción muscular y la recuperación.\n• Cereales: Ricos en carbohidratos, fibra y micronutrientes. Ayudan a mantener energía estable y aportan densidad calórica saludable.\n• Mantequilla de maní: Alta en grasas saludables, proteínas y antioxidantes. Aumenta la saciedad, mejora la energía y apoya el desarrollo muscular.\n• Stevia: Endulzante natural sin calorías que realza el sabor sin afectar el equilibrio metabólico.\n\n🌟 Ideal para:\n• 💪 Aumento de masa muscular\n• 🔄 Recuperación post-entrenamiento\n• ⚡ Energía sostenida\n• 📈 Aumento de peso saludable");
                repository.save(p5);

                Producto p6 = new Producto();
                p6.setNombre("Granola Vital");
                p6.setPrecio(precioBatido);
                p6.setCategoria("500 mls");
                p6.setSucursal(sede);
                p6.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/AbxpIdqJveajud3o919w/pub/jZbEbfUaOcM42XpdueRQ.png");
                p6.setDescripcion("🥣 Granola Vital 🌾\nMezcla nutritiva elaborada con avena integral, semillas y frutos secos para una saciedad prolongada y energía estable durante el día.\n\n🌱 Ingredientes:\n• Avena integral\n• Semillas mixtas (chía, linaza)\n• Frutos secos y miel\n\n🌟 Ideal para acompañar tus batidos o disfrutar como snack saludable.");
                repository.save(p6);

                Producto p7 = new Producto();
                p7.setNombre("Dark defence");
                p7.setPrecio(precioBatido);
                p7.setCategoria("500 mls");
                p7.setSucursal(sede);
                p7.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/AbxpIdqJveajud3o919w/pub/GtgIowHLxsTlY7nM4kVM.png");
                p7.setDescripcion("🛡️ Dark Defence 🌑\nPotente escudo antioxidante para fortalecer las defensas naturales del organismo, a base de superalimentos de tonos oscuros.\n\n🌱 Beneficios:\n• Refuerza el sistema inmunológico.\n• Combate los radicales libres.\n• Aporta energía y vitalidad extrema.");
                repository.save(p7);

                Producto p8 = new Producto();
                p8.setNombre("Purple Detox");
                p8.setPrecio(precioBatido);
                p8.setCategoria("500 mls");
                p8.setSucursal(sede);
                p8.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/AbxpIdqJveajud3o919w/pub/jZW2MAqB50DKyaoo9yBR.png");
                p8.setDescripcion("💜 Purple Detox 🍇\nDepuración profunda con el poder de frutos rojos y morados para la regeneración celular y la salud de la piel.\n\n🌱 Beneficios:\n• Alto en vitamina C y antioxidantes.\n• Retrasa el envejecimiento celular.\n• Mejora la digestión y circulación.");
                repository.save(p8);

                Producto p9 = new Producto();
                p9.setNombre("Dark Detox");
                p9.setPrecio(precioBatido);
                p9.setCategoria("500 mls");
                p9.setSucursal(sede);
                p9.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/vfleIZ0C3qCqps6UZvJi/pub/xKHjw8h7cSAlUV6o7Ebg.jpg");
                p9.setDescripcion("🖤 Dark Detox 🌿\nLimpieza celular intensa y eliminación de toxinas acumuladas para un metabolismo ágil.\n\n🌱 Beneficios:\n• Acelera la desintoxicación profunda.\n• Promueve un hígado saludable.\n• Ligereza instantánea.");
                repository.save(p9);

                // ==========================================
                // 📦 2. PULPAS NUEVAS (Packs)
                // ==========================================
                Producto p10 = new Producto();
                p10.setNombre("Pulpas Detox");
                p10.setPrecio(precioPulpa);
                p10.setCategoria("Packs");
                p10.setSucursal(sede);
                p10.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/AbxpIdqJveajud3o919w/pub/4lg7wIH6tZwDfMgC6oSg.png");
                p10.setDescripcion("🥬 Pulpas Detox 🌱✨\nLas pulpas Detox combinan ingredientes verdes y frutales que trabajan en conjunto para depurar, desinflamar y revitalizar el organismo. Su mezcla de fibra, clorofila, enzimas digestivas y antioxidantes lo convierte en un aliado ideal para quienes buscan limpieza interna y energía ligera.\n\n🥑 Ingredientes y beneficios:\n• Espinaca: Rica en clorofila, ayuda a eliminar toxinas, oxigena la sangre y aporta hierro y vitaminas A y C. Favorece la energía y la salud celular.\n• Apio: Potente diurético natural que reduce la retención de líquidos, limpia el sistema digestivo y aporta minerales alcalinos que equilibran el cuerpo.\n• Piña: Alta en bromelina, facilita la digestión, reduce la inflamación y aporta un sabor fresco y naturalmente dulce.\n• Aloe vera: Contribuye a la salud digestiva, calma el sistema gastrointestinal y apoya la depuración natural del organismo.\n• Chía: Fuente de fibra y omega-3 vegetales que mejoran la digestión, aportan saciedad y estabilizan la energía.\n• Stevia: Endulzante natural sin calorías que realza el sabor sin afectar el equilibrio metabólico.\n\n🌟 Ideal para:\n• 🔄 Depuración\n• 🍃 Digestión ligera\n• 💧 Reducción de inflamación\n• ⚡ Energía natural\n• 🌞 Bienestar diario");
                repository.save(p10);

                Producto p11 = new Producto();
                p11.setNombre("Pulpas Desparasitantes");
                p11.setPrecio(precioPulpa);
                p11.setCategoria("Packs");
                p11.setSucursal(sede);
                p11.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/AbxpIdqJveajud3o919w/pub/sFz8bbNOoLw8cslxxf7F.png");
                p11.setDescripcion("🥕 Pulpas Desparasitantes 🌿✨\nLas pulpas Desparasitantes combinan ingredientes naturales con propiedades digestivas, antiinflamatorias y depurativas que ayudan a limpiar el organismo de forma suave pero efectiva. Su mezcla de fibra, aceites esenciales y compuestos bioactivos favorece el equilibrio intestinal y el bienestar general.\n\n🌱 Ingredientes y beneficios:\n• Zanahoria: Rica en fibra y betacarotenos, apoya la salud intestinal, fortalece el sistema inmune y contribuye a una digestión más eficiente.\n• Aceite de coco: Contiene ácido láurico, reconocido por sus propiedades antimicrobianas y antiparasitarias naturales. Aporta energía limpia y favorece el equilibrio digestivo.\n• Clavo de olor: Potente especia con propiedades antiparasitarias, antioxidantes y antiinflamatorias. Ayuda a limpiar el tracto digestivo y a reducir molestias intestinales.\n• Apio: Diurético natural que ayuda a eliminar líquidos retenidos, depurar el sistema digestivo y aportar minerales alcalinos.\n• Limón: Rico en vitamina C y antioxidantes, apoya la desintoxicación hepática, mejora la digestión y aporta frescura natural.\n• Stevia: Endulzante natural sin calorías que realza el sabor sin afectar el equilibrio metabólico.\n\n🌟 Ideal para:\n• 🌀 Limpieza digestiva\n• 🛡️ Apoyo antiparasitario natural\n• 💧 Reducción de inflamación\n• 🌱 Bienestar intestinal");
                repository.save(p11);

                Producto p12 = new Producto();
                p12.setNombre("Pulpas Cardio");
                p12.setPrecio(precioPulpa);
                p12.setCategoria("Packs");
                p12.setSucursal(sede);
                p12.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/AbxpIdqJveajud3o919w/pub/IjfjVjkuzHbwGO0g6KvN.png");
                p12.setDescripcion("❤️ Pulpas Cardio 🍎🥑\nLas pulpas Cardio combinan ingredientes naturales ricos en antioxidantes, grasas saludables y compuestos bioactivos que favorecen la salud cardiovascular, la energía sostenida y el bienestar integral. Su mezcla de fibra, vitaminas y aceites esenciales ayuda a fortalecer el corazón y mejorar la circulación.\n\n🌱 Ingredientes y beneficios:\n• Betarraga: Fuente de nitratos naturales que mejoran la circulación sanguínea, aportan antioxidantes y apoyan la salud del corazón.\n• Manzana roja: Rica en fibra y polifenoles, ayuda a regular el colesterol, favorece la digestión y aporta dulzura natural.\n• Nuez: Contiene omega-3 y grasas saludables que protegen el sistema cardiovascular, reducen la inflamación y aportan energía sostenida.\n• Palta (aguacate): Excelente fuente de grasas monoinsaturadas, potasio y vitamina E. Favorece la salud arterial y aporta cremosidad natural.\n• Canela: Especia antioxidante que ayuda a regular los niveles de azúcar en sangre y aporta un toque cálido y aromático.\n• Stevia: Endulzante natural sin calorías que realza el sabor sin afectar el equilibrio metabólico.\n\n🌟 Ideal para:\n• ❤️ Fortalecer el corazón\n• 🔄 Mejorar la circulación\n• 💧 Reducir la inflamación\n• ⚡ Energía limpia y sostenida\n• 🌱 Bienestar diario");
                repository.save(p12);

                Producto p13 = new Producto();
                p13.setNombre("Pulpas Gainer");
                p13.setPrecio(precioPulpa);
                p13.setCategoria("Packs");
                p13.setSucursal(sede);
                p13.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/AbxpIdqJveajud3o919w/pub/0ZOQG7qfy7AVsSmByjsW.png");
                p13.setDescripcion("💪🏽 Pulpas Gainer ⚡🥜\nLas pulpas Gainer están diseñadas para aportar energía densa, calorías de calidad y nutrientes que favorecen el aumento de masa muscular, la recuperación y la saciedad prolongada. Su combinación de carbohidratos complejos, proteínas naturales y grasas saludables lo convierte en un batido ideal para deportistas, personas con alto gasto energético o quienes buscan subir de peso de forma saludable.\n\n🌱 Ingredientes y beneficios:\n• Mandioca: Fuente de carbohidratos complejos que entregan energía sostenida. Aporta fibra y minerales que favorecen la digestión y el rendimiento físico.\n• Maca: Adaptógeno natural que mejora la energía, la resistencia y el equilibrio hormonal. Apoya la recuperación muscular y el bienestar general.\n• Leche de vaca: Aporta proteínas completas, calcio y grasas naturales que favorecen la construcción muscular y la recuperación.\n• Cereales: Ricos en carbohidratos, fibra y micronutrientes. Ayudan a mantener energía estable y aportan densidad calórica saludable.\n• Mantequilla de maní: Alta en grasas saludables, proteínas y antioxidantes. Aumenta la saciedad, mejora la energía y apoya el desarrollo muscular.\n• Stevia: Endulzante natural sin calorías que realza el sabor sin afectar el equilibrio metabólico.\n\n🌟 Ideal para:\n• 💪 Aumento de masa muscular\n• 🔄 Recuperación post-entrenamiento\n• ⚡ Energía sostenida\n• 📈 Aumento de peso saludable");
                repository.save(p13);

                Producto p14 = new Producto();
                p14.setNombre("Pulpas Quelantes");
                p14.setPrecio(precioPulpa);
                p14.setCategoria("Packs");
                p14.setSucursal(sede);
                p14.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/AbxpIdqJveajud3o919w/pub/dXqark4Swgtdyyuk9Gca.png");
                p14.setDescripcion("🍏 Pulpas Quelantes 🌿✨\nLas pulpas Quelantes están diseñadas para apoyar la eliminación de metales pesados y toxinas del organismo mediante ingredientes ricos en clorofila, antioxidantes y compuestos depurativos. Su mezcla verde y fresca favorece la limpieza interna, la energía celular y el equilibrio metabólico.\n\n🌟 Ideal para:\n• 🔄 Depuración profunda\n• 🧲 Eliminación de metales pesados\n• ⚡ Energía celular\n• 🌱 Bienestar digestivo");
                repository.save(p14);

                // ==========================================
                // ⚡ 3. SHOTS
                // ==========================================
                double precioShot = 2500.0;

                Producto p15 = new Producto();
                p15.setNombre("Shot Ginger Detox");
                p15.setPrecio(precioShot);
                p15.setCategoria("Shots");
                p15.setSucursal(sede);
                p15.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/vfleIZ0C3qCqps6UZvJi/pub/SUajizyFozHkVBp5Omh3.jpg");
                p15.setDescripcion("⚡ Shot Ginger Detox 🍋🔥\nConcentrado funcional de Jengibre, Limón y Pimienta Cayena para activar el metabolismo, desinflamar y subir las defensas al instante.\n\n🌟 Beneficios:\n• Impulso energético inmediato.\n• Estimula la digestión y quema calórica.\n• Potente antiinflamatorio.");
                p15.setRecetaDetalle("Limón:20\nAceite de Coco:10");
                repository.save(p15);

                Producto p16 = new Producto();
                p16.setNombre("Shot Cúrcuma & Inmunidad");
                p16.setPrecio(precioShot);
                p16.setCategoria("Shots");
                p16.setSucursal(sede);
                p16.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/vfleIZ0C3qCqps6UZvJi/pub/XhijMbEh1XqgPLr7zRhs.jpg");
                p16.setDescripcion("🛡️ Shot Cúrcuma & Inmunidad 💥✨\nExtracto concentrado de Cúrcuma orgánica, Naranja, Pimienta Negra y Aceite de Coco. Diseñado para reforzar el sistema inmune y combatir radicales libres.\n\n🌟 Beneficios:\n• Escudo antioxidante celular.\n• Apoyo articular e inmunológico.\n• Absorción maximizada con piperina.");
                p16.setRecetaDetalle("Limón:20\nAceite de Coco:10");
                repository.save(p16);

                Producto p17 = new Producto();
                p17.setNombre("Shot Antiox Berries");
                p17.setPrecio(precioShot);
                p17.setCategoria("Shots");
                p17.setSucursal(sede);
                p17.setImagen("https://storage.googleapis.com/glide-prod.appspot.com/uploads-v2/AbxpIdqJveajud3o919w/pub/jZW2MAqB50DKyaoo9yBR.png");
                p17.setDescripcion("🍇 Shot Antiox Berries 💜⚡\nShot concentrado de Maqui, Arándanos, Granada y Vitamina C para rejuvenecer las células y activar la mente.\n\n🌟 Beneficios:\n• Alto en polifenoles y antocianinas.\n• Protección antiedad.\n• Sabor ácido y revitalizante.");
                p17.setRecetaDetalle("Betarraga:30\nLimón:10");
                repository.save(p17);

            }

            System.out.println(">> GÓMEZ SYSTEMS: ¡Base de datos iniciada con todos los batidos y Shots para Antofagasta!");
        } else {
            System.out.println(">> GÓMEZ SYSTEMS: Los productos ya existen, saltando inicialización para proteger tus ventas.");
        }

        // MIGRAR INSUMOS EXISTENTES A ANTOFAGASTA Y ASIGNAR SUBCATEGORÍAS
        if (insumoRepository.count() > 0) {
            List<Insumo> existentesInsumos = insumoRepository.findAll();
            for (Insumo ins : existentesInsumos) {
                boolean mod = false;
                if (ins.getSucursal() == null || ins.getSucursal().isEmpty() || !ins.getSucursal().equals("Antofagasta")) {
                    ins.setSucursal("Antofagasta");
                    mod = true;
                }
                if (ins.getCantidadPorcion() == null || ins.getCantidadPorcion() <= 0) {
                    ins.setCantidadPorcion("und".equalsIgnoreCase(ins.getMedida()) ? 1 : 50);
                    mod = true;
                }
                if (ins.getUnidadActual() == null) {
                    ins.setUnidadActual(1000.0);
                    mod = true;
                }
                if (ins.getSubcategoria() == null || ins.getSubcategoria().isEmpty()) {
                    String nom = ins.getNombre() != null ? ins.getNombre().toLowerCase() : "";
                    if (nom.contains("leche") || nom.contains("agua") || nom.contains("aloe") || nom.contains("base")) ins.setSubcategoria("Base");
                    else if (nom.contains("chía") || nom.contains("chia") || nom.contains("linaza") || nom.contains("semilla")) ins.setSubcategoria("Semillas");
                    else if (nom.contains("piña") || nom.contains("pina") || nom.contains("manzana") || nom.contains("limón") || nom.contains("limon") || nom.contains("betarraga") || nom.contains("frut")) ins.setSubcategoria("Frutas");
                    else if (nom.contains("espinaca") || nom.contains("apio") || nom.contains("zanahoria") || nom.contains("acelga") || nom.contains("pepino")) ins.setSubcategoria("Vegetales");
                    else if (nom.contains("canela") || nom.contains("jengibre") || nom.contains("cúrcuma") || nom.contains("curcuma") || nom.contains("pimienta") || nom.contains("clavo")) ins.setSubcategoria("Especias");
                    else if (nom.contains("stevia") || nom.contains("estevia") || nom.contains("miel") || nom.contains("agave") || nom.contains("azúcar") || nom.contains("azucar")) ins.setSubcategoria("Endulzantes");
                    else if (nom.contains("goma") || nom.contains("xantana") || nom.contains("pectina") || nom.contains("agar")) ins.setSubcategoria("Estabilizantes");
                    else if (nom.contains("palta") || nom.contains("mantequilla") || nom.contains("cacao")) ins.setSubcategoria("Grasas");
                    else if (nom.contains("whey") || nom.contains("proteina") || nom.contains("proteína")) ins.setSubcategoria("Proteínas");
                    else if (nom.contains("avena") || nom.contains("quinoa") || nom.contains("quinua") || nom.contains("arroz") || nom.contains("mandioca")) ins.setSubcategoria("Cereales");
                    else if (nom.contains("espirulina") || nom.contains("maca") || nom.contains("aceite") || nom.contains("colágeno")) ins.setSubcategoria("Suplementos");
                    else if (nom.contains("maní") || nom.contains("mani") || nom.contains("nuez") || nom.contains("nueces") || nom.contains("almendra")) ins.setSubcategoria("Frutos Secos");
                    else ins.setSubcategoria("Vegetales");
                    mod = true;
                }
                if (mod) insumoRepository.save(ins);
            }
        }

        // INICIALIZACIÓN DE INSUMOS DE MUESTRA PARA ANTOFAGASTA SI ESTÁ VACÍO
        if (insumoRepository.count() == 0 || insumoRepository.findBySucursal("Antofagasta").isEmpty()) {
            String[] sucursales = {"Antofagasta"};
            for (String sede : sucursales) {
                double factorMoneda = 50.0;

                // 1. BASE
                crearInsumoSiNoExiste("Agua de Coco", 5000.0, 100, "mls", sede, "Pulpas", "Base", 10.0 * factorMoneda);
                crearInsumoSiNoExiste("Leche de Almendras", 5000.0, 100, "mls", sede, "Pulpas", "Base", 12.0 * factorMoneda);
                crearInsumoSiNoExiste("Base Aloe Vera", 5000.0, 30, "mls", sede, "Pulpas", "Base", 20.0 * factorMoneda);

                // 2. SEMILLAS
                crearInsumoSiNoExiste("Semillas de Chía", 3000.0, 15, "gr", sede, "Pulpas", "Semillas", 25.0 * factorMoneda);
                crearInsumoSiNoExiste("Semillas de Linaza", 3000.0, 15, "gr", sede, "Pulpas", "Semillas", 22.0 * factorMoneda);

                // 3. FRUTAS
                crearInsumoSiNoExiste("Piña", 12000.0, 50, "gr", sede, "Pulpas", "Frutas", 18.0 * factorMoneda);
                crearInsumoSiNoExiste("Manzana", 10000.0, 50, "gr", sede, "Pulpas", "Frutas", 16.0 * factorMoneda);
                crearInsumoSiNoExiste("Limón", 5000.0, 20, "mls", sede, "Pulpas", "Frutas", 10.0 * factorMoneda);
                crearInsumoSiNoExiste("Betarraga", 8000.0, 50, "gr", sede, "Pulpas", "Frutas", 14.0 * factorMoneda);

                // 4. VEGETALES
                crearInsumoSiNoExiste("Espinaca", 10000.0, 50, "gr", sede, "Pulpas", "Vegetales", 15.0 * factorMoneda);
                crearInsumoSiNoExiste("Apio", 8000.0, 50, "gr", sede, "Pulpas", "Vegetales", 12.0 * factorMoneda);
                crearInsumoSiNoExiste("Zanahoria", 10000.0, 50, "gr", sede, "Pulpas", "Vegetales", 10.0 * factorMoneda);

                // 5. SUPLEMENTOS
                crearInsumoSiNoExiste("Aceite de Coco", 4000.0, 15, "mls", sede, "Pulpas", "Suplementos", 40.0 * factorMoneda);
                crearInsumoSiNoExiste("Maca", 2000.0, 10, "gr", sede, "Pulpas", "Suplementos", 50.0 * factorMoneda);
                crearInsumoSiNoExiste("Espirulina", 2000.0, 10, "gr", sede, "Pulpas", "Suplementos", 60.0 * factorMoneda);

                // 6. FRUTOS SECOS
                crearInsumoSiNoExiste("Mantequilla de Maní", 4000.0, 20, "gr", sede, "Pulpas", "Frutos Secos", 35.0 * factorMoneda);
                crearInsumoSiNoExiste("Nueces", 3000.0, 15, "gr", sede, "Pulpas", "Frutos Secos", 45.0 * factorMoneda);

                // 7. ESPECIAS
                crearInsumoSiNoExiste("Canela en Polvo", 2000.0, 5, "gr", sede, "Pulpas", "Especias", 15.0 * factorMoneda);
                crearInsumoSiNoExiste("Jengibre Orgánico", 3000.0, 10, "gr", sede, "Pulpas", "Especias", 20.0 * factorMoneda);
                crearInsumoSiNoExiste("Cúrcuma Orgánica", 2000.0, 5, "gr", sede, "Pulpas", "Especias", 25.0 * factorMoneda);

                // 8. ENDULZANTES
                crearInsumoSiNoExiste("Stevia Natural", 1000.0, 2, "gr", sede, "Pulpas", "Endulzantes", 10.0 * factorMoneda);
                crearInsumoSiNoExiste("Miel Orgánica", 3000.0, 15, "mls", sede, "Pulpas", "Endulzantes", 30.0 * factorMoneda);

                // 9. ESTABILIZANTES
                crearInsumoSiNoExiste("Goma Xantana", 1000.0, 2, "gr", sede, "Pulpas", "Estabilizantes", 15.0 * factorMoneda);

                // 10. GRASAS
                crearInsumoSiNoExiste("Palta Hass", 5000.0, 30, "gr", sede, "Pulpas", "Grasas", 30.0 * factorMoneda);

                // 11. PROTEÍNAS
                crearInsumoSiNoExiste("Proteína Aislada Whey", 3000.0, 30, "gr", sede, "Pulpas", "Proteínas", 60.0 * factorMoneda);
                crearInsumoSiNoExiste("Proteína Vegana", 3000.0, 30, "gr", sede, "Pulpas", "Proteínas", 55.0 * factorMoneda);

                // 12. CEREALES
                crearInsumoSiNoExiste("Avena Integral", 5000.0, 40, "gr", sede, "Pulpas", "Cereales", 15.0 * factorMoneda);
                crearInsumoSiNoExiste("Quinua Inflada", 3000.0, 20, "gr", sede, "Pulpas", "Cereales", 20.0 * factorMoneda);

                // 13. SHOTS Y CALDOS DE HUESO
                crearInsumoSiNoExiste("Concentrado de Jengibre Shot", 3000.0, 30, "mls", sede, "Shots y Caldos", "Suplementos", 25.0 * factorMoneda);
                crearInsumoSiNoExiste("Extracto de Cúrcuma & Pimienta", 2000.0, 20, "mls", sede, "Shots y Caldos", "Especias", 30.0 * factorMoneda);
                crearInsumoSiNoExiste("Base Caldo de Huesos Orgánico", 5000.0, 100, "mls", sede, "Shots y Caldos", "Base", 35.0 * factorMoneda);
            }
            System.out.println(">> GÓMEZ SYSTEMS: Insumos de Bodega inicializados con subcategorías correctamente para Antofagasta.");
        }
    }

    private void crearInsumoSiNoExiste(String nombre, Double stock, Integer porcion, String medida, String sucursal, String cat, String subcat, Double precio) {
        com.gomezsystems.minierp.model.Insumo ins = new com.gomezsystems.minierp.model.Insumo();
        ins.setNombre(nombre);
        ins.setUnidadActual(stock);
        ins.setCantidadPorcion(porcion);
        ins.setMedida(medida);
        ins.setSucursal(sucursal);
        ins.setCategoria(cat);
        ins.setSubcategoria(subcat);
        ins.setPrecio(precio);
        insumoRepository.save(ins);
    }
}