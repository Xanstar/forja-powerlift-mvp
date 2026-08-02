---
name: Forja
description: Sistema operativo de coaching inspirado en la sala de competencia.
colors:
  competition-red: "#c9272c"
  competition-red-hover: "#a9181d"
  regulatory-navy: "#10233d"
  results-blue: "#1f4e79"
  approved-green: "#1f6b4f"
  mineral-ground: "#f2f0e9"
  official-paper: "#fbfaf6"
  working-surface: "#e9e7df"
  rule-light: "#d2cfc5"
  rule-strong: "#9b9a94"
  secondary-ink: "#4f5b68"
typography:
  display:
    fontFamily: "Space Grotesk, sans-serif"
    fontSize: "clamp(3.4rem, 8vw, 6rem)"
    fontWeight: 700
    lineHeight: 0.9
    letterSpacing: "-0.04em"
  body:
    fontFamily: "Inter, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Inter, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 600
    lineHeight: 1
rounded:
  control: "0px"
  surface: "0px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "20px"
  lg: "40px"
  xl: "80px"
contentWidth:
  workout: "48rem"
  review: "56rem"
  reading: "72ch"
  operations: "72rem"
components:
  button-primary:
    backgroundColor: "{colors.competition-red}"
    textColor: "{colors.official-paper}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.competition-red-hover}"
  input:
    backgroundColor: "{colors.official-paper}"
    textColor: "{colors.regulatory-navy}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "44px"
  working-sheet:
    backgroundColor: "{colors.official-paper}"
    textColor: "{colors.regulatory-navy}"
    rounded: "{rounded.surface}"
    padding: "20px"
---

# Design System: Forja

## Overview

**Creative North Star: "Gym Sport / Sala de competencia"**

Forja traduce las hojas oficiales de pesaje, los tableros de intentos, las señales de jueces y los sistemas de resultados a un producto digital contemporáneo. La interfaz se siente verificable y operativa: cada regla separa información, cada número merece jerarquía y cada color comunica una decisión.

La evolución Gym Sport lleva esa autoridad a la planta de entrenamiento sin recurrir al estereotipo rojo-negro de culturismo. Papel mineral, navy reglamentario y señales de resultado conviven con referencias contenidas a goma, plataforma, acero galvanizado y tiza. Son materiales y geometrías de trabajo, nunca imágenes falsas ni decoración temática.

La marca Forja siempre domina. La identidad de un gimnasio puede aparecer como contexto secundario, nunca desplazar el nombre ni la gramática visual del producto. Las superficies públicas persuaden mostrando el ciclo operativo; las superficies de coach y atleta priorizan velocidad, evidencia y ergonomía táctil.

**Key Characteristics:**

- Superficies minerales claras con tinta azul reglamentaria.
- Rojo de competencia reservado para decisiones y desvíos.
- Reglas nítidas, tablas, estados sellados y numerales tabulares.
- Densidad de sala de control sin sacrificar respiración ni foco.

## Colors

La paleta combina papel mineral, tinta reglamentaria y señales de decisión.

### Primary

- **Competition Red:** acciones primarias, desvíos que requieren revisión y señales de alta prioridad.

### Secondary

- **Regulatory Navy:** marca, navegación estructural, texto principal y fondos de control.
- **Results Blue:** foco, datos secundarios y estados informativos.
- **Approved Green:** confirmaciones y ejecución conforme al plan.

### Neutral

- **Mineral Ground:** superficie ambiental de trabajo.
- **Official Paper:** hojas, formularios y áreas de lectura.
- **Rule Light / Rule Strong:** divisores según jerarquía.
- **Secondary Ink:** texto de apoyo con contraste legible.

### Named Rules

**The Decision Red Rule.** El rojo identifica una acción decisiva o una diferencia relevante; no decora superficies.

**The Ink Hierarchy Rule.** Azul reglamentario para autoridad, tinta secundaria para contexto y nunca gris tenue sobre color.

## Typography

**Display Font:** Space Grotesk (sans-serif fallback)  
**Body Font:** Inter (sans-serif fallback)

**Character:** Space Grotesk aporta una voz compacta y técnica para marca, titulares y cifras. Inter sostiene formularios y lectura continua sin competir con los datos.

### Hierarchy

- **Display:** peso 700, hasta 6rem, interletrado -0.04em; reservado para tesis públicas y números dominantes.
- **Headline:** peso 700, 2.25–3.75rem; títulos de ruta y secciones principales.
- **Title:** peso 600–700, 1.125–1.5rem; ejercicios, bloques y nombres.
- **Body:** peso 400–500, 1rem y línea 1.75; medida recomendada de 65–75 caracteres.
- **Label:** peso 600, 0.75–0.875rem; mayúsculas sólo para sellos regulatorios o encabezados compactos de tablas.

### Named Rules

**The Numeral Authority Rule.** Totales, cargas, sets y tiempos usan cifras tabulares con la voz display; los iconos nunca compiten con esos valores.

## Layout

Las superficies se organizan como hojas y tableros: bordes completos, reglas horizontales y columnas de datos antes que mosaicos de tarjetas. La landing divide la tesis y el tablero de ejecución en desktop, y los apila en móvil. El ciclo operativo forma cinco columnas informativas que pasan a una lista reglada en pantallas estrechas.

El shell coach usa una columna fija de 15rem sólo desde 768px. En móvil desaparece por completo y se reemplaza por navegación inferior de cuatro destinos con objetivos táctiles de 64px. El contenido siempre conserva `min-width: 0` y padding independiente, evitando que la geometría desktop reduzca el viewport móvil.

Las superficies atleta son mobile-first. Los controles táctiles miden al menos 44px y la acción de completar entrenamiento permanece accesible en el borde inferior.

El entrenamiento usa `max-width: 48rem`, la revisión `56rem`, la lectura continua `72ch` y las operaciones comparativas hasta `72rem`. Estas medidas evitan que una tarea secuencial se disperse en un lienzo de dashboard.

## Elevation & Depth

El sistema es plano por defecto. La profundidad proviene de contraste tonal, fondos de papel, reglas y densidad, no de sombras decorativas, blur o vidrio. Los elementos fijos usan una superficie opaca y un borde estructural.

**The Evidence Plane Rule.** Una hoja o tablero debe parecer parte del mismo plano de trabajo; no elevar cada bloque como una tarjeta independiente.

## Shapes

Controles, hojas y contenedores usan esquinas rectas. Los estados se expresan como sellos con borde de 1px y una rotación mínima, mientras los indicadores de avance usan barras rectangulares. Los círculos se reservan para iconografía semántica existente, como completar una serie, cuando la forma también es un objetivo táctil.

## Components

Los componentes se nombran y componen por tarea, no por apariencia genérica:

- **Decision Queue:** sesiones incompletas, fechas incumplidas, accesos pendientes o marcas insuficientes. El primer asunto es la única acción primaria.
- **Training Card:** ejercicio con prescripción resuelta, próxima serie dominante, registro u omisión y descanso con unidad.
- **Result Board:** comparación entre prescripción inmutable y ejecución real, con métricas declaradas.
- **Program Version Bar:** estado `Borrador` o `Publicado`, número de versión y publicación explícita.
- **Sync Status:** estado persistente `Sincronizado`, `Pendiente` o `Conflicto`; el color acompaña al texto pero no lo reemplaza.
- **Action Disclosure:** `Más acciones` aloja importación, exportación, duplicación y tareas secundarias.
- **Danger Disclosure:** la destrucción requiere apertura deliberada, explicación del impacto histórico y confirmación textual.

### Voice

La voz es español neutral y propia del sector. Para coach, los controles y estados hablan de `programa`, `bloque`, `sesión`, `prescripción`, `desvío`, `pendiente`, `revisar`, `ajustar` y `publicar`. Para atleta, cada pantalla conduce a la siguiente acción física con `serie`, `repeticiones`, `carga`, `descanso`, `hecho`, `omitido` y `próxima serie`. Se eliminan motivación vacía, lenguaje SaaS y explicaciones repetidas.

### Semantic Statuses

- **Pendiente / Informativo:** tinta results-blue con etiqueta textual.
- **Sincronizado / Cumplido:** approved-green con confirmación textual.
- **Revisar / Desvío / Conflicto:** competition-red, reservado para decisiones y excepciones reales.
- **Omitido:** navy secundario; es un resultado explícito, no un error.
- **Destructivo:** rojo sólo dentro de una confirmación abierta.

### Buttons

- **Shape:** rectangular, borde de 1px, altura mínima de 44px.
- **Primary:** rojo de competencia con texto blanco y peso 600.
- **Hover / Focus:** rojo profundo en hover; anillo azul de 3px con separación visible para teclado.
- **Secondary / Ghost / Danger:** papel con borde, acción textual reglada y peligro que se llena de rojo al confirmar.

### Cards / Containers

- **Corner Style:** recto.
- **Background:** papel oficial o transparente sobre mineral.
- **Shadow Strategy:** sin sombras en reposo.
- **Border:** reglas fuertes para estructura; reglas claras para separación interna.
- **Internal Padding:** 20px por defecto.

### Inputs / Fields

- **Style:** papel oficial, borde fuerte, altura mínima de 44px y cifras tabulares.
- **Focus:** borde y anillo azul reglamentario.
- **Error / Disabled:** rojo con fondo rojo claro; opacidad reducida y eventos bloqueados para disabled.

### Navigation

Desktop coach usa un panel navy de ancho fijo con estado activo invertido. Mobile coach usa navegación inferior de cuatro columnas; nunca comprime el sidebar desktop. Las superficies públicas y atleta usan cabeceras regladas con Forja como marca principal.

### Competition Stamp

Estado compacto con borde de 1px, texto de 0.7rem, interletrado moderado y rotación de -1 grado. Se usa para estados verificables o de decisión, no como etiqueta decorativa sobre cada título.

### Working Sheet

Superficie de papel con reglas horizontales tenues cada 2.75rem. Aloja formularios y bloques de evidencia donde la alineación entre campos importa.

## Do's and Don'ts

### Do:

- **Do** priorizar números, nombres, estados y diferencias reales sobre iconografía.
- **Do** usar reglas y tablas para conjuntos comparables.
- **Do** mantener Forja como marca primaria y el gimnasio como contexto secundario.
- **Do** preservar contraste, foco visible, estados textuales y objetivos táctiles de al menos 44px.

### Don't:

- **Don't** reconstruir la interfaz como dark SaaS, rojo sobre negro o gimnasio estereotípico.
- **Don't** usar mosaicos de tarjetas redondeadas intercambiables como estructura principal.
- **Don't** repetir iconos Lucide donde el texto o el dato ya comunica la función.
- **Don't** usar pills para navegación rutinaria, blur decorativo, gradientes de texto o sombras bloque.
- **Don't** trasladar el sidebar desktop al viewport móvil.
