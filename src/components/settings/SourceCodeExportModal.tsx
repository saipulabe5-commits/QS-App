import React, { useState, useEffect } from 'react';
import {
  X,
  Download,
  Copy,
  Check,
  Code2,
  FileCode,
  FolderTree,
  FileText,
  Search,
  Layers,
  Sparkles,
  RefreshCw,
  ExternalLink,
  ShieldCheck,
  Server,
  Cpu,
} from 'lucide-react';

interface SourceCodePayload {
  project: string;
  application: string;
  version: string;
  description: string;
  exportedAt: string;
  generator: string;
  summary: {
    totalFiles: number;
    totalLines: number;
    totalSizeKb: number;
    categories: {
      components: number;
      context: number;
      types: number;
      utils: number;
      data: number;
      server: number;
      configs: number;
    };
  };
  fileList: Array<{
    path: string;
    size: number;
    lines: number;
    modified: string;
  }>;
  sourceFiles: Record<
    string,
    {
      size: number;
      lines: number;
      extension: string;
      content: string;
      modified: string;
    }
  >;
}

interface SourceCodeExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onShowToast: (title: string, message: string, type: 'success' | 'info' | 'warning' | 'error') => void;
}

export const SourceCodeExportModal: React.FC<SourceCodeExportModalProps> = ({
  isOpen,
  onClose,
  onShowToast,
}) => {
  const [data, setData] = useState<SourceCodePayload | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<'explorer' | 'json_preview'>('explorer');

  useEffect(() => {
    if (isOpen) {
      fetchSourceCode();
    }
  }, [isOpen]);

  const fetchSourceCode = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/export/source-code');
      if (!res.ok) {
        throw new Error(`Server returned status ${res.status}`);
      }
      const json = await res.json();
      setData(json);
      // default select the first file or App.tsx / server.ts
      if (json.fileList && json.fileList.length > 0) {
        const preferred = json.fileList.find((f: any) => f.path.includes('App.tsx')) || json.fileList[0];
        setSelectedFile(preferred.path);
      }
    } catch (err: any) {
      console.error('Fetch source code error:', err);
      setError(err?.message || 'Gagal memuat struktur source code');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (!data) return;
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const dateStr = new Date().toISOString().slice(0, 10);
    a.href = url;
    a.download = `SOURCE_CODE_${(data.application || 'rab_pro').toUpperCase()}_${dateStr}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    onShowToast('Download Dimulai', 'Berkas JSON source code lengkap berhasil diunduh.', 'success');
  };

  const handleCopyJSON = async () => {
    if (!data) return;
    try {
      await navigator.clipboard.writeText(JSON.stringify(data, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
      onShowToast('Disalin', 'Seluruh data JSON source code berhasil disalin ke clipboard.', 'success');
    } catch (err) {
      onShowToast('Gagal Menyalin', 'Tidak dapat mengakses clipboard browser.', 'error');
    }
  };

  const handleCopyFileContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      onShowToast('File Disalin', `Isi berkas ${selectedFile} berhasil disalin.`, 'success');
    } catch (err) {
      onShowToast('Gagal Menyalin', 'Tidak dapat mengakses clipboard browser.', 'error');
    }
  };

  if (!isOpen) return null;

  const filteredFiles = (data?.fileList || []).filter((file) => {
    const matchesSearch = file.path.toLowerCase().includes(searchQuery.toLowerCase());
    if (!matchesSearch) return false;
    if (selectedCategory === 'all') return true;
    if (selectedCategory === 'components') return file.path.startsWith('src/components/');
    if (selectedCategory === 'context') return file.path.startsWith('src/context/');
    if (selectedCategory === 'types') return file.path.startsWith('src/types/') || file.path === 'src/types.ts';
    if (selectedCategory === 'utils') return file.path.startsWith('src/utils/');
    if (selectedCategory === 'data') return file.path.startsWith('src/data/');
    if (selectedCategory === 'server') return file.path.startsWith('server');
    if (selectedCategory === 'config') return !file.path.startsWith('src/');
    return true;
  });

  const activeFileData = selectedFile && data?.sourceFiles ? data.sourceFiles[selectedFile] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-6xl h-[90vh] rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-xs">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="text-base font-bold text-slate-900">
                  Export Source Code Project (JSON File)
                </h3>
                <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-700 rounded-full">
                  JSON Bundle v1.0
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Struktur dan seluruh kode sumber aplikasi dikemas rapi dalam satu file JSON standar
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={fetchSourceCode}
              disabled={loading}
              className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-blue-600' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Quick Stats Bar */}
        {data && (
          <div className="bg-slate-900 text-white px-6 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs flex-shrink-0">
            <div className="flex flex-wrap items-center gap-4 text-slate-300">
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Total File:</span>
                <span className="font-bold text-white font-mono">{data.summary.totalFiles} berkas</span>
              </div>
              <div className="w-1 h-3 bg-slate-700 hidden sm:block"></div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Total Baris:</span>
                <span className="font-bold text-emerald-400 font-mono">
                  {data.summary.totalLines.toLocaleString('id-ID')} baris
                </span>
              </div>
              <div className="w-1 h-3 bg-slate-700 hidden sm:block"></div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Ukuran Bundle:</span>
                <span className="font-bold text-amber-300 font-mono">{data.summary.totalSizeKb} KB</span>
              </div>
              <div className="w-1 h-3 bg-slate-700 hidden sm:block"></div>
              <div className="flex items-center space-x-1.5">
                <span className="text-slate-400">Tech Stack:</span>
                <span className="text-blue-300 font-medium">React + TS + Tailwind + Vite + Express + Gemini</span>
              </div>
            </div>

            {/* View Mode Tabs */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg border border-slate-700">
              <button
                onClick={() => setActiveTab('explorer')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'explorer'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FolderTree className="w-3.5 h-3.5" />
                <span>File Explorer</span>
              </button>
              <button
                onClick={() => setActiveTab('json_preview')}
                className={`px-3 py-1 text-xs font-semibold rounded-md transition-colors flex items-center space-x-1.5 ${
                  activeTab === 'json_preview'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <FileCode className="w-3.5 h-3.5" />
                <span>Raw JSON Preview</span>
              </button>
            </div>
          </div>
        )}

        {/* Content Area */}
        <div className="flex-1 flex overflow-hidden">
          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
              <RefreshCw className="w-8 h-8 text-blue-600 animate-spin" />
              <p className="text-sm font-semibold text-slate-700">Memindai dan mengemas seluruh source code...</p>
              <p className="text-xs text-slate-400">Membaca berkas TypeScript, React components, CSS, dan server logic</p>
            </div>
          ) : error ? (
            <div className="flex-1 flex flex-col items-center justify-center p-8 space-y-3">
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-200">
                <X className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-900">{error}</p>
              <button
                onClick={fetchSourceCode}
                className="px-4 py-2 bg-blue-600 text-white text-xs font-semibold rounded-xl"
              >
                Coba Lagi
              </button>
            </div>
          ) : activeTab === 'explorer' ? (
            <>
              {/* Left Column: File Tree / File List */}
              <div className="w-80 border-r border-slate-200 flex flex-col bg-slate-50 flex-shrink-0">
                {/* Filter and Search */}
                <div className="p-3 border-b border-slate-200 space-y-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Cari file (mis: Settings, types...)"
                      className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg focus:ring-2 focus:ring-blue-500/20"
                    />
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {[
                      { id: 'all', label: 'Semua' },
                      { id: 'components', label: 'Components' },
                      { id: 'context', label: 'Context' },
                      { id: 'types', label: 'Types' },
                      { id: 'utils', label: 'Utils' },
                      { id: 'server', label: 'Server' },
                      { id: 'config', label: 'Config' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id)}
                        className={`px-2 py-0.5 text-[10px] font-semibold rounded-md transition-colors ${
                          selectedCategory === cat.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-slate-600 hover:bg-slate-200 border border-slate-200'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File List */}
                <div className="flex-1 overflow-y-auto divide-y divide-slate-100 p-1">
                  {filteredFiles.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400">
                      Tidak ada berkas yang cocok dengan filter.
                    </div>
                  ) : (
                    filteredFiles.map((file) => {
                      const isSelected = selectedFile === file.path;
                      return (
                        <button
                          key={file.path}
                          onClick={() => setSelectedFile(file.path)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors flex items-center justify-between group ${
                            isSelected
                              ? 'bg-blue-100/80 text-blue-900 font-semibold shadow-2xs'
                              : 'hover:bg-slate-200/60 text-slate-700'
                          }`}
                        >
                          <div className="flex items-center space-x-2 truncate pr-2">
                            <FileCode
                              className={`w-4 h-4 flex-shrink-0 ${
                                isSelected
                                  ? 'text-blue-600'
                                  : file.path.endsWith('.tsx')
                                  ? 'text-sky-500'
                                  : file.path.endsWith('.ts')
                                  ? 'text-blue-500'
                                  : file.path.endsWith('.json')
                                  ? 'text-amber-500'
                                  : file.path.endsWith('.css')
                                  ? 'text-pink-500'
                                  : 'text-slate-400'
                              }`}
                            />
                            <span className="truncate">{file.path}</span>
                          </div>
                          <span className="text-[10px] font-mono text-slate-400 flex-shrink-0">
                            {file.lines} l
                          </span>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Right Column: Active File Viewer */}
              <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
                {activeFileData && selectedFile ? (
                  <>
                    <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                      <div className="flex items-center space-x-2 truncate">
                        <FileCode className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-xs font-mono font-semibold text-slate-200 truncate">
                          {selectedFile}
                        </span>
                        <span className="px-2 py-0.5 text-[10px] bg-slate-800 text-slate-400 rounded-md font-mono">
                          {activeFileData.lines} baris • {Math.round((activeFileData.size / 1024) * 10) / 10} KB
                        </span>
                      </div>

                      <button
                        onClick={() => handleCopyFileContent(activeFileData.content)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin File</span>
                      </button>
                    </div>

                    <div className="flex-1 overflow-auto p-4 font-mono text-xs text-slate-300 leading-relaxed select-text">
                      <pre className="whitespace-pre">
                        <code>{activeFileData.content}</code>
                      </pre>
                    </div>
                  </>
                ) : (
                  <div className="flex-1 flex items-center justify-center text-slate-500 text-xs">
                    Pilih salah satu berkas di sebelah kiri untuk melihat isi kode
                  </div>
                )}
              </div>
            </>
          ) : (
            /* Raw JSON Preview Tab */
            <div className="flex-1 flex flex-col bg-slate-950 overflow-hidden">
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center space-x-2">
                  <FileCode className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-mono font-semibold text-slate-200">
                    JSON Schema & Data Bundle
                  </span>
                </div>

                <button
                  onClick={handleCopyJSON}
                  className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg transition-colors flex items-center space-x-1.5"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Berhasil Disalin' : 'Salin Seluruh JSON'}</span>
                </button>
              </div>

              <div className="flex-1 overflow-auto p-4 font-mono text-xs text-emerald-300/90 leading-relaxed select-text">
                <pre className="whitespace-pre">
                  <code>{JSON.stringify(data, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row items-center justify-between gap-3 flex-shrink-0">
          <div className="flex items-center space-x-2 text-xs text-slate-500">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Format berkas JSON terstandarisasi, mudah dibaca, di-backup, atau diimpor ke sistem lain.</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto justify-end">
            <button
              onClick={handleCopyJSON}
              disabled={!data}
              className="px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-semibold rounded-xl transition-colors flex items-center space-x-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'JSON Disalin' : 'Salin JSON'}</span>
            </button>

            <button
              onClick={handleDownload}
              disabled={!data}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center space-x-2"
            >
              <Download className="w-4 h-4" />
              <span>Download File JSON (.json)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
