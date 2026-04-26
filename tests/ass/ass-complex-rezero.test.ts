import { describe, it, expect } from "bun:test";
import { readFileSync } from "fs";
import { join } from "path";
import { assToUniversal, universalToAss, validateAssStructure } from "../../src/formats/ass.js";
import type { UniversalSubtitle } from "../../src/types.js";
import { parseToUniversal, formatFromUniversal, analyze, validate } from "../../src/index.js";

const complexAssPath = join(__dirname, "..", "fixtures", "complex-rezero.ass");

function getAssContent(): string {
  try {
    return readFileSync(complexAssPath, "utf-8");
  } catch {
    return "";
  }
}

describe("Complex ASS Subtitle Parser - Re:Zero Episode", () => {
  const assContent = getAssContent();

  describe("Basic Parsing", () => {
    it("should parse complex ASS content without throwing", () => {
      expect(() => {
        assToUniversal(assContent);
      }).not.toThrow();
    });

    it("should detect as valid ASS format", () => {
      const result = validate(assContent, "ass");
      expect(result.isValid).toBe(true);
    });
  });

  describe("Metadata Preservation", () => {
    let universal: UniversalSubtitle;

    it("should preserve script info metadata", () => {
      universal = assToUniversal(assContent);

      expect(universal.metadata.title).toBe("Default Aegisub file");
      expect(universal.metadata.formatSpecific?.ass?.scriptType).toBe("v4.00+");
      expect(universal.metadata.formatSpecific?.ass?.playResX).toBe(1920);
      expect(universal.metadata.formatSpecific?.ass?.playResY).toBe(1080);
      expect(universal.metadata.formatSpecific?.ass?.scaledBorderAndShadow).toBe("yes");
      expect(universal.metadata.formatSpecific?.ass?.yCbCrMatrix).toBe("TV.709");
      expect(universal.metadata.formatSpecific?.ass?.wrapStyle).toBe("0");
    });

    it("should parse and preserve all 5 style definitions", () => {
      universal = assToUniversal(assContent);

      expect(universal.styles).toHaveLength(5);

      const styleNames = universal.styles.map((s) => s.name);
      expect(styleNames).toContain("Gen_Main");
      expect(styleNames).toContain("Gen_Italics");
      expect(styleNames).toContain("Gen_Main_Up");
      expect(styleNames).toContain("Gen_Italics_top");
      expect(styleNames).toContain("Edición");
    });

    it("should preserve style properties correctly", () => {
      universal = assToUniversal(assContent);

      const genMainStyle = universal.styles.find((s) => s.name === "Gen_Main");
      expect(genMainStyle).toBeDefined();
      expect(genMainStyle!.fontName).toBe("ATFArumSansW01");
      expect(genMainStyle!.fontSize).toBe(90);
      expect(genMainStyle!.primaryColor).toBe("&H00FFF3FB");
      expect(genMainStyle!.alignment).toBe(2);

      const italicStyle = universal.styles.find((s) => s.name === "Gen_Italics");
      expect(italicStyle).toBeDefined();
      expect(italicStyle!.italic).toBe(true);
      expect(italicStyle!.alignment).toBe(2);
    });
  });

  describe("Dialogue Parsing", () => {
    let universal: UniversalSubtitle;

    it("should parse all dialogue cues", () => {
      universal = assToUniversal(assContent);

      expect(universal.cues.length).toBeGreaterThan(100);
    });

    it("should correctly parse time values", () => {
      universal = assToUniversal(assContent);

      const firstCue = universal.cues[0];
      expect(firstCue).toBeDefined();
      expect(firstCue!.startTime).toBe(26400); // 0:00:26.40 = 26.4s = 26400ms
      expect(firstCue!.endTime).toBe(28760); // 0:00:28.76 = 28.76s = 28760ms
    });

    it("should preserve character names in actor field", () => {
      universal = assToUniversal(assContent);

      const subaruCue = universal.cues.find((c) => c.formatSpecific?.ass?.actor === "Subaru");
      expect(subaruCue).toBeDefined();
      expect(subaruCue!.text).toContain("¿De verdad");
    });

    it("should handle Spanish dialogue with special characters", () => {
      universal = assToUniversal(assContent);

      const specialCue = universal.cues.find((c) => c.text.includes("¿"));
      expect(specialCue).toBeDefined();
    });

    it("should handle multiline text with \\N correctly", () => {
      universal = assToUniversal(assContent);

      const multilineCue = universal.cues.find((c) => c.content.includes("\\N"));
      expect(multilineCue).toBeDefined();
      expect(multilineCue!.text).toContain("\n");
    });

    it("should preserve layer information", () => {
      universal = assToUniversal(assContent);

      const layer20Cues = universal.cues.filter((c) => c.formatSpecific?.ass?.layer === 20);
      expect(layer20Cues.length).toBeGreaterThan(0);
    });
  });

  describe("ASS Overrides Handling", () => {
    let universal: UniversalSubtitle;

    it("should preserve fade effects {fad()} in content", () => {
      universal = assToUniversal(assContent);

      const fadeCue = universal.cues.find((c) => c.content.includes("{\\fad"));
      expect(fadeCue).toBeDefined();
      expect(fadeCue!.content).toMatch(/\\fad\(\d+,\d+\)/);
    });

    it("should clean fade tags from text field", () => {
      universal = assToUniversal(assContent);

      const fadeCue = universal.cues.find((c) => c.content.includes("{\\fad"));
      expect(fadeCue).toBeDefined();
      expect(fadeCue!.text).not.toContain("{\fad");
    });
  });

  describe("Analysis", () => {
    it("should analyze complex ASS content correctly", () => {
      const analysis = analyze(assContent, "ass");

      expect(analysis.totalCues).toBeGreaterThan(100);
      expect(analysis.totalDuration).toBeGreaterThan(0);
      expect(analysis.totalLines).toBeGreaterThan(100);
    });
  });

  describe("Round-Trip Conversions", () => {
    it("should convert ASS -> Universal -> ASS", () => {
      const universal = assToUniversal(assContent);
      const converted = universalToAss(universal);

      expect(converted).toBeDefined();
      expect(converted.length).toBeGreaterThan(0);
    });

    it("should preserve all cues after round-trip", () => {
      const universal = assToUniversal(assContent);
      const converted = universalToAss(universal);
      const reparsed = assToUniversal(converted);

      expect(reparsed.cues.length).toBe(universal.cues.length);
    });

    it("should validate converted ASS", () => {
      const universal = assToUniversal(assContent);
      const converted = universalToAss(universal);

      const validation = validate(converted, "ass");
      expect(validation.isValid).toBe(true);
    });
  });

  describe("Cross-Format Conversion", () => {
    it("should convert ASS to SRT", () => {
      const universal = assToUniversal(assContent);
      const srt = formatFromUniversal(universal, "srt");

      expect(srt).toBeDefined();
      expect(srt).toContain("\n\n");
    });

    it("should convert ASS to VTT with proper line breaks", () => {
      const universal = assToUniversal(assContent);
      const vtt = formatFromUniversal(universal, "vtt");

      expect(vtt).toBeDefined();
      expect(vtt).toContain("WEBVTT");
    });

    it("should preserve dialogue count in cross-format conversion", () => {
      const universal = assToUniversal(assContent);
      const textCues = universal.cues.filter((c) => c.text.trim());
      // Drawing-only cues (\p1) are stripped from text output
      const drawingCues = universal.cues.length - textCues.length;

      const srt = formatFromUniversal(universal, "srt");
      const universal2 = parseToUniversal(srt, "srt");

      expect(universal2.cues.length).toBe(textCues.length);
      expect(drawingCues).toBeGreaterThan(0);
    });

    it("should strip drawing commands from text output", () => {
      const universal = assToUniversal(assContent);
      const srt = formatFromUniversal(universal, "srt");

      // Vector drawing paths should not appear in SRT output
      expect(srt).not.toMatch(/^m \d+ \d+ l /m);
      expect(srt).not.toMatch(/\bm -66\.84\b/);
    });

    it("should convert newlines correctly in SRT", () => {
      const universal = assToUniversal(assContent);
      const srt = formatFromUniversal(universal, "srt");
      
      // Verify multiline cues have proper blank line separation
      expect(srt).toMatch(/a los que devoró la Gula\.\n/);
    });

    it("should convert newlines correctly in VTT", () => {
      const universal = assToUniversal(assContent);
      const vtt = formatFromUniversal(universal, "vtt");
      
      // VTT should have actual newlines (not \N)
      expect(vtt).toMatch(/a los que devoró la Gula\.\n/);
    });
  });
});