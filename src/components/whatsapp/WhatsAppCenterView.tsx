import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  MessageSquare,
  QrCode,
  Send,
  Plus,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  Users,
  Trash2,
  ExternalLink,
  Bell,
  Lock,
  X,
  CheckCheck,
  Smartphone,
  KeyRound,
  LogOut,
  Bookmark,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  useWhatsAppCenter,
  WaConversation,
  startWaQrSession,
  pollWaSessionStatus,
  disconnectWaSession,
  sendDirectWhatsApp,
  upsertWaMessage,
  saveWaConversations,
  normalizePhoneDigits,
  formatDisplayPhone,
} from '../../data/whatsappService';
import { DEFAULT_TEMPLATES, LeadMessageTemplate } from '../leads/LeadActionModal';

export const WhatsAppCenterView: React.FC = () => {
  const { theme } = useTheme();
  const { currentUser } = useAuth();
  const isLight = theme === 'white-sky';
  const { config, conversations, updateConfig } = useWhatsAppCenter();

  const isMetaConfigured = Boolean(
    config.mode === 'meta_api' &&
      config.metaPhoneNumberId.trim() &&
      config.metaAccessToken.trim()
  );
  const isLiveConnected = Boolean(config.qrConnected || isMetaConfigured);

  // Connect Drawer & Live QR State
  const [isConnectOpen, setIsConnectOpen] = useState(!isLiveConnected);
  const [qrStatus, setQrStatus] = useState<'disconnected' | 'connecting' | 'qr_ready' | 'connected'>(
    config.qrConnected ? 'connected' : 'disconnected'
  );
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [isStartingQr, setIsStartingQr] = useState(false);
  const [isSyncingNow, setIsSyncingNow] = useState(false);

  // Meta API Form State
  const [metaPhoneId, setMetaPhoneId] = useState(config.metaPhoneNumberId);
  const [metaWabaId, setMetaWabaId] = useState(config.metaWabaId);
  const [metaToken, setMetaToken] = useState(config.metaAccessToken);

  // Chat Workspace State: 'chats' (1-on-1 only) | 'groups' (WhatsApp Groups only) | 'unread'
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'chats' | 'groups' | 'unread'>('chats');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    conversations[0]?.id || null
  );
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // New Chat Modal State
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [newChatPhone, setNewChatPhone] = useState('');
  const [newChatName, setNewChatName] = useState('');
  const [newChatCompany, setNewChatCompany] = useState('');
  const [newChatText, setNewChatText] = useState('');

  // In-page Notification Banner
  const [banner, setBanner] = useState<{
    type: 'received' | 'sent' | 'info' | 'error';
    title: string;
    subtitle: string;
  } | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const showBanner = (
    type: 'received' | 'sent' | 'info' | 'error',
    title: string,
    subtitle: string
  ) => {
    setBanner({ type, title, subtitle });
    setTimeout(() => {
      setBanner((prev) => (prev?.title === title ? null : prev));
    }, 6000);
  };

  // Poll live WhatsApp session status, chats, groups & history from backend
  useEffect(() => {
    let active = true;
    let firstPoll = true;
    const checkStatus = async () => {
      const res = await pollWaSessionStatus(firstPoll);
      firstPoll = false;
      if (!active || !res.ok) return;
      setQrStatus(res.status);
      if (res.qrDataUrl) {
        setQrDataUrl(res.qrDataUrl);
      } else if (res.status === 'connected') {
        setQrDataUrl(null);
      }
      if (res.newMessagesCount > 0) {
        showBanner(
          'received',
          `Synced ${res.newMessagesCount} WhatsApp Message${res.newMessagesCount > 1 ? 's' : ''}`,
          'Chats & group messages synced directly from your linked WhatsApp account!'
        );
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, isConnectOpen || config.qrConnected ? 3000 : 7000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [currentUser?.id, isConnectOpen, config.qrConnected]);

  // Saved templates
  const templates = useMemo<LeadMessageTemplate[]>(() => {
    try {
      const saved = localStorage.getItem('ozostack_lead_message_templates');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch {}
    return DEFAULT_TEMPLATES;
  }, []);

  const directChatsCount = useMemo(
    () => conversations.filter((c) => !c.isGroup).length,
    [conversations]
  );

  const groupChatsCount = useMemo(
    () => conversations.filter((c) => Boolean(c.isGroup)).length,
    [conversations]
  );

  const totalUnread = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0),
    [conversations]
  );

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filterTab === 'chats' && c.isGroup) return false;
      if (filterTab === 'groups' && !c.isGroup) return false;
      if (filterTab === 'unread' && c.unreadCount === 0) return false;
      if (q) {
        return (
          c.contactName.toLowerCase().includes(q) ||
          c.contactPhone.toLowerCase().includes(q) ||
          (c.company || '').toLowerCase().includes(q) ||
          c.lastMessageText.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [conversations, filterTab, searchQuery]);

  const selectedChat = useMemo(
    () =>
      conversations.find((c) => c.id === selectedChatId) ||
      filteredConversations[0] ||
      null,
    [conversations, selectedChatId, filteredConversations]
  );

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [selectedChat?.messages.length, selectedChat?.id]);

  const handleSelectChat = (conv: WaConversation) => {
    setSelectedChatId(conv.id);
    if (conv.unreadCount > 0) {
      const updated = conversations.map((c) =>
        c.id === conv.id ? { ...c, unreadCount: 0 } : c
      );
      saveWaConversations(updated);
    }
  };

  // Manual Full Sync Trigger
  const handleManualSyncNow = async () => {
    setIsSyncingNow(true);
    try {
      const res = await pollWaSessionStatus(true);
      if (res.ok && res.status === 'connected') {
        showBanner(
          'sent',
          'WhatsApp Chats & Groups Synced!',
          `Synced ${res.syncedChatsCount} chats/groups and ${res.newMessagesCount} new messages from your WhatsApp session.`
        );
      } else {
        setIsConnectOpen(true);
        showBanner(
          'info',
          'Scan QR to Sync WhatsApp Chats & Groups',
          'Click "Generate Live QR" below and scan from your phone to sync all chats and groups.'
        );
      }
    } finally {
      setIsSyncingNow(false);
    }
  };

  // Start Live Baileys QR Code Generation
  const handleStartQrLink = async (forceReset = false) => {
    setIsStartingQr(true);
    setQrStatus('connecting');
    try {
      const res = await startWaQrSession(forceReset);
      if (res.ok) {
        if (res.status === 'connected') {
          setQrStatus('connected');
          setQrDataUrl(null);
          await pollWaSessionStatus(true);
          showBanner(
            'sent',
            'WhatsApp Linked & Syncing!',
            `Connected to ${res.phoneNumber || 'your WhatsApp account'}`
          );
        } else if (res.qrDataUrl) {
          setQrStatus('qr_ready');
          setQrDataUrl(res.qrDataUrl);
        }
      } else {
        setQrStatus('disconnected');
        showBanner('error', 'QR Session Notice', res.error || 'Could not generate QR code.');
      }
    } finally {
      setIsStartingQr(false);
    }
  };

  const handleDisconnectQr = async () => {
    await disconnectWaSession();
    setQrStatus('disconnected');
    setQrDataUrl(null);
    showBanner('info', 'WhatsApp Unlinked', 'Your WhatsApp session has been disconnected.');
  };

  const handleSaveMetaApi = (e: React.FormEvent) => {
    e.preventDefault();
    updateConfig({
      mode: 'meta_api',
      metaPhoneNumberId: metaPhoneId.trim(),
      metaWabaId: metaWabaId.trim(),
      metaAccessToken: metaToken.trim(),
    });
    showBanner(
      'sent',
      'Meta Cloud API Saved',
      `Configured Phone Number ID ${metaPhoneId.trim()} for your account.`
    );
  };

  // Simulate / Test Incoming WhatsApp Message & Notification Bell Alert
  const handleTestIncomingMessage = () => {
    const sampleSenders = [
      {
        name: 'Vikram Singhania (DLF Enterprise)',
        phone: '+91 98112 45890',
        company: 'DLF Enterprise',
        text: `Hi ${currentUser?.name || 'Team'}, we reviewed the OzoStack CRM proposal on WhatsApp. Can we finalize the onboarding call today at 4 PM?`,
      },
      {
        name: 'Priya Nair (FinTech Global)',
        phone: '+91 98204 77123',
        company: 'FinTech Global',
        text: `Hello ${currentUser?.name || 'there'}, please share the payment link and invoice PDF here on WhatsApp so our accounts team can process it.`,
      },
    ];
    const pick =
      selectedChat && !selectedChat.isGroup
        ? {
            name: selectedChat.contactName,
            phone: selectedChat.contactPhone,
            company: selectedChat.company || 'CRM',
            text: `Hi ${currentUser?.name || 'there'}, thanks for the update! We received your message and are ready to proceed with the next steps.`,
          }
        : sampleSenders[Math.floor(Math.random() * sampleSenders.length)];

    const conv = upsertWaMessage(
      {
        contactPhone: pick.phone,
        contactName: pick.name,
        company: pick.company,
        fromMe: false,
        text: pick.text,
        via: 'Live WhatsApp',
      },
      true
    );

    if (conv) {
      setSelectedChatId(conv.id);
    }
    showBanner(
      'received',
      `New WhatsApp Received from ${pick.name}`,
      `"${pick.text.slice(0, 75)}..." — Added to your Notification Bell!`
    );
  };

  // Send message in active chat or group thread
  const handleSendMessage = async (e?: React.FormEvent, forceWeb = false) => {
    e?.preventDefault();
    if (!selectedChat || !messageText.trim()) return;
    const textToSend = messageText.trim();
    setMessageText('');

    if (forceWeb && !selectedChat.isGroup) {
      const digits = normalizePhoneDigits(selectedChat.contactPhone);
      window.open(
        `https://wa.me/${digits}?text=${encodeURIComponent(textToSend)}`,
        '_blank',
        'noopener,noreferrer'
      );
      upsertWaMessage(
        {
          contactPhone: selectedChat.contactPhone,
          contactName: selectedChat.contactName,
          company: selectedChat.company,
          fromMe: true,
          text: textToSend,
          via: 'WhatsApp Web',
        },
        false
      );
      return;
    }

    setIsSending(true);
    try {
      const res = await sendDirectWhatsApp({
        toPhone: selectedChat.isGroup ? selectedChat.id : selectedChat.contactPhone,
        contactName: selectedChat.contactName,
        company: selectedChat.company,
        isGroup: selectedChat.isGroup,
        text: textToSend,
        allowWebFallback: !selectedChat.isGroup,
      });

      if (res.realDelivered) {
        showBanner('sent', 'Delivered via Live WhatsApp', res.message);
      } else {
        showBanner('info', 'WhatsApp Delivery Notice', res.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Start new 1-on-1 WhatsApp chat
  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = normalizePhoneDigits(newChatPhone);
    if (!digits || !newChatText.trim()) return;

    setIsSending(true);
    try {
      const res = await sendDirectWhatsApp({
        toPhone: digits,
        contactName: newChatName.trim() || formatDisplayPhone(digits),
        company: newChatCompany.trim() || undefined,
        text: newChatText.trim(),
        allowWebFallback: true,
      });

      setSelectedChatId(digits);
      setFilterTab('chats');
      setIsNewChatOpen(false);
      setNewChatPhone('');
      setNewChatName('');
      setNewChatCompany('');
      setNewChatText('');

      if (res.realDelivered) {
        showBanner('sent', 'WhatsApp Sent Directly!', res.message);
      } else {
        showBanner('info', 'Opened WhatsApp Web & Saved Thread', res.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleApplyTemplate = (tpl: LeadMessageTemplate) => {
    const targetName = selectedChat?.contactName || newChatName || 'there';
    const firstName = targetName.split(' ')[0];
    const company = selectedChat?.company || newChatCompany || 'your company';
    const populated = tpl.text
      .replace(/\{firstName\}/g, firstName)
      .replace(/\{name\}/g, targetName)
      .replace(/\{company\}/g, company)
      .replace(/\{owner\}/g, currentUser?.name || 'OzoStack');
    setMessageText(populated);
  };

  const handleDeleteChat = (chatId: string) => {
    const next = conversations.filter((c) => c.id !== chatId);
    saveWaConversations(next);
    if (selectedChatId === chatId) {
      setSelectedChatId(next[0]?.id || null);
    }
    showBanner('info', 'Conversation Removed', 'Chat thread deleted from your WhatsApp inbox.');
  };

  const cardBg = isLight
    ? 'bg-white border-sky-100/90 shadow-xs'
    : 'bg-[#0f172a]/95 border-slate-800';
  const inputCls = `w-full px-3 py-2 rounded-xl border text-xs font-medium outline-none ${
    isLight
      ? 'bg-slate-50 border-slate-200 text-slate-900 focus:border-emerald-500 focus:bg-white'
      : 'bg-slate-900 border-slate-700 text-white focus:border-emerald-400'
  }`;

  return (
    <div className="space-y-4">
      {/* =================================================================== */}
      {/* IN-PAGE LIVE SENT / RECEIVED NOTIFICATION BANNER                    */}
      {/* =================================================================== */}
      {banner && (
        <div
          className={`p-3.5 rounded-2xl border flex items-center justify-between gap-3 shadow-lg animate-fade-in ${
            banner.type === 'received'
              ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-700 dark:text-emerald-300'
              : banner.type === 'sent'
              ? 'bg-sky-500/15 border-sky-500/40 text-sky-700 dark:text-sky-300'
              : banner.type === 'error'
              ? 'bg-rose-500/15 border-rose-500/40 text-rose-600 dark:text-rose-300'
              : 'bg-indigo-500/15 border-indigo-500/40 text-indigo-700 dark:text-indigo-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-white/10">
              {banner.type === 'received' ? (
                <Bell className="w-4 h-4 animate-bounce" />
              ) : banner.type === 'sent' ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <AlertCircle className="w-4 h-4" />
              )}
            </div>
            <div>
              <div className="text-xs font-extrabold">{banner.title}</div>
              <div className="text-[11px] opacity-90">{banner.subtitle}</div>
            </div>
          </div>
          <button onClick={() => setBanner(null)} className="p-1 rounded-lg hover:bg-black/10">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* TOP HEADER: PERSONAL WHATSAPP STATUS, QR LINK & ACTION CONTROLS     */}
      {/* =================================================================== */}
      <div className={`p-4 sm:p-5 rounded-2xl border ${cardBg}`}>
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 shrink-0">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-base sm:text-lg font-extrabold text-slate-900 dark:text-white">
                  {currentUser?.name || 'My'} — WhatsApp Messenger &amp; Live Sync
                </h1>
                {config.qrConnected ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>
                      Linked: {config.connectedPhone ? config.connectedPhone : 'Live WhatsApp'}
                    </span>
                  </span>
                ) : isMetaConfigured ? (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/15 text-sky-600 dark:text-sky-400 border border-sky-500/30">
                    Meta Cloud API Active ({config.metaPhoneNumberId})
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30">
                    WhatsApp Not Linked Yet
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>
                  <strong>100% Per-User Private WhatsApp:</strong> Only you ({currentUser?.name}) can see your linked WhatsApp number, direct chats, and groups.
                </span>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleManualSyncNow}
              disabled={isSyncingNow}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isLight
                  ? 'border-sky-200 bg-sky-50/70 text-sky-700 hover:bg-sky-100'
                  : 'border-sky-500/30 bg-sky-500/10 text-sky-300 hover:bg-sky-500/20'
              }`}
              title="Force sync all WhatsApp chats and groups from your linked session"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
              <span>{isSyncingNow ? 'Syncing...' : 'Sync Chats & Groups'}</span>
            </button>

            <button
              type="button"
              onClick={handleTestIncomingMessage}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isLight
                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-700 hover:bg-emerald-100'
                  : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20'
              }`}
              title="Simulate receiving an incoming WhatsApp message & notification bell alert"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Test Incoming</span>
            </button>

            <button
              type="button"
              onClick={() => setIsConnectOpen((prev) => !prev)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isConnectOpen
                  ? 'bg-emerald-500/15 border-emerald-500 text-emerald-500'
                  : isLight
                  ? 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  : 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
              }`}
            >
              <QrCode className="w-3.5 h-3.5" />
              <span>{config.qrConnected ? 'Manage Linked WhatsApp' : 'Link My WhatsApp (QR / API)'}</span>
            </button>

            <button
              type="button"
              onClick={() => setIsNewChatOpen(true)}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-extrabold text-white bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>New WhatsApp Chat</span>
            </button>
          </div>
        </div>

        {/* =================================================================== */}
        {/* COLLAPSIBLE WHATSAPP QR SCANNER & META CLOUD API SETUP DRAWER       */}
        {/* =================================================================== */}
        {isConnectOpen && (
          <div className="mt-4 pt-4 border-t border-slate-200/80 dark:border-slate-800 space-y-4 animate-fade-in">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => updateConfig({ mode: 'qr' })}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    config.mode === 'qr'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>Option 1: Scan QR Code (Personal / Business App)</span>
                </button>
                <button
                  type="button"
                  onClick={() => updateConfig({ mode: 'meta_api' })}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-extrabold transition-all cursor-pointer flex items-center gap-1.5 ${
                    config.mode === 'meta_api'
                      ? 'bg-sky-500 text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
                  }`}
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Option 2: Official Meta WhatsApp Cloud API</span>
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsConnectOpen(false)}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                Close ✕
              </button>
            </div>

            {config.mode === 'qr' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center p-4 rounded-2xl bg-emerald-500/5 border border-emerald-500/20">
                <div className="lg:col-span-4 flex flex-col items-center justify-center">
                  {config.qrConnected || qrStatus === 'connected' ? (
                    <div className="w-52 rounded-2xl bg-emerald-500/15 border-2 border-emerald-500/40 flex flex-col items-center justify-center p-4 text-center space-y-2">
                      <CheckCircle2 className="w-11 h-11 text-emerald-500" />
                      <div className="text-xs font-extrabold text-emerald-600 dark:text-emerald-300">
                        WhatsApp Connected!
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 dark:text-slate-300">
                        {config.connectedPhone || config.connectedName}
                      </div>
                      <div className="flex flex-col gap-1.5 w-full pt-1">
                        <button
                          type="button"
                          onClick={handleManualSyncNow}
                          disabled={isSyncingNow}
                          className="w-full px-3 py-1.5 rounded-xl bg-emerald-500 text-white hover:bg-emerald-600 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSyncingNow ? 'animate-spin' : ''}`} />
                          <span>Sync All Chats &amp; Groups</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleStartQrLink(true)}
                          className="w-full px-3 py-1.5 rounded-xl bg-sky-500/15 text-sky-600 dark:text-sky-300 hover:bg-sky-500/25 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <QrCode className="w-3 h-3" />
                          <span>Re-Scan QR for Full History</span>
                        </button>
                        <button
                          type="button"
                          onClick={handleDisconnectQr}
                          className="w-full px-3 py-1.5 rounded-xl bg-rose-500/15 text-rose-500 hover:bg-rose-500/25 text-[11px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                        >
                          <LogOut className="w-3 h-3" />
                          <span>Unlink Device</span>
                        </button>
                      </div>
                    </div>
                  ) : qrDataUrl ? (
                    <div className="p-3 bg-white rounded-2xl shadow-xl border border-emerald-200 flex flex-col items-center space-y-2">
                      <img
                        src={qrDataUrl}
                        alt="Scan WhatsApp QR Code"
                        className="w-44 h-44 object-contain"
                      />
                      <span className="text-[10px] font-bold text-emerald-700">
                        Scan with WhatsApp → Linked Devices
                      </span>
                    </div>
                  ) : (
                    <div className="w-48 h-48 rounded-2xl bg-slate-900/60 border border-slate-700 flex flex-col items-center justify-center p-4 text-center space-y-3">
                      <QrCode className="w-12 h-12 text-emerald-400 opacity-80" />
                      <button
                        type="button"
                        onClick={() => handleStartQrLink(true)}
                        disabled={isStartingQr}
                        className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white text-xs font-extrabold shadow-md cursor-pointer flex items-center gap-1.5"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isStartingQr ? 'animate-spin' : ''}`} />
                        <span>{isStartingQr ? 'Generating QR...' : 'Generate Live QR'}</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="lg:col-span-8 space-y-3">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>Direct Chats + WhatsApp Groups Sync</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    How to Sync Your WhatsApp Chats &amp; Groups:
                  </h3>
                  <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside">
                    <li>
                      Click <strong>"Generate Live QR"</strong> on the left to load your real-time pairing QR code.
                    </li>
                    <li>
                      Open <strong>WhatsApp</strong> on your phone → <strong>Menu (⋮) / Settings → Linked Devices → Link a Device</strong> and scan the QR code.
                    </li>
                    <li>
                      Your 1-on-1 conversations appear in <strong>Chats ({directChatsCount})</strong> and your WhatsApp groups appear in <strong>Groups ({groupChatsCount})</strong>!
                    </li>
                  </ol>
                  {qrDataUrl && (
                    <button
                      type="button"
                      onClick={() => handleStartQrLink(true)}
                      className="text-xs font-bold text-emerald-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Refresh QR Code</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <form
                onSubmit={handleSaveMetaApi}
                className="p-4 rounded-2xl bg-sky-500/5 border border-sky-500/20 space-y-3 text-xs"
              >
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold block mb-1">Meta Phone Number ID</label>
                    <input
                      type="text"
                      required
                      value={metaPhoneId}
                      onChange={(e) => setMetaPhoneId(e.target.value)}
                      placeholder="e.g. 104928374650192"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">WhatsApp Business Account (WABA) ID</label>
                    <input
                      type="text"
                      value={metaWabaId}
                      onChange={(e) => setMetaWabaId(e.target.value)}
                      placeholder="e.g. 109283746501928"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label className="font-bold block mb-1">Permanent Meta Access Token</label>
                    <input
                      type="password"
                      required
                      autoComplete="new-password"
                      value={metaToken}
                      onChange={(e) => setMetaToken(e.target.value)}
                      placeholder="EAAG..."
                      className={inputCls}
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <span className="text-[11px] text-slate-400">
                    Webhook Callback URL: <code>https://ozostack.in/api/whatsapp/webhook</code>
                  </span>
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-600 text-white font-extrabold text-xs cursor-pointer"
                  >
                    Save Meta API Credentials
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>

      {/* =================================================================== */}
      {/* 2-PANE WHATSAPP MESSENGER WORKSPACE: CHATS & GROUPS | LIVE THREAD   */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[620px]">
        {/* LEFT PANE: CHATS, GROUPS & UNREAD TABS (4 cols) */}
        <div className={`lg:col-span-4 rounded-2xl border flex flex-col overflow-hidden ${cardBg}`}>
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setFilterTab('chats')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 ${
                    filterTab === 'chats'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <MessageSquare className="w-3 h-3" />
                  <span>Chats ({directChatsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('groups')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 ${
                    filterTab === 'groups'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Groups ({groupChatsCount})</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  className={`px-3 py-1 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer ${
                    filterTab === 'unread'
                      ? 'bg-emerald-500 text-white shadow-xs'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  Unread ({totalUnread})
                </button>
              </div>
            </div>

            <div className="relative">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  filterTab === 'groups'
                    ? 'Search WhatsApp groups...'
                    : 'Search chats by name, phone, message...'
                }
                className={`${inputCls} pl-8 py-1.5`}
              />
            </div>
          </div>

          {/* Conversations List (Chats or Groups) */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[520px]">
            {filteredConversations.length === 0 ? (
              <div className="py-12 px-4 text-center space-y-2.5">
                {filterTab === 'groups' ? (
                  <Users className="w-8 h-8 text-emerald-400 mx-auto opacity-50" />
                ) : (
                  <MessageSquare className="w-8 h-8 text-emerald-400 mx-auto opacity-50" />
                )}
                <p className="text-xs font-bold text-slate-500">
                  {filterTab === 'groups'
                    ? 'No WhatsApp groups synced yet'
                    : 'No WhatsApp chats yet'}
                </p>
                <p className="text-[11px] text-slate-400">
                  Click <strong>"Sync Chats &amp; Groups"</strong> in the top bar to load your latest WhatsApp conversations.
                </p>
              </div>
            ) : (
              filteredConversations.map((conv) => {
                const isSelected = selectedChat?.id === conv.id;
                return (
                  <div
                    key={conv.id}
                    onClick={() => handleSelectChat(conv)}
                    className={`p-3.5 cursor-pointer transition-colors flex items-start gap-3 ${
                      isSelected
                        ? isLight
                          ? 'bg-emerald-50/90 border-l-4 border-l-emerald-500'
                          : 'bg-emerald-500/10 border-l-4 border-l-emerald-400'
                        : isLight
                        ? 'hover:bg-slate-50'
                        : 'hover:bg-slate-800/40'
                    }`}
                  >
                    <div
                      className={`w-9 h-9 rounded-full text-white font-extrabold text-xs flex items-center justify-center shrink-0 uppercase ${
                        conv.isGroup
                          ? 'bg-gradient-to-tr from-teal-600 to-sky-600'
                          : 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                      }`}
                    >
                      {conv.isGroup ? (
                        <Users className="w-4 h-4" />
                      ) : (
                        conv.contactName[0] || 'W'
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {conv.contactName}
                        </span>
                        <span className="text-[10px] text-slate-400 shrink-0">
                          {new Date(conv.lastMessageAt).toLocaleTimeString([], {
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </span>
                      </div>
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                        {conv.contactPhone}
                      </div>
                      <div className="flex items-center justify-between gap-2 mt-1">
                        <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                          {conv.lastMessageText}
                        </p>
                        {conv.unreadCount > 0 && (
                          <span className="px-1.5 py-0.5 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold shrink-0">
                            {conv.unreadCount}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT PANE: ACTIVE WHATSAPP CONVERSATION WINDOW (8 cols) */}
        <div className={`lg:col-span-8 rounded-2xl border flex flex-col justify-between overflow-hidden ${cardBg}`}>
          {!selectedChat ? (
            <div className="flex-1 flex flex-col items-center justify-center p-10 text-center space-y-3">
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                <MessageSquare className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-extrabold text-slate-700 dark:text-slate-200">
                Select a WhatsApp Chat or Group on the left
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Switch between <strong>Chats ({directChatsCount})</strong> and <strong>Groups ({groupChatsCount})</strong> on the left panel, or click <strong>"Sync Chats &amp; Groups"</strong> to pull your latest WhatsApp messages.
              </p>
              <button
                type="button"
                onClick={() => setIsNewChatOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md cursor-pointer"
              >
                + Start New WhatsApp Chat
              </button>
            </div>
          ) : (
            <>
              {/* Active Chat / Group Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={`w-10 h-10 rounded-full text-white font-extrabold text-sm flex items-center justify-center uppercase ${
                      selectedChat.isGroup
                        ? 'bg-gradient-to-tr from-teal-600 to-sky-600'
                        : 'bg-gradient-to-tr from-emerald-500 to-teal-600'
                    }`}
                  >
                    {selectedChat.isGroup ? (
                      <Users className="w-5 h-5" />
                    ) : (
                      selectedChat.contactName[0] || 'W'
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {selectedChat.contactName}
                      </h3>
                      {selectedChat.isGroup ? (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 text-teal-500">
                          Group
                        </span>
                      ) : (
                        selectedChat.company && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-500">
                            {selectedChat.company}
                          </span>
                        )
                      )}
                    </div>
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      {selectedChat.contactPhone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {!selectedChat.isGroup && (
                    <button
                      type="button"
                      onClick={() => {
                        const digits = normalizePhoneDigits(selectedChat.contactPhone);
                        window.open(`https://wa.me/${digits}`, '_blank', 'noopener,noreferrer');
                      }}
                      className="px-3 py-1.5 rounded-xl border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Open in WhatsApp</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDeleteChat(selectedChat.id)}
                    className="p-1.5 rounded-xl border border-rose-200 dark:border-rose-900/40 text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/30 cursor-pointer"
                    title="Delete conversation"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Chat Messages Timeline */}
              <div
                className={`flex-1 p-5 overflow-y-auto space-y-3 max-h-[430px] ${
                  isLight ? 'bg-slate-50/70' : 'bg-[#090e1a]'
                }`}
              >
                {selectedChat.messages.length === 0 ? (
                  <div className="h-full py-16 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-500">
                      {selectedChat.isGroup
                        ? `Group: ${selectedChat.contactName}`
                        : `Chat with ${selectedChat.contactName} (${selectedChat.contactPhone})`}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Type a message below to send directly via your linked WhatsApp.
                    </p>
                  </div>
                ) : (
                  selectedChat.messages.map((m) => (
                    <div
                      key={m.id}
                      className={`flex flex-col ${m.fromMe ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[78%] rounded-2xl px-4 py-2.5 text-xs leading-relaxed shadow-xs ${
                          m.fromMe
                            ? 'bg-emerald-600 text-white rounded-br-none'
                            : isLight
                            ? 'bg-white border border-slate-200 text-slate-800 rounded-bl-none'
                            : 'bg-slate-800 border border-slate-700 text-slate-100 rounded-bl-none'
                        }`}
                      >
                        {selectedChat.isGroup && !m.fromMe && m.senderName && (
                          <div className="text-[10px] font-extrabold text-emerald-500 mb-0.5">
                            {m.senderName}
                          </div>
                        )}
                        <div className="whitespace-pre-wrap break-words">{m.text}</div>
                        <div
                          className={`flex items-center justify-end gap-1.5 mt-1 text-[10px] ${
                            m.fromMe ? 'text-emerald-100' : 'text-slate-400'
                          }`}
                        >
                          <span>{m.via}</span>
                          <span>·</span>
                          <span>
                            {new Date(m.timestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                          {m.fromMe && <CheckCheck className="w-3.5 h-3.5 text-emerald-200" />}
                        </div>
                      </div>
                    </div>
                  ))
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Templates & Message Composer Footer */}
              <div className="p-3.5 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                {/* 1-Click Outreach Templates Strip */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                  <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1 shrink-0">
                    <Bookmark className="w-3 h-3 text-emerald-500" />
                    <span>Templates:</span>
                  </span>
                  {templates.map((tpl) => (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => handleApplyTemplate(tpl)}
                      className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:border-emerald-500 text-[11px] font-semibold text-slate-600 dark:text-slate-300 whitespace-nowrap cursor-pointer"
                    >
                      {tpl.label}
                    </button>
                  ))}
                </div>

                <form onSubmit={(e) => handleSendMessage(e, false)} className="flex items-end gap-2">
                  <textarea
                    rows={2}
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSendMessage(undefined, false);
                      }
                    }}
                    placeholder={`Type a WhatsApp message to ${selectedChat.contactName}... (Enter to send)`}
                    className={`${inputCls} resize-none flex-1`}
                  />

                  {!selectedChat.isGroup && (
                    <button
                      type="button"
                      onClick={() => handleSendMessage(undefined, true)}
                      disabled={!messageText.trim()}
                      className="px-3 py-2.5 rounded-xl border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 disabled:opacity-40 text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer"
                      title="Send via WhatsApp Web / App"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">WhatsApp Web</span>
                    </button>
                  )}

                  <button
                    type="submit"
                    disabled={isSending || !messageText.trim()}
                    className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-emerald-600/20 flex items-center gap-1.5 shrink-0 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{isSending ? 'Sending...' : 'Send Direct'}</span>
                  </button>
                </form>
              </div>
            </>
          )}
        </div>
      </div>

      {/* =================================================================== */}
      {/* NEW WHATSAPP CHAT MODAL                                             */}
      {/* =================================================================== */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${cardBg}`}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    Start New WhatsApp Chat
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Enter any WhatsApp number with country code
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsNewChatOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleStartNewChat} className="p-6 space-y-3.5 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="font-bold block mb-1">
                    WhatsApp Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={newChatPhone}
                    onChange={(e) => setNewChatPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="font-bold block mb-1">Name</label>
                  <input
                    type="text"
                    value={newChatName}
                    onChange={(e) => setNewChatName(e.target.value)}
                    placeholder="e.g. Rahul Sharma"
                    className={inputCls}
                  />
                </div>
              </div>

              <div>
                <label className="font-bold block mb-1">
                  Message <span className="text-rose-500">*</span>
                </label>
                <textarea
                  rows={4}
                  required
                  value={newChatText}
                  onChange={(e) => setNewChatText(e.target.value)}
                  placeholder="Write your WhatsApp message..."
                  className={`${inputCls} resize-none`}
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsNewChatOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSending}
                  className="flex items-center gap-1.5 px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-extrabold shadow-md cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{isSending ? 'Sending...' : 'Send WhatsApp Message'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
