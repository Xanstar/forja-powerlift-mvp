---
name: Forja
description: Sistema de entrenamiento preciso, sobrio y orientado al rendimiento.
colors:
  azul-forja: "#10294B"
  blanco-hueso: "#F4F1EA"
  rojo-impulso: "#D93636"
  gris-niebla: "#A7AFBA"
  rojo-impulso-hover: "#B62A2A"
  papel-operativo: "#FFFFFF"
  tinta-secundaria: "#526075"
  success: "#286B4F"
  dark-surface: "#1C3B63"
  dark-surface-hover: "#31547D"
  dark-border: "#587598"
  dark-muted: "#C4CAD1"
typography:
  display:
    fontFamily: "Inter, sans-serif"
    fontSize: "clamp(2.8rem, 7vw, 5rem)"
    fontWeight: 700
    lineHeight: 0.92
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
    backgroundColor: "{colors.rojo-impulso}"
    textColor: "{colors.papel-operativo}"
    rounded: "{rounded.control}"
    padding: "10px 16px"
    height: "44px"
  button-primary-hover:
    backgroundColor: "{colors.rojo-impulso-hover}"
  input:
    backgroundColor: "{colors.papel-operativo}"
    textColor: "{colors.azul-forja}"
    rounded: "{rounded.control}"
    padding: "10px 14px"
    height: "44px"
  working-sheet:
    backgroundColor: "{colors.papel-operativo}"
    textColor: "{colors.azul-forja}"
    rounded: "{rounded.surface}"
    padding: "20px"
---

# Design System: Forja

## Overview

**Creative North Star: "Gym Sport / Sala de competencia"**

Forja traduce las hojas oficiales de pesaje, los tableros de intentos, las señales de jueces y los sistemas de resultados a un producto digital contemporáneo. La interfaz es precisa, sobria y orientada al rendimiento: cada regla separa información, cada número merece jerarquía y cada color comunica una decisión.

La evolución Gym Sport lleva esa autoridad a la planta de entrenamiento sin recurrir al estereotipo rojo-negro de culturismo. Papel mineral, navy reglamentario y señales de resultado conviven con referencias contenidas a goma, plataforma, acero galvanizado y tiza. Son materiales y geometrías de trabajo, nunca imágenes falsas ni decoración temática.

La marca Forja siempre domina. La identidad de un gimnasio puede aparecer como contexto secundario, nunca desplazar el nombre ni la gramática visual del producto. Las superficies públicas persuaden mostrando el ciclo operativo; las superficies de coach y atleta priorizan velocidad, evidencia y ergonomía táctil.

**Key Characteristics:**

- Superficies Blanco Hueso con tinta Azul Forja.
- Rojo Impulso reservado para acciones primarias, decisiones y desvíos.
- Reglas nítidas, tablas, estados sellados y numerales tabulares.
- Densidad de sala de control sin sacrificar respiración ni foco.

### Logo aprobado

El logo aprobado es la composición horizontal de `public/brand/forja-lockup-source.png`: llama roja nítida sobre una barra compacta y wordmark `Forja` en azul navy. Debe utilizarse tal como está, sin redibujar, sustituir la tipografía, modificar proporciones ni agregar descriptores. La llama no admite glow, blur, halo, feathering, sombra ni haze translúcido.

`public/brand/forja-lockup-source.png` es la autoridad positiva de producción; `public/brand/forja-lockup-negative-source.png` es la negativa; sus equivalentes `-350` sirven a la interfaz. `public/brand/forja-mark-source.png` y `public/brand/forja-mark-negative-source.png` son las marcas cuadradas. Todos preservan la misma geometría limpia.

Usar la composición completa para la marca visible del producto y mantener el nombre accesible `Forja`, salvo que un texto adyacente ya anuncie la marca. Reservar la marca cuadrada para favicon e íconos de aplicación. En superficies claras se usa la positiva: llama Rojo Impulso, barra y wordmark Azul Forja. En Azul Forja se usa la negativa: la llama permanece Rojo Impulso y barra y wordmark pasan a Blanco Hueso, sin placa de contención.

## Colors

La paleta canónica combina Blanco Hueso, Azul Forja, Rojo Impulso y Gris Niebla. Los tonos auxiliares sólo derivan estados interactivos o semánticos.

### Paleta validada para la landing

Las escalas completas y su procedencia se exportan en `docs/design/forja-landing-palette.json`. Fueron generadas con [UI Colors para Azul Forja](https://uicolors.app/generate/10294b) y [UI Colors para Rojo Impulso](https://uicolors.app/generate/d93636), y validadas el 2026-08-04 con [Cool Contrast](https://coolcontrast.vercel.app), proyecto [MIT disponible en GitHub](https://github.com/AlexGarrixen/Cool-Contrast), usando el tipo de contenido `Landing Page`.

| Uso semántico | Fondo | Primer plano | Contraste | Criterio para texto normal |
|---|---:|---:|---:|---|
| Tinta principal sobre hueso | `#F4F1EA` | `#10294B` | 12.92:1 | AAA |
| Extremo claro del gradiente hero | `#174E91` | `#F4F1EA` | 7.34:1 | AAA |
| Acción primaria | `#B52020` | `#FFFFFF` | 6.58:1 | AA |
| Acción primaria en hover/active | `#951F1F` | `#FFFFFF` | 8.42:1 | AAA |
| Señal Rojo Impulso | `#D93636` | `#FFFFFF` | 4.63:1 | AA; no usar como CTA preferente |
| Texto secundario sobre hueso | `#F4F1EA` | `#526075` | 5.66:1 | AA |

El gradiente público se limita a una superficie hero significativa, de `#10294B` a `#174E91`, siempre con texto Blanco Hueso. `#526075` sólo se usa sobre hueso o papel; las superficies navy usan tokens inversos. Los umbrales aplicados son 4.5:1 para AA y 7:1 para AAA en texto normal.

### Primary

- **Rojo Impulso:** acciones primarias, desvíos que requieren revisión y señales de alta prioridad.

### Secondary

- **Azul Forja:** marca, navegación estructural, texto principal, foco y fondos de métricas.
- **Verde semántico:** confirmaciones y ejecución conforme al plan; no forma parte de la identidad primaria.

### Neutral

- **Blanco Hueso:** superficie ambiental de trabajo.
- **Papel operativo:** formularios y áreas de lectura.
- **Gris Niebla:** divisores y texto inverso de apoyo sobre Azul Forja.
- **Tinta secundaria:** texto de apoyo con contraste legible.

### Named Rules

**The Decision Red Rule.** Rojo Impulso identifica una acción decisiva o una diferencia relevante; no decora superficies.

**The Ink Hierarchy Rule.** Azul reglamentario para autoridad, tinta secundaria para contexto y nunca gris tenue sobre color.

### Temas digitales

- **Claro:** Blanco Hueso como ambiente, papel blanco como superficie, Azul Forja como tinta y Rojo Impulso como acción.
- **Oscuro:** Azul Forja como ambiente, `#1C3B63` como superficie elevada, Blanco Hueso como tinta, `#C4CAD1` como texto secundario y `#587598` como borde.
- **Sistema:** es el valor inicial seguro y sigue `prefers-color-scheme`; una elección explícita Claro u Oscuro se conserva en `localStorage`.
- La resolución ocurre antes del primer paint mediante `data-theme`; los componentes consumen tokens semánticos y nunca acumulan clases oscuras locales.
- El control ofrece Claro, Oscuro y Sistema con nombre accesible y foco visible en cabeceras públicas, atleta y coach.

## Typography

**Display Font:** Inter (sans-serif compatible como fallback)
**Body Font:** Inter (sans-serif compatible como fallback)

**Character:** Inter aporta una voz precisa y estable en titulares, formularios, lectura continua y datos densos. La jerarquía depende de tamaño, peso y espacio, no de sumar familias.

### Hierarchy

- **Display:** peso 700, hasta 5rem, interletrado -0.04em; reservado para tesis públicas y números dominantes.
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

- **Pendiente / Informativo:** tinta Azul Forja con etiqueta textual.
- **Sincronizado / Cumplido:** approved-green con confirmación textual.
- **Revisar / Desvío / Conflicto:** Rojo Impulso, reservado para decisiones y excepciones reales.
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
- **Focus:** anillo Azul Forja en claro y Rojo Impulso claro en oscuro, siempre con 3px y separación visible.
- **Error / Disabled:** rojo con fondo rojo claro; opacidad reducida y eventos bloqueados para disabled.

### Navigation

Desktop coach usa un panel navy de ancho fijo con estado activo invertido. Mobile coach usa navegación inferior de cuatro columnas; nunca comprime el sidebar desktop. Las superficies públicas y atleta usan cabeceras regladas con Forja como marca principal. El logo cambia entre positivo y negativo por contexto o tema sin flash ni recoloreo CSS del bitmap.

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

- **Don't** convertir el tema oscuro en dark SaaS genérico, rojo sobre negro o gimnasio estereotípico: su lienzo es Azul Forja y conserva la gramática de evidencia.
- **Don't** usar mosaicos de tarjetas redondeadas intercambiables como estructura principal.
- **Don't** repetir iconos Lucide donde el texto o el dato ya comunica la función.
- **Don't** usar pills para navegación rutinaria, blur decorativo, gradientes de texto o sombras bloque.
- **Don't** trasladar el sidebar desktop al viewport móvil.
