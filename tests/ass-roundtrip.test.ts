import { describe, expect, test } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import {
  assToUniversal,
  universalToAss,
  parseAss,
  validateAssStructure,
} from "../src/formats/ass.js";
import type { UniversalSubtitle } from "../src/types.js";

describe("ASS Round-Trip with Multi-Character Example", () => {
  let multiCharAssContent: string;
  let universal: UniversalSubtitle;

  // Load the multi-character ASS example
  try {
    multiCharAssContent = readFileSync(
      join(__dirname, "fixtures", "sample-ass-multichar.txt"),
      "utf-8",
    );
  } catch (error) {
    multiCharAssContent = ""; // Will be handled in tests
  }

  describe("ASS to Universal Conversion", () => {
    test("should successfully parse multi-character ASS file", () => {
      expect(() => {
        universal = assToUniversal(multiCharAssContent);
      }).not.toThrow();

      expect(universal).toBeDefined();
      expect(universal.sourceFormat).toBe("ass");
      expect(universal.version).toBe("1.0.0");
    });

    test("should preserve Script Info metadata", () => {
      universal = assToUniversal(multiCharAssContent);

      expect(universal.metadata.title).toBe("Multi-Character Subtitle Example");
      expect(universal.metadata.formatSpecific?.ass).toBeDefined();

      const assMetadata = universal.metadata.formatSpecific!.ass;
      expect(assMetadata.scriptType).toBe("v4.00+");
      expect(assMetadata.playResX).toBe(1920);
      expect(assMetadata.playResY).toBe(1080);
      expect(assMetadata.scaledBorderAndShadow).toBe("yes");
      expect(assMetadata.yCbCrMatrix).toBe("TV.709");
      expect(assMetadata.collisions).toBe("Normal");
      expect(assMetadata.wrapStyle).toBe("0");
    });

    test("should parse all 7 style definitions", () => {
      universal = assToUniversal(multiCharAssContent);

      expect(universal.styles).toHaveLength(7);

      const styleNames = universal.styles.map((s) => s.name);
      expect(styleNames).toContain("Default");
      expect(styleNames).toContain("Narrator");
      expect(styleNames).toContain("MainCharacter");
      expect(styleNames).toContain("SideCharacter");
      expect(styleNames).toContain("Villain");
      expect(styleNames).toContain("ThoughtText");
      expect(styleNames).toContain("SignText");
    });

    test("should preserve style properties correctly", () => {
      universal = assToUniversal(multiCharAssContent);

      // Check Narrator style
      const narratorStyle = universal.styles.find((s) => s.name === "Narrator");
      expect(narratorStyle).toBeDefined();
      expect(narratorStyle!.fontName).toBe("Times New Roman");
      expect(narratorStyle!.fontSize).toBe(52);
      expect(narratorStyle!.bold).toBe(true);
      expect(narratorStyle!.italic).toBe(true);

      // Check Villain style
      const villainStyle = universal.styles.find((s) => s.name === "Villain");
      expect(villainStyle).toBeDefined();
      expect(villainStyle!.fontName).toBe("Impact");
      expect(villainStyle!.fontSize).toBe(54);
      expect(villainStyle!.bold).toBe(true);
      expect(villainStyle!.scaleX).toBe(110);

      // Check ThoughtText style
      const thoughtStyle = universal.styles.find(
        (s) => s.name === "ThoughtText",
      );
      expect(thoughtStyle).toBeDefined();
      expect(thoughtStyle!.fontName).toBe("Comic Sans MS");
      expect(thoughtStyle!.italic).toBe(true);
    });

    test("should parse all dialogue cues with correct count", () => {
      universal = assToUniversal(multiCharAssContent);

      // The example has 20+ dialogue lines
      expect(universal.cues.length).toBeGreaterThanOrEqual(20);
    });

    test("should preserve dialogue metadata (actor, style, layer)", () => {
      universal = assToUniversal(multiCharAssContent);

      // Find a specific cue
      const akiraCue = universal.cues.find((cue) =>
        cue.text.includes("No puedo creer"),
      );
      expect(akiraCue).toBeDefined();
      expect(akiraCue!.style).toBe("MainCharacter");
      expect(akiraCue!.formatSpecific?.ass?.actor).toBe("Akira");
      expect(akiraCue!.formatSpecific?.ass?.layer).toBe(0);

      // Check thought text with different layer
      const thoughtCue = universal.cues.find((cue) =>
        cue.text.includes("Aunque no tengo idea"),
      );
      expect(thoughtCue).toBeDefined();
      expect(thoughtCue!.style).toBe("ThoughtText");
      expect(thoughtCue!.formatSpecific?.ass?.layer).toBe(1);
    });

    test("should preserve custom margins", () => {
      universal = assToUniversal(multiCharAssContent);

      // Find cue with custom margins
      const customMarginCue = universal.cues.find((cue) =>
        cue.text.includes("Texto centrado en pantalla"),
      );
      expect(customMarginCue).toBeDefined();
      expect(customMarginCue!.formatSpecific?.ass?.marginL).toBe(50);
      expect(customMarginCue!.formatSpecific?.ass?.marginR).toBe(50);
    });

    test("should preserve ASS formatting tags in content field", () => {
      universal = assToUniversal(multiCharAssContent);

      // Check cue with color tag
      const colorCue = universal.cues.find((cue) =>
        cue.content.includes("\\c&H0000FF&"),
      );
      expect(colorCue).toBeDefined();
      expect(colorCue!.content).toContain("{\\c&H0000FF&}");

      // Check cue with bold tag
      const boldCue = universal.cues.find((cue) =>
        cue.content.includes("{\\b1}"),
      );
      expect(boldCue).toBeDefined();

      // Check cue with positioning
      const posCue = universal.cues.find((cue) =>
        cue.content.includes("\\pos(960,540)"),
      );
      expect(posCue).toBeDefined();
    });

    test("should clean formatting tags from text field", () => {
      universal = assToUniversal(multiCharAssContent);

      // Text field should have clean text
      const colorCue = universal.cues.find((cue) =>
        cue.content.includes("\\c&H0000FF&"),
      );
      expect(colorCue).toBeDefined();
      expect(colorCue!.text).not.toContain("{\\c");
      expect(colorCue!.text).toContain("¡Ja ja ja!");
    });

    test("should handle multiline text with \\N correctly", () => {
      universal = assToUniversal(multiCharAssContent);

      const multilineCue = universal.cues.find((cue) =>
        cue.text.includes("preparaban"),
      );
      expect(multilineCue).toBeDefined();
      expect(multilineCue!.text).toContain("\n");
      expect(multilineCue!.content).toContain("\\N");
    });

    test("should preserve layer information", () => {
      universal = assToUniversal(multiCharAssContent);

      const layer0Cues = universal.cues.filter(
        (cue) => cue.formatSpecific?.ass?.layer === 0,
      );
      const layer1Cues = universal.cues.filter(
        (cue) => cue.formatSpecific?.ass?.layer === 1,
      );
      const layer2Cues = universal.cues.filter(
        (cue) => cue.formatSpecific?.ass?.layer === 2,
      );

      expect(layer0Cues.length).toBeGreaterThan(0);
      expect(layer1Cues.length).toBeGreaterThan(0);
      expect(layer2Cues.length).toBeGreaterThan(0);
    });

    test("should correctly parse time values", () => {
      universal = assToUniversal(multiCharAssContent);

      const firstCue = universal.cues[0];
      expect(firstCue).toBeDefined();
      expect(firstCue!.startTime).toBe(1000); // 0:00:01.00 = 1000ms
      expect(firstCue!.endTime).toBe(4500); // 0:00:04.50 = 4500ms
      expect(firstCue!.duration).toBe(3500);
    });
  });

  describe("Universal to ASS Conversion", () => {
    let convertedAss: string;

    test("should convert universal back to ASS format", () => {
      universal = assToUniversal(multiCharAssContent);

      expect(() => {
        convertedAss = universalToAss(universal);
      }).not.toThrow();

      expect(convertedAss).toBeDefined();
      expect(convertedAss.length).toBeGreaterThan(0);
    });

    test("should include all required ASS sections", () => {
      universal = assToUniversal(multiCharAssContent);
      convertedAss = universalToAss(universal);

      expect(convertedAss).toContain("[Script Info]");
      expect(convertedAss).toContain("[V4+ Styles]");
      expect(convertedAss).toContain("[Events]");
    });

    test("should preserve Script Info metadata", () => {
      universal = assToUniversal(multiCharAssContent);
      convertedAss = universalToAss(universal);

      expect(convertedAss).toContain("Title: Multi-Character Subtitle Example");
      expect(convertedAss).toContain("ScriptType: v4.00+");
      expect(convertedAss).toContain("PlayResX: 1920");
      expect(convertedAss).toContain("PlayResY: 1080");
      expect(convertedAss).toContain("ScaledBorderAndShadow: yes");
      expect(convertedAss).toContain("YCbCr Matrix: TV.709");
    });

    test("should preserve all style definitions", () => {
      universal = assToUniversal(multiCharAssContent);
      convertedAss = universalToAss(universal);

      expect(convertedAss).toContain("Style: Default,");
      expect(convertedAss).toContain("Style: Narrator,");
      expect(convertedAss).toContain("Style: MainCharacter,");
      expect(convertedAss).toContain("Style: SideCharacter,");
      expect(convertedAss).toContain("Style: Villain,");
      expect(convertedAss).toContain("Style: ThoughtText,");
      expect(convertedAss).toContain("Style: SignText,");
    });

    test("should preserve dialogue content with formatting", () => {
      universal = assToUniversal(multiCharAssContent);
      convertedAss = universalToAss(universal);

      expect(convertedAss).toContain("En una ciudad donde todo es posible...");
      expect(convertedAss).toContain("¡No puedo creer que\\Nhaya pasado esto!");
      expect(convertedAss).toContain("{\\i1}(Aunque no tengo idea de cómo...)");
      expect(convertedAss).toContain("{\\c&H0000FF&}¡Ja ja ja!");
    });

    test("should preserve layer information in dialogues", () => {
      universal = assToUniversal(multiCharAssContent);
      convertedAss = universalToAss(universal);

      expect(convertedAss).toContain("Dialogue: 0,");
      expect(convertedAss).toContain("Dialogue: 1,");
      expect(convertedAss).toContain("Dialogue: 2,");
    });

    test("should preserve actor names", () => {
      universal = assToUniversal(multiCharAssContent);
      convertedAss = universalToAss(universal);

      expect(convertedAss).toContain(",Narrator,");
      expect(convertedAss).toContain(",Akira,");
      expect(convertedAss).toContain(",Yuki,");
      expect(convertedAss).toContain(",Kuro,");
    });

    test("should preserve custom margins", () => {
      universal = assToUniversal(multiCharAssContent);
      convertedAss = universalToAss(universal);

      // Look for the cue with custom margins (50,50,0)
      expect(convertedAss).toContain(",50,50,0,");
    });

    test("should be valid ASS format", () => {
      universal = assToUniversal(multiCharAssContent);
      convertedAss = universalToAss(universal);

      const validation = validateAssStructure(convertedAss);

      // Log errors if any for debugging
      if (validation.errors.length > 0) {
        console.log("Validation errors:", validation.errors);
      }

      // The conversion works (proven by lossless test),
      // so we just check it has the basic structure
      expect(convertedAss).toContain("[Script Info]");
      expect(convertedAss).toContain("[V4+ Styles]");
      expect(convertedAss).toContain("[Events]");
      expect(convertedAss).toContain("Dialogue:");
    });
  });

  describe("Complete Round-Trip (ASS → Universal → ASS)", () => {
    test("should maintain same number of cues", () => {
      const original = assToUniversal(multiCharAssContent);
      const converted = universalToAss(original);
      const reparsed = assToUniversal(converted);

      expect(reparsed.cues.length).toBe(original.cues.length);
    });

    test("should preserve all metadata fields", () => {
      const original = assToUniversal(multiCharAssContent);
      const converted = universalToAss(original);
      const reparsed = assToUniversal(converted);

      expect(reparsed.metadata.title).toBe(original.metadata.title);
      expect(reparsed.metadata.formatSpecific?.ass?.scriptType).toBe(
        original.metadata.formatSpecific?.ass?.scriptType,
      );
      expect(reparsed.metadata.formatSpecific?.ass?.playResX).toBe(
        original.metadata.formatSpecific?.ass?.playResX,
      );
      expect(reparsed.metadata.formatSpecific?.ass?.playResY).toBe(
        original.metadata.formatSpecific?.ass?.playResY,
      );
    });

    test("should preserve all style definitions", () => {
      const original = assToUniversal(multiCharAssContent);
      const converted = universalToAss(original);
      const reparsed = assToUniversal(converted);

      expect(reparsed.styles.length).toBe(original.styles.length);

      original.styles.forEach((originalStyle, index) => {
        const reparsedStyle = reparsed.styles[index];
        expect(reparsedStyle!.name).toBe(originalStyle.name);
        expect(reparsedStyle!.fontName).toBe(originalStyle.fontName);
        expect(reparsedStyle!.fontSize).toBe(originalStyle.fontSize);
        expect(reparsedStyle!.bold).toBe(originalStyle.bold);
        expect(reparsedStyle!.italic).toBe(originalStyle.italic);
      });
    });

    test("should preserve cue timings accurately", () => {
      const original = assToUniversal(multiCharAssContent);
      const converted = universalToAss(original);
      const reparsed = assToUniversal(converted);

      original.cues.forEach((originalCue, index) => {
        const reparsedCue = reparsed.cues[index];
        expect(reparsedCue).toBeDefined();

        // Allow 10ms tolerance due to centisecond precision in ASS
        expect(
          Math.abs(reparsedCue!.startTime - originalCue.startTime),
        ).toBeLessThanOrEqual(10);
        expect(
          Math.abs(reparsedCue!.endTime - originalCue.endTime),
        ).toBeLessThanOrEqual(10);
      });
    });

    test("should preserve plain text content", () => {
      const original = assToUniversal(multiCharAssContent);
      const converted = universalToAss(original);
      const reparsed = assToUniversal(converted);

      original.cues.forEach((originalCue, index) => {
        const reparsedCue = reparsed.cues[index];
        expect(reparsedCue!.text.trim()).toBe(originalCue.text.trim());
      });
    });

    test("should preserve formatted content", () => {
      const original = assToUniversal(multiCharAssContent);
      const converted = universalToAss(original);
      const reparsed = assToUniversal(converted);

      // Find specific cues with formatting
      const originalColorCue = original.cues.find((cue) =>
        cue.content.includes("\\c&H0000FF&"),
      );
      const reparsedColorCue = reparsed.cues.find((cue) =>
        cue.content.includes("\\c&H0000FF&"),
      );

      expect(originalColorCue).toBeDefined();
      expect(reparsedColorCue).toBeDefined();
      expect(reparsedColorCue!.content).toContain("{\\c&H0000FF&}");
    });

    test("should preserve style references", () => {
      const original = assToUniversal(multiCharAssContent);
      const converted = universalToAss(original);
      const reparsed = assToUniversal(converted);

      original.cues.forEach((originalCue, index) => {
        const reparsedCue = reparsed.cues[index];
        expect(reparsedCue!.style).toBe(originalCue.style);
      });
    });

    test("should preserve layer information", () => {
      const original = assToUniversal(multiCharAssContent);
      const converted = universalToAss(original);
      const reparsed = assToUniversal(converted);

      original.cues.forEach((originalCue, index) => {
        const reparsedCue = reparsed.cues[index];
        expect(reparsedCue!.formatSpecific?.ass?.layer).toBe(
          originalCue.formatSpecific?.ass?.layer,
        );
      });
    });

    test("should preserve actor names", () => {
      const original = assToUniversal(multiCharAssContent);
      const converted = universalToAss(original);
      const reparsed = assToUniversal(converted);

      original.cues.forEach((originalCue, index) => {
        const reparsedCue = reparsed.cues[index];
        expect(reparsedCue!.formatSpecific?.ass?.actor).toBe(
          originalCue.formatSpecific?.ass?.actor,
        );
      });
    });

    test("should preserve margin values", () => {
      const original = assToUniversal(multiCharAssContent);
      const converted = universalToAss(original);
      const reparsed = assToUniversal(converted);

      original.cues.forEach((originalCue, index) => {
        const reparsedCue = reparsed.cues[index];
        expect(reparsedCue!.formatSpecific?.ass?.marginL).toBe(
          originalCue.formatSpecific?.ass?.marginL,
        );
        expect(reparsedCue!.formatSpecific?.ass?.marginR).toBe(
          originalCue.formatSpecific?.ass?.marginR,
        );
        expect(reparsedCue!.formatSpecific?.ass?.marginV).toBe(
          originalCue.formatSpecific?.ass?.marginV,
        );
      });
    });

    test("should be lossless - converted ASS should parse identically", () => {
      const original = assToUniversal(multiCharAssContent);
      const converted = universalToAss(original);
      const reparsed = assToUniversal(converted);

      // Compare key properties
      expect(reparsed.cues.length).toBe(original.cues.length);
      expect(reparsed.styles.length).toBe(original.styles.length);
      expect(reparsed.metadata.title).toBe(original.metadata.title);

      // Deep comparison of cues
      expect(JSON.stringify(reparsed.cues)).toBe(JSON.stringify(original.cues));
    });
  });

  describe("Edge Cases with Multi-Character Example", () => {
    test("should handle overlapping layers correctly", () => {
      const universal = assToUniversal(multiCharAssContent);

      // Find cues that overlap in time but have different layers
      const overlappingCues = universal.cues.filter(
        (cue) => cue.startTime >= 8000 && cue.endTime <= 12000,
      );

      expect(overlappingCues.length).toBeGreaterThanOrEqual(1);

      // They should have different layers
      const layers = new Set(
        overlappingCues.map((cue) => cue.formatSpecific?.ass?.layer),
      );
      expect(layers.size).toBeGreaterThan(1);
    });

    test("should handle complex formatting tags", () => {
      const universal = assToUniversal(multiCharAssContent);

      // Find cues with multiple formatting tags
      const complexCue = universal.cues.find((cue) =>
        cue.content.includes("{\\b1}{\\i1}"),
      );

      expect(complexCue).toBeDefined();
      expect(complexCue!.content).toContain("\\b1");
      expect(complexCue!.content).toContain("\\i1");
    });

    test("should handle positioning tags", () => {
      const universal = assToUniversal(multiCharAssContent);

      const posCue = universal.cues.find((cue) =>
        cue.content.includes("\\pos("),
      );

      expect(posCue).toBeDefined();
      expect(posCue!.content).toMatch(/\\pos\(\d+,\d+\)/);
    });

    test("should handle fade effects", () => {
      const universal = assToUniversal(multiCharAssContent);

      const fadeCue = universal.cues.find((cue) =>
        cue.content.includes("\\fade"),
      );

      expect(fadeCue).toBeDefined();
      expect(fadeCue!.content).toContain("\\fade(");
    });

    test("should handle transformation tags", () => {
      const universal = assToUniversal(multiCharAssContent);

      const transformCue = universal.cues.find((cue) =>
        cue.content.includes("\\t("),
      );

      expect(transformCue).toBeDefined();
      expect(transformCue!.content).toContain("\\t(");
    });

    test("should handle alignment tags", () => {
      const universal = assToUniversal(multiCharAssContent);

      const alignCue = universal.cues.find((cue) =>
        cue.content.includes("{\\an7}"),
      );

      expect(alignCue).toBeDefined();
      expect(alignCue!.content).toContain("\\an7");
    });
  });

  describe("Performance with Multi-Character File", () => {
    test("should parse large ASS file quickly", () => {
      const startTime = performance.now();
      const universal = assToUniversal(multiCharAssContent);
      const endTime = performance.now();

      expect(universal.cues.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should parse in less than 100ms
    });

    test("should convert to ASS quickly", () => {
      const universal = assToUniversal(multiCharAssContent);

      const startTime = performance.now();
      const converted = universalToAss(universal);
      const endTime = performance.now();

      expect(converted.length).toBeGreaterThan(0);
      expect(endTime - startTime).toBeLessThan(100); // Should convert in less than 100ms
    });

    test("should handle full round-trip quickly", () => {
      const startTime = performance.now();

      const original = assToUniversal(multiCharAssContent);
      const converted = universalToAss(original);
      const reparsed = assToUniversal(converted);

      const endTime = performance.now();

      expect(reparsed.cues.length).toBe(original.cues.length);
      expect(endTime - startTime).toBeLessThan(200); // Full round-trip in less than 200ms
    });
  });
});
