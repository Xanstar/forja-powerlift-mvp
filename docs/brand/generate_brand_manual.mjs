#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const outputBase = "Forja-Manual-de-Marca";
const tempDir = mkdtempSync(join(tmpdir(), "forja-brand-"));
const fodpPath = join(tempDir, `${outputBase}.fodp`);

execFileSync(process.execPath, [join(here, "generate_brand_assets.mjs")], { stdio: "inherit" });

const C = {
  navy: "#10294B",
  bone: "#F4F1EA",
  red: "#D93636",
  mist: "#A7AFBA",
  white: "#FFFFFF",
  inkMuted: "#526075",
  navySoft: "#1C3B63",
  redDark: "#B62A2A",
  pale: "#E6E5E1",
  green: "#286B4F",
};

const PAGE_W = 33.867;
const PAGE_H = 19.05;
const FONT = "Liberation Sans";
const lockup = readFileSync(join(root, "public/brand/forja-lockup-source.png")).toString("base64");
const lockupNegative = readFileSync(join(root, "public/brand/forja-lockup-negative-source.png")).toString("base64");
const mark = readFileSync(join(root, "public/brand/forja-mark-source.png")).toString("base64");
const markNegative = readFileSync(join(root, "public/brand/forja-mark-negative-source.png")).toString("base64");

const xml = (value) => String(value)
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;");

const cm = (value) => `${value}cm`;
const automaticStyles = [];
let styleIndex = 0;

function style(prefix, body) {
  const name = `${prefix}${++styleIndex}`;
  automaticStyles.push(`<style:style style:name="${name}" style:family="${prefix === "P" ? "paragraph" : "graphic"}">${body}</style:style>`);
  return name;
}

function paragraphStyle({ size = 16, color = C.navy, bold = false, align = "start", line = 1.15, tracking = 0 } = {}) {
  return style("P", `<style:paragraph-properties fo:text-align="${align}" fo:line-height="${line * 100}%"/><style:text-properties style:font-name="Body" fo:font-family="${FONT}" fo:font-size="${size}pt" fo:font-weight="${bold ? "bold" : "normal"}" fo:color="${color}" fo:letter-spacing="${tracking}pt"/>`);
}

function graphicStyle({ fill = "none", stroke = "none", strokeWidth = 0.02, opacity = 100 } = {}) {
  const fillProps = fill === "none"
    ? 'draw:fill="none"'
    : `draw:fill="solid" draw:fill-color="${fill}" draw:opacity="${opacity}%"`;
  const strokeProps = stroke === "none"
    ? 'draw:stroke="none"'
    : `draw:stroke="solid" svg:stroke-color="${stroke}" svg:stroke-width="${cm(strokeWidth)}"`;
  return style("G", `<style:graphic-properties ${fillProps} ${strokeProps}/>`);
}

function text(textValue, x, y, w, h, options = {}) {
  const pStyle = paragraphStyle(options);
  const gStyle = graphicStyle();
  const valign = options.valign ?? "top";
  return `<draw:frame draw:style-name="${gStyle}" draw:layer="layout" svg:x="${cm(x)}" svg:y="${cm(y)}" svg:width="${cm(w)}" svg:height="${cm(h)}"><draw:text-box draw:auto-grow-height="false" fo:min-height="${cm(h)}"><text:p text:style-name="${pStyle}">${xml(textValue)}</text:p></draw:text-box></draw:frame>`
    .replace("<draw:text-box", `<draw:text-box draw:textarea-vertical-align="${valign}"`);
}

function rect(x, y, w, h, fill, stroke = "none", strokeWidth = 0.02, opacity = 100) {
  const gStyle = graphicStyle({ fill, stroke, strokeWidth, opacity });
  return `<draw:rect draw:style-name="${gStyle}" draw:layer="layout" svg:x="${cm(x)}" svg:y="${cm(y)}" svg:width="${cm(w)}" svg:height="${cm(h)}"/>`;
}

function line(x1, y1, x2, y2, color = C.navy, width = 0.03) {
  const gStyle = graphicStyle({ stroke: color, strokeWidth: width });
  return `<draw:line draw:style-name="${gStyle}" draw:layer="layout" svg:x1="${cm(x1)}" svg:y1="${cm(y1)}" svg:x2="${cm(x2)}" svg:y2="${cm(y2)}"/>`;
}

function image(data, x, y, w, h) {
  const gStyle = graphicStyle();
  return `<draw:frame draw:style-name="${gStyle}" draw:layer="layout" svg:x="${cm(x)}" svg:y="${cm(y)}" svg:width="${cm(w)}" svg:height="${cm(h)}"><draw:image draw:mime-type="image/png"><office:binary-data>${data}</office:binary-data></draw:image></draw:frame>`;
}

function footer(number, dark = false) {
  const fg = dark ? C.bone : C.inkMuted;
  const rule = dark ? C.mist : C.navy;
  return [
    line(1.4, 17.95, 32.45, 17.95, rule, 0.018),
    text("FORJA · MANUAL DE MARCA · 2026", 1.4, 18.12, 10, 0.36, { size: 7.5, color: fg, bold: true, tracking: 0.7 }),
    text(String(number).padStart(2, "0"), 30.9, 18.08, 1.55, 0.4, { size: 8.5, color: fg, bold: true, align: "end" }),
  ].join("");
}

function base(title, section, number, dark = false) {
  const bg = dark ? C.navy : C.bone;
  const fg = dark ? C.bone : C.navy;
  return [
    rect(0, 0, PAGE_W, PAGE_H, bg),
    rect(0, 0, 0.18, PAGE_H, C.red),
    text(section.toUpperCase(), 1.4, 0.72, 8, 0.35, { size: 8, color: C.red, bold: true, tracking: 1.2 }),
    text(title, 1.4, 1.28, 30.2, 1.05, { size: 27, color: fg, bold: true, line: 1 }),
    footer(number, dark),
  ].join("");
}

function card(x, y, w, h, label, body, index, options = {}) {
  const fill = options.fill ?? C.white;
  const bodyColor = options.bodyColor ?? C.navy;
  const accent = options.accent ?? C.red;
  return [
    rect(x, y, w, h, fill, options.stroke ?? C.mist, 0.025),
    rect(x, y, 0.12, h, accent),
    index ? text(index, x + 0.45, y + 0.38, 1.15, 0.55, { size: 11, color: accent, bold: true }) : "",
    text(label.toUpperCase(), x + (index ? 1.45 : 0.45), y + 0.38, w - 1.8, 0.48, { size: 9, color: accent, bold: true, tracking: 0.8 }),
    text(body, x + 0.45, y + 1.12, w - 0.9, h - 1.35, { size: options.size ?? 14, color: bodyColor, line: 1.2 }),
  ].join("");
}

function swatch(x, y, w, h, name, hex, fill, darkText = false) {
  const color = darkText ? C.navy : C.white;
  return [
    rect(x, y, w, h, fill),
    text(name, x + 0.45, y + 0.45, w - 0.9, 0.55, { size: 13, color, bold: true }),
    text(hex, x + 0.45, y + h - 0.9, w - 0.9, 0.4, { size: 10, color, bold: true, tracking: 0.5 }),
  ].join("");
}

function slide(name, number, content) {
  return `<draw:page draw:name="${xml(name)}" draw:style-name="dp1" draw:master-page-name="Default">${content}<presentation:notes/></draw:page>`;
}

const slides = [];

slides.push(slide("Portada", 1, [
  rect(0, 0, PAGE_W, PAGE_H, C.bone),
  rect(21.3, 0, 12.567, PAGE_H, C.navy),
  rect(21.3, 0, 0.18, PAGE_H, C.red),
  image(lockup, 1.6, 1.45, 8.75, 3.5),
  text("MANUAL DE MARCA", 1.65, 6.3, 16.5, 0.55, { size: 10, color: C.red, bold: true, tracking: 1.8 }),
  text("Precisión que convierte\nel esfuerzo en progreso.", 1.6, 7.1, 18.1, 3.5, { size: 34, color: C.navy, bold: true, line: 1.02 }),
  text("Sistema visual y criterios de aplicación", 1.65, 11.4, 15.5, 0.7, { size: 16, color: C.inkMuted }),
  text("DISCIPLINA", 23.0, 3.1, 8.4, 0.55, { size: 11, color: C.bone, bold: true, tracking: 1.1 }),
  line(23.0, 4.05, 31.8, 4.05, C.mist, 0.025),
  text("EVIDENCIA", 23.0, 5.0, 8.4, 0.55, { size: 11, color: C.bone, bold: true, tracking: 1.1 }),
  line(23.0, 5.95, 31.8, 5.95, C.mist, 0.025),
  text("PROGRESO", 23.0, 6.9, 8.4, 0.55, { size: 11, color: C.bone, bold: true, tracking: 1.1 }),
  line(23.0, 7.85, 31.8, 7.85, C.mist, 0.025),
  text("RENDIMIENTO", 23.0, 8.8, 8.4, 0.55, { size: 11, color: C.bone, bold: true, tracking: 1.1 }),
  text("Versión 1.0 · Agosto de 2026", 23.0, 15.8, 8.4, 0.5, { size: 9, color: C.mist }),
  footer(1),
].join("")));

slides.push(slide("Fundamentos", 2, [
  base("Una marca construida sobre evidencia", "01 · Fundamentos", 2),
  text("Forja acompaña el ciclo completo del entrenamiento con una voz precisa, sobria y orientada al rendimiento.", 1.4, 2.7, 28.5, 0.9, { size: 16, color: C.inkMuted }),
  card(1.4, 4.25, 7.25, 4.35, "Disciplina", "Constancia que construye resultados.", "01"),
  card(9.25, 4.25, 7.25, 4.35, "Evidencia", "Decisiones basadas en datos y registro.", "02"),
  card(17.1, 4.25, 7.25, 4.35, "Progreso", "Mejora continua, sesión tras sesión.", "03"),
  card(24.95, 4.25, 7.25, 4.35, "Rendimiento", "Expresar tu mejor versión.", "04"),
  rect(1.4, 10.1, 30.8, 4.9, C.navy),
  text("TONO VISUAL", 2.1, 10.85, 5, 0.45, { size: 9, color: C.red, bold: true, tracking: 1 }),
  text("Preciso", 2.1, 11.65, 8, 0.7, { size: 24, color: C.bone, bold: true }),
  text("Sobrio", 12.3, 11.65, 8, 0.7, { size: 24, color: C.bone, bold: true }),
  text("Orientado al rendimiento", 21.4, 11.65, 9.8, 1.35, { size: 20, color: C.bone, bold: true, line: 1.05 }),
  text("Jerarquía clara", 2.1, 13.15, 8, 0.5, { size: 11, color: C.mist }),
  text("Sin ruido ornamental", 12.3, 13.15, 8, 0.5, { size: 11, color: C.mist }),
  text("Datos que conducen la acción", 21.4, 13.15, 9.5, 0.5, { size: 11, color: C.mist }),
].join("")));

slides.push(slide("Logo principal", 3, [
  base("Logo principal", "02 · Sistema de logo", 3),
  text("La composición horizontal aprobada es la firma primaria. El arte no se reconstruye: se usa desde el archivo de producción.", 1.4, 2.7, 28, 0.9, { size: 15, color: C.inkMuted }),
  rect(1.4, 4.2, 20.2, 9.8, C.white, C.mist, 0.025),
  image(lockup, 4.15, 6.35, 14.7, 5.88),
  rect(23.0, 4.2, 9.2, 9.8, C.navy),
  text("COMPOSICIÓN", 23.75, 4.95, 7.5, 0.45, { size: 9, color: C.red, bold: true, tracking: 1 }),
  text("Llama roja", 23.75, 6.0, 7.5, 0.55, { size: 16, color: C.bone, bold: true }),
  text("sobre barra compacta", 23.75, 6.55, 7.5, 0.45, { size: 11, color: C.mist }),
  line(23.75, 7.45, 31.2, 7.45, C.mist, 0.02),
  text("Wordmark Forja", 23.75, 8.25, 7.5, 0.55, { size: 16, color: C.bone, bold: true }),
  text("en Azul Forja", 23.75, 8.8, 7.5, 0.45, { size: 11, color: C.mist }),
  line(23.75, 9.7, 31.2, 9.7, C.mist, 0.02),
  text("Archivo maestro", 23.75, 10.5, 7.5, 0.45, { size: 10, color: C.red, bold: true }),
  text("forja-lockup-source.png", 23.75, 11.05, 7.5, 0.9, { size: 10.5, color: C.bone }),
].join("")));

slides.push(slide("Versiones", 4, [
  base("Versiones aprobadas", "02 · Sistema de logo", 4),
  text("Cada versión resuelve un contexto real sin modificar geometría, proporción ni color.", 1.4, 2.7, 28, 0.7, { size: 15, color: C.inkMuted }),
  rect(1.4, 4.0, 14.8, 5.1, C.white, C.mist, 0.025),
  image(lockup, 3.95, 4.75, 9.7, 3.88),
  text("POSITIVA", 1.8, 8.4, 4, 0.4, { size: 9, color: C.red, bold: true, tracking: 1 }),
  rect(17.4, 4.0, 14.8, 5.1, C.navy),
  image(lockupNegative, 19.95, 4.65, 9.7, 3.88),
  text("NEGATIVA", 17.8, 8.4, 7.5, 0.4, { size: 9, color: C.red, bold: true, tracking: 1 }),
  rect(1.4, 10.2, 9.2, 5.5, C.white, C.mist, 0.025),
  image(mark, 4.1, 10.65, 3.8, 3.8),
  text("MARCA / ÍCONO", 1.8, 14.9, 5.5, 0.45, { size: 9, color: C.red, bold: true, tracking: 1 }),
  text("Positiva", 12.0, 10.45, 5.1, 0.5, { size: 14, color: C.navy, bold: true }),
  text("Fondos Blanco Hueso o blanco. Es la aplicación preferida.", 12.0, 11.15, 5.1, 1.55, { size: 11, color: C.inkMuted, line: 1.25 }),
  text("Negativa", 18.4, 10.45, 5.1, 0.5, { size: 14, color: C.navy, bold: true }),
  text("Sobre Azul Forja, la llama permanece roja; barra y wordmark pasan a Blanco Hueso.", 18.4, 11.15, 5.1, 1.65, { size: 11, color: C.inkMuted, line: 1.25 }),
  text("Marca", 24.8, 10.45, 5.1, 0.5, { size: 14, color: C.navy, bold: true }),
  text("Sólo para favicon, ícono de aplicación y espacios donde el wordmark no resulte legible.", 24.8, 11.15, 6.5, 1.8, { size: 11, color: C.inkMuted, line: 1.25 }),
].join("")));

slides.push(slide("Protección y tamaño", 5, [
  base("Protección, proporción y tamaño", "02 · Sistema de logo", 5),
  text("La guía se apoya en rasgos observables del arte y en tamaños ya verificados en el producto; no declara una retícula de construcción inexistente.", 1.4, 2.7, 29.2, 0.9, { size: 14, color: C.inkMuted }),
  rect(1.4, 4.2, 19.4, 9.2, C.white, C.mist, 0.025),
  rect(3.1, 5.5, 16.0, 6.4, C.pale, C.red, 0.035),
  image(lockup, 4.6, 6.6, 13.0, 5.2),
  text("ÁREA DE PROTECCIÓN", 2.0, 12.55, 7.5, 0.4, { size: 8.5, color: C.red, bold: true, tracking: 0.9 }),
  text("Mantener un margen libre continuo. Como referencia visual, usar al menos el diámetro del extremo de la barra presente en el propio símbolo.", 22.1, 4.3, 9.8, 2.2, { size: 13, color: C.navy, line: 1.25 }),
  line(22.1, 7.05, 31.9, 7.05, C.mist, 0.025),
  text("TAMAÑO DIGITAL", 22.1, 7.7, 5.2, 0.45, { size: 9, color: C.red, bold: true, tracking: 0.9 }),
  text("112–180 px", 22.1, 8.35, 7.8, 0.75, { size: 24, color: C.navy, bold: true }),
  text("Rango del lockup ya verificado en las superficies actuales. Por debajo, usar la marca aprobada sólo en contextos de ícono.", 22.1, 9.3, 9.8, 2.05, { size: 11.5, color: C.inkMuted, line: 1.25 }),
  line(22.1, 12.0, 31.9, 12.0, C.mist, 0.025),
  text("REGLA", 22.1, 12.65, 4, 0.4, { size: 9, color: C.red, bold: true, tracking: 0.9 }),
  text("Escalar siempre de forma proporcional. Si el wordmark pierde legibilidad, cambiar de versión; nunca comprimir.", 22.1, 13.25, 9.8, 1.7, { size: 12, color: C.navy, bold: true, line: 1.2 }),
].join("")));

slides.push(slide("Color", 6, [
  base("Paleta y uso digital", "03 · Color", 6),
  text("Cuatro colores construyen la identidad. Los tonos auxiliares sólo derivan estados interactivos o semánticos y nunca reemplazan a los canónicos.", 1.4, 2.7, 29, 0.8, { size: 14.5, color: C.inkMuted }),
  swatch(1.4, 4.0, 7.35, 4.2, "Azul Forja", "#10294B", C.navy),
  swatch(9.25, 4.0, 7.35, 4.2, "Blanco Hueso", "#F4F1EA", C.bone, true),
  swatch(17.1, 4.0, 7.35, 4.2, "Rojo Impulso", "#D93636", C.red),
  swatch(24.95, 4.0, 7.25, 4.2, "Gris Niebla", "#A7AFBA", C.mist, true),
  card(1.4, 9.3, 9.4, 5.4, "Acción", "Rojo Impulso con texto blanco para la acción primaria. Reservarlo para decisiones y desvíos.", "", { size: 12.5 }),
  card(11.4, 9.3, 9.4, 5.4, "Estructura", "Azul Forja para marca, texto principal, navegación y tarjetas métricas de alta jerarquía.", "", { size: 12.5, accent: C.navy }),
  card(21.4, 9.3, 10.8, 5.4, "Accesibilidad", "Texto normal: contraste mínimo 4,5:1. Controles, íconos y texto grande: 3:1. No comunicar estados sólo por color; sumar etiqueta, forma o posición.", "", { size: 12.5, accent: C.mist }),
].join("")));

slides.push(slide("Tipografía", 7, [
  base("Tipografía funcional", "04 · Tipografía", 7),
  text("Inter es la voz del sistema: precisa en titulares, estable en formularios y legible en datos densos.", 1.4, 2.7, 29, 0.75, { size: 15, color: C.inkMuted }),
  text("Aa", 1.4, 4.0, 8.0, 3.3, { size: 70, color: C.red, bold: true, line: 0.9 }),
  text("Inter", 1.7, 7.25, 8.0, 0.7, { size: 24, color: C.navy, bold: true }),
  text("Familia principal · fallback compatible sans-serif", 1.7, 8.1, 8.2, 0.8, { size: 11, color: C.inkMuted }),
  rect(10.7, 4.0, 21.5, 11.0, C.white, C.mist, 0.025),
  text("Título", 11.5, 4.65, 7.0, 0.6, { size: 9, color: C.red, bold: true, tracking: 0.8 }),
  text("Entrená con evidencia", 18.5, 4.45, 12.6, 0.9, { size: 24, color: C.navy, bold: true }),
  text("INTER BOLD · 48/56", 18.5, 5.4, 11.0, 0.45, { size: 8.5, color: C.inkMuted, bold: true, tracking: 0.6 }),
  line(11.5, 6.3, 31.4, 6.3, C.pale, 0.025),
  text("Subtítulo", 11.5, 7.0, 7.0, 0.6, { size: 9, color: C.red, bold: true, tracking: 0.8 }),
  text("Progreso de la sesión", 18.5, 6.8, 12.6, 0.65, { size: 16, color: C.navy, bold: true }),
  text("INTER SEMIBOLD · 24/32", 18.5, 7.6, 11.0, 0.45, { size: 8.5, color: C.inkMuted, bold: true, tracking: 0.6 }),
  line(11.5, 8.5, 31.4, 8.5, C.pale, 0.025),
  text("Cuerpo", 11.5, 9.2, 7.0, 0.6, { size: 9, color: C.red, bold: true, tracking: 0.8 }),
  text("Registrá cada serie para revisar la carga y tomar la próxima decisión con datos claros.", 18.5, 9.05, 12.0, 1.25, { size: 11, color: C.navy, line: 1.35 }),
  text("INTER REGULAR · 16/24", 18.5, 10.45, 11.0, 0.45, { size: 8.5, color: C.inkMuted, bold: true, tracking: 0.6 }),
  line(11.5, 11.35, 31.4, 11.35, C.pale, 0.025),
  text("Botón", 11.5, 12.1, 7.0, 0.6, { size: 9, color: C.red, bold: true, tracking: 0.8 }),
  rect(18.5, 11.95, 6.4, 1.35, C.red),
  text("Guardar sesión", 18.5, 12.28, 6.4, 0.48, { size: 10.5, color: C.white, bold: true, align: "center" }),
  text("INTER SEMIBOLD · 14/20", 25.6, 12.38, 5.8, 0.45, { size: 8.5, color: C.inkMuted, bold: true, tracking: 0.5 }),
].join("")));

slides.push(slide("Lenguaje gráfico", 8, [
  base("Iconografía y lenguaje gráfico", "05 · Sistema visual", 8),
  text("La interfaz se organiza como una hoja de trabajo: reglas nítidas, numerales dominantes y señales que siempre acompañan texto.", 1.4, 2.7, 29.2, 0.8, { size: 14.5, color: C.inkMuted }),
  card(1.4, 4.15, 9.6, 5.0, "Iconografía", "Trazos simples y consistentes. Tamaños de 16–24 px. El ícono aclara una acción; no reemplaza su etiqueta.", "01", { size: 12.5 }),
  card(11.6, 4.15, 9.6, 5.0, "Reglas", "Bordes completos y líneas horizontales estructuran tablas, módulos y formularios. Sin sombras decorativas.", "02", { size: 12.5, accent: C.navy }),
  card(21.8, 4.15, 10.4, 5.0, "Datos", "Cargas, repeticiones, sets y tiempos usan cifras tabulares y una jerarquía mayor que la iconografía.", "03", { size: 12.5, accent: C.mist }),
  rect(1.4, 10.25, 30.8, 4.7, C.navy),
  text("01", 2.1, 11.05, 2.0, 1.0, { size: 27, color: C.red, bold: true }),
  text("SESIÓN", 4.1, 11.15, 5.0, 0.45, { size: 9, color: C.mist, bold: true, tracking: 1 }),
  text("Sentadilla", 4.1, 11.85, 6.2, 0.65, { size: 17, color: C.bone, bold: true }),
  line(11.0, 10.9, 11.0, 14.3, C.mist, 0.02),
  text("120", 12.0, 10.95, 4.0, 1.2, { size: 34, color: C.bone, bold: true, align: "center" }),
  text("KG", 12.0, 12.3, 4.0, 0.4, { size: 8.5, color: C.mist, bold: true, align: "center", tracking: 1 }),
  line(17.0, 10.9, 17.0, 14.3, C.mist, 0.02),
  text("5 × 5", 18.0, 11.25, 5.0, 0.9, { size: 25, color: C.bone, bold: true, align: "center" }),
  text("SERIES × REPS", 18.0, 12.3, 5.0, 0.4, { size: 8.5, color: C.mist, bold: true, align: "center", tracking: 0.8 }),
  rect(25.0, 11.25, 5.5, 1.4, C.red),
  text("Registrar", 25.0, 11.62, 5.5, 0.45, { size: 11, color: C.white, bold: true, align: "center" }),
].join("")));

slides.push(slide("Componentes", 9, [
  base("Componentes, tokens y tema", "06 · Producto digital", 9),
  text("Los componentes traducen la marca en decisiones visibles y conservan su jerarquía en tema claro, oscuro o del sistema.", 1.4, 2.7, 29.5, 0.7, { size: 14.5, color: C.inkMuted }),
  rect(1.4, 4.0, 9.5, 10.8, C.white, C.mist, 0.025),
  text("ACCIONES", 2.05, 4.65, 5, 0.45, { size: 9, color: C.red, bold: true, tracking: 1 }),
  rect(2.05, 5.6, 7.2, 1.35, C.red),
  text("Guardar sesión", 2.05, 5.95, 7.2, 0.45, { size: 10.5, color: C.white, bold: true, align: "center" }),
  rect(2.05, 7.55, 7.2, 1.35, C.white, C.navy, 0.025),
  text("Ver historial", 2.05, 7.9, 7.2, 0.45, { size: 10.5, color: C.navy, bold: true, align: "center" }),
  text("Primaria: Rojo Impulso. Secundaria: papel y borde Azul Forja. Altura táctil mínima: 44 px.", 2.05, 9.8, 7.6, 2.0, { size: 11, color: C.inkMuted, line: 1.3 }),
  rect(11.6, 4.0, 9.5, 10.8, C.navy),
  image(markNegative, 18.55, 4.35, 1.85, 1.85),
  text("TEMA OSCURO", 12.25, 4.65, 5, 0.45, { size: 9, color: C.red, bold: true, tracking: 1 }),
  text("VOLUMEN", 12.25, 5.65, 6, 0.4, { size: 8.5, color: C.mist, bold: true, tracking: 0.8 }),
  text("4.250", 12.25, 6.2, 7.6, 1.1, { size: 31, color: C.bone, bold: true }),
  text("kg registrados", 12.25, 7.45, 7, 0.45, { size: 10, color: C.mist }),
  line(12.25, 8.4, 20.25, 8.4, C.mist, 0.02),
  text("RPE MEDIO", 12.25, 9.15, 6, 0.4, { size: 8.5, color: C.mist, bold: true, tracking: 0.8 }),
  text("7,8", 12.25, 9.7, 7.6, 1.1, { size: 31, color: C.bone, bold: true }),
  text("Azul Forja como lienzo; superficies elevadas azul suave, texto Hueso y logo negativo.", 12.25, 11.6, 7.7, 1.5, { size: 10.5, color: C.mist, line: 1.25 }),
  rect(21.8, 4.0, 10.4, 10.8, C.white, C.mist, 0.025),
  text("MÓDULO DE CICLO", 22.45, 4.65, 6.5, 0.45, { size: 9, color: C.red, bold: true, tracking: 1 }),
  ...["Programar", "Ejecutar", "Detectar", "Revisar", "Ajustar"].flatMap((label, i) => [
    text(`0${i + 1}`, 22.45, 5.65 + i * 1.55, 1.1, 0.45, { size: 10, color: i === 1 ? C.red : C.mist, bold: true }),
    text(label, 23.8, 5.58 + i * 1.55, 6.7, 0.55, { size: 12.5, color: C.navy, bold: i === 1 }),
    i < 4 ? line(23.0, 6.15 + i * 1.55, 23.0, 6.85 + i * 1.55, C.mist, 0.02) : "",
  ]),
].flat().join("")));

slides.push(slide("Aplicaciones", 10, [
  base("Aplicaciones clave", "07 · Contextos", 10),
  text("La marca se expresa en tres momentos del producto: preparar, registrar y revisar.", 1.4, 2.7, 28.5, 0.7, { size: 15, color: C.inkMuted }),
  card(1.4, 4.0, 9.6, 10.7, "Entrenamiento", "La siguiente acción domina. Carga, repeticiones y descanso se leen de inmediato. Los controles respetan el uso táctil.", "01", { size: 12.5 }),
  rect(2.05, 9.2, 8.3, 4.5, C.navy),
  text("PRÓXIMA SERIE", 2.55, 9.75, 5, 0.4, { size: 8.5, color: C.mist, bold: true, tracking: 0.8 }),
  text("5 × 120 kg", 2.55, 10.35, 6.7, 0.8, { size: 22, color: C.bone, bold: true }),
  rect(2.55, 11.55, 6.2, 1.15, C.red),
  text("Registrar", 2.55, 11.84, 6.2, 0.42, { size: 10, color: C.white, bold: true, align: "center" }),
  card(11.6, 4.0, 9.6, 10.7, "Registro", "Los formularios funcionan como hojas de evidencia: campos rectos, etiquetas claras y una sola acción primaria.", "02", { size: 12.5, accent: C.navy }),
  rect(12.25, 9.2, 8.3, 1.2, C.white, C.mist, 0.025),
  text("117,5 kg", 12.65, 9.52, 5.5, 0.45, { size: 10.5, color: C.navy }),
  rect(12.25, 10.9, 8.3, 1.2, C.white, C.mist, 0.025),
  text("5 repeticiones", 12.65, 11.22, 5.5, 0.45, { size: 10.5, color: C.navy }),
  card(21.8, 4.0, 10.4, 10.7, "Revisión", "La comparación plan versus ejecución usa filas, reglas y estados escritos. El color orienta, pero nunca es la única señal.", "03", { size: 12.5, accent: C.mist }),
  rect(22.45, 9.2, 9.1, 3.7, C.navy),
  text("PLAN", 22.95, 9.7, 3.0, 0.4, { size: 8.5, color: C.mist, bold: true }),
  text("120 kg", 22.95, 10.3, 3.3, 0.55, { size: 15, color: C.bone, bold: true }),
  text("HECHO", 27.1, 9.7, 3.0, 0.4, { size: 8.5, color: C.mist, bold: true }),
  text("117,5 kg", 27.1, 10.3, 3.9, 0.55, { size: 15, color: C.bone, bold: true }),
  text("REVISAR", 27.1, 11.35, 3.6, 0.4, { size: 8.5, color: C.red, bold: true, tracking: 0.7 }),
].join("")));

slides.push(slide("Usos", 11, [
  base("Uso correcto e incorrecto", "08 · Guardas", 11),
  rect(1.4, 3.0, 14.8, 12.2, C.white, C.green, 0.04),
  text("CORRECTO", 2.05, 3.65, 5.5, 0.45, { size: 9, color: C.green, bold: true, tracking: 1 }),
  image(lockup, 3.6, 4.75, 10.4, 4.16),
  text("✓ Mantener proporción y área libre.", 2.05, 9.35, 12.6, 0.55, { size: 12.5, color: C.navy, bold: true }),
  text("✓ Usar los archivos aprobados y los colores canónicos.", 2.05, 10.25, 12.6, 0.8, { size: 12.5, color: C.navy, bold: true }),
  text("✓ Asegurar legibilidad y contraste en cada superficie.", 2.05, 11.35, 12.6, 0.8, { size: 12.5, color: C.navy, bold: true }),
  text("✓ Preferir el lockup; reservar la marca para íconos.", 2.05, 12.45, 12.6, 0.8, { size: 12.5, color: C.navy, bold: true }),
  rect(17.4, 3.0, 14.8, 12.2, C.white, C.red, 0.04),
  text("INCORRECTO", 18.05, 3.65, 5.5, 0.45, { size: 9, color: C.red, bold: true, tracking: 1 }),
  rect(19.1, 4.65, 11.4, 3.55, C.pale, C.red, 0.025),
  text("FORJA", 20.1, 5.6, 9.4, 0.9, { size: 28, color: C.red, bold: true, align: "center", tracking: 2 }),
  text("Representación didáctica de un uso prohibido; no es una versión del logo.", 19.15, 8.35, 11.3, 0.7, { size: 8.5, color: C.inkMuted, align: "center" }),
  text("× No estirar, comprimir ni alterar proporciones.", 18.05, 9.35, 12.8, 0.8, { size: 12.5, color: C.navy, bold: true }),
  text("× No cambiar colores ni crear combinaciones nuevas.", 18.05, 10.45, 12.8, 0.8, { size: 12.5, color: C.navy, bold: true }),
  text("× No sustituir el wordmark ni redibujar la geometría.", 18.05, 11.55, 12.8, 0.8, { size: 12.5, color: C.navy, bold: true }),
  text("× No aplicar sobre fondos que oculten la marca.", 18.05, 12.65, 12.8, 0.8, { size: 12.5, color: C.navy, bold: true }),
].join("")));

slides.push(slide("Implementación", 12, [
  base("Lista de implementación", "09 · Puesta en práctica", 12, true),
  text("Una aplicación está lista cuando la identidad, la jerarquía y la accesibilidad funcionan como un solo sistema.", 1.4, 2.7, 29, 0.8, { size: 15, color: C.mist }),
  ...[
    ["01", "Logo", "Usar public/brand; mantener proporción, área libre y versión adecuada."],
    ["02", "Color y tema", "Aplicar tokens semánticos; respetar Claro, Oscuro y Sistema sin destellos."],
    ["03", "Tipografía", "Usar Inter con la jerarquía definida y cifras tabulares en métricas."],
    ["04", "Componentes", "Reservar Rojo Impulso para CTA primaria, decisión o desvío."],
    ["05", "Accesibilidad", "Verificar contraste, foco visible, etiquetas y objetivos táctiles."],
    ["06", "Contenido", "Mantener una voz precisa, sobria y vinculada a evidencia real."],
  ].flatMap(([index, label, body], i) => {
    const y = 4.25 + i * 1.85;
    return [
      text(index, 1.4, y, 1.2, 0.55, { size: 12, color: C.red, bold: true }),
      text(label, 2.9, y - 0.05, 4.5, 0.6, { size: 15, color: C.bone, bold: true }),
      text(body, 8.0, y, 22.8, 0.75, { size: 11.5, color: C.mist, line: 1.2 }),
      line(2.9, y + 0.95, 31.7, y + 0.95, C.navySoft, 0.025),
    ];
  }),
  footer(12, true),
].flat().join("")));

const fodp = `<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0" xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0" xmlns:draw="urn:oasis:names:tc:opendocument:xmlns:drawing:1.0" xmlns:presentation="urn:oasis:names:tc:opendocument:xmlns:presentation:1.0" xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0" xmlns:xlink="http://www.w3.org/1999/xlink" xmlns:svg="urn:oasis:names:tc:opendocument:xmlns:svg-compatible:1.0" office:version="1.3" office:mimetype="application/vnd.oasis.opendocument.presentation">
  <office:font-face-decls><style:font-face style:name="Body" svg:font-family="${FONT}" style:font-family-generic="swiss" style:font-pitch="variable"/></office:font-face-decls>
  <office:styles><style:default-style style:family="paragraph"><style:paragraph-properties fo:orphans="2" fo:widows="2"/><style:text-properties style:font-name="Body" fo:font-size="16pt"/></style:default-style></office:styles>
  <office:automatic-styles>
    <style:page-layout style:name="PM1"><style:page-layout-properties fo:page-width="${cm(PAGE_W)}" fo:page-height="${cm(PAGE_H)}" style:print-orientation="landscape" presentation:display-header="false" presentation:display-footer="false" presentation:display-page-number="false" presentation:display-date-time="false"/></style:page-layout>
    <style:style style:name="dp1" style:family="drawing-page"><style:drawing-page-properties draw:fill="solid" draw:fill-color="${C.bone}" presentation:background-visible="true" presentation:background-objects-visible="true"/></style:style>
    ${automaticStyles.join("\n")}
  </office:automatic-styles>
  <office:master-styles><style:master-page style:name="Default" style:page-layout-name="PM1" draw:style-name="dp1"/></office:master-styles>
  <office:body><office:presentation>${slides.join("\n")}</office:presentation></office:body>
</office:document>`;

try {
  writeFileSync(fodpPath, fodp);
  execFileSync("libreoffice", ["--headless", "--convert-to", "pptx", "--outdir", here, fodpPath], { stdio: "inherit" });
  execFileSync("libreoffice", ["--headless", "--convert-to", "pdf", "--outdir", here, join(here, `${outputBase}.pptx`)], { stdio: "inherit" });
  console.log(`Generated ${join(here, `${outputBase}.pptx`)}`);
  console.log(`Generated ${join(here, `${outputBase}.pdf`)}`);
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
