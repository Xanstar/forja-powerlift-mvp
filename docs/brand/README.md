# Manual de marca Forja

Este directorio contiene el manual de marca editable y su equivalente en PDF. Ambos documentos se generan desde la misma fuente para mantener una composición visual consistente.

## Archivos

- `Forja-Manual-de-Marca.pptx`: presentación editable de 12 diapositivas en formato 16:9.
- `Forja-Manual-de-Marca.pdf`: versión de distribución de 12 páginas.
- `generate_brand_manual.mjs`: generador reproducible sin dependencias adicionales del proyecto.
- `generate_brand_assets.mjs`: normaliza el arte aprobado y genera variantes positivas, negativas e íconos sin difusión.

## Generación

Requiere Node.js, ImageMagick y LibreOffice disponibles en el entorno local.

```bash
node docs/brand/generate_brand_manual.mjs
```

El generador utiliza exclusivamente `public/brand/forja-lockup-source.png` y `public/brand/forja-mark-source.png` como autoridad geométrica. Primero elimina la difusión de la llama y genera versiones positivas y negativas canónicas; luego compone el PPTX y el PDF. No usa referencias ni pruebas locales del directorio raíz.

## Criterio tipográfico

El sistema de marca especifica Inter. El generador utiliza Liberation Sans como fallback métrico compatible para garantizar una exportación local reproducible y fuentes embebidas en el PDF cuando Inter no está instalado en el sistema operativo.
