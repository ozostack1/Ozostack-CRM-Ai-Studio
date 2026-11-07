import React, { useState } from 'react';
import {
  X,
  Download,
  Share2,
  Star,
  Trash2,
  FileCode,
  FileText,
  FileSpreadsheet,
  File,
  ShieldCheck,
  Check,
  Copy,
  ExternalLink,
  Code,
  Folder,
} from 'lucide-react';
import { DocumentItem } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';

interface DocumentDetailsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  document: DocumentItem | null;
  onToggleStar: (id: string) => void;
  onDelete: (id: string, name: string) => void;
  onDownload: (doc: DocumentItem) => void;
  onNotify?: (msg: string) => void;
}

export const DocumentDetailsDrawer: React.FC<DocumentDetailsDrawerProps> = ({
  isOpen,
  onClose,
  document,
  onToggleStar,
  onDelete,
  onDownload,
  onNotify,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';
  const [copiedChecksum, setCopiedChecksum] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  if (!isOpen || !document) return null;

  const getBadgeColor = (type: string) => {
    switch (type) {
      case 'code_zip':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'pdf':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-300 dark:border-rose-800';
      case 'docx':
        return 'bg-sky-500/15 text-sky-600 dark:text-sky-400 border-sky-300 dark:border-sky-800';
      case 'xlsx':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-300 dark:border-emerald-800';
      case 'pptx':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-300 dark:border-amber-800';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-300 dark:border-slate-700';
    }
  };

  const getFileIcon = (type: string) => {
    switch (type) {
      case 'code_zip':
        return <FileCode className="w-5 h-5 text-emerald-500" />;
      case 'pdf':
        return <FileText className="w-5 h-5 text-rose-500" />;
      case 'docx':
        return <FileText className="w-5 h-5 text-sky-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="w-5 h-5 text-emerald-500" />;
      case 'pptx':
        return <File className="w-5 h-5 text-amber-500" />;
      default:
        return <File className="w-5 h-5 text-slate-400" />;
    }
  };

  const copyChecksum = () => {
    if (document.checksum) {
      if (navigator.clipboard) {
        navigator.clipboard.writeText(document.checksum).catch(() => {});
      }
      setCopiedChecksum(true);
      if (onNotify) onNotify('SHA-256 Checksum copied to clipboard.');
      setTimeout(() => setCopiedChecksum(false), 2000);
    }
  };

  const copyShareLink = () => {
    const url = `https://app.ozostack.io/vault/share/${document.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).catch(() => {});
    }
    setCopiedShare(true);
    if (onNotify) onNotify(`Secure share link copied for "${document.name}".`);
    setTimeout(() => setCopiedShare(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div
          className={`w-screen max-w-xl shadow-2xl border-l flex flex-col ${
            isLight
              ? 'bg-white border-sky-100 text-slate-800'
              : 'bg-[#0f172a] border-slate-800 text-slate-100'
          }`}
        >
          {/* Header */}
          <div className="p-5 border-b border-sky-100/30 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-11 h-11 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-extrabold text-lg shadow-xs shrink-0 mt-0.5">
                {getFileIcon(document.fileType)}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <span
                    className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getBadgeColor(
                      document.fileType
                    )}`}
                  >
                    {document.fileType === 'code_zip' ? '</> CODE ZIP' : document.fileType.toUpperCase()}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">
                    {document.fileSizeFormatted}
                  </span>
                  {document.isStarred && (
                    <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-amber-500/15 text-amber-500">
                      ★ Starred
                    </span>
                  )}
                </div>

                <h2 className="text-base font-bold text-slate-900 dark:text-white truncate" title={document.name}>
                  {document.name}
                </h2>

                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-sky-600 dark:text-sky-400">{document.folderName}</span>
                  {document.client && (
                    <>
                      <span>•</span>
                      <span>{document.client}</span>
                    </>
                  )}
                </p>
              </div>
            </div>

            {/* Header Actions */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => onToggleStar(document.id)}
                className={`p-1.5 rounded-lg transition-colors ${
                  document.isStarred
                    ? 'text-amber-500 bg-amber-500/10'
                    : 'text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={document.isStarred ? 'Remove from Starred' : 'Add to Starred'}
              >
                <Star className={`w-4 h-4 ${document.isStarred ? 'fill-current' : ''}`} />
              </button>

              <button
                onClick={copyShareLink}
                className={`p-1.5 rounded-lg transition-colors ${
                  copiedShare
                    ? 'text-emerald-500 bg-emerald-500/10'
                    : 'text-slate-400 hover:text-sky-500 hover:bg-slate-100 dark:hover:bg-slate-800'
                }`}
                title={copiedShare ? 'Copied Link!' : 'Copy Secure Share Link'}
              >
                {copiedShare ? <Check className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-4 h-4" />}
              </button>

              <button
                onClick={() => {
                  if (confirm(`Delete "${document.name}"?`)) {
                    onDelete(document.id, document.name);
                    onClose();
                  }
                }}
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800 transition-colors"
                title="Delete Document"
              >
                <Trash2 className="w-4 h-4" />
              </button>

              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-3 gap-2 px-5 py-3 border-b border-sky-100/30 bg-sky-50/30 dark:bg-slate-800/40 text-center text-xs">
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">File Size</span>
              <span className="text-xs font-bold text-slate-800 dark:text-white">
                {document.fileSizeFormatted}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Uploaded By</span>
              <span className="text-xs font-bold text-sky-600 dark:text-sky-400 truncate block">
                {document.uploadedBy}
              </span>
            </div>
            <div>
              <span className="text-[10px] text-slate-400 uppercase font-semibold block">Security Status</span>
              <span className="text-xs font-extrabold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Encrypted</span>
              </span>
            </div>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 text-xs space-y-4">
            {/* Primary Action Button */}
            <button
              onClick={() => onDownload(document)}
              className="w-full py-2.5 px-4 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-bold text-xs shadow-sm transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              <span>Download {document.name}</span>
            </button>

            {/* Description Card */}
            <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
              <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-sky-500" />
                Document Synopsis & Description
              </h3>
              <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs">
                {document.description}
              </p>

              {document.tags && document.tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap mt-3 pt-2.5 border-t border-sky-100/30">
                  {document.tags.map((tag) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Manifest / File Tree for Code ZIPs */}
            {document.manifestFiles && document.manifestFiles.length > 0 && (
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <Code className="w-3.5 h-3.5 text-emerald-500" />
                    Archive File Manifest ({document.manifestFiles.length} files)
                  </h3>
                  <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                    ZIP Indexed
                  </span>
                </div>
                <div className="space-y-1 font-mono text-[11px] bg-slate-900 text-slate-200 p-3 rounded-lg border border-slate-700 max-h-40 overflow-y-auto">
                  {document.manifestFiles.map((file) => (
                    <div key={file} className="flex items-center gap-2 hover:text-emerald-400 transition-colors">
                      <Folder className="w-3 h-3 text-sky-400 shrink-0" />
                      <span className="truncate">{file}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Code / Content Preview Snippet */}
            {document.previewSnippet && (
              <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                    <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                    Preview Snippet
                  </h3>
                  <span className="text-[10px] text-slate-400">Read-only preview</span>
                </div>
                <pre className="p-3 rounded-lg bg-slate-950 text-slate-200 font-mono text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed border border-slate-800">
                  {document.previewSnippet}
                </pre>
              </div>
            )}

            {/* Cryptographic Checksum & Integrity */}
            <div className={`p-4 rounded-xl border ${isLight ? 'bg-slate-50/70 border-sky-100' : 'bg-slate-800/40 border-slate-700'}`}>
              <div className="flex items-center justify-between mb-2">
                <span className="font-bold text-xs text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Cryptographic Integrity (SHA-256)
                </span>
                <button
                  onClick={copyChecksum}
                  className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                >
                  {copiedChecksum ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-500" />
                      <span className="text-emerald-500">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="font-mono text-[10px] text-slate-500 dark:text-slate-400 break-all bg-white dark:bg-slate-900 p-2 rounded-lg border border-slate-200 dark:border-slate-800">
                {document.checksum || 'sha256-verified-and-encrypted'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

