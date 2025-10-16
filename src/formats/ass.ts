import type {
  SubtitleCue,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  UniversalSubtitle,
  UniversalCue,
  StyleDefinition,
  SubtitleMetadata,
} from "../types.js";

/**
 * Parse ASS content and convert it to an array of SubtitleCue objects
 * @param assContent - Complete ASS file content as string
 * @returns Array of SubtitleCue objects
 */
export function parseAss(assContent: string): SubtitleCue[] {
  const cues: SubtitleCue[] = [];

  const lines = assContent.trim().split(/\r?\n/);

  let inEventsSection = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith(";")) continue;

    // Check if we're entering the Events section
    if (trimmedLine === "[Events]") {
      inEventsSection = true;
      continue;
    }

    // Skip if we're not in the Events section
    if (!inEventsSection) continue;

    // Skip section headers and format lines
    if (trimmedLine.startsWith("[") || trimmedLine.startsWith("Format:"))
      continue;

    // Parse dialogue line
    if (trimmedLine.startsWith("Dialogue:")) {
      const dialogueMatch = trimmedLine.match(
        /^Dialogue:\s*(\d+),([^,]+),([^,]+),[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,([^,]*),(.*)$/,
      );

      if (dialogueMatch) {
        //const layer = dialogueMatch[1];
        const startTime = convertAssTimeToStandard(dialogueMatch[2]!);
        const endTime = convertAssTimeToStandard(dialogueMatch[3]!);
        //const style = dialogueMatch[4]!;
        const text = dialogueMatch[5]!;

        // Clean up ASS formatting tags and convert to plain text
        const cleanText = cleanAssText(text);

        if (cleanText) {
          cues.push({
            startTime,
            endTime,
            text: cleanText,
          });
        }
      }
    }

    // Stop parsing if we hit another section
    if (trimmedLine.startsWith("[") && trimmedLine !== "[Events]") {
      break;
    }
  }

  return cues;
}

/**
 * Parse ASS content to Universal format with full metadata preservation
 * @param assContent - Complete ASS file content as string
 * @returns UniversalSubtitle object with all ASS metadata preserved
 */
export function assToUniversal(assContent: string): UniversalSubtitle {
  const lines = assContent.trim().split(/\r?\n/);

  // Storage for parsed data
  const scriptInfo: Record<string, any> = {};
  const styles: StyleDefinition[] = [];
  const cues: UniversalCue[] = [];

  let currentSection = "";
  let styleFormat: string[] = [];
  let eventFormat: string[] = [];

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Skip empty lines and comments
    if (!trimmedLine || trimmedLine.startsWith(";")) continue;

    // Section headers
    if (trimmedLine.startsWith("[") && trimmedLine.endsWith("]")) {
      currentSection = trimmedLine.slice(1, -1);
      continue;
    }

    // Parse Script Info
    if (currentSection === "Script Info") {
      const colonIndex = trimmedLine.indexOf(":");
      if (colonIndex > 0) {
        const key = trimmedLine.slice(0, colonIndex).trim();
        const value = trimmedLine.slice(colonIndex + 1).trim();
        scriptInfo[key] = value;
      }
    }

    // Parse Styles
    if (currentSection === "V4+ Styles" || currentSection === "V4 Styles") {
      if (trimmedLine.startsWith("Format:")) {
        styleFormat = trimmedLine
          .slice(7)
          .split(",")
          .map((s) => s.trim());
      } else if (trimmedLine.startsWith("Style:")) {
        const styleData = trimmedLine
          .slice(6)
          .split(",")
          .map((s) => s.trim());
        const style = parseAssStyle(styleFormat, styleData);
        if (style) styles.push(style);
      }
    }

    // Parse Events
    if (currentSection === "Events") {
      if (trimmedLine.startsWith("Format:")) {
        eventFormat = trimmedLine
          .slice(7)
          .split(",")
          .map((s) => s.trim());
      } else if (trimmedLine.startsWith("Dialogue:")) {
        const cue = parseAssDialogue(trimmedLine, eventFormat, cues.length + 1);
        if (cue) cues.push(cue);
      }
    }
  }

  // Build metadata
  const metadata: SubtitleMetadata = {
    title: scriptInfo["Title"],
    formatSpecific: {
      ass: {},
    },
  };

  // Only add properties that exist
  if (scriptInfo["ScriptType"]) {
    metadata.formatSpecific!.ass!.scriptType = scriptInfo["ScriptType"];
  }
  if (scriptInfo["WrapStyle"]) {
    metadata.formatSpecific!.ass!.wrapStyle = scriptInfo["WrapStyle"];
  }
  if (scriptInfo["PlayResX"]) {
    metadata.formatSpecific!.ass!.playResX = parseInt(scriptInfo["PlayResX"]);
  }
  if (scriptInfo["PlayResY"]) {
    metadata.formatSpecific!.ass!.playResY = parseInt(scriptInfo["PlayResY"]);
  }
  if (scriptInfo["ScaledBorderAndShadow"]) {
    (metadata.formatSpecific!.ass as any)["scaledBorderAndShadow"] =
      scriptInfo["ScaledBorderAndShadow"];
  }
  if (scriptInfo["YCbCr Matrix"]) {
    (metadata.formatSpecific!.ass as any)["yCbCrMatrix"] =
      scriptInfo["YCbCr Matrix"];
  }
  if (scriptInfo["Collisions"]) {
    metadata.formatSpecific!.ass!.collisions = scriptInfo["Collisions"];
  }
  if (scriptInfo["PlayDepth"]) {
    metadata.formatSpecific!.ass!.playDepth = parseInt(scriptInfo["PlayDepth"]);
  }
  if (scriptInfo["Timer"]) {
    metadata.formatSpecific!.ass!.timer = scriptInfo["Timer"];
  }

  return {
    version: "1.0.0",
    sourceFormat: "ass",
    metadata,
    styles,
    cues,
  };
}

/**
 * Convert Universal format to ASS with full metadata restoration
 * @param universal - UniversalSubtitle object
 * @returns ASS formatted string with all metadata preserved
 */
export function universalToAss(universal: UniversalSubtitle): string {
  const parts: string[] = [];

  // Script Info section
  parts.push("[Script Info]");

  const assMetadata = universal.metadata.formatSpecific?.ass || {};

  parts.push(
    `Title: ${universal.metadata.title || assMetadata["Title"] || "Converted Subtitle"}`,
  );
  parts.push(
    `ScriptType: ${assMetadata.scriptType || assMetadata["ScriptType"] || "v4.00+"}`,
  );

  if (assMetadata.wrapStyle !== undefined)
    parts.push(
      `WrapStyle: ${assMetadata.wrapStyle || assMetadata["WrapStyle"]}`,
    );
  if (assMetadata.playResX !== undefined)
    parts.push(`PlayResX: ${assMetadata.playResX || assMetadata["PlayResX"]}`);
  if (assMetadata.playResY !== undefined)
    parts.push(`PlayResY: ${assMetadata.playResY || assMetadata["PlayResY"]}`);
  if ((assMetadata as any).scaledBorderAndShadow !== undefined)
    parts.push(
      `ScaledBorderAndShadow: ${(assMetadata as any).scaledBorderAndShadow || (assMetadata as any)["ScaledBorderAndShadow"]}`,
    );
  if ((assMetadata as any).yCbCrMatrix !== undefined)
    parts.push(
      `YCbCr Matrix: ${(assMetadata as any).yCbCrMatrix || (assMetadata as any)["YCbCr Matrix"]}`,
    );

  parts.push(
    `Collisions: ${assMetadata.collisions || assMetadata["Collisions"] || "Normal"}`,
  );
  parts.push(
    `PlayDepth: ${assMetadata.playDepth || assMetadata["PlayDepth"] || "0"}`,
  );
  parts.push(
    `Timer: ${assMetadata.timer || assMetadata["Timer"] || "100.000"}`,
  );

  if (assMetadata.timer !== undefined)
    parts.push(`Timer: ${assMetadata.timer || (assMetadata as any)["Timer"]}`);

  parts.push("");

  // Styles section
  parts.push("[V4+ Styles]");
  parts.push(
    "Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding",
  );

  if (universal.styles.length > 0) {
    universal.styles.forEach((style) => {
      parts.push(formatAssStyle(style));
    });
  } else {
    // Default style if none provided
    parts.push(
      "Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1",
    );
  }

  parts.push("");

  // Events section
  parts.push("[Events]");
  parts.push(
    "Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text",
  );

  universal.cues.forEach((cue) => {
    const assSpecific = cue.formatSpecific?.ass || {};
    const layer = assSpecific.layer !== undefined ? assSpecific.layer : 0;
    const startTime = msToAssTime(cue.startTime);
    const endTime = msToAssTime(cue.endTime);
    const style = cue.style || (assSpecific as any).style || "Default";
    const actor = assSpecific.actor || "";
    const marginL = assSpecific.marginL !== undefined ? assSpecific.marginL : 0;
    const marginR = assSpecific.marginR !== undefined ? assSpecific.marginR : 0;
    const marginV = assSpecific.marginV !== undefined ? assSpecific.marginV : 0;
    const effect = assSpecific.effect || "";

    // Use content (with formatting) if available, otherwise text
    const text = cue.content || cue.text;
    const assText = text.replace(/\n/g, "\\N");

    parts.push(
      `Dialogue: ${layer},${startTime},${endTime},${style},${actor},${marginL},${marginR},${marginV},${effect},${assText}`,
    );
  });

  return parts.join("\n");
}

/**
 * Parse ASS style definition
 */
function parseAssStyle(
  format: string[],
  data: string[],
): StyleDefinition | null {
  if (format.length === 0 || data.length === 0) return null;

  const styleObj: any = {};
  format.forEach((key, index) => {
    if (data[index] !== undefined) {
      styleObj[key] = data[index];
    }
  });

  const style: any = {
    name: styleObj.Name || "Default",
  };

  // Only add properties that exist to avoid exactOptionalPropertyTypes issues
  if (styleObj.Fontname !== undefined) {
    style.fontName = styleObj.Fontname;
  }
  if (styleObj.Fontsize !== undefined) {
    style.fontSize = parseInt(styleObj.Fontsize);
  }
  if (styleObj.PrimaryColour !== undefined) {
    style.primaryColor = styleObj.PrimaryColour;
  }
  if (styleObj.SecondaryColour !== undefined) {
    style.secondaryColor = styleObj.SecondaryColour;
  }
  if (styleObj.OutlineColour !== undefined) {
    style.outlineColor = styleObj.OutlineColour;
  }
  if (styleObj.BackColour !== undefined) {
    style.backColor = styleObj.BackColour;
  }
  if (styleObj.Bold !== undefined) {
    style.bold = styleObj.Bold === "-1" || styleObj.Bold === "1";
  }
  if (styleObj.Italic !== undefined) {
    style.italic = styleObj.Italic === "-1" || styleObj.Italic === "1";
  }
  if (styleObj.Underline !== undefined) {
    style.underline = styleObj.Underline === "-1" || styleObj.Underline === "1";
  }
  if (styleObj.StrikeOut !== undefined) {
    style.strikeOut = styleObj.StrikeOut === "-1" || styleObj.StrikeOut === "1";
  }
  if (styleObj.ScaleX !== undefined) {
    style.scaleX = parseFloat(styleObj.ScaleX);
  }
  if (styleObj.ScaleY !== undefined) {
    style.scaleY = parseFloat(styleObj.ScaleY);
  }
  if (styleObj.Spacing !== undefined) {
    style.spacing = parseFloat(styleObj.Spacing);
  }
  if (styleObj.Angle !== undefined) {
    style.angle = parseFloat(styleObj.Angle);
  }
  if (styleObj.BorderStyle !== undefined) {
    style.borderStyle = parseInt(styleObj.BorderStyle);
  }
  if (styleObj.Outline !== undefined) {
    style.outline = parseFloat(styleObj.Outline);
  }
  if (styleObj.Shadow !== undefined) {
    style.shadow = parseFloat(styleObj.Shadow);
  }
  if (styleObj.Alignment !== undefined) {
    style.alignment = parseInt(styleObj.Alignment);
  }
  if (styleObj.MarginL !== undefined) {
    style.marginL = parseInt(styleObj.MarginL);
  }
  if (styleObj.MarginR !== undefined) {
    style.marginR = parseInt(styleObj.MarginR);
  }
  if (styleObj.MarginV !== undefined) {
    style.marginV = parseInt(styleObj.MarginV);
  }
  if (styleObj.Encoding !== undefined) {
    style.encoding = parseInt(styleObj.Encoding);
  }

  style.formatSpecific = {
    assRaw: styleObj,
  };

  return style as StyleDefinition;
}

/**
 * Parse ASS dialogue line
 */
function parseAssDialogue(
  line: string,
  format: string[],
  index: number,
): UniversalCue | null {
  // Match: Dialogue: Layer,Start,End,Style,Name,MarginL,MarginR,MarginV,Effect,Text
  const match = line.match(/^Dialogue:\s*(.+)$/);
  if (!match) return null;

  const parts = match[1]!.split(",");
  if (parts.length < 9) return null;

  // Get the text (everything after the 9th comma)
  const textStartIndex = match[1]!.split(",", 9).join(",").length + 1;
  const text = match[1]!.slice(textStartIndex);

  const dialogueObj: any = {};
  format.forEach((key, idx) => {
    if (idx < 9 && parts[idx] !== undefined) {
      dialogueObj[key] = parts[idx];
    }
  });
  dialogueObj.Text = text;

  const layer = parseInt(dialogueObj.Layer || "0");
  const startTimeStr = dialogueObj.Start || "0:00:00.00";
  const endTimeStr = dialogueObj.End || "0:00:00.00";
  const style = dialogueObj.Style || "Default";
  const actor = dialogueObj.Name || "";
  const marginL = parseInt(dialogueObj.MarginL || "0");
  const marginR = parseInt(dialogueObj.MarginR || "0");
  const marginV = parseInt(dialogueObj.MarginV || "0");
  const effect = dialogueObj.Effect || "";

  // Convert ASS time to milliseconds
  const startTime = assTimeToMs(startTimeStr);
  const endTime = assTimeToMs(endTimeStr);

  // Clean text for plain version
  const plainText = cleanAssText(text);

  return {
    index,
    startTime,
    endTime,
    duration: endTime - startTime,
    text: plainText,
    content: text, // Keep original with formatting
    style,
    formatSpecific: {
      ass: {
        layer,
        actor,
        marginL,
        marginR,
        marginV,
        effect,
        style,
      },
    },
  };
}

/**
 * Format style definition to ASS format
 */
function formatAssStyle(style: StyleDefinition): string {
  const bold = style.bold ? -1 : 0;
  const italic = style.italic ? -1 : 0;
  const underline = style.underline ? -1 : 0;
  const strikeOut = style.strikeOut ? -1 : 0;

  const parts = [
    style.name || "Default",
    style.fontName || "Arial",
    style.fontSize || 20,
    style.primaryColor || "&H00FFFFFF",
    style.secondaryColor || "&H000000FF",
    style.outlineColor || "&H00000000",
    style.backColor || "&H00000000",
    bold,
    italic,
    underline,
    strikeOut,
    style.scaleX || 100,
    style.scaleY || 100,
    style.spacing || 0,
    style.angle || 0,
    style.borderStyle !== undefined ? style.borderStyle : 1,
    style.outline !== undefined ? style.outline : 2,
    style.shadow !== undefined ? style.shadow : 0,
    style.alignment || 2,
    style.marginL !== undefined ? style.marginL : 10,
    style.marginR !== undefined ? style.marginR : 10,
    style.marginV !== undefined ? style.marginV : 10,
    style.encoding !== undefined ? style.encoding : 1,
  ];

  return `Style: ${parts.join(",")}`;
}

/**
 * Convert milliseconds to ASS time format (H:MM:SS.cc)
 */
function msToAssTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const centiseconds = Math.floor((ms % 1000) / 10);

  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

/**
 * Convert ASS time format (H:MM:SS.cc) to milliseconds
 */
function assTimeToMs(timeStr: string): number {
  const match = timeStr.match(/^(\d+):(\d{2}):(\d{2})\.(\d{2})$/);
  if (!match) return 0;

  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const seconds = parseInt(match[3]!, 10);
  const centiseconds = parseInt(match[4]!, 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + centiseconds * 10;
}

/**
 * Convert an array of SubtitleCue objects to ASS format
 * @param cues - Array of SubtitleCue objects
 * @returns ASS formatted string
 */
export function toAss(cues: SubtitleCue[]): string {
  let assContent = `[Script Info]
Title: Converted Subtitle
ScriptType: v4.00+
Collisions: Normal
PlayDepth: 0

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,20,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  if (cues.length === 0) {
    return assContent;
  }

  assContent += cues
    .map((cue) => {
      const startTime = convertStandardTimeToAss(cue.startTime);
      const endTime = convertStandardTimeToAss(cue.endTime);
      const layer = "0";
      const style = "Default";
      const name = "";
      const marginL = "0";
      const marginR = "0";
      const marginV = "0";
      const effect = "";

      // Convert text to ASS format (replace newlines with \N)
      const assText = cue.text.replace(/\n/g, "\\N");

      return `Dialogue: ${layer},${startTime},${endTime},${style},${name},${marginL},${marginR},${marginV},${effect},${assText}`;
    })
    .join("\n");

  return assContent;
}

/**
 * Validate ASS file structure
 * @param assContent - Complete ASS file content as string
 * @returns ValidationResult with errors and warnings
 */
export function validateAssStructure(assContent: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationWarning[] = [];
  const lines = assContent.trim().split("\n");

  let hasScriptInfo = false;
  let hasV4Styles = false;
  let hasEvents = false;
  let inEventsSection = false;
  let dialogueCount = 0;
  const cues: SubtitleCue[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]!.trim();

    if (!line || line.startsWith(";")) continue;

    // Check for required sections
    if (line === "[Script Info]") {
      hasScriptInfo = true;
      continue;
    }

    if (line === "[V4+ Styles]") {
      hasV4Styles = true;
      continue;
    }

    if (line === "[Events]") {
      hasEvents = true;
      inEventsSection = true;
      continue;
    }

    // Validate dialogue lines
    if (inEventsSection && line.startsWith("Dialogue:")) {
      dialogueCount++;

      const dialogueMatch = line.match(
        /^Dialogue:\s*(\d+),([^,]+),([^,]+),[^,]*,[^,]*,[^,]*,[^,]*,[^,]*,([^,]*),(.*)$/,
      );

      if (!dialogueMatch) {
        errors.push({
          type: "INVALID_FORMAT",
          message: `Invalid dialogue format on line ${i + 1}`,
          lineNumber: i + 1,
        });
        continue;
      }

      const startTimeRaw = dialogueMatch[2]!;
      const endTimeRaw = dialogueMatch[3]!;
      const text = dialogueMatch[5]!;

      // Validate raw ASS time format first (H:MM:SS.cc)
      const timeRegex = /^\d+:\d{2}:\d{2}\.\d{2}$/;

      if (!timeRegex.test(startTimeRaw)) {
        errors.push({
          type: "INVALID_TIMECODE",
          message: `Invalid start time format on line ${i + 1}: "${startTimeRaw}"`,
          lineNumber: i + 1,
        });
        continue; // Skip further processing for this line
      }

      if (!timeRegex.test(endTimeRaw)) {
        errors.push({
          type: "INVALID_TIMECODE",
          message: `Invalid end time format on line ${i + 1}: "${endTimeRaw}"`,
          lineNumber: i + 1,
        });
        continue; // Skip further processing for this line
      }

      const startTime = convertAssTimeToStandard(startTimeRaw);
      const endTime = convertAssTimeToStandard(endTimeRaw);

      // Validate that start time is before end time
      if (timeToMilliseconds(startTime) >= timeToMilliseconds(endTime)) {
        errors.push({
          type: "INVALID_TIMECODE",
          message: `Start time must be before end time on line ${i + 1}`,
          lineNumber: i + 1,
        });
        continue;
      }

      const cleanText = cleanAssText(text);
      if (cleanText) {
        cues.push({
          startTime,
          endTime,
          text: cleanText,
        });
      }
    }

    // Stop parsing events if we hit another section
    if (line.startsWith("[") && line !== "[Events]") {
      inEventsSection = false;
    }
  }

  // Validate required sections
  if (!hasScriptInfo) {
    errors.push({
      type: "INVALID_FORMAT",
      message: "Missing [Script Info] section",
    });
  }

  if (!hasV4Styles) {
    errors.push({
      type: "INVALID_FORMAT",
      message: "Missing [V4+ Styles] section",
    });
  }

  if (!hasEvents) {
    errors.push({
      type: "INVALID_FORMAT",
      message: "Missing [Events] section",
    });
  }

  if (dialogueCount === 0) {
    warnings.push({
      type: "EMPTY_CUE",
      message: "No dialogue lines found in the file",
    });
  }

  // Check for overlapping cues
  for (let i = 0; i < cues.length - 1; i++) {
    const currentCue = cues[i];
    const nextCue = cues[i + 1];

    if (!currentCue || !nextCue) continue;

    const currentEnd = timeToMilliseconds(currentCue.endTime);
    const nextStart = timeToMilliseconds(nextCue.startTime);

    if (currentEnd > nextStart) {
      errors.push({
        type: "OVERLAPPING_CUES",
        message: `Overlapping cues: cue ${i + 1} ends after cue ${i + 2} starts`,
        cueIndex: i,
      });
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Convert ASS time format (H:MM:SS.cc) to standard format (HH:MM:SS,mmm)
 * @param assTime - Time in H:MM:SS.cc format (ASS format)
 * @returns Time in HH:MM:SS,mmm format (SRT format)
 */
function convertAssTimeToStandard(assTime: string): string {
  // ASS format: H:MM:SS.cc (centiseconds)
  // Standard format: HH:MM:SS,mmm (milliseconds)
  const match = assTime.match(/^(\d+):(\d{2}):(\d{2})\.(\d{2})$/);

  if (!match) {
    // Return a default time instead of throwing to handle validation gracefully
    return "00:00:00,000";
  }

  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const seconds = parseInt(match[3]!, 10);
  const centiseconds = parseInt(match[4]!, 10);

  // Convert centiseconds to milliseconds
  const milliseconds = centiseconds * 10;

  // Format as HH:MM:SS,mmm
  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")},${milliseconds.toString().padStart(3, "0")}`;
}

/**
 * Convert standard time format (HH:MM:SS,mmm) to ASS format (H:MM:SS.cc)
 * @param standardTime - Time in HH:MM:SS,mmm format (SRT format)
 * @returns Time in H:MM:SS.cc format (ASS format)
 */
function convertStandardTimeToAss(standardTime: string): string {
  // Standard format: HH:MM:SS,mmm (milliseconds)
  // ASS format: H:MM:SS.cc (centiseconds)
  const match = standardTime.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);

  if (!match) {
    // Return a default time instead of throwing to handle validation gracefully
    return "0:00:00.00";
  }

  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const seconds = parseInt(match[3]!, 10);
  const milliseconds = parseInt(match[4]!, 10);

  // Convert milliseconds to centiseconds (truncate, don't round)
  const centiseconds = Math.floor(milliseconds / 10);

  // Format as H:MM:SS.cc
  return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}.${centiseconds.toString().padStart(2, "0")}`;
}

/**
 * Clean ASS text by removing formatting tags and converting special characters
 * @param assText - Raw ASS text with formatting tags
 * @returns Clean text suitable for display
 */
function cleanAssText(assText: string): string {
  // Remove ASS formatting tags
  let cleanText = assText;

  // Remove basic ASS tags
  cleanText = cleanText.replace(/\{[^}]*\}/g, "");

  // Convert ASS line breaks to regular newlines
  // Use String.fromCharCode to avoid bundler issues with literal newlines
  cleanText = cleanText.replace(/\\N/g, String.fromCharCode(10)); // hard line break (\n)

  cleanText = cleanText.replace(/\\n/g, " "); // soft line break

  // Remove other ASS escape sequences
  cleanText = cleanText.replace(/\\h/g, " "); // Non-breaking space

  // Trim whitespace
  cleanText = cleanText.trim();

  return cleanText;
}

/**
 * Validate time format (HH:MM:SS,mmm)
 * @param timeString - Time string to validate
 * @returns true if valid, false otherwise
 */
/* function isValidTimeFormat(timeString: string): boolean {
  const match = timeString.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  return match !== null;
}
 */
/**
 * Convert time string to milliseconds
 * @param timeString - Time in HH:MM:SS,mmm format
 * @returns Time in milliseconds
 */
function timeToMilliseconds(timeString: string): number {
  const match = timeString.match(/^(\d{2}):(\d{2}):(\d{2}),(\d{3})$/);
  if (!match) return 0;

  const hours = parseInt(match[1]!, 10);
  const minutes = parseInt(match[2]!, 10);
  const seconds = parseInt(match[3]!, 10);
  const milliseconds = parseInt(match[4]!, 10);

  return (hours * 3600 + minutes * 60 + seconds) * 1000 + milliseconds;
}
