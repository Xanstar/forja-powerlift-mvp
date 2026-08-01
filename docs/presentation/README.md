# Resumen para desarrollo del MVP de Forja: regeneración

La presentación canónica es `Forja-MVP-Developer-Brief.pptx`. El archivo `.ppt` es una exportación de compatibilidad y puede perder detalles menores de tipografía o fidelidad de formas en implementaciones antiguas de PowerPoint. El PDF es la copia de revisión con diseño fijo.

## Requisitos

- Python 3.11 o posterior
- LibreOffice / `soffice` para las exportaciones a PowerPoint heredado y PDF

Use un entorno aislado; no instale las dependencias del generador en la aplicación:

```bash
python3 -m venv /tmp/opencode/forja-deck-venv
/tmp/opencode/forja-deck-venv/bin/pip install -r docs/presentation/requirements.txt
```

## Generar el PPTX canónico

Ejecute el siguiente comando desde la raíz del repositorio:

```bash
/tmp/opencode/forja-deck-venv/bin/python docs/presentation/generate_developer_deck.py
```

## Exportar el PPT heredado y el PDF

LibreOffice debe estar instalado y disponible como `libreoffice` o `soffice`:

```bash
libreoffice --headless --convert-to 'ppt:MS PowerPoint 97' --outdir docs/presentation docs/presentation/Forja-MVP-Developer-Brief.pptx
libreoffice --headless --convert-to pdf --outdir docs/presentation docs/presentation/Forja-MVP-Developer-Brief.pptx
```

LibreOffice puede negarse a sobrescribir exportaciones existentes. Mueva o elimine los archivos `.ppt` y `.pdf` generados antes de regenerarlos, o exporte a un directorio temporal vacío y reemplácelos después de validarlos.

## Verificar

```bash
/tmp/opencode/forja-deck-venv/bin/python -c "from pptx import Presentation; p=Presentation('docs/presentation/Forja-MVP-Developer-Brief.pptx'); print(len(p.slides))"
file docs/presentation/Forja-MVP-Developer-Brief.ppt
pdfinfo docs/presentation/Forja-MVP-Developer-Brief.pdf
pdftotext docs/presentation/Forja-MVP-Developer-Brief.pdf -
```

El PPTX debe contener 12 diapositivas y el PDF debe tener la misma cantidad de páginas. Revise ambas exportaciones después de modificar el generador, ya que la sustitución de fuentes puede alterar los saltos de línea.
