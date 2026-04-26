import { readFileSync, writeFileSync } from "fs";
import { assToUniversal } from "../src/formats/ass.ts";
import { formatFromUniversal, analyze } from "../src/index.ts";

const assFilePath = "./tests/fixtures/complex-rezero.ass";
const outputDir = "./examples/output";

console.log("=== Complex ASS Subtitle Example ===\n");

const assContent = readFileSync(assFilePath, "utf-8");

console.log("1. Parse ASS to Universal format:");
const universal = assToUniversal(assContent);
console.log(`   - Total cues: ${universal.cues.length}`);
console.log(`   - Styles: ${universal.styles.length}`);
console.log(`   - Title: ${universal.metadata.title}`);
console.log(`   - Resolution: ${universal.metadata.formatSpecific?.ass?.playResX}x${universal.metadata.formatSpecific?.ass?.playResY}`);

console.log("\n2. Analyze subtitle statistics:");
const stats = analyze(assContent, "ass");
console.log(`   - Total duration: ${(stats.totalDuration / 1000).toFixed(1)}s`);
console.log(`   - Total lines: ${stats.totalLines}`);
console.log(`   - Average cue duration: ${stats.averageDuration.toFixed(0)}ms`);

console.log("\n3. First 5 cues:");
universal.cues.slice(0, 5).forEach((cue, i) => {
  const start = (cue.startTime / 1000).toFixed(2);
  const end = (cue.endTime / 1000).toFixed(2);
  const actor = cue.formatSpecific?.ass?.actor || cue.style;
  console.log(`   [${start}s - ${end}s] ${actor}: ${cue.text.substring(0, 50)}...`);
});

console.log("\n4. Convert to SRT (preserving original ASS text):");
const srt = formatFromUniversal(universal, "srt");
writeFileSync(`${outputDir}/complex-rezero.srt`, srt, "utf-8");
console.log(`   Saved to ${outputDir}/complex-rezero.srt`);

console.log("\n5. Convert to VTT (preserving original ASS text):");
const vtt = formatFromUniversal(universal, "vtt");
writeFileSync(`${outputDir}/complex-rezero.vtt`, vtt, "utf-8");
console.log(`   Saved to ${outputDir}/complex-rezero.vtt`);

console.log("\n6. Style information (read-only, never modifies ASS):");
universal.styles.forEach(style => {
  console.log(`   - ${style.name}: ${style.fontName} ${style.fontSize}px, alignment: ${style.alignment}`);
});

console.log("\n=== Done ===");
console.log("   Original ASS file was parsed and analyzed without modification.");
console.log("   Only SRT and VTT output files were created.");