import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

type ContrastCheck = {
  foreground: string;
  background: string;
  ratio: number;
  normalText: "AA" | "AAA";
};

const palette = JSON.parse(
  readFileSync(new URL("../docs/design/forja-landing-palette.json", import.meta.url), "utf8")
) as {
  contrastChecks: ContrastCheck[];
  semantic: {
    heroGradient: { from: string; to: string; foreground: string };
    primaryAction: { default: string; hover: string; foreground: string };
    secondaryInk: string;
    canvas: string;
  };
};

function relativeLuminance(hex: string) {
  const channels = hex.match(/[\da-f]{2}/gi)?.map((channel) => Number.parseInt(channel, 16) / 255);
  assert.ok(channels && channels.length === 3, `Invalid color: ${hex}`);

  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}

function contrastRatio(first: string, second: string) {
  const luminances = [relativeLuminance(first), relativeLuminance(second)].sort((a, b) => b - a);
  return (luminances[0] + 0.05) / (luminances[1] + 0.05);
}

test("records accurate WCAG ratios and classifications", () => {
  for (const check of palette.contrastChecks) {
    const measured = contrastRatio(check.foreground, check.background);
    assert.ok(Math.abs(measured - check.ratio) < 0.01, `${check.foreground} on ${check.background}`);
    assert.ok(measured >= 4.5, `${check.foreground} on ${check.background} must pass AA`);
    assert.equal(check.normalText, measured >= 7 ? "AAA" : "AA");
  }
});

test("keeps hero and primary controls on the selected semantic colors", () => {
  const { heroGradient, primaryAction, secondaryInk, canvas } = palette.semantic;

  assert.ok(contrastRatio(heroGradient.foreground, heroGradient.from) >= 7);
  assert.ok(contrastRatio(heroGradient.foreground, heroGradient.to) >= 7);
  assert.ok(contrastRatio(primaryAction.foreground, primaryAction.default) >= 4.5);
  assert.ok(contrastRatio(primaryAction.foreground, primaryAction.hover) >= 7);
  assert.ok(contrastRatio(secondaryInk, canvas) >= 4.5);
});
