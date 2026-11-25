import React, { useState, useRef } from 'react';
import {
  Paperclip,
  Upload,
  FileText,
  Trash2,
  ExternalLink,
  Download,
  ZoomIn,
  X,
  Loader2,
  AlertCircle,
  MessageSquare,
} from 'lucide-react';
import { TaskAttachment } from '../../types/crm';
import {
  deleteTaskAttachment,
  formatFileSize,
  isImageAttachment,
  uploadTaskAttachment,
} from '../../data/attachmentService';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface TaskAttachmentsPanelProps {
  attachments: TaskAttachment[];
  onChange: (next: TaskAttachment[]) => void;
  compact?: boolean;
  title?: string;
}

export const TaskAttachmentsPanel: React.FC<TaskAttachmentsPanelProps> = ({
  attachments,
  onChange,
  compact = false,
  title = 'Issue Screenshots & PDF Attachments',
}) => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const isLight = theme === 'white-sky';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draftIssueNote, setDraftIssueNote] = useState('');
  const [lightboxItem, setLightboxItem] = useState<TaskAttachment | null>(null);

  const handleFiles = async (files: FileList | File[]) => {
    const list = Array.from(files || []);
    if (list.length === 0) return;

    setUploading(true);
    setErrorMsg(null);
    const added: TaskAttachment[] = [];

    try {
      for (let i = 0; i < list.length; i++) {
        const f = list[i];
        const uploaded = await uploadTaskAttachment(
          f,
          currentUser?.name || 'Staff',
          i === 0 ? draftIssueNote : undefined
        );
        added.push(uploaded);
      }
      if (added.length > 0) {
        onChange([...added, ...attachments]);
        setDraftIssueNote('');
      }
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Failed to upload file.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      const it = items[i];
      if (it.kind === 'file') {
        const f = it.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      handleFiles(files);
    }
  };

  const handleUpdateNote = (id: string, note: string) => {
    onChange(
      attachments.map((att) =>
        att.id === id ? { ...att, issueNote: note } : att
      )
    );
  };

  const handleRemove = (att: TaskAttachment) => {
    onChange(attachments.filter((a) => a.id !== att.id));
    deleteTaskAttachment(att.id);
    if (lightboxItem?.id === att.id) setLightboxItem(null);
  };

  return (
    <div onPaste={handlePaste} className="space-y-2.5">
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <label className="text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
          <Paperclip className="w-3.5 h-3.5 text-sky-500" />
          <span>
            {title} ({attachments.length})
          </span>
        </label>
        <span className="text-[10px] text-slate-400">
          PNG, JPG, WEBP, PDF · Paste screenshot (`Ctrl+V`)
        </span>
      </div>

      {/* Clean Upload Box + Optional Issue Note Input */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        }}
        className={`rounded-xl border border-dashed transition-all ${
          compact ? 'p-2.5' : 'p-3'
        } ${
          isDragging
            ? 'border-sky-500 bg-sky-500/10'
            : isLight
            ? 'border-sky-200 bg-sky-50/35 hover:border-sky-400'
            : 'border-slate-700 bg-slate-900/50 hover:border-sky-500/60'
        }`}
      >
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          <input
            type="text"
            value={draftIssueNote}
            onChange={(e) => setDraftIssueNote(e.target.value)}
            placeholder="Describe issue for this screenshot/PDF (optional) or paste Ctrl+V..."
            className={`flex-1 px-3 py-1.5 rounded-lg border text-xs outline-none ${
              isLight
                ? 'bg-white border-slate-200 text-slate-800 focus:border-sky-500'
                : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
            }`}
          />

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/png,image/jpeg,image/webp,image/gif,application/pdf"
            onChange={(e) => e.target.files && handleFiles(e.target.files)}
            className="hidden"
          />

          <button
            type="button"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
            className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-600 disabled:opacity-50 text-white shadow-2xs transition-all shrink-0 cursor-pointer"
          >
            {uploading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Uploading...</span>
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                <span>Attach File</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold text-rose-500">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Attached Proof Cards (Thumbnail + Per-File Issue Content Note) */}
      {attachments.length > 0 && (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-0.5">
          {attachments.map((att) => {
            const isImg = isImageAttachment(att);
            return (
              <div
                key={att.id}
                className={`p-2.5 rounded-xl border flex items-start gap-3 transition-all ${
                  isLight
                    ? 'bg-white border-slate-200/90 hover:border-sky-300'
                    : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                }`}
              >
                {/* Left Preview Thumbnail */}
                {isImg ? (
                  <button
                    type="button"
                    onClick={() => setLightboxItem(att)}
                    className="relative w-20 h-16 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-700 shrink-0 group cursor-pointer bg-slate-100 dark:bg-slate-800"
                    title="Click to zoom screenshot"
                  >
                    <img
                      src={att.url}
                      alt={att.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                    <span className="absolute inset-0 bg-slate-950/35 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                      <ZoomIn className="w-4 h-4 text-white" />
                    </span>
                  </button>
                ) : (
                  <a
                    href={att.url}
                    target="_blank"
                    rel="noreferrer"
                    className="w-20 h-16 rounded-lg border border-rose-200 dark:border-rose-900/60 bg-rose-500/10 text-rose-500 flex flex-col items-center justify-center shrink-0 hover:bg-rose-500/20 transition-colors"
                    title="Open PDF in new tab"
                  >
                    <FileText className="w-5 h-5" />
                    <span className="text-[9px] font-extrabold uppercase mt-0.5">PDF</span>
                  </a>
                )}

                {/* Right File Info + Inline Editable Issue/Note */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-xs font-bold truncate text-slate-800 dark:text-white">
                        {att.name}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatFileSize(att.size)}
                        {att.uploadedBy ? ` · ${att.uploadedBy}` : ''}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {isImg ? (
                        <button
                          type="button"
                          onClick={() => setLightboxItem(att)}
                          className="p-1 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800"
                          title="Preview full screen"
                        >
                          <ZoomIn className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        <a
                          href={att.url}
                          target="_blank"
                          rel="noreferrer"
                          className="p-1 rounded-lg text-slate-400 hover:text-sky-500 hover:bg-sky-50 dark:hover:bg-slate-800"
                          title="View PDF"
                        >
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                      <a
                        href={att.url}
                        download={att.name}
                        className="p-1 rounded-lg text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-slate-800"
                        title="Download file"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </a>
                      <button
                        type="button"
                        onClick={() => handleRemove(att)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-slate-800"
                        title="Remove attachment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Per-attachment Issue / Content Note */}
                  <div className="relative flex items-center">
                    <MessageSquare className="w-3 h-3 text-amber-500 absolute left-2.5 pointer-events-none" />
                    <input
                      type="text"
                      value={att.issueNote || ''}
                      onChange={(e) => handleUpdateNote(att.id, e.target.value)}
                      placeholder="Add issue details or note for this file..."
                      className={`w-full pl-7 pr-2.5 py-1 rounded-lg border text-[11px] font-medium outline-none ${
                        isLight
                          ? 'bg-amber-50/40 border-amber-200/70 text-slate-800 placeholder-slate-400 focus:border-sky-500 focus:bg-white'
                          : 'bg-slate-800/70 border-slate-700 text-slate-100 placeholder-slate-500 focus:border-sky-400'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full-Screen Screenshot Lightbox Viewer */}
      {lightboxItem && (
        <div
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-xs"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-w-5xl w-full max-h-[90vh] flex flex-col rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-4 py-3 border-b border-slate-800 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">{lightboxItem.name}</div>
                <div className="text-[10px] text-slate-400">
                  {formatFileSize(lightboxItem.size)}
                  {lightboxItem.uploadedBy ? ` · Uploaded by ${lightboxItem.uploadedBy}` : ''}
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={lightboxItem.url}
                  download={lightboxItem.name}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold bg-sky-500 hover:bg-sky-600 text-white"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxItem(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-auto flex items-center justify-center p-4 bg-black/50">
              <img
                src={lightboxItem.url}
                alt={lightboxItem.name}
                className="max-w-full max-h-[70vh] object-contain rounded-lg shadow-lg"
              />
            </div>

            {lightboxItem.issueNote && (
              <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 text-xs text-amber-200 flex items-start gap-2">
                <MessageSquare className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-amber-400 mr-1.5">Issue Note:</span>
                  <span>{lightboxItem.issueNote}</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
