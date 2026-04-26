import { useState, useCallback } from "preact/hooks";
import type {
  UniversalSubtitle,
  SubtitleFormat,
  SubtitleAnalysis,
  UniversalCue,
} from "subs-converter";
import {
  parseToUniversal,
  formatFromUniversal,
  analyze,
  detectFormat,
} from "subs-converter";
import { FileDrop } from "./components/FileDrop";
import { Timeline } from "./components/Timeline";
import { SubtitleList } from "./components/SubtitleList";
import { CueEditor } from "./components/CueEditor";
import { PreviewPanel } from "./components/PreviewPanel";
import { AnalysisPanel } from "./components/AnalysisPanel";

export function App() {
  const [universal, setUniversal] = useState<UniversalSubtitle | null>(null);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  const [fileName, setFileName] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [detectedFormat, setDetectedFormat] = useState<string>("");
  const [analysis, setAnalysis] = useState<SubtitleAnalysis | null>(null);
  const [exportFormat, setExportFormat] = useState<SubtitleFormat>("srt");
  const [exported, setExported] = useState<string>("");

  const handleFile = useCallback((name: string, text: string) => {
    const detected = detectFormat(text);
    const fmt = detected?.format || "srt";
    const u = parseToUniversal(text, fmt);
    setFileName(name);
    setDetectedFormat(fmt);
    setUniversal(u);
    setSelectedIndex(u.cues.length > 0 ? 0 : -1);
    setSearchQuery("");
    setExported("");
    const a = analyze(text, fmt);
    setAnalysis(a);
    console.log(JSON.stringify(u), fmt);
  }, []);

  const handleCueUpdate = useCallback(
    (index: number, updates: Partial<UniversalCue>) => {
      if (!universal) return;
      const u = { ...universal, cues: [...universal.cues] };
      u.cues[index] = { ...u.cues[index], ...updates };
      setUniversal(u);
    },
    [universal],
  );

  const handleExport = useCallback(() => {
    if (!universal) return;
    const out = formatFromUniversal(universal, exportFormat);
    setExported(out);
  }, [universal, exportFormat]);

  const handleDownload = useCallback(() => {
    if (!exported) return;
    const blob = new Blob([exported], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const ext = exportFormat === "csv" ? "csv" : exportFormat;
    a.download = `${fileName.replace(/\.[^.]+$/, "")}.${ext}`;
    a.click();
    URL.revokeObjectURL(url);
  }, [exported, exportFormat, fileName]);

  const selectedCue =
    universal && selectedIndex >= 0 ? universal.cues[selectedIndex] : null;

  const filteredCues = universal
    ? searchQuery.trim()
      ? universal.cues.filter((c) =>
          c.text.toLowerCase().includes(searchQuery.toLowerCase()),
        )
      : universal.cues
    : [];

  const totalMs = universal
    ? universal.cues.reduce((max, c) => Math.max(max, c.endTime), 0)
    : 0;

  return (
    <div class="app">
      <header class="header">
        <div class="header-left">
          <h1 class="logo">Subconv Editor</h1>
          <FileDrop onFile={handleFile} />
        </div>
        <div class="header-right">
          {fileName && (
            <>
              <span class="file-badge">{fileName}</span>
              <span class="format-badge">{detectedFormat.toUpperCase()}</span>
              <select
                class="export-select"
                value={exportFormat}
                onChange={(e: any) => setExportFormat(e.currentTarget.value)}
              >
                <option value="srt">SRT</option>
                <option value="vtt">VTT</option>
                <option value="ass">ASS</option>
                <option value="json">JSON</option>
                <option value="csv">CSV</option>
              </select>
              <button class="btn btn-export" onClick={handleExport}>
                Export
              </button>
            </>
          )}
        </div>
      </header>

      {!universal ? (
        <div class="empty-state">
          <div class="empty-icon">🎬</div>
          <h2>Drop a subtitle file here</h2>
          <p>Supports SRT, VTT, ASS, JSON, CSV</p>
        </div>
      ) : (
        <>
          <Timeline
            cues={universal.cues}
            totalMs={totalMs}
            selectedIndex={selectedIndex}
            onSelect={setSelectedIndex}
          />

          <div class="main-content">
            <div class="panel panel-left">
              <div class="panel-header">
                <h3>Cues</h3>
                <input
                  class="search-input"
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onInput={(e: any) => setSearchQuery(e.currentTarget.value)}
                />
                <span class="cue-count">{universal.cues.length}</span>
              </div>
              <SubtitleList
                cues={filteredCues}
                selectedIndex={selectedIndex}
                onSelect={setSelectedIndex}
              />
            </div>
            <div class="panel panel-right">
              {selectedCue && (
                <CueEditor
                  cue={selectedCue}
                  index={selectedIndex}
                  onUpdate={handleCueUpdate}
                />
              )}
              {universal && (
                <PreviewPanel
                  universal={universal}
                  selectedIndex={selectedIndex}
                />
              )}
              {analysis && <AnalysisPanel analysis={analysis} />}
            </div>
          </div>

          {exported && (
            <div class="export-panel">
              <div class="export-header">
                <h3>Exported {exportFormat.toUpperCase()}</h3>
                <div class="export-actions">
                  <button class="btn btn-sm" onClick={handleDownload}>
                    Download
                  </button>
                  <button
                    class="btn btn-sm btn-secondary"
                    onClick={() => setExported("")}
                  >
                    Close
                  </button>
                </div>
              </div>
              <pre class="export-content">{exported}</pre>
            </div>
          )}
        </>
      )}
    </div>
  );
}
