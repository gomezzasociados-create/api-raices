package com.gomezsystems.minierp.service;

import com.gomezsystems.minierp.model.Producto;
import com.gomezsystems.minierp.repository.ProductoRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
public class DataInitializer implements CommandLineRunner {

    private final ProductoRepository repository;

    public DataInitializer(ProductoRepository repository) {
        this.repository = repository;
    }

    @Override
    public void run(String... args) {

        if (repository.count() == 0) {

            // ¡EL CLONADOR MULTI-SUCURSAL!
            String[] sucursales = {"Colombia", "Chile", "España"};

            for (String sede : sucursales) {

                // Ajustamos la moneda automáticamente según la sede
                double precioBatido = 0.0;
                double precioPulpa = 0.0;

                if (sede.equals("Colombia")) { precioBatido = 4500.0; precioPulpa = 25000.0; }
                else if (sede.equals("Chile")) { precioBatido = 3500.0; precioPulpa = 22000.0; }
                else if (sede.equals("España")) { precioBatido = 5.5; precioPulpa = 25.0; }

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
                p14.setDescripcion("🍏 Pulpas Quelantes 🌿✨\nLas pulpas Quelantes están diseñadas para apoyar la eliminación de metales pesados y toxinas del organismo mediante ingredientes ricos en clorofila, antioxidantes y compuestos depurativos. Su mezcla verde y fresca favorece la limpieza interna, la energía celular y el equilibrio metabólico.\n\n🌱 Ingredientes y beneficios:\n• Espirulina: Superalga rica en clorofila, proteínas y antioxidantes. Conocida por su capacidad quelante natural, ayuda a capturar y eliminar metales pesados mientras aporta energía y vitalidad.\n• Cilantro: Potente depurador natural que apoya la eliminación de toxinas y metales pesados. Favorece la digestión y aporta un perfil antioxidante elevado.\n• Manzana verde: Rica en fibra y antioxidantes, mejora la digestión, regula el tránsito intestinal y aporta un sabor fresco y equilibrado.\n• Limón: Alto en vitamina C, apoya la desintoxicación hepática, mejora la digestión y potencia la acción depurativa del batido.\n• Acelga: Fuente de clorofila, fibra y minerales esenciales. Ayuda a oxigenar la sangre, mejorar la digestión y apoyar la limpieza interna.\n• Stevia: Endulzante natural sin calorías que realza el sabor sin afectar el equilibrio metabólico.\n\n🌟 Ideal para:\n• 🔄 Depuración profunda\n• 🧲 Eliminación de metales pesados\n• ⚡ Energía celular\n• 🌱 Bienestar digestivo");
                repository.save(p14);

            }

            System.out.println(">> GÓMEZ SYSTEMS: ¡Base de datos iniciada con todos los batidos clonados para Tuluá, Antofa y Mallorca!");
        } else {
            System.out.println(">> GÓMEZ SYSTEMS: Los productos ya existen, saltando inicialización para proteger tus ventas.");
        }
    }
}