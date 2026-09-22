import { describe, expect, test } from "bun:test";
import { canvasAppearanceForWorkspace, normalizeCanvasAppearance } from "../src/lib/canvas/canvas-appearance";

describe("canvas appearance and workspace theme", () => {
    test("existing fixed appearance follows the dark workspace", () => {
        expect(canvasAppearanceForWorkspace({ mode: "light" }, "dark")).toEqual({ mode: "dark" });
        expect(canvasAppearanceForWorkspace(undefined, "dark")).toEqual({ mode: "dark" });
    });

    test("explicit canvas selection survives project normalization", () => {
        const selected = normalizeCanvasAppearance({ mode: "light", userSelected: true }, "dark");
        expect(canvasAppearanceForWorkspace(selected, "dark")).toEqual(selected);
    });

    test("custom canvas appearance remains independent", () => {
        const custom = {
            mode: "custom" as const,
            custom: { baseTheme: "light" as const, backgroundColor: "#F0F0F0", backgroundBrightness: 0, gridColor: "#000000", gridOpacity: 80 },
        };
        expect(canvasAppearanceForWorkspace(custom, "dark")).toEqual(custom);
    });
});
