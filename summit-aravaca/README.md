# SUMMIT — Landing Page · Aravaca, Madrid

Landing page de captación de leads para la promoción de obra nueva **SUMMIT** en Aravaca, Madrid. Comercializado por **Promora Inmobiliaria**.

**Stack:** HTML5 + CSS3 + JavaScript vanilla · Formspree · Netlify

---

## Configuración paso a paso

### 1. Configurar Formspree

1. Ve a [formspree.io](https://formspree.io) y crea una cuenta gratuita.
2. Crea un nuevo formulario: **New Form**.
3. Copia el ID del formulario (tiene formato `mXXXXXXX` o similar).
4. En `index.html`, busca esta línea:
   ```html
   <form action="https://formspree.io/f/XXXXXXXX" method="POST" id="contact-form" novalidate>
   ```
   y sustituye `XXXXXXXX` por tu ID real.
5. En el panel de Formspree, activa **Email notifications** con el email de Promora para recibir cada lead.

### 2. Añadir las fotografías

1. Dentro de la carpeta `summit-aravaca/`, encontrarás la carpeta `img/`.
2. Añade las imágenes con estos nombres exactos:
   - `hero.jpg` — terraza principal con tumbonas y vistas
   - `terraza.jpg` — terraza con pérgola y mesa de comedor
   - `salon.jpg` — salón principal con luz natural
   - `cocina.jpg` — cocina con isla y muebles de nogal
   - `dormitorio.jpg` — dormitorio principal
   - `bano.jpg` — baño con madera y doble lavabo
   - `hall.jpg` — hall de entrada con escalera
3. **Tamaño recomendado:** 2400px en el lado largo, calidad JPEG 85%.

> La página funciona sin imágenes (muestra placeholders con el nombre de cada espacio).

### 3. Rellenar datos de contacto

En `index.html`, busca los comentarios `<!-- Rellenar -->` y completa:
- Teléfono de contacto
- Email de contacto
- URL canónica (una vez tengas el dominio definitivo)

### 4. Deploy en Netlify

1. Ve a [netlify.com](https://netlify.com) → **Add new site** → **Deploy manually**.
2. Arrastra la carpeta `summit-aravaca/` entera al área de deploy.
3. Netlify genera una URL automáticamente (ej: `summit-aravaca.netlify.app`).
4. Para dominio propio: en Netlify → **Domain settings** → **Add custom domain**.

### 5. Configurar el anuncio de Instagram

La URL del anuncio debe incluir parámetros UTM para tracking:

```
https://tu-dominio.netlify.app/?utm_source=instagram&utm_medium=paid_social&utm_campaign=summit_aravaca&utm_content=terraza
```

Estos datos aparecerán automáticamente en cada lead recibido en Formspree.

### 6. URL de confirmación (opcional)

En `index.html`, el campo hidden `_next` permite definir una URL a la que Formspree redirigirá tras el envío. Déjalo vacío para usar el mensaje de éxito inline integrado en la página.

---

## Estructura de archivos

```
summit-aravaca/
├── index.html       ← Página principal
├── styles.css       ← Estilos
├── main.js          ← Lógica (navbar, form, UTM, animaciones)
├── netlify.toml     ← Configuración de deploy
├── README.md        ← Este archivo
└── img/             ← Fotografías del proyecto
    ├── hero.jpg
    ├── terraza.jpg
    ├── salon.jpg
    ├── cocina.jpg
    ├── dormitorio.jpg
    ├── bano.jpg
    └── hall.jpg
```

## Checklist antes de publicar

- [ ] Sustituir `XXXXXXXX` en el formulario por el ID de Formspree
- [ ] Añadir las 7 fotografías en `/img/`
- [ ] Rellenar teléfono, email y URL canónica
- [ ] Hacer un envío de prueba del formulario
- [ ] Probar en Chrome, Safari y Firefox
- [ ] Probar en iPhone (375px) y iPad (768px)
- [ ] Verificar Lighthouse: Performance >90, Accessibility >95, SEO >90
