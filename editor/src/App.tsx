import type { JSX } from "preact";
import { useState, useCallback, useEffect, useRef } from "preact/hooks";
import type {
  UniversalSubtitle,
  SubtitleFormat,
  SubtitleAnalysis,
  UniversalCue,
  StyleDefinition,
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
import { StyleEditor } from "./components/StyleEditor";
import { ActorManager } from "./components/ActorManager";
import { 
  IconEditor, 
  IconStyles, 
  IconActors, 
  IconAnalysis, 
  IconSearch, 
  IconDownload, 
  IconKeyboard 
} from "./components/Icons";

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
  const [activeTab, setActiveTab] = useState<'editor' | 'styles' | 'actors' | 'analysis'>('editor');
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
    setActiveTab('editor');
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

  const handleStyleUpdate = useCallback(
    (name: string, updates: Partial<StyleDefinition>) => {
      if (!universal) return;
      const u = { ...universal, styles: universal.styles.map((s) =>
        s.name === name ? { ...s, ...updates } : s,
      )};
      setUniversal(u);
    },
    [universal],
  );

  const handleActorRename = useCallback(
    (oldName: string, newName: string) => {
      if (!universal) return;
      const u = { ...universal, cues: universal.cues.map((c) => {
        const actor = c.formatSpecific?.ass?.actor;
        if (actor !== oldName) return c;
        return {
          ...c,
          formatSpecific: {
            ...c.formatSpecific,
            ass: { ...c.formatSpecific?.ass, actor: newName },
          },
        };
      })};
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
      // Tab switching shortcuts
      if (mod && e.key === "1") { e.preventDefault(); setActiveTab('editor'); }
      if (mod && e.key === "2") { e.preventDefault(); setActiveTab('styles'); }
      if (mod && e.key === "3") { e.preventDefault(); setActiveTab('actors'); }
      if (mod && e.key === "4") { e.preventDefault(); setActiveTab('analysis'); }
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
              <div class="file-info">
                <span class="file-name">{fileName}</span>
                <span class="format-badge">{detectedFormat.toUpperCase()}</span>
              </div>
              
              <div class="export-group">
                <select
                  class="export-select"
                  value={exportFormat}
                  onChange={(e: JSX.TargetedEvent<HTMLSelectElement>) => setExportFormat(e.currentTarget.value as SubtitleFormat)}
                >
                  <option value="srt">SRT</option>
                  <option value="vtt">VTT</option>
                  <option value="ass">ASS</option>
                  <option value="json">JSON</option>
                  <option value="csv">CSV</option>
                </select>
                <button class="btn btn-primary btn-export" onClick={handleExport}>
                  Export
                </button>
              </div>

              <div class="shortcuts-tip">
                <button
                  class="btn-icon-circle"
                  onClick={() => setShowShortcuts((p) => !p)}
                  title="Keyboard shortcuts"
                >
                  <IconKeyboard />
                </button>
                {showShortcuts && (
                  <div class="shortcuts-popup">
                    <div class="shortcuts-header">Shortcuts</div>
                    <div class="shortcuts-row">
                      <kbd>↑</kbd> <kbd>↓</kbd> <span>Navigate cues</span>
                    </div>
                    <div class="shortcuts-row">
                      <kbd>⌘1-4</kbd> <span>Switch tabs</span>
                    </div>
                    <div class="shortcuts-row">
                      <kbd>⌘E</kbd> <span>Export</span>
                    </div>
                    <div class="shortcuts-row">
                      <kbd>⌘F</kbd> <span>Search</span>
                    </div>
                    <div class="shortcuts-row">
                      <kbd>Esc</kbd> <span>Clear/Close</span>
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
          <div class="empty-glass">
            <div class="empty-icon">🎬</div>
            <h2>Ready to Edit</h2>
            <p>Drop a subtitle file here to begin</p>
            <div class="supported-formats">SRT • VTT • ASS • JSON • CSV</div>
          </div>
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
                <div class="search-container">
                  <span class="search-icon"><IconSearch /></span>
                  <input
                    class="search-input"
                    ref={searchRef}
                    type="text"
                    placeholder="Search cues..."
                    value={searchQuery}
                    onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => setSearchQuery(e.currentTarget.value)}
                  />
                  {searchQuery && (
                    <button class="search-clear" onClick={() => setSearchQuery("")}>×</button>
                  )}
                </div>
              </div>
              {(actors.length > 0 || styles.length > 0) && (
                <div class="filter-row">
                  {actors.length > 0 && (
                    <select
                      class="filter-select"
                      value={actorFilter}
                      onChange={(e: JSX.TargetedEvent<HTMLSelectElement>) => {
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
                      onChange={(e: JSX.TargetedEvent<HTMLSelectElement>) => {
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
              <div class="panel-footer">
                <span class="cue-count-badge">{filteredCues.length} / {universal.cues.length} Cues</span>
              </div>
            </div>

            <div class="panel panel-right">
              <nav class="tabs-nav">
                <button 
                  class={`tab-btn ${activeTab === 'editor' ? 'active' : ''}`}
                  onClick={() => setActiveTab('editor')}
                >
                  <span class="tab-icon"><IconEditor /></span> Editor
                </button>
                <button 
                  class={`tab-btn ${activeTab === 'styles' ? 'active' : ''}`}
                  onClick={() => setActiveTab('styles')}
                >
                  <span class="tab-icon"><IconStyles /></span> Styles
                </button>
                <button 
                  class={`tab-btn ${activeTab === 'actors' ? 'active' : ''}`}
                  onClick={() => setActiveTab('actors')}
                >
                  <span class="tab-icon"><IconActors /></span> Actors
                </button>
                <button 
                  class={`tab-btn ${activeTab === 'analysis' ? 'active' : ''}`}
                  onClick={() => setActiveTab('analysis')}
                >
                  <span class="tab-icon"><IconAnalysis /></span> Analysis
                </button>
              </nav>

              <div class="tab-content">
                {activeTab === 'editor' && (
                  <div class="editor-tab">
                    {selectedCue && (
                      <CueEditor
                        cue={selectedCue}
                        index={selectedIndex}
                        onUpdate={handleCueUpdate}
                      />
                    )}
                  </div>
                )}
                
                {activeTab === 'styles' && (
                  <div class="styles-tab">
                    {universal && universal.styles.length > 0 ? (
                      <StyleEditor
                        styles={universal.styles}
                        onUpdate={handleStyleUpdate}
                      />
                    ) : (
                      <div class="tab-empty">No styles found in this file</div>
                    )}
                  </div>
                )}

                {activeTab === 'actors' && (
                  <div class="actors-tab">
                    {universal && (
                      <ActorManager
                        universal={universal}
                        onActorRename={handleActorRename}
                      />
                    )}
                  </div>
                )}

                {activeTab === 'analysis' && (
                  <div class="analysis-tab">
                    {analysis ? (
                      <AnalysisPanel analysis={analysis} />
                    ) : (
                      <div class="tab-empty">Analysis not available</div>
                    )}
                  </div>
                )}
              </div>

              {universal && (
                <div class="persistent-preview">
                  <PreviewPanel
                    universal={universal}
                    selectedIndex={selectedIndex}
                  />
                </div>
              )}
            </div>
          </div>

          {exported && (
            <div class="export-overlay">
              <div class="export-modal">
                <div class="export-header">
                  <h3>Export Preview ({exportFormat.toUpperCase()})</h3>
                  <div class="export-actions">
                    <button class="btn btn-primary" onClick={handleDownload}>
                      Download File
                    </button>
                    <button
                      class="btn btn-secondary"
                      onClick={() => setExported("")}
                    >
                      Close
                    </button>
                  </div>
                </div>
                <pre class="export-content">{exported}</pre>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
