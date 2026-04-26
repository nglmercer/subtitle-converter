import { useState, useCallback, useEffect, useRef } from "preact/hooks";
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
  const [actorFilter, setActorFilter] = useState<string>("");
  const [styleFilter, setStyleFilter] = useState<string>("");
  const [detectedFormat, setDetectedFormat] = useState<string>("");
  const [analysis, setAnalysis] = useState<SubtitleAnalysis | null>(null);
  const [exportFormat, setExportFormat] = useState<SubtitleFormat>("srt");
  const [exported, setExported] = useState<string>("");
  const [showShortcuts, setShowShortcuts] = useState(false);
  const searchRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((name: string, text: string) => {
    const detected = detectFormat(text);
    const fmt = detected?.format || "srt";
    const u = parseToUniversal(text, fmt);
    setFileName(name);
    setDetectedFormat(fmt);
    setUniversal(u);
    setSelectedIndex(u.cues.length > 0 ? 0 : -1);
    setSearchQuery("");
    setActorFilter("");
    setStyleFilter("");
    setExported("");
    const a = analyze(text, fmt);
    console.log(u, a);
    setAnalysis(a);
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

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement).tagName;
      const isInput = tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT";
      const mod = e.metaKey || e.ctrlKey;

      if (mod && e.key === "e") {
        e.preventDefault();
        if (universal) handleExport();
        return;
      }
      if (mod && e.key === "f") {
        e.preventDefault();
        searchRef.current?.focus();
        return;
      }
      if (e.key === "Escape") {
        if (exported) {
          setExported("");
          return;
        }
        if (searchQuery) {
          setSearchQuery("");
          return;
        }
        return;
      }
      if (e.key === "?" && !isInput) {
        setShowShortcuts((p) => !p);
        return;
      }
      if (e.key === "ArrowDown" && !isInput) {
        e.preventDefault();
        if (universal)
          setSelectedIndex((i) => Math.min(i + 1, universal.cues.length - 1));
        return;
      }
      if (e.key === "ArrowUp" && !isInput) {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
        return;
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [universal, exported, searchQuery, handleExport]);

  const actors = universal
    ? [...new Set(
        universal.cues
          .map((c) => c.formatSpecific?.ass?.actor || "")
          .filter(Boolean),
      )].sort()
    : [];

  const styles = universal
    ? [...new Set(universal.cues.map((c) => c.style || "").filter(Boolean))].sort()
    : [];

  const selectedCue =
    universal && selectedIndex >= 0 ? universal.cues[selectedIndex] : null;

  const filteredCues = universal
    ? universal.cues.filter((c) => {
        const matchesText = !searchQuery.trim() ||
          c.text.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesActor = !actorFilter ||
          (c.formatSpecific?.ass?.actor || "") === actorFilter;
        const matchesStyle = !styleFilter ||
          (c.style || "") === styleFilter;
        return matchesText && matchesActor && matchesStyle;
      })
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
              {analysis && <AnalysisPanel analysis={analysis} />}
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
              <div class="shortcuts-tip">
                <button
                  class="btn btn-sm btn-secondary"
                  onClick={() => setShowShortcuts((p) => !p)}
                  title="Keyboard shortcuts"
                >
                  ⌨
                </button>
                {showShortcuts && (
                  <div class="shortcuts-popup">
                    <div class="shortcuts-row">
                      <kbd>↑</kbd>
                      <kbd>↓</kbd> <span>Navigate cues</span>
                    </div>
                    <div class="shortcuts-row">
                      <kbd>⌘E</kbd> / <kbd>Ctrl+E</kbd> <span>Export</span>
                    </div>
                    <div class="shortcuts-row">
                      <kbd>⌘F</kbd> / <kbd>Ctrl+F</kbd> <span>Search</span>
                    </div>
                    <div class="shortcuts-row">
                      <kbd>Esc</kbd> <span>Clear search/export</span>
                    </div>
                    <div class="shortcuts-row">
                      <kbd>?</kbd> <span>Toggle shortcuts</span>
                    </div>
                  </div>
                )}
              </div>
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
                  ref={searchRef}
                  type="text"
                  placeholder="Search..."
                  value={searchQuery}
                  onInput={(e: any) => setSearchQuery(e.currentTarget.value)}
                />
                <span class="cue-count">{universal.cues.length}</span>
              </div>
              {(actors.length > 0 || styles.length > 0) && (
                <div class="filter-row">
                  {actors.length > 0 && (
                    <select
                      class="filter-select"
                      value={actorFilter}
                      onChange={(e: any) => {
                        setActorFilter(e.currentTarget.value);
                        setSelectedIndex(-1);
                      }}
                    >
                      <option value="">All actors</option>
                      {actors.map((a) => (
                        <option key={a} value={a}>{a}</option>
                      ))}
                    </select>
                  )}
                  {styles.length > 0 && (
                    <select
                      class="filter-select"
                      value={styleFilter}
                      onChange={(e: any) => {
                        setStyleFilter(e.currentTarget.value);
                        setSelectedIndex(-1);
                      }}
                    >
                      <option value="">All styles</option>
                      {styles.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  )}
                </div>
              )}
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
