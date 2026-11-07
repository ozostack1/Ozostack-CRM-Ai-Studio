import React, { useState } from 'react';
import {
  X,
  Upload,
  FolderKanban,
  FileCode,
  FileText,
  FileSpreadsheet,
  File,
  CheckCircle2,
  DollarSign,
  Building2,
  Star,
  Tag,
} from 'lucide-react';
import { DocumentItem, DocumentFileType, DocumentFolder } from '../../types/crm';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';

interface DocumentUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (doc: DocumentItem) => void;
  availableFolders: DocumentFolder[];
  availableClients?: string[];
  availableProjects?: string[];
  defaultFolderId?: string;
}

export const DocumentUploadModal: React.FC<DocumentUploadModalProps> = ({
  isOpen,
  onClose,
  onUpload,
  availableFolders,
  availableClients = ['FinEdge Systems', 'TechVision Inc.', 'SwiftRetail Global', 'DLF Limited', 'Mahindra Housing'],
  availableProjects = ['PCI-DSS Banking API Gateway', 'Cloud Migration & Microservices', 'Omnichannel POS Sync Engine'],
  defaultFolderId,
}) => {
  const { theme } = useTheme();
  const { users, currentUser } = useAuth();
  const isLight = theme === 'white-sky';

  const [name, setName] = useState('');
  const [folderId, setFolderId] = useState(defaultFolderId || availableFolders[0]?.id || 'folder-3');
  const [fileType, setFileType] = useState<DocumentFileType>('code_zip');
  const [description, setDescription] = useState('');
  const [client, setClient] = useState(availableClients[0] || 'FinEdge Systems');
  const [project, setProject] = useState(availableProjects[0] || 'PCI-DSS Banking API Gateway');
  const [fileSizeFormatted, setFileSizeFormatted] = useState('18.5 MB');
  const [uploadedBy, setUploadedBy] = useState(currentUser?.name || 'Engineering Team');
  const [isStarred, setIsStarred] = useState(false);
  const [tagsInput, setTagsInput] = useState('');
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Sync folder if defaultFolderId updates
  React.useEffect(() => {
    if (defaultFolderId) {
      setFolderId(defaultFolderId);
    }
  }, [defaultFolderId, isOpen]);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = (file: File) => {
    setName(file.name);
    const sizeMb = Math.round((file.size / (1024 * 1024)) * 10) / 10;
    setFileSizeFormatted(sizeMb > 0 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`);

    if (file.name.endsWith('.zip') || file.name.endsWith('.tar.gz') || file.name.endsWith('.7z')) {
      setFileType('code_zip');
    } else if (file.name.endsWith('.pdf')) {
      setFileType('pdf');
    } else if (file.name.endsWith('.docx') || file.name.endsWith('.doc')) {
      setFileType('docx');
    } else if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
      setFileType('xlsx');
    } else if (file.name.endsWith('.pptx') || file.name.endsWith('.ppt')) {
      setFileType('pptx');
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const matchedFolder = availableFolders.find((f) => f.id === folderId) || availableFolders[0];
    const folderName = matchedFolder?.name || 'Source Code & Repositories';

    const tags = tagsInput
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t.length > 0);

    const ext = name.includes('.') ? `.${name.split('.').pop()}` : fileType === 'code_zip' ? '.zip' : '.pdf';

    const newDoc: DocumentItem = {
      id: `doc-${Date.now()}`,
      name: name.trim(),
      description: description.trim() || 'Uploaded enterprise vault file.',
      folderId,
      folderName,
      fileType,
      extension: ext,
      fileSizeFormatted,
      fileSizeBytes: parseFloat(fileSizeFormatted) * 1024 * 1024,
      uploadedBy,
      client,
      project,
      isStarred,
      tags: tags.length > 0 ? tags : ['Vault', 'Secure'],
      filesCount: fileType === 'code_zip' ? 6 : undefined,
      checksum: `sha256-${Math.random().toString(36).substring(2)}${Math.random().toString(36).substring(2)}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      previewSnippet: fileType === 'code_zip' ? '// Uploaded project source code package\nexport default {};' : undefined,
      manifestFiles: fileType === 'code_zip' ? ['src/index.ts', 'src/app.ts', 'package.json', 'README.md'] : undefined,
    };

    onUpload(newDoc);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div
        className={`relative w-full max-w-2xl rounded-2xl shadow-2xl border flex flex-col max-h-[92vh] overflow-hidden my-auto animate-fade-in ${
          isLight
            ? 'bg-white border-sky-100 text-slate-800'
            : 'bg-slate-900 border-slate-700 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-sky-100/30">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-500 text-white flex items-center justify-center font-extrabold shadow-sm">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Upload File or Code ZIP
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Deposit codebase repositories, legal agreements, and client archives into the vault
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

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 text-xs">
          {/* Drag & Drop Upload Zone */}
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={`p-6 border-2 border-dashed rounded-2xl text-center transition-all cursor-pointer group ${
              dragActive
                ? 'border-sky-500 bg-sky-500/10'
                : isLight
                ? 'border-sky-200 bg-sky-50/30 hover:bg-sky-50/70 hover:border-sky-400'
                : 'border-slate-700 bg-slate-800/40 hover:bg-slate-800/70 hover:border-slate-600'
            }`}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              className="hidden"
              accept=".zip,.tar.gz,.7z,.pdf,.docx,.doc,.xlsx,.xls,.pptx,.ppt,.txt"
            />
            <Upload className="w-8 h-8 text-sky-500 mx-auto mb-2 opacity-80 group-hover:scale-110 transition-transform" />
            <p className="font-bold text-xs text-slate-800 dark:text-slate-200">
              Drag & Drop your Code ZIP or Document here, or <span className="text-sky-500 underline">browse files</span>
            </p>
            <p className="text-[11px] text-slate-400 mt-1">
              Supports .zip, .pdf, .docx, .xlsx, .pptx up to 500 MB (Encrypted on upload)
            </p>
          </div>

          {/* File Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Document / File Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CRM-Backend-API-v2.0.zip or Service-Agreement.pdf"
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Folder & File Type */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Vault Destination Folder <span className="text-rose-500">*</span>
              </label>
              <select
                value={folderId}
                onChange={(e) => setFolderId(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {availableFolders.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.filesCount} files)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Category / Format
              </label>
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value as DocumentFileType)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                <option value="code_zip">&lt;/&gt; Code ZIP Repository Archive</option>
                <option value="pdf">PDF Document / Agreement</option>
                <option value="docx">Microsoft Word Document (.docx)</option>
                <option value="xlsx">Excel Workbook / Sheet (.xlsx)</option>
                <option value="pptx">Keynote / Pitch Deck (.pptx)</option>
                <option value="archive">Generic Archive (.tar.gz / .7z)</option>
              </select>
            </div>
          </div>

          {/* Client & Project */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Linked Client / Organization
              </label>
              <select
                value={client}
                onChange={(e) => setClient(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {availableClients.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="Internal Engineering">Internal Engineering</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Linked Project
              </label>
              <select
                value={project}
                onChange={(e) => setProject(e.target.value)}
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium cursor-pointer ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              >
                {availableProjects.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
                <option value="General Enterprise Archive">General Enterprise Archive</option>
              </select>
            </div>
          </div>

          {/* Size & Uploader */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                File Size
              </label>
              <input
                type="text"
                value={fileSizeFormatted}
                onChange={(e) => setFileSizeFormatted(e.target.value)}
                placeholder="e.g. 24.5 MB"
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Uploaded By / Assigned Staff
              </label>
              <input
                type="text"
                list="vault-staff-owners"
                value={uploadedBy}
                onChange={(e) => setUploadedBy(e.target.value)}
                placeholder="Select staff or team..."
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
              <datalist id="vault-staff-owners">
                {users.map((u) => (
                  <option key={u.id} value={u.name} />
                ))}
                <option value="Engineering Team" />
                <option value="Finance Team" />
                <option value="HR Team" />
                <option value="Marketing Team" />
              </datalist>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
              Document Description / Synopsis
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief summary of code contents, API documentation, or contract scope..."
              className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium resize-none ${
                isLight
                  ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                  : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
              }`}
            />
          </div>

          {/* Tags & Starred */}
          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex-1">
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-200 mb-1">
                Tags (comma-separated)
              </label>
              <input
                type="text"
                value={tagsInput}
                onChange={(e) => setTagsInput(e.target.value)}
                placeholder="e.g. Next.js, Contract, SLA"
                className={`w-full px-3 py-2 text-xs rounded-xl border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/30 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-800/80 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            <label className="flex items-center gap-2 cursor-pointer mt-5">
              <input
                type="checkbox"
                checked={isStarred}
                onChange={(e) => setIsStarred(e.target.checked)}
                className="rounded text-sky-600 focus:ring-sky-500"
              />
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-current" />
                <span>Mark Starred</span>
              </span>
            </label>
          </div>

          {/* Footer Actions */}
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
              Upload to Vault
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

