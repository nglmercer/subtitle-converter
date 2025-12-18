import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs";
import { join, basename, extname } from "path";
import { parseCsv, universalToJson, universalToAss } from "../src/index.js";

/**
 * Script to extract raw data from CSV subtitles and convert them to Universal JSON
 * Usage: bun scripts/extract-csv.ts <input_file_or_dir> <output_dir>
 */

const inputPath = process.argv[2];
const outputDir = process.argv[3] || "output/extracted";

if (!inputPath) {
  console.error("Usage: bun scripts/extract-csv.ts <input_file_or_dir> [output_dir]");
  process.exit(1);
}

if (!existsSync(outputDir)) {
  mkdirSync(outputDir, { recursive: true });
}

function processFile(filePath: string) {
  try {
    console.log(`Processing: ${filePath}`);
    const content = readFileSync(filePath, "utf-8");
    const universal = parseCsv(content);
    
    // Save as universal JSON
    const fileName = basename(filePath, extname(filePath));
    const outputPath = join(outputDir, `${fileName}.json`);
    const assPath = join(outputDir, `${fileName}.ass`);
    const assFormat = universalToAss(universal);
    writeFileSync(assPath, assFormat);
    writeFileSync(outputPath, universalToJson(universal, true));
    console.log(`✅ Extracted to: ${outputPath}`);
    console.log(`   Found ${universal.cues.length} cues.`);
  } catch (err) {
    console.error(`❌ Error processing ${filePath}:`, (err as Error).message);
  }
}

if (existsSync(inputPath)) {
  const stats = require("fs").statSync(inputPath);
  if (stats.isDirectory()) {
    const files = require("fs").readdirSync(inputPath)
      .filter((f: string) => f.endsWith(".csv"));
    
    if (files.length === 0) {
      console.log("No CSV files found in directory.");
    } else {
      files.forEach((f: string) => processFile(join(inputPath, f)));
    }
  } else {
    processFile(inputPath);
  }
} else {
  console.error(`Input path does not exist: ${inputPath}`);
  process.exit(1);
}
