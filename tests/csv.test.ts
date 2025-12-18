import { expect, test, describe } from "bun:test";
import { parseCsv, toCsv, convert, detectFormat } from "../src/index.js";

const sampleCsv = `[0:01:21.05],[0:01:21.81],Middle-aged Man 1,"Xavier, no queremos...",,1.14,[1:34:00.32],[1:34:01.21]
[0:01:28.97],[0:01:29.91],Middle-aged Man 3,"Cuando la ciudad caiga...",,5.32,[1:34:09.68],[1:34:10.63]
,,,,,,,
Episode 045,,,,,,,
[0:00:00.19],[0:00:00.99],Young Man 6,Noticias.,,1.25,[1:34:39.77],[1:34:40.56]`;

describe("CSV Format", () => {
  test("should parse CSV correctly", () => {
    const universal = parseCsv(sampleCsv);
    expect(universal.cues.length).toBe(3);
    expect(universal.cues[0].text).toBe("Xavier, no queremos...");
    expect(universal.cues[0].style).toBe("Middle-aged Man 1");
    // Check specific extraction fields
    expect(universal.cues[0].formatSpecific?.['csv'].confidence).toBe(1.14);
    expect(universal.cues[0].formatSpecific?.['csv'].absStart).toBe("1:34:00.32");
  });

  test("should handle edge cases", () => {
    const edgeCaseCsv = `
[01:21.05],[01:22],Char1,"Short time format"
[1:21:28.97],[1:21:29.9],Char2,"H:MM:SS format"
[0:00:10],[0:00:11],,No char
[0:00:12.123],[0:00:13.123],Char3,
Malformed line here
[invalid],[times],,
[0:00:14],[0:00:15]
`;
    const universal = parseCsv(edgeCaseCsv);
    // 1. [01:21.05],[01:22] -> valid (M:SS)
    // 2. [1:21:28.97],[1:21:29.9] -> valid (H:MM:SS)
    // 3. [0:00:10],[0:00:11] -> valid (no char)
    // 4. [0:00:12.123],[0:00:13.123] -> valid (no text)
    // Others should be skipped
    expect(universal.cues.length).toBe(4);
    
    expect(universal.cues[0].text).toBe("Short time format");
    expect(universal.cues[2].style).toBeUndefined();
    expect(universal.cues[3].text).toBe("");
  });

  test("should detect CSV format", () => {
    const format = detectFormat(sampleCsv);
    expect(format.format).toBe("csv");
  });

  test("should convert CSV to SRT", () => {
    const srt = convert(sampleCsv, "csv", "srt");
    expect(srt).toContain("1");
    expect(srt).toContain("00:01:21,050");
    expect(srt).toContain("Xavier, no queremos...");
  });

  test("should convert CSV to VTT", () => {
    const vtt = convert(sampleCsv, "csv", "vtt");
    expect(vtt).toContain("WEBVTT");
    expect(vtt).toContain("00:01:21.050");
  });

  test("should round-trip CSV", () => {
    const universal = parseCsv(sampleCsv);
    const csv = toCsv(universal);
    const universal2 = parseCsv(csv);
    
    expect(universal2.cues.length).toBe(universal.cues.length);
    expect(universal2.cues[0].text).toBe(universal.cues[0].text);
    expect(universal2.cues[0].startTime).toBe(universal.cues[0].startTime);
  });
});
