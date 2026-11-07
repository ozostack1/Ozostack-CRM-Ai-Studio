import React, { useState } from 'react';
import { X, FolderPlus, Palette } from 'lucide-react';
import { DocumentFolder } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';

interface NewFolderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateFolder: (folder: DocumentFolder) => void;
}

const COLOR_OPTIONS = [
  { name: 'Sky Blue', hex: '#38bdf8' },
  { name: 'Purple', hex: '#a855f7' },
  { name: 'Emerald Green', hex: '#10b981' },
  { name: 'Amber Gold', hex: '#f59e0b' },
  { name: 'Pink Rose', hex: '#ec4899' },
  { name: 'Cyan Teal', hex: '#06b6d4' },
  { name: 'Indigo', hex: '#6366f1' },
];

export const NewFolderModal: React.FC<NewFolderModalProps> = ({
  isOpen,
  onClose,
  onCreateFolder,
}) => {
  const { theme } = useTheme();
  const isLight = theme === 'white-sky';

  const [folderName, setFolderName] = useState('');
  const [selectedColor, setSelectedColor] = useState(COLOR_OPTIONS[0].hex);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!folderName.trim()) return;

    const newFolder: DocumentFolder = {
      id: `folder-${Date.now()}`,
      name: folderName.trim(),
      iconColor: selectedColor,
      filesCount: 0,
      totalSizeBytes: 0,
      totalSizeFormatted: '0 KB',
    };

    onCreateFolder(newFolder);
    setFolderName('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div
        className={`relative w-full max-w-md rounded-2xl shadow-2xl border flex flex-col overflow-hidden my-auto animate-fade-in ${
          isLight
            ? 'bg-white border-sky-100 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-sky-100/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-extrabold shadow-sm">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Create New Folder
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Organize repository bundles, pitch decks, and legal files
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 text-xs">
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Folder Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              placeholder="e.g. Security Audits & SOC2"
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-2">
              Color Accent Badge
            </label>
            <div className="flex items-center gap-2.5 flex-wrap">
              {COLOR_OPTIONS.map((col) => (
                <button
                  key={col.hex}
                  type="button"
                  onClick={() => setSelectedColor(col.hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-all flex items-center justify-center ${
                    selectedColor === col.hex
                      ? 'scale-115 ring-2 ring-sky-400 border-white'
                      : 'border-transparent hover:scale-105'
                  }`}
                  style={{ backgroundColor: col.hex }}
                  title={col.name}
                />
              ))}
            </div>
          </div>

          <div className="pt-3 border-t border-sky-100/30 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs font-semibold rounded-xl border transition-colors ${
                isLight
                  ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100'
                  : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
            >
              Create Folder
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

