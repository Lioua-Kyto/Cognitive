import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

// Resolved from the vitest root rather than import.meta.url: under the jsdom
// environment that URL is not a file: URL.
const read = (p) => readFileSync(resolve(process.cwd(), p), "utf8");
const theme = read("src/styles/theme.css");
const legacy = read("src/layout.css");

/**
 * These guard two failures that cost real debugging time and would be silent if
 * they came back: text rendered invisible on the shell's own background, and
 * scroll-driven motion dying because the document cannot scroll.
 *
 * They assert on stylesheet content because jsdom does no layout — it cannot
 * tell you the page scrolls. A content assertion is weaker than a rendered
 * check, but it is strictly better than a comment nobody reads.
 */
describe("theme overrides the legacy app shell", () => {
  it("still needs to: layout.css sets overflow:hidden on the shell", () => {
    // If this fails, layout.css has been retired and the overrides below — and
    // this whole test — can go with it.
    expect(legacy).toMatch(/overflow:\s*hidden/);
  });

  it("returns html, body, #root and .app-container to document flow", () => {
    // The vibecoded shell scrolled an inner div. ScrollTrigger's default
    // scroller is the window, so nothing scroll-driven could ever fire, and
    // 100vh stopped meaning the viewport.
    for (const selector of ["#root", ".app-container"]) {
      expect(theme).toContain(selector);
    }
    expect(theme).toMatch(/html,\s*\n?body\s*\{[^}]*overflow-y:\s*visible/);
    expect(theme).toMatch(/#root\s*\{[^}]*overflow:\s*visible/);
  });

  it("paints the shell containers with the token ground", () => {
    // .main-content sets its own background, so theming body alone left every
    // redesigned surface as light text on a light ground.
    expect(theme).toMatch(
      /\.app-container,\s*\n\.main-content,\s*\n\.scrollable-content\s*\{[^}]*--color-ground/
    );
  });

  it("declares the legacy layer before Tailwind's, so utilities win", () => {
    // Unlayered CSS beats layered CSS regardless of import order; the legacy
    // sheets are wrapped in layer(legacy) and that layer must sort first.
    const layerAt = theme.indexOf("@layer legacy");
    const tailwindAt = theme.indexOf('@import "tailwindcss"');
    expect(layerAt).toBeGreaterThanOrEqual(0);
    expect(tailwindAt).toBeGreaterThan(layerAt);
  });
});
