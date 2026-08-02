#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { copyFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "../..");
const brandDir = join(root, "public/brand");
const appDir = join(root, "src/app");
const tempDir = mkdtempSync(join(tmpdir(), "forja-assets-"));

const C = {
  navy: "#10294B",
  bone: "#F4F1EA",
  red: "#D93636",
};

function magick(...args) {
  execFileSync("magick", args, { stdio: "inherit" });
}

function normalize(source, width, height, prefix) {
  const alpha = join(tempDir, `${prefix}-alpha.png`);
  const redClass = join(tempDir, `${prefix}-red-class.png`);
  const redMask = join(tempDir, `${prefix}-red-mask.png`);
  const navyMask = join(tempDir, `${prefix}-navy-mask.png`);
  const redLayer = join(tempDir, `${prefix}-red-layer.png`);
  const navyLayer = join(tempDir, `${prefix}-navy-layer.png`);
  const boneLayer = join(tempDir, `${prefix}-bone-layer.png`);
  const positive = join(tempDir, `${prefix}-positive.png`);
  const negative = join(tempDir, `${prefix}-negative.png`);

  // The approved silhouette is the high-opacity core. The discarded pixels are
  // the diffuse red haze, not part of the mark geometry.
  magick(source, "-alpha", "extract", "-threshold", "70%", alpha);
  magick(source, "-alpha", "off", "-fx", "r>g*1.3&&r>b*1.3?1:0", "-threshold", "50%", redClass);
  magick(alpha, redClass, "-compose", "Multiply", "-composite", redMask);
  magick(alpha, redMask, "-compose", "MinusSrc", "-composite", navyMask);
  magick("-size", `${width}x${height}`, `xc:${C.red}`, redMask, "-alpha", "off", "-compose", "CopyOpacity", "-composite", redLayer);
  magick("-size", `${width}x${height}`, `xc:${C.navy}`, navyMask, "-alpha", "off", "-compose", "CopyOpacity", "-composite", navyLayer);
  magick("-size", `${width}x${height}`, `xc:${C.bone}`, navyMask, "-alpha", "off", "-compose", "CopyOpacity", "-composite", boneLayer);
  magick(navyLayer, redLayer, "-compose", "Over", "-composite", positive);
  magick(boneLayer, redLayer, "-compose", "Over", "-composite", negative);

  return { positive, negative };
}

function appIcon(mark, size, background, output) {
  const artwork = Math.round(size * 0.78);
  magick(mark, "-resize", `${artwork}x${artwork}`, "-background", background, "-gravity", "center", "-extent", `${size}x${size}`, output);
}

try {
  const lockupSource = join(brandDir, "forja-lockup-source.png");
  const markSource = join(brandDir, "forja-mark-source.png");
  const lockup = normalize(lockupSource, 700, 280, "lockup");
  const mark = normalize(markSource, 260, 260, "mark");

  copyFileSync(lockup.positive, lockupSource);
  copyFileSync(lockup.negative, join(brandDir, "forja-lockup-negative-source.png"));
  copyFileSync(mark.positive, markSource);
  copyFileSync(mark.negative, join(brandDir, "forja-mark-negative-source.png"));

  magick(lockup.positive, "-resize", "350x140", join(brandDir, "forja-lockup-350.png"));
  magick(lockup.negative, "-resize", "350x140", join(brandDir, "forja-lockup-negative-350.png"));

  const positive192 = join(brandDir, "forja-mark-192.png");
  const positive512 = join(brandDir, "forja-mark-512.png");
  appIcon(mark.positive, 192, C.bone, positive192);
  appIcon(mark.positive, 512, C.bone, positive512);
  appIcon(mark.negative, 192, C.navy, join(brandDir, "forja-mark-negative-192.png"));
  appIcon(mark.negative, 512, C.navy, join(brandDir, "forja-mark-negative-512.png"));

  magick(positive512, "-resize", "180x180", join(appDir, "apple-icon.png"));
  copyFileSync(positive512, join(appDir, "icon.png"));
  magick(positive192, "-define", "icon:auto-resize=48,32,16", join(appDir, "favicon.ico"));
  console.log("Generated crisp positive, negative, icon, and app brand assets.");
} finally {
  rmSync(tempDir, { recursive: true, force: true });
}
