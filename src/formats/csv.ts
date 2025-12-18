import Papa from "papaparse";
import type {
  UniversalSubtitle,
  UniversalCue,
  ValidationResult,
} from "../types.js";
import {
  timeStringToMs,
  msToTimeString,
} from "./universal.js";

/**
 * Parse CSV content to Universal Subtitle format
 * Optimized for the user's specific extraction format:
 * [rel_start],[rel_end],character,text,,confidence,[abs_start],[abs_end]
 */
export function parseCsv(content: string): UniversalSubtitle {
  const result = Papa.parse<string[]>(content, {
    skipEmptyLines: true,
  });

  const cues: UniversalCue[] = [];
  let index = 1;

  for (const row of result.data) {
    // A valid row must have at least [rel_start], [rel_end], character, and text
    if (row.length < 4) continue;

    const firstCol = row[0]?.trim() || "";
    const secondCol = row[1]?.trim() || "";

    // A valid data row MUST start with [ in the first two columns (times)
    if (!firstCol.startsWith("[") || !secondCol.startsWith("[")) continue;

    const relStart = firstCol.replace(/[\[\]]/g, "").trim();
    const relEnd = secondCol.replace(/[\[\]]/g, "").trim();
    
    if (!relStart || !relEnd) continue;
    const character = row[2] || "";
    const text = row[3] || "";
    const confidence = row[5] ? parseFloat(row[5]) : undefined;
    const absStart = row[6] ? row[6].replace(/[\[\]]/g, "") : undefined;
    const absEnd = row[7] ? row[7].replace(/[\[\]]/g, "") : undefined;

    try {
      // Use internal helper to handle H:MM:SS.mmm or HH:MM:SS.mmm
      const startTime = parseTime(relStart);
      const endTime = parseTime(relEnd);

      const cue: UniversalCue = {
        index: index++,
        startTime,
        endTime,
        duration: endTime - startTime,
        text: text,
        content: text,
        formatSpecific: {
          ['csv']: {
            character,
            confidence,
            absStart,
            absEnd,
          },
        },
      };

      if (character) {
        cue.style = character;
      }

      cues.push(cue);
    } catch (e) {
      // Skip invalid time rows (like "Episode 045")
      continue;
    }
  }

  return {
    version: "1.0.0",
    sourceFormat: "csv",
    metadata: {},
    styles: [],
    cues,
  };
}

/**
 * Convert Universal Subtitle to CSV string
 */
export function toCsv(universal: UniversalSubtitle): string {
  const rows = universal.cues.map((cue) => {
    const csvData = cue.formatSpecific?.['csv'] || {};
    return [
      `[${msToTimeString(cue.startTime, "vtt")}]`,
      `[${msToTimeString(cue.endTime, "vtt")}]`,
      csvData.character || cue.style || "",
      cue.text,
      "",
      csvData.confidence || "",
      csvData.absStart ? `[${csvData.absStart}]` : "",
      csvData.absEnd ? `[${csvData.absEnd}]` : "",
    ];
  });

  return Papa.unparse(rows);
}

/**
 * Helper to parse time in various formats (H:MM:SS.mmm, MM:SS.mmm, etc)
 */
function parseTime(timeStr: string): number {
  if (!timeStr) return 0;
  
  // Normalize to HH:MM:SS.mmm if needed
  const parts = timeStr.split(":");
  let formatted = timeStr;
  
  if (parts.length === 2) {
    const min = parts[0] || "00";
    const sec = parts[1] || "00.000";
    formatted = `00:${min.padStart(2, "0")}:${sec}`;
  } else if (parts.length === 3) {
    const hour = parts[0] || "00";
    const min = parts[1] || "00";
    const sec = parts[2] || "00.000";
    formatted = `${hour.padStart(2, "0")}:${min}:${sec}`;
  }

  // Ensure milliseconds have 3 digits
  if (formatted.includes(".")) {
    const [hms, ms] = formatted.split(".");
    if (hms && ms) {
      formatted = `${hms}.${ms.padEnd(3, "0").slice(0, 3)}`;
    }
  } else {
    formatted += ".000";
  }

  // timeStringToMs handles Both SRT (,) and VTT (.) separators internally in some versions, 
  // but to be safe we normalize to SRT format as parseTime used to do.
  return timeStringToMs(formatted.replace(".", ","));
}

/**
 * Validate CSV structure
 */
export function validateCsvStructure(content: string): ValidationResult {
  try {
    const universal = parseCsv(content);
    return {
      isValid: universal.cues.length > 0,
      errors: universal.cues.length === 0 ? [{
        type: "INVALID_FORMAT",
        message: "No valid subtitle cues found in CSV",
      }] : [],
      warnings: [],
    };
  } catch (e) {
    return {
      isValid: false,
      errors: [{
        type: "INVALID_FORMAT",
        message: (e as Error).message,
      }],
      warnings: [],
    };
  }
}
