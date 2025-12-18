import { describe, expect, test } from "bun:test";
import {
  parseToUniversal,
  formatFromUniversal,
  toUniversal,
  fromUniversal,
  universalToJson,
  jsonToUniversal,
  timeStringToMs,
  msToTimeString,
  getUniversalStats,
  cloneUniversal,
  createDefaultStyle,
  mergeMetadata,
  validateUniversal,
} from "../../src/index.js";
import type {
  UniversalSubtitle,
  UniversalCue,
  SubtitleCue,
  SubtitleMetadata,
} from "../../src/types.js";
import {
  commonCues,
  multilineCues,
  overlappingCues,
  SrtBuilder,
  VttBuilder,
  AssBuilder,
} from "../fixtures/test-fixtures.js";

describe("Universal Format", () => {
  const srtBuilder = new SrtBuilder();
  const vttBuilder = new VttBuilder();
  const assBuilder = new AssBuilder();

  describe("Time Conversion Utilities", () => {
    describe("timeStringToMs", () => {
      test("should convert SRT time format to milliseconds", () => {
        expect(timeStringToMs("00:00:01,000")).toBe(1000);
        expect(timeStringToMs("00:01:23,456")).toBe(83456);
        expect(timeStringToMs("01:30:45,123")).toBe(5445123);
      });

      test("should convert VTT time format to milliseconds", () => {
        expect(timeStringToMs("00:00:01.000")).toBe(1000);
        expect(timeStringToMs("00:01:23.456")).toBe(83456);
        expect(timeStringToMs("01:30:45.123")).toBe(5445123);
      });

      test("should handle zero time", () => {
        expect(timeStringToMs("00:00:00,000")).toBe(0);
        expect(timeStringToMs("00:00:00.000")).toBe(0);
      });

      test("should throw on invalid time format", () => {
        expect(() => timeStringToMs("invalid")).toThrow();
        expect(() => timeStringToMs("00:00:01")).toThrow();
        expect(() => timeStringToMs("1:23:45,678")).toThrow();
      });
    });

    describe("msToTimeString", () => {
      test("should convert milliseconds to SRT time format", () => {
        expect(msToTimeString(1000, "srt")).toBe("00:00:01,000");
        expect(msToTimeString(83456, "srt")).toBe("00:01:23,456");
        expect(msToTimeString(5445123, "srt")).toBe("01:30:45,123");
      });

      test("should convert milliseconds to VTT time format", () => {
        expect(msToTimeString(1000, "vtt")).toBe("00:00:01.000");
        expect(msToTimeString(83456, "vtt")).toBe("00:01:23.456");
        expect(msToTimeString(5445123, "vtt")).toBe("01:30:45.123");
      });

      test("should default to SRT format", () => {
        expect(msToTimeString(1000)).toBe("00:00:01,000");
      });

      test("should handle zero milliseconds", () => {
        expect(msToTimeString(0, "srt")).toBe("00:00:00,000");
        expect(msToTimeString(0, "vtt")).toBe("00:00:00.000");
      });

      test("should round down milliseconds", () => {
        expect(msToTimeString(1999, "srt")).toBe("00:00:01,999");
      });
    });

    describe("round-trip time conversion", () => {
      test("should maintain precision through round-trip", () => {
        const times = [
          "00:00:01,000",
          "00:01:23,456",
          "01:30:45,789",
          "23:59:59,999",
        ];

        times.forEach((time) => {
          const ms = timeStringToMs(time);
          const converted = msToTimeString(ms, "srt");
          expect(converted).toBe(time);
        });
      });
    });
  });

  describe("toUniversal / fromUniversal", () => {
    test("should convert basic cues to universal format", () => {
      const universal = toUniversal(commonCues, "srt");

      expect(universal.version).toBe("1.0.0");
      expect(universal.sourceFormat).toBe("srt");
      expect(universal.cues).toHaveLength(3);
      expect(universal.styles).toHaveLength(0);
    });

    test("should preserve cue data in universal format", () => {
      const universal = toUniversal(commonCues, "srt");

      expect(universal.cues[0].index).toBe(1);
      expect(universal.cues[0].startTime).toBe(1000);
      expect(universal.cues[0].endTime).toBe(3000);
      expect(universal.cues[0].duration).toBe(2000);
      expect(universal.cues[0].text).toBe("Hello world");
      expect(universal.cues[0].content).toBe("Hello world");
    });

    test("should convert universal format back to basic cues", () => {
      const universal = toUniversal(commonCues, "srt");
      const cues = fromUniversal(universal, "srt");

      expect(cues).toHaveLength(3);
      expect(cues[0].startTime).toBe("00:00:01,000");
      expect(cues[0].endTime).toBe("00:00:03,000");
      expect(cues[0].text).toBe("Hello world");
    });

    test("should handle VTT format time separators", () => {
      const universal = toUniversal(commonCues, "srt");
      const vttCues = fromUniversal(universal, "vtt");

      expect(vttCues[0].startTime).toBe("00:00:01.000");
      expect(vttCues[0].endTime).toBe("00:00:03.000");
    });

    test("should include metadata when provided", () => {
      const metadata: Partial<SubtitleMetadata> = {
        title: "Test Movie",
        language: "en",
        author: "Test Author",
      };

      const universal = toUniversal(commonCues, "srt", metadata);

      expect(universal.metadata.title).toBe("Test Movie");
      expect(universal.metadata.language).toBe("en");
      expect(universal.metadata.author).toBe("Test Author");
    });

    test("should include styles when provided", () => {
      const styles = [createDefaultStyle("Custom")];
      const universal = toUniversal(commonCues, "srt", undefined, styles);

      expect(universal.styles).toHaveLength(1);
      expect(universal.styles[0].name).toBe("Custom");
    });
  });

  describe("parseToUniversal / formatFromUniversal", () => {
    test("should parse SRT to universal format", () => {
      const srtContent = srtBuilder.reset().addCues(commonCues).build();
      const universal = parseToUniversal(srtContent, "srt");

      expect(universal.sourceFormat).toBe("srt");
      expect(universal.cues).toHaveLength(3);
      expect(universal.cues[0].text).toBe("Hello world");
    });

    test("should parse VTT to universal format", () => {
      const vttContent = vttBuilder.reset().addCues(commonCues).build();
      const universal = parseToUniversal(vttContent, "vtt");

      expect(universal.sourceFormat).toBe("vtt");
      expect(universal.cues).toHaveLength(3);
    });

    test("should parse ASS to universal format", () => {
      const assContent = assBuilder.reset().addCues(commonCues).build();
      const universal = parseToUniversal(assContent, "ass");

      expect(universal.sourceFormat).toBe("ass");
      expect(universal.cues).toHaveLength(3);
    });

    test("should format universal to SRT", () => {
      const srtContent = srtBuilder.reset().addCues(commonCues).build();
      const universal = parseToUniversal(srtContent, "srt");
      const output = formatFromUniversal(universal, "srt");

      expect(output).toContain("Hello world");
      expect(output).toContain("00:00:01,000 --> 00:00:03,000");
    });

    test("should format universal to VTT", () => {
      const srtContent = srtBuilder.reset().addCues(commonCues).build();
      const universal = parseToUniversal(srtContent, "srt");
      const output = formatFromUniversal(universal, "vtt");

      expect(output).toContain("WEBVTT");
      expect(output).toContain("Hello world");
      expect(output).toContain("00:00:01.000 --> 00:00:03.000");
    });

    test("should format universal to ASS", () => {
      const srtContent = srtBuilder.reset().addCues(commonCues).build();
      const universal = parseToUniversal(srtContent, "srt");
      const output = formatFromUniversal(universal, "ass");

      expect(output).toContain("[Script Info]");
      expect(output).toContain("[V4+ Styles]");
      expect(output).toContain("[Events]");
      expect(output).toContain("Hello world");
    });

    test("should auto-detect format", () => {
      const srtContent = srtBuilder.reset().addCues(commonCues).build();
      const universal = parseToUniversal(srtContent, "auto");

      expect(universal.sourceFormat).toBe("srt");
      expect(universal.cues).toHaveLength(3);
    });
  });

  describe("JSON Serialization", () => {
    test("should convert universal to JSON string", () => {
      const universal = toUniversal(commonCues, "srt");
      const jsonString = universalToJson(universal);

      expect(jsonString).toContain('"version"');
      expect(jsonString).toContain('"sourceFormat"');
      expect(jsonString).toContain('"cues"');
    });

    test("should parse JSON string to universal", () => {
      const universal = toUniversal(commonCues, "srt");
      const jsonString = universalToJson(universal);
      const parsed = jsonToUniversal(jsonString);

      expect(parsed.version).toBe(universal.version);
      expect(parsed.sourceFormat).toBe(universal.sourceFormat);
      expect(parsed.cues).toHaveLength(universal.cues.length);
    });

    test("should handle pretty printing", () => {
      const universal = toUniversal(commonCues, "srt");
      const pretty = universalToJson(universal, true);
      const compact = universalToJson(universal, false);

      expect(pretty.length).toBeGreaterThan(compact.length);
      expect(pretty).toContain("  ");
      expect(compact).not.toContain("  ");
    });

    test("should throw on invalid JSON", () => {
      expect(() => jsonToUniversal("invalid json")).toThrow();
      expect(() => jsonToUniversal("{}")).toThrow();
    });

    test("should handle legacy JSON format", () => {
      const legacyJson = JSON.stringify([
        {
          type: "caption",
          index: 1,
          start: 1000,
          end: 3000,
          duration: 2000,
          content: "Hello world",
          text: "Hello world",
        },
      ]);

      const universal = jsonToUniversal(legacyJson);
      expect(universal.cues).toHaveLength(1);
      expect(universal.cues[0].text).toBe("Hello world");
    });
  });

  describe("Round-Trip Conversions", () => {
    test("SRT -> Universal -> SRT should be lossless", () => {
      const original = srtBuilder.reset().addCues(commonCues).build();
      const universal = parseToUniversal(original, "srt");
      const converted = formatFromUniversal(universal, "srt");
      const reparsed = parseToUniversal(converted, "srt");

      expect(reparsed.cues).toHaveLength(universal.cues.length);
      reparsed.cues.forEach((cue, i) => {
        expect(cue.text).toBe(universal.cues[i].text);
        expect(cue.startTime).toBe(universal.cues[i].startTime);
        expect(cue.endTime).toBe(universal.cues[i].endTime);
      });
    });

    test("VTT -> Universal -> VTT should preserve data", () => {
      const original = vttBuilder.reset().addCues(commonCues).build();
      const universal = parseToUniversal(original, "vtt");
      const converted = formatFromUniversal(universal, "vtt");
      const reparsed = parseToUniversal(converted, "vtt");

      expect(reparsed.cues).toHaveLength(universal.cues.length);
    });

    test("Cross-format conversions should work", () => {
      const srtContent = srtBuilder.reset().addCues(commonCues).build();
      const universal = parseToUniversal(srtContent, "srt");

      const vtt = formatFromUniversal(universal, "vtt");
      const ass = formatFromUniversal(universal, "ass");

      expect(vtt).toContain("WEBVTT");
      expect(ass).toContain("[Events]");
    });
  });

  describe("Statistics", () => {
    test("should calculate basic statistics", () => {
      const universal = toUniversal(commonCues, "srt");
      const stats = getUniversalStats(universal);

      expect(stats.totalCues).toBe(3);
      expect(stats.totalDuration).toBe(6000); // 3 cues × 2000ms each
      expect(stats.averageDuration).toBe(2000);
    });

    test("should calculate character counts", () => {
      const universal = toUniversal(commonCues, "srt");
      const stats = getUniversalStats(universal);

      const expectedChars =
        "Hello world".length +
        "This is a test subtitle".length +
        "Testing subtitle format".length;

      expect(stats.totalCharacters).toBe(expectedChars);
      expect(stats.averageCharactersPerCue).toBe(expectedChars / 3);
    });

    test("should handle empty subtitles", () => {
      const universal = toUniversal([], "srt");
      const stats = getUniversalStats(universal);

      expect(stats.totalCues).toBe(0);
      expect(stats.totalDuration).toBe(0);
      expect(stats.averageDuration).toBe(0);
    });

    test("should calculate first and last cue times", () => {
      const universal = toUniversal(commonCues, "srt");
      const stats = getUniversalStats(universal);

      expect(stats.firstCueStart).toBe(1000);
      expect(stats.lastCueEnd).toBe(9000);
    });
  });

  describe("Metadata Operations", () => {
    test("should create default style", () => {
      const style = createDefaultStyle();

      expect(style.name).toBe("Default");
      expect(style.fontName).toBe("Arial");
      expect(style.fontSize).toBe(20);
      expect(style.primaryColor).toBe("#FFFFFF");
    });

    test("should create custom style", () => {
      const style = createDefaultStyle("Custom");

      expect(style.name).toBe("Custom");
    });

    test("should merge metadata", () => {
      const meta1: Partial<SubtitleMetadata> = {
        title: "Movie Title",
        language: "en",
      };

      const meta2: Partial<SubtitleMetadata> = {
        language: "es", // Should override
        author: "Subtitle Team",
      };

      const merged = mergeMetadata(meta1, meta2);

      expect(merged.title).toBe("Movie Title");
      expect(merged.language).toBe("es"); // Later metadata wins
      expect(merged.author).toBe("Subtitle Team");
    });

    test("should merge format-specific metadata", () => {
      const meta1: Partial<SubtitleMetadata> = {
        formatSpecific: {
          ass: { scriptType: "v4.00+" },
        },
      };

      const meta2: Partial<SubtitleMetadata> = {
        formatSpecific: {
          vtt: { notes: ["Test note"] },
        },
      };

      const merged = mergeMetadata(meta1, meta2);

      expect(merged.formatSpecific?.ass).toBeDefined();
      expect(merged.formatSpecific?.vtt).toBeDefined();
    });
  });

  describe("Clone and Validation", () => {
    test("should clone universal object", () => {
      const original = toUniversal(commonCues, "srt");
      const cloned = cloneUniversal(original);

      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.cues).not.toBe(original.cues);
    });

    test("should validate valid universal format", () => {
      const universal = toUniversal(commonCues, "srt");
      expect(validateUniversal(universal)).toBe(true);
    });

    test("should reject invalid universal format", () => {
      expect(validateUniversal(null)).toBe(false);
      expect(validateUniversal({})).toBe(false);
      expect(validateUniversal({ version: "1.0.0" })).toBe(false);
    });

    test("should validate cue structure", () => {
      const invalid = {
        version: "1.0.0",
        sourceFormat: "srt",
        metadata: {},
        styles: [],
        cues: [
          {
            index: "invalid", // Should be number
            startTime: 1000,
            endTime: 3000,
            duration: 2000,
            text: "Test",
            content: "Test",
          },
        ],
      };

      expect(validateUniversal(invalid)).toBe(false);
    });
  });

  describe("Programmatic Manipulation", () => {
    test("should shift all subtitles by time offset", () => {
      const universal = toUniversal(commonCues, "srt");
      const offset = 2000; // 2 seconds

      universal.cues.forEach((cue) => {
        cue.startTime += offset;
        cue.endTime += offset;
      });

      expect(universal.cues[0].startTime).toBe(3000);
      expect(universal.cues[0].endTime).toBe(5000);
    });

    test("should filter subtitles by duration", () => {
      const universal = toUniversal(commonCues, "srt");
      const minDuration = 2000;

      universal.cues = universal.cues.filter(
        (cue) => cue.duration >= minDuration,
      );

      expect(universal.cues.every((cue) => cue.duration >= minDuration)).toBe(
        true,
      );
    });

    test("should transform text content", () => {
      const universal = toUniversal(commonCues, "srt");

      universal.cues.forEach((cue) => {
        cue.text = cue.text.toUpperCase();
        cue.content = cue.content.toUpperCase();
      });

      expect(universal.cues[0].text).toBe("HELLO WORLD");
    });

    test("should merge multiple subtitle files", () => {
      const cues1: SubtitleCue[] = [
        {
          startTime: "00:00:01,000",
          endTime: "00:00:03,000",
          text: "First",
        },
      ];

      const cues2: SubtitleCue[] = [
        {
          startTime: "00:00:05,000",
          endTime: "00:00:07,000",
          text: "Second",
        },
      ];

      const universal1 = toUniversal(cues1, "srt");
      const universal2 = toUniversal(cues2, "srt");

      const merged = cloneUniversal(universal1);
      merged.cues = [...universal1.cues, ...universal2.cues].sort(
        (a, b) => a.startTime - b.startTime,
      );

      // Re-index
      merged.cues.forEach((cue, i) => {
        cue.index = i + 1;
      });

      expect(merged.cues).toHaveLength(2);
      expect(merged.cues[0].text).toBe("First");
      expect(merged.cues[1].text).toBe("Second");
    });
  });

  describe("Multiline Text Handling", () => {
    test("should preserve multiline text in universal format", () => {
      const universal = toUniversal(multilineCues, "srt");

      expect(universal.cues[0].text).toContain("\n");
      expect(universal.cues[0].text).toBe("Line 1\nLine 2\nLine 3");
    });

    test("should maintain multiline text through round-trip", () => {
      const srtContent = srtBuilder.reset().addCues(multilineCues).build();
      const universal = parseToUniversal(srtContent, "srt");
      const converted = formatFromUniversal(universal, "srt");
      const reparsed = parseToUniversal(converted, "srt");

      expect(reparsed.cues[0].text).toBe(multilineCues[0].text);
    });
  });

  describe("Edge Cases", () => {
    test("should handle empty cue array", () => {
      const universal = toUniversal([], "srt");

      expect(universal.cues).toHaveLength(0);
      expect(validateUniversal(universal)).toBe(true);
    });

    test("should handle single cue", () => {
      const singleCue = [commonCues[0]];
      const universal = toUniversal(singleCue, "srt");

      expect(universal.cues).toHaveLength(1);
      expect(universal.cues[0].text).toBe("Hello world");
    });

    test("should handle very long duration", () => {
      const longCue: SubtitleCue = {
        startTime: "00:00:01,000",
        endTime: "23:59:59,999",
        text: "Very long subtitle",
      };

      const universal = toUniversal([longCue], "srt");
      const expectedDuration =
        timeStringToMs("23:59:59,999") - timeStringToMs("00:00:01,000");

      expect(universal.cues[0].duration).toBe(expectedDuration);
    });

    test("should handle zero-duration cues", () => {
      const zeroCue: SubtitleCue = {
        startTime: "00:00:01,000",
        endTime: "00:00:01,000",
        text: "Zero duration",
      };

      const universal = toUniversal([zeroCue], "srt");

      expect(universal.cues[0].duration).toBe(0);
    });

    test("should handle special characters in text", () => {
      const specialCue: SubtitleCue = {
        startTime: "00:00:01,000",
        endTime: "00:00:03,000",
        text: "Special: &\"'",
      };

      const universal = toUniversal([specialCue], "srt");

      // stripFormatting removes HTML-like tags and trims whitespace
      expect(universal.cues[0].text).toBe("Special: &\"'");
    });
  });

  describe("Conversion Options", () => {
    test("should respect plainTextOnly option", () => {
      const universal = toUniversal(commonCues, "srt");
      const cues = fromUniversal(universal, "srt", { plainTextOnly: true });

      expect(cues[0].text).toBe(universal.cues[0].text);
    });

    test("should format to all supported formats", () => {
      const universal = toUniversal(commonCues, "srt");

      const srt = formatFromUniversal(universal, "srt");
      const vtt = formatFromUniversal(universal, "vtt");
      const ass = formatFromUniversal(universal, "ass");
      const json = formatFromUniversal(universal, "json");

      expect(srt).toContain("00:00:01,000");
      expect(vtt).toContain("WEBVTT");
      expect(ass).toContain("[Events]");
      expect(json).toContain('"version"');
    });
  });

  describe("Performance and Data Integrity", () => {
    test("should handle large number of cues", () => {
      const largeCueSet: SubtitleCue[] = [];
      for (let i = 0; i < 1000; i++) {
        largeCueSet.push({
          startTime: msToTimeString(i * 2000, "srt"),
          endTime: msToTimeString(i * 2000 + 1500, "srt"),
          text: `Subtitle ${i + 1}`,
        });
      }

      const universal = toUniversal(largeCueSet, "srt");

      expect(universal.cues).toHaveLength(1000);
      expect(universal.cues[999].index).toBe(1000);
    });

    test("should maintain data integrity with complex operations", () => {
      const srtContent = srtBuilder.reset().addCues(commonCues).build();

      // Parse
      const universal1 = parseToUniversal(srtContent, "srt");

      // Clone
      const universal2 = cloneUniversal(universal1);

      // Modify
      universal2.cues.forEach((cue) => {
        cue.startTime += 1000;
        cue.endTime += 1000;
      });

      // Convert to different format
      const vttOutput = formatFromUniversal(universal2, "vtt");

      // Parse back
      const universal3 = parseToUniversal(vttOutput, "vtt");

      // Verify modifications persisted
      expect(universal3.cues[0].startTime).toBe(
        universal1.cues[0].startTime + 1000,
      );
    });

    test("should preserve all cue properties through complex workflow", () => {
      const original = toUniversal(commonCues, "srt");
      const originalFirstCue = original.cues[0];

      // Complex workflow
      const jsonString = universalToJson(original);
      const parsed = jsonToUniversal(jsonString);
      const cloned = cloneUniversal(parsed);
      const vtt = formatFromUniversal(cloned, "vtt");
      const reparsed = parseToUniversal(vtt, "vtt");

      expect(reparsed.cues[0].text).toBe(originalFirstCue.text);
      expect(reparsed.cues[0].startTime).toBe(originalFirstCue.startTime);
      expect(reparsed.cues[0].endTime).toBe(originalFirstCue.endTime);
      expect(reparsed.cues[0].duration).toBe(originalFirstCue.duration);
    });
  });
});
