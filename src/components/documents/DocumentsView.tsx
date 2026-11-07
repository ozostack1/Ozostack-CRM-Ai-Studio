import React, { useState, useMemo, useEffect } from 'react';
import {
  ArrowLeft,
  Plus,
  Search,
  Filter,
  Download,
  Upload,
  FolderPlus,
  Folder,
  FolderOpen,
  FileCode,
  FileText,
  FileSpreadsheet,
  File,
  Star,
  Share2,
  Trash2,
  Eye,
  CheckCircle2,
  HardDrive,
  CheckSquare,
  Square,
  ShieldCheck,
  ChevronDown,
  LayoutGrid,
  LayoutList,
  Sparkles,
  ArrowUpDown,
  ExternalLink,
  X,
} from 'lucide-react';
import { DocumentItem, DocumentFolder, DocumentFileType } from '../../types/crm';
import { INITIAL_DOCUMENT_FOLDERS, INITIAL_DOCUMENTS, INITIAL_PROJECTS } from '../../data/mockData';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { DocumentDetailsDrawer } from './DocumentDetailsDrawer';
import { DocumentUploadModal } from './DocumentUploadModal';
import { NewFolderModal } from './NewFolderModal';

type SortOption = 'date-desc' | 'date-asc' | 'name-asc' | 'size-desc';
type ViewMode = 'grid' | 'list';

export const DocumentsView: React.FC = () => {
  const { theme, setActiveNav } = useTheme();
  const { scopeFilter } = useAuth();
  const isLight = theme === 'white-sky';

  // Folders and Documents State (persisted so uploads/assignments survive user switches)
  const [folders, setFolders] = useState<DocumentFolder[]>(INITIAL_DOCUMENT_FOLDERS);
  const [documents, setDocuments] = useState<DocumentItem[]>(() => {
    try {
      const saved = localStorage.getItem('ozostack_documents_v2');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {
      /* fallback */
    }
    return INITIAL_DOCUMENTS;
  });

  useEffect(() => {
    try {
      localStorage.setItem('ozostack_documents_v2', JSON.stringify(documents));
    } catch {
      /* ignore */
    }
  }, [documents]);

  useEffect(() => {
    const syncDocs = () => {
      try {
        const saved = localStorage.getItem('ozostack_documents_v2');
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.length > 0) setDocuments(parsed);
        }
      } catch {
        /* ignore */
      }
    };
    window.addEventListener('ozostack-crm-config-changed', syncDocs);
    return () => window.removeEventListener('ozostack-crm-config-changed', syncDocs);
  }, []);

  // Scoped documents visible to the signed-in staff member
  const visibleDocuments = useMemo(
    () =>
      scopeFilter(documents, (doc) => {
        const proj = INITIAL_PROJECTS.find(
          (p) =>
            p.name === doc.project ||
            (doc.project && p.name.toLowerCase().includes(doc.project.toLowerCase().split(' ')[0]))
        );
        return {
          owner: [doc.uploadedBy, proj?.projectManager, ...(proj?.team || [])],
        };
      }),
    [documents, scopeFilter]
  );

  // Selected Folder Filter: 'all' or folderId
  const [selectedFolderId, setSelectedFolderId] = useState<string>('all');

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyStarred, setOnlyStarred] = useState(false);
  const [sortBy, setSortBy] = useState<SortOption>('date-desc');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // Selection state for bulk operations
  const [selectedDocIds, setSelectedDocIds] = useState<Set<string>>(new Set());

  // Modals & Drawer State
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isFolderModalOpen, setIsFolderModalOpen] = useState(false);
  const [inspectDoc, setInspectDoc] = useState<DocumentItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/90 border-slate-800/80';

  // Format bytes helper for clean display across MB and KB
  const formatBytes = (bytes: number): string => {
    if (bytes <= 0) return '0 KB';
    const mb = bytes / (1024 * 1024);
    if (mb < 0.1) {
      const kb = Math.round(bytes / 1024);
      return `${kb} KB`;
    }
    return `${Math.round(mb * 10) / 10} MB`;
  };

  // Total Storage Used Calculation
  const totalStorageBytes = useMemo(() => {
    return visibleDocuments.reduce((acc, curr) => acc + curr.fileSizeBytes, 0);
  }, [visibleDocuments]);

  const totalStorageFormatted = useMemo(() => {
    return formatBytes(totalStorageBytes);
  }, [totalStorageBytes]);

  // Recalculate folder sizes and counts dynamically
  const computedFolders = useMemo(() => {
    return folders.map((f) => {
      const folderDocs = visibleDocuments.filter((d) => d.folderId === f.id);
      const totalBytes = folderDocs.reduce((acc, c) => acc + c.fileSizeBytes, 0);
      return {
        ...f,
        filesCount: folderDocs.length,
        totalSizeBytes: totalBytes,
        totalSizeFormatted: formatBytes(totalBytes),
      };
    });
  }, [folders, visibleDocuments]);

  // Filtered and Sorted Documents
  const filteredDocuments = useMemo(() => {
    let result = visibleDocuments.filter((doc) => {
      const matchesFolder = selectedFolderId === 'all' || doc.folderId === selectedFolderId;
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        doc.name.toLowerCase().includes(q) ||
        doc.description.toLowerCase().includes(q) ||
        doc.folderName.toLowerCase().includes(q) ||
        (doc.client && doc.client.toLowerCase().includes(q)) ||
        (doc.project && doc.project.toLowerCase().includes(q)) ||
        doc.uploadedBy.toLowerCase().includes(q) ||
        (doc.tags && doc.tags.some((t) => t.toLowerCase().includes(q)));

      const matchesStarred = !onlyStarred || doc.isStarred;

      return matchesFolder && matchesSearch && matchesStarred;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortBy === 'date-desc') return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === 'date-asc') return a.createdAt.localeCompare(b.createdAt);
      if (sortBy === 'name-asc') return a.name.localeCompare(b.name);
      if (sortBy === 'size-desc') return b.fileSizeBytes - a.fileSizeBytes;
      return 0;
    });

    return result;
  }, [visibleDocuments, selectedFolderId, searchQuery, onlyStarred, sortBy]);

  // Document Operations
  const handleToggleStar = (docId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDocuments((prev) =>
      prev.map((doc) => (doc.id === docId ? { ...doc, isStarred: !doc.isStarred } : doc))
    );
    if (inspectDoc?.id === docId) {
      setInspectDoc((prev) => (prev ? { ...prev, isStarred: !prev.isStarred } : null));
    }
  };

  const handleShareDoc = (doc: DocumentItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const link = `https://app.ozostack.io/vault/share/${doc.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).catch(() => {});
    }
    showToast(`Secure share link copied for "${doc.name}".`);
  };

  const handleDownloadDoc = (doc: DocumentItem, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    // Simulate real browser download
    const blob = new Blob([doc.previewSnippet || `${doc.name} - Downloaded from Ozostack Vault`], {
      type: 'text/plain;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = doc.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    showToast(`Downloaded "${doc.name}".`);
  };

  const handleDeleteDoc = (docId: string, docName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDocuments((prev) => prev.filter((d) => d.id !== docId));
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      next.delete(docId);
      return next;
    });
    showToast(`Removed "${docName}" from vault.`);
  };

  const handleSelectDoc = (docId: string, e?: React.SyntheticEvent) => {
    if (e) e.stopPropagation();
    setSelectedDocIds((prev) => {
      const next = new Set(prev);
      if (next.has(docId)) next.delete(docId);
      else next.add(docId);
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedDocIds.size === filteredDocuments.length) {
      setSelectedDocIds(new Set());
    } else {
      setSelectedDocIds(new Set(filteredDocuments.map((d) => d.id)));
    }
  };

  // Bulk Operations
  const handleBulkDownload = () => {
    const selectedDocs = documents.filter((d) => selectedDocIds.has(d.id));
    if (selectedDocs.length === 0) return;

    selectedDocs.forEach((doc, idx) => {
      setTimeout(() => {
        const blob = new Blob([doc.previewSnippet || `${doc.name} - Downloaded from Ozostack Vault`], {
          type: 'text/plain;charset=utf-8',
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, idx * 150);
    });

    showToast(`Downloading ${selectedDocs.length} vault documents.`);
  };

  const handleBulkStar = () => {
    const selectedDocs = documents.filter((d) => selectedDocIds.has(d.id));
    const allStarred = selectedDocs.every((d) => d.isStarred);
    setDocuments((prev) =>
      prev.map((d) => (selectedDocIds.has(d.id) ? { ...d, isStarred: !allStarred } : d))
    );
    showToast(`${allStarred ? 'Unstarred' : 'Starred'} ${selectedDocs.length} files.`);
  };

  const handleBulkDelete = () => {
    const count = selectedDocIds.size;
    if (count === 0) return;
    if (confirm(`Are you sure you want to delete ${count} selected document${count > 1 ? 's' : ''} from the vault?`)) {
      setDocuments((prev) => prev.filter((d) => !selectedDocIds.has(d.id)));
      setSelectedDocIds(new Set());
      showToast(`Removed ${count} files from vault.`);
    }
  };

  const handleUploadNewDoc = (newDoc: DocumentItem) => {
    setDocuments((prev) => [newDoc, ...prev]);
    showToast(`Deposited "${newDoc.name}" into ${newDoc.folderName}.`);
  };

  const handleCreateFolder = (newFolder: DocumentFolder) => {
    setFolders((prev) => [...prev, newFolder]);
    setSelectedFolderId(newFolder.id);
    showToast(`Created folder "${newFolder.name}".`);
  };

  const getBadgeColor = (type: DocumentFileType) => {
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

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER BANNER (Vault Header with Upload & New Folder) */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-2xl border bg-gradient-to-r from-sky-500/10 via-sky-400/5 to-transparent border-sky-200/60 dark:border-sky-500/20">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setActiveNav('Dashboard')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-sky-700 dark:text-sky-300 bg-white dark:bg-slate-800 border border-sky-200 dark:border-slate-700 shadow-xs hover:bg-sky-50 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>CEO Command Center</span>
          </button>
          <div>
            <h1 className="text-base font-extrabold text-slate-800 dark:text-white flex items-center gap-2">
              <span>Documents & Files Vault</span>
              <span className="text-xs bg-sky-500/15 text-sky-600 dark:text-sky-400 font-bold px-2 py-0.5 rounded-full">
                {visibleDocuments.length} Files Encrypted
              </span>
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Manage code ZIP repositories, enterprise contracts, proposals, and client file archives
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
          {/* New Folder Button */}
          <button
            onClick={() => setIsFolderModalOpen(true)}
            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl border transition-colors ${
              isLight
                ? 'bg-white border-sky-200 text-slate-700 hover:bg-sky-50'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            <FolderPlus className="w-3.5 h-3.5 text-sky-500" />
            <span>New Folder</span>
          </button>

          {/* Upload File / Code ZIP Button */}
          <button
            onClick={() => setIsUploadModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-sky-500 hover:bg-sky-600 text-white shadow-sm transition-all active:scale-95"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Upload File / Code ZIP</span>
          </button>
        </div>
      </div>

      {/* 2. TWO-COLUMN VAULT LAYOUT */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
        {/* ============================================================ */}
        {/* LEFT SIDEBAR: FOLDERS & REPOS + STORAGE METER               */}
        {/* ============================================================ */}
        <div className="lg:col-span-3 space-y-4">
          <div className={`p-3.5 rounded-2xl border ${cardBg}`}>
            {/* Header */}
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-sky-100/50 dark:border-slate-800">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Folders & Repos
              </span>
              <button
                onClick={() => setIsFolderModalOpen(true)}
                className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline flex items-center gap-0.5"
              >
                <Plus className="w-3 h-3" />
                <span>New</span>
              </button>
            </div>

            {/* Folder Navigation List */}
            <div className="space-y-1">
              {/* All Vault Files (Virtual) */}
              <button
                onClick={() => setSelectedFolderId('all')}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-all ${
                  selectedFolderId === 'all'
                    ? 'bg-sky-500 text-white shadow-sm'
                    : 'text-slate-700 dark:text-slate-300 hover:bg-sky-50/50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Folder className="w-4 h-4" />
                  <span>All Vault Files</span>
                </div>
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                  selectedFolderId === 'all' ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                }`}>
                  {visibleDocuments.length}
                </span>
              </button>

              {/* Individual Folders */}
              {computedFolders.map((folder) => {
                const isSelected = selectedFolderId === folder.id;

                return (
                  <button
                    key={folder.id}
                    onClick={() => setSelectedFolderId(folder.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all ${
                      isSelected
                        ? 'bg-sky-500/15 border border-sky-400/40 text-sky-700 dark:text-sky-300 font-bold'
                        : 'text-slate-600 dark:text-slate-300 hover:bg-sky-50/40 dark:hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Folder
                        className="w-4 h-4 shrink-0"
                        style={{ color: folder.iconColor || '#38bdf8' }}
                      />
                      <span className="truncate">{folder.name}</span>
                    </div>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-400 font-bold shrink-0">
                      {folder.filesCount}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Storage Meter Widget */}
            <div className="mt-5 pt-4 border-t border-sky-100/50 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-sky-500" />
                  <span>Storage Used</span>
                </span>
                <span className="text-[11px] font-mono text-slate-400 font-medium">
                  {totalStorageFormatted} / 50 GB
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1.5 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-500"
                  style={{ width: `${Math.min(100, Math.max(3, (totalStorageBytes / (50 * 1024 * 1024 * 1024)) * 100))}%` }}
                />
              </div>

              <p className="text-[10px] text-slate-400 leading-tight">
                Supports Code ZIPs, PDFs, Docs & Media. Encrypted and indexed for instant search.
              </p>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT MAIN AREA: HORIZONTAL FOLDERS + CONTROLS + FILES GRID  */}
        {/* ============================================================ */}
        <div className="lg:col-span-9 space-y-4">
          {/* Top Horizontal Folder Cards Ribbon */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Folders & Repositories ({computedFolders.length})
              </span>
              <button
                onClick={() => setIsFolderModalOpen(true)}
                className="text-[10px] font-bold text-sky-600 dark:text-sky-400 hover:underline uppercase tracking-wide"
              >
                + Add New Folder
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-2.5">
              {computedFolders.map((folder) => {
                const isSelected = selectedFolderId === folder.id;

                return (
                  <div
                    key={folder.id}
                    onClick={() => setSelectedFolderId(isSelected ? 'all' : folder.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer group flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-400 ring-2 ring-sky-300 dark:ring-sky-700 shadow-sm ' + cardBg
                        : cardBg + ' hover:border-sky-300'
                    }`}
                  >
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center mb-2 shadow-2xs"
                      style={{ backgroundColor: `${folder.iconColor}20` }}
                    >
                      <Folder className="w-4 h-4" style={{ color: folder.iconColor }} />
                    </div>

                    <div>
                      <h4 className="font-bold text-xs text-slate-900 dark:text-white truncate group-hover:text-sky-500 transition-colors">
                        {folder.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5 truncate">
                        {folder.filesCount} files · {folder.totalSizeFormatted}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Search, Sort, Starred & View Mode Toolbar */}
          <div className={`p-3.5 rounded-xl border flex flex-col sm:flex-row gap-3 items-center justify-between ${cardBg}`}>
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search code ZIPs, PDFs, clients..."
                className={`w-full text-xs pl-8 pr-3 py-1.5 rounded-lg border outline-none font-medium ${
                  isLight
                    ? 'bg-sky-50/40 border-sky-200 text-slate-800 focus:border-sky-500'
                    : 'bg-slate-900 border-slate-700 text-white focus:border-sky-400'
                }`}
              />
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap text-xs">
              {/* Sort By Dropdown */}
              <div className="flex items-center gap-1.5">
                <span className="text-slate-400 text-xs hidden md:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as SortOption)}
                  className={`text-xs px-2.5 py-1.5 rounded-lg border outline-none font-medium cursor-pointer ${
                    isLight ? 'bg-white border-sky-200 text-slate-700' : 'bg-slate-800 border-slate-700 text-slate-200'
                  }`}
                >
                  <option value="date-desc">Date (Newest)</option>
                  <option value="date-asc">Date (Oldest)</option>
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="size-desc">File Size (Largest)</option>
                </select>
              </div>

              {/* Starred Filter Button */}
              <button
                onClick={() => setOnlyStarred(!onlyStarred)}
                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                  onlyStarred
                    ? 'bg-amber-500/15 border-amber-300 dark:border-amber-800 text-amber-600 dark:text-amber-400'
                    : isLight
                    ? 'bg-white border-sky-200 text-slate-600 hover:bg-sky-50'
                    : 'bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700'
                }`}
              >
                <Star className={`w-3.5 h-3.5 ${onlyStarred ? 'fill-current text-amber-500' : ''}`} />
                <span>Starred</span>
              </button>

              {/* View Toggle */}
              <div className="flex items-center p-0.5 rounded-lg border border-sky-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'grid'
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="Grid View"
                >
                  <LayoutGrid className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-1.5 rounded-md transition-colors ${
                    viewMode === 'list'
                      ? 'bg-sky-500 text-white shadow-2xs'
                      : 'text-slate-400 hover:text-slate-600'
                  }`}
                  title="List Table View"
                >
                  <LayoutList className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* ============================================================ */}
          {/* VIEW 1: DOCUMENT CARDS GRID (Matches Reference Screenshot)    */}
          {/* ============================================================ */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3.5">
              {filteredDocuments.map((doc) => {
                const isSelected = selectedDocIds.has(doc.id);

                return (
                  <div
                    key={doc.id}
                    onClick={() => {
                      setInspectDoc(doc);
                      setIsDrawerOpen(true);
                    }}
                    className={`p-4 rounded-xl border flex flex-col justify-between transition-all duration-200 hover:shadow-md cursor-pointer group ${
                      isSelected
                        ? 'border-sky-400 ring-2 ring-sky-300 dark:ring-sky-700 ' + cardBg
                        : cardBg + ' hover:border-sky-300'
                    }`}
                  >
                    <div>
                      {/* Top Row: Checkbox, Badge, Star & Share */}
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onClick={(e) => handleSelectDoc(doc.id, e)}
                            onChange={() => {}}
                            className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                          />
                          <span
                            className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider border ${getBadgeColor(
                              doc.fileType
                            )}`}
                          >
                            {doc.fileType === 'code_zip' ? '</> CODE ZIP' : doc.fileType.toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={(e) => handleToggleStar(doc.id, e)}
                            className="p-1 text-slate-400 hover:text-amber-500 transition-colors"
                            title={doc.isStarred ? 'Unstar' : 'Star'}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                doc.isStarred ? 'fill-current text-amber-500' : ''
                              }`}
                            />
                          </button>
                          <button
                            onClick={(e) => handleShareDoc(doc, e)}
                            className="p-1 text-slate-400 hover:text-sky-500 transition-colors"
                            title="Share"
                          >
                            <Share2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* File Title */}
                      <h3
                        className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white group-hover:text-sky-500 transition-colors line-clamp-1 leading-snug"
                        title={doc.name}
                      >
                        {doc.name}
                      </h3>

                      {/* Description */}
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {doc.description}
                      </p>

                      {/* Code/Archive Extra Pill Tags */}
                      <div className="flex items-center gap-2 flex-wrap mt-2.5">
                        {doc.filesCount && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-300/30">
                            &lt;/&gt; {doc.filesCount} files included
                          </span>
                        )}
                        {doc.fileType === 'code_zip' && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700">
                            ZIP Archive
                          </span>
                        )}
                        {doc.client && (
                          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-sky-500/10 text-sky-600 dark:text-sky-400 border border-sky-200/40">
                            {doc.client}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Card Footer: Uploader & Size + Actions Bar */}
                    <div className="pt-3 mt-3 border-t border-sky-100/30 space-y-2">
                      <div className="flex items-center justify-between text-[11px] text-slate-400">
                        <span className="font-medium truncate max-w-[150px]">{doc.uploadedBy}</span>
                        <span className="font-mono font-bold text-slate-600 dark:text-slate-300">
                          {doc.fileSizeFormatted}
                        </span>
                      </div>

                      {/* Bottom Quick Action Bar */}
                      <div className="flex items-center justify-between pt-1">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setInspectDoc(doc);
                            setIsDrawerOpen(true);
                          }}
                          className="flex items-center gap-1 text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Inspect</span>
                        </button>

                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => handleDownloadDoc(doc, e)}
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-700 dark:text-slate-300 hover:text-sky-500 transition-colors"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={(e) => handleDeleteDoc(doc.id, doc.name, e)}
                            className="p-1 text-slate-400 hover:text-rose-500 transition-colors"
                            title="Delete File"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* ============================================================ */}
          {/* VIEW 2: DOCUMENT TABLE LIST VIEW                             */}
          {/* ============================================================ */}
          {viewMode === 'list' && (
            <div className={`rounded-xl border overflow-hidden ${cardBg}`}>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-sky-50/50 dark:bg-slate-800/60 border-b border-sky-100/50 dark:border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                      <th className="p-3 w-8">
                        <input
                          type="checkbox"
                          checked={selectedDocIds.size === filteredDocuments.length && filteredDocuments.length > 0}
                          onChange={handleSelectAll}
                          className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                        />
                      </th>
                      <th className="p-3">File Name</th>
                      <th className="p-3">Folder</th>
                      <th className="p-3">Category</th>
                      <th className="p-3">Client / Project</th>
                      <th className="p-3">Uploaded By</th>
                      <th className="p-3 text-right">File Size</th>
                      <th className="p-3 text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-sky-100/30 dark:divide-slate-800">
                    {filteredDocuments.map((doc) => {
                      const isSelected = selectedDocIds.has(doc.id);

                      return (
                        <tr
                          key={doc.id}
                          onClick={() => {
                            setInspectDoc(doc);
                            setIsDrawerOpen(true);
                          }}
                          className={`hover:bg-sky-50/20 dark:hover:bg-slate-800/40 transition-colors cursor-pointer ${
                            isSelected ? 'bg-sky-50/40 dark:bg-sky-950/20' : ''
                          }`}
                        >
                          <td className="p-3" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleSelectDoc(doc.id, e)}
                              className="rounded text-sky-600 focus:ring-sky-500 cursor-pointer"
                            />
                          </td>

                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => handleToggleStar(doc.id, e)}
                                className="text-slate-400 hover:text-amber-500 transition-colors"
                              >
                                <Star className={`w-3.5 h-3.5 ${doc.isStarred ? 'fill-current text-amber-500' : ''}`} />
                              </button>
                              <div>
                                <span className="font-bold text-slate-800 dark:text-white block hover:text-sky-500 transition-colors">
                                  {doc.name}
                                </span>
                                <span className="text-[10px] text-slate-400 line-clamp-1">
                                  {doc.description}
                                </span>
                              </div>
                            </div>
                          </td>

                          <td className="p-3 text-slate-600 dark:text-slate-300 font-medium">
                            {doc.folderName}
                          </td>

                          <td className="p-3">
                            <span className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full uppercase border ${getBadgeColor(doc.fileType)}`}>
                              {doc.fileType}
                            </span>
                          </td>

                          <td className="p-3 text-slate-600 dark:text-slate-300">
                            {doc.client || '—'}
                          </td>

                          <td className="p-3 text-slate-500 dark:text-slate-400">
                            {doc.uploadedBy}
                          </td>

                          <td className="p-3 text-right font-mono font-bold text-slate-700 dark:text-slate-200">
                            {doc.fileSizeFormatted}
                          </td>

                          <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setInspectDoc(doc);
                                  setIsDrawerOpen(true);
                                }}
                                className="p-1 rounded text-slate-400 hover:text-sky-500"
                                title="Inspect"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDownloadDoc(doc, e)}
                                className="p-1 rounded text-slate-400 hover:text-sky-500"
                                title="Download"
                              >
                                <Download className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => handleDeleteDoc(doc.id, doc.name, e)}
                                className="p-1 rounded text-slate-400 hover:text-rose-500"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Empty State */}
          {filteredDocuments.length === 0 && (
            <div className={`p-12 text-center rounded-xl border ${cardBg}`}>
              <FileCode className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-60" />
              <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200">
                No matching vault documents found
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                Try selecting a different folder, resetting your search, or upload a new file.
              </p>
              <button
                onClick={() => {
                  setSelectedFolderId('all');
                  setSearchQuery('');
                  setOnlyStarred(false);
                }}
                className="mt-3 px-3 py-1.5 text-xs font-semibold text-sky-600 bg-sky-50 dark:bg-slate-800 rounded-lg hover:underline"
              >
                Reset All Filters
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 3. FLOATING BULK ACTIONS TOOLBAR */}
      {selectedDocIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center gap-2 sm:gap-3 px-4 sm:px-5 py-2.5 rounded-2xl bg-slate-900/95 text-white dark:bg-slate-800/95 dark:border-slate-700 border border-slate-800 shadow-2xl backdrop-blur-md animate-fade-in text-xs font-semibold">
          <div className="flex items-center gap-2 pr-2 border-r border-slate-700">
            <CheckCircle2 className="w-4 h-4 text-sky-400" />
            <span>
              <strong className="text-sky-400 font-extrabold">{selectedDocIds.size}</strong> selected
            </span>
          </div>

          <button
            onClick={handleBulkDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 text-sky-300 transition-colors"
            title="Download Selected Files"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download</span>
          </button>

          <button
            onClick={handleBulkStar}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 transition-colors"
            title="Toggle Starred"
          >
            <Star className="w-3.5 h-3.5" />
            <span>Star</span>
          </button>

          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 transition-colors"
            title="Delete Selected Files"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

          <button
            onClick={() => setSelectedDocIds(new Set())}
            className="p-1 rounded-lg text-slate-400 hover:text-white transition-colors"
            title="Clear Selection"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 4. INSPECT DRAWER */}
      <DocumentDetailsDrawer
        isOpen={isDrawerOpen}
        onClose={() => {
          setIsDrawerOpen(false);
          setInspectDoc(null);
        }}
        document={inspectDoc}
        onToggleStar={handleToggleStar}
        onDelete={handleDeleteDoc}
        onDownload={handleDownloadDoc}
        onNotify={showToast}
      />

      {/* 5. UPLOAD MODAL */}
      <DocumentUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUploadNewDoc}
        availableFolders={computedFolders}
        availableClients={['FinEdge Systems', 'TechVision Inc.', 'SwiftRetail Global', 'DLF Limited', 'Mahindra Housing']}
        availableProjects={INITIAL_PROJECTS.map((p) => p.name)}
        defaultFolderId={selectedFolderId !== 'all' ? selectedFolderId : undefined}
      />

      {/* 6. NEW FOLDER MODAL */}
      <NewFolderModal
        isOpen={isFolderModalOpen}
        onClose={() => setIsFolderModalOpen(false)}
        onCreateFolder={handleCreateFolder}
      />

      {/* 7. TOAST FEEDBACK */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 text-white dark:bg-sky-500 dark:text-slate-950 font-medium text-xs shadow-xl animate-fade-in border border-slate-700 dark:border-sky-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 dark:text-slate-950" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
};

