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
  Upload,
  UserPlus,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import {
  useWhatsAppCenter,
  WaConversation,
  WaContact,
  startWaQrSession,
  pollWaSessionStatus,
  disconnectWaSession,
  sendDirectWhatsApp,
  upsertWaMessage,
  saveWaConversations,
  openOrCreateWaConversation,
  importWaContactsBatch,
  normalizePhoneDigits,
  formatDisplayPhone,
} from '../../data/whatsappService';
import { INITIAL_LEADS, INITIAL_CONTACTS } from '../../data/mockData';
import { DEFAULT_TEMPLATES, LeadMessageTemplate } from '../leads/LeadActionModal';

export const WhatsAppCenterView: React.FC = () => {
  const { theme } = useTheme();
  const { currentUser, scopeFilter } = useAuth();
  const isLight = theme === 'white-sky';
  const { config, conversations, waContacts, updateConfig } = useWhatsAppCenter();

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

  // Chat Workspace State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'contacts'>('all');
  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    conversations[0]?.id || null
  );
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);

  // New Chat / Add Contact Modal State
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
  const vcfInputRef = useRef<HTMLInputElement>(null);

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

  // Poll live WhatsApp session status, contacts, chats & history from backend
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
          'Messages & contacts synced directly from your linked WhatsApp account!'
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

  // Unified Contacts Directory: Synced WhatsApp Contacts + CRM Contacts + CRM Leads + Conversation Participants
  const allDirectoryContacts = useMemo(() => {
    const map = new Map<string, WaContact>();
    const put = (
      name?: string,
      phone?: string,
      company?: string,
      source: WaContact['source'] = 'whatsapp'
    ) => {
      const digits = normalizePhoneDigits(phone || '');
      if (!digits || digits.length < 7) return;
      const displayPhone = formatDisplayPhone(digits);
      const existing = map.get(digits);
      const rawName = (name || '').trim();
      const hasRealName = rawName && !rawName.startsWith('+');
      const finalName = hasRealName
        ? rawName
        : existing?.name && !existing.name.startsWith('+')
        ? existing.name
        : displayPhone;

      map.set(digits, {
        id: digits,
        name: finalName,
        phone: displayPhone,
        company: company || existing?.company || (source === 'crm' ? 'CRM' : 'WhatsApp'),
        source: existing?.source === 'whatsapp' ? 'whatsapp' : source,
      });
    };

    // 1. Synced WhatsApp contacts from linked phone
    waContacts.forEach((c) => put(c.name, c.phone || c.id, c.company, c.source || 'whatsapp'));

    // 2. Existing conversation participants
    conversations.forEach((conv) =>
      put(conv.contactName, conv.contactPhone || conv.id, conv.company, 'whatsapp')
    );

    // 3. CRM Leads (scoped + fallback if unscoped)
    try {
      const rawLeads = localStorage.getItem('ozostack_leads_v2');
      const parsedLeads = rawLeads ? JSON.parse(rawLeads) : INITIAL_LEADS;
      const leads =
        Array.isArray(parsedLeads) && parsedLeads.length > 0 ? parsedLeads : INITIAL_LEADS;
      const scoped = scopeFilter(leads, (l: any) => ({ owner: l.owner }));
      const targetLeads = scoped.length > 0 ? scoped : leads;
      targetLeads.forEach((l: any) => put(l.name, l.whatsapp || l.phone, l.company, 'crm'));
    } catch {}

    // 4. CRM Contacts (scoped + fallback if unscoped)
    try {
      const rawContacts = localStorage.getItem('ozostack_contacts_v1');
      const parsedContacts = rawContacts ? JSON.parse(rawContacts) : INITIAL_CONTACTS;
      const contacts =
        Array.isArray(parsedContacts) && parsedContacts.length > 0
          ? parsedContacts
          : INITIAL_CONTACTS;
      const scoped = scopeFilter(contacts, (c: any) => ({ owner: c.owner }));
      const targetContacts = scoped.length > 0 ? scoped : contacts;
      targetContacts.forEach((c: any) => put(c.name, c.phone, c.company, 'crm'));
    } catch {}

    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [waContacts, conversations, scopeFilter]);

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

  const filteredConversations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return conversations.filter((c) => {
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

  const filteredContacts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return allDirectoryContacts;
    return allDirectoryContacts.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        (c.company || '').toLowerCase().includes(q)
    );
  }, [allDirectoryContacts, searchQuery]);

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

  // Instant 1-Click Open Chat with any Contact (No Modal Required!)
  const handleInstantChatWithContact = (contact: {
    name: string;
    phone: string;
    company?: string;
  }) => {
    const conv = openOrCreateWaConversation({
      contactPhone: contact.phone,
      contactName: contact.name,
      company: contact.company,
    });
    if (conv) {
      setSelectedChatId(conv.id);
      setFilterTab('all');
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
          'WhatsApp Sync Complete!',
          `Synced ${res.syncedContactsCount} contacts and ${res.newMessagesCount} new/history messages from your WhatsApp session.`
        );
      } else {
        setIsConnectOpen(true);
        showBanner(
          'info',
          'Scan QR to Sync Full WhatsApp History & Contacts',
          'Click "Generate Live QR" below and scan from your phone to sync all chats and contacts.'
        );
      }
    } finally {
      setIsSyncingNow(false);
    }
  };

  // Native Device Contact Picker OR VCF/CSV File Import
  const handlePickDeviceContacts = async () => {
    const nav = navigator as any;
    if (nav?.contacts?.select) {
      try {
        const picked = await nav.contacts.select(['name', 'tel'], { multiple: true });
        if (Array.isArray(picked) && picked.length > 0) {
          const batch: { name?: string; phone: string; company?: string }[] = [];
          for (const p of picked) {
            const name = Array.isArray(p.name) ? p.name[0] : p.name;
            const phones = Array.isArray(p.tel) ? p.tel : [p.tel];
            for (const tel of phones) {
              if (tel) batch.push({ name, phone: String(tel), company: 'Phone Contacts' });
            }
          }
          const count = importWaContactsBatch(batch);
          setFilterTab('contacts');
          showBanner('sent', 'Phone Contacts Synced!', `Imported ${count} contacts from your device.`);
          return;
        }
      } catch {
        /* fallback to file picker */
      }
    }
    vcfInputRef.current?.click();
  };

  const handleVcfOrCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const text = await file.text();
      const batch: { name?: string; phone: string; company?: string }[] = [];

      if (text.includes('BEGIN:VCARD')) {
        const cards = text.split(/BEGIN:VCARD/i);
        for (const card of cards) {
          const fnMatch = card.match(/^(?:FN|N)(?:;[^:]*)?:(.+)$/im);
          const name = fnMatch
            ? fnMatch[1].replace(/;/g, ' ').trim()
            : '';
          const telMatches = card.matchAll(/^TEL(?:;[^:]*)?:(.+)$/gim);
          for (const tm of telMatches) {
            if (tm[1]) {
              batch.push({
                name: name || undefined,
                phone: tm[1].trim(),
                company: 'Phone Contacts',
              });
            }
          }
        }
      } else {
        // CSV / line-by-line format: Name, Phone, Company
        const lines = text.split(/\r?\n/);
        for (const line of lines) {
          const parts = line.split(/[,;\t]/).map((s) => s.replace(/^["']|["']$/g, '').trim());
          const phonePart = parts.find((p) => p.replace(/[^0-9]/g, '').length >= 10);
          if (phonePart) {
            const namePart = parts.find((p) => p !== phonePart && /[a-zA-Z]/.test(p));
            batch.push({
              name: namePart || undefined,
              phone: phonePart,
              company: 'Imported Contact',
            });
          }
        }
      }

      if (batch.length > 0) {
        const count = importWaContactsBatch(batch);
        setFilterTab('contacts');
        showBanner(
          'sent',
          `Imported ${count} Contacts!`,
          'All contacts are now available in your Contacts tab for 1-click WhatsApp chat.'
        );
      } else {
        showBanner('error', 'No Valid Phone Numbers Found', 'Upload a .vcf (vCard) or .csv contacts file.');
      }
    } catch {
      showBanner('error', 'Import Failed', 'Could not read the contacts file.');
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
      selectedChat
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

  // Send message in active chat thread
  const handleSendMessage = async (e?: React.FormEvent, forceWeb = false) => {
    e?.preventDefault();
    if (!selectedChat || !messageText.trim()) return;
    const textToSend = messageText.trim();
    setMessageText('');

    if (forceWeb) {
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
        toPhone: selectedChat.contactPhone,
        contactName: selectedChat.contactName,
        company: selectedChat.company,
        text: textToSend,
        allowWebFallback: true,
      });

      if (res.realDelivered) {
        showBanner('sent', 'Delivered via Live WhatsApp', res.message);
      } else {
        showBanner('info', 'Opened WhatsApp Web & Logged in Chat', res.message);
      }
    } finally {
      setIsSending(false);
    }
  };

  // Start new WhatsApp chat or save new contact
  const handleStartNewChat = async (e: React.FormEvent) => {
    e.preventDefault();
    const digits = normalizePhoneDigits(newChatPhone);
    if (!digits) return;

    importWaContactsBatch([
      {
        name: newChatName.trim() || formatDisplayPhone(digits),
        phone: digits,
        company: newChatCompany.trim() || 'WhatsApp Contact',
        source: 'imported',
      },
    ]);

    if (!newChatText.trim()) {
      const conv = openOrCreateWaConversation({
        contactPhone: digits,
        contactName: newChatName.trim() || formatDisplayPhone(digits),
        company: newChatCompany.trim() || undefined,
      });
      if (conv) setSelectedChatId(conv.id);
      setIsNewChatOpen(false);
      setNewChatPhone('');
      setNewChatName('');
      setNewChatCompany('');
      return;
    }

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

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0);

  return (
    <div className="space-y-4">
      {/* Hidden file input for VCF / CSV Contact Import */}
      <input
        ref={vcfInputRef}
        type="file"
        accept=".vcf,.vcard,.csv,.txt"
        onChange={handleVcfOrCsvUpload}
        className="hidden"
      />

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
                  <strong>100% Per-User Private WhatsApp:</strong> Only you ({currentUser?.name}) can see your linked WhatsApp number, contacts, and chats.
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
              title="Force sync all WhatsApp chats, messages, and contacts from your linked session"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncingNow ? 'animate-spin' : ''}`} />
              <span>{isSyncingNow ? 'Syncing...' : 'Sync Chats & Contacts'}</span>
            </button>

            <button
              type="button"
              onClick={handlePickDeviceContacts}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition-colors cursor-pointer ${
                isLight
                  ? 'border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100'
                  : 'border-indigo-500/30 bg-indigo-500/10 text-indigo-300 hover:bg-indigo-500/20'
              }`}
              title="Import contacts from your Phone / Google Contacts (.vcf or .csv)"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import Phone Contacts</span>
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
              <span>New Chat / Contact</span>
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
                          <span>Sync All Chats &amp; Contacts</span>
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
                    <span>Full Chat History + Contacts Sync Enabled</span>
                  </div>
                  <h3 className="text-sm sm:text-base font-extrabold text-slate-900 dark:text-white">
                    How to Sync Your WhatsApp Chats, Messages &amp; Contacts:
                  </h3>
                  <ol className="text-xs text-slate-600 dark:text-slate-300 space-y-1.5 list-decimal list-inside">
                    <li>
                      Click <strong>"Generate Live QR"</strong> (or <strong>"Re-Scan QR for Full History"</strong> if you linked earlier) to load a fresh pairing QR code.
                    </li>
                    <li>
                      Open <strong>WhatsApp</strong> on your phone → <strong>Menu (⋮) / Settings → Linked Devices → Link a Device</strong> and scan the QR code.
                    </li>
                    <li>
                      Keep WhatsApp open on your phone for 5–10 seconds after scanning — your phone will automatically push your <strong>recent WhatsApp chats, message history, and saved contacts</strong> directly into this window!
                    </li>
                    <li>
                      You can also click the <strong>Contacts ({allDirectoryContacts.length})</strong> tab on the left or <strong>"Import Phone Contacts"</strong> to browse and start a chat with any contact in 1 click.
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
      {/* 2-PANE WHATSAPP MESSENGER WORKSPACE: CHAT/CONTACT LIST | LIVE CHAT  */}
      {/* =================================================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[620px]">
        {/* LEFT PANE: CHATS & CONTACTS DIRECTORY (4 cols) */}
        <div className={`lg:col-span-4 rounded-2xl border flex flex-col overflow-hidden ${cardBg}`}>
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 space-y-2.5">
            <div className="flex items-center justify-between gap-1">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setFilterTab('all')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer ${
                    filterTab === 'all'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  Chats ({conversations.length})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('unread')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer ${
                    filterTab === 'unread'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  Unread ({totalUnread})
                </button>
                <button
                  type="button"
                  onClick={() => setFilterTab('contacts')}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-extrabold transition-colors cursor-pointer flex items-center gap-1 ${
                    filterTab === 'contacts'
                      ? 'bg-emerald-500 text-white'
                      : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
                  }`}
                >
                  <Users className="w-3 h-3" />
                  <span>Contacts ({allDirectoryContacts.length})</span>
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
                  filterTab === 'contacts'
                    ? 'Search synced WhatsApp & CRM contacts...'
                    : 'Search chats by name, phone, message...'
                }
                className={`${inputCls} pl-8 py-1.5`}
              />
            </div>
          </div>

          {/* Active List: Either Chats OR Contacts Directory */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/80 max-h-[410px]">
            {filterTab === 'contacts' ? (
              filteredContacts.length === 0 ? (
                <div className="py-10 px-4 text-center space-y-2.5">
                  <Users className="w-8 h-8 text-emerald-400 mx-auto opacity-50" />
                  <p className="text-xs font-bold text-slate-500">No contacts found</p>
                  <div className="flex flex-wrap justify-center gap-2">
                    <button
                      type="button"
                      onClick={handlePickDeviceContacts}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500 text-white text-xs font-bold cursor-pointer"
                    >
                      Import Phone Contacts (.vcf / .csv)
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsNewChatOpen(true)}
                      className="px-3 py-1.5 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-bold cursor-pointer"
                    >
                      + Add Contact
                    </button>
                  </div>
                </div>
              ) : (
                filteredContacts.map((contact) => (
                  <div
                    key={contact.id}
                    onClick={() => handleInstantChatWithContact(contact)}
                    className={`p-3 cursor-pointer transition-colors flex items-center justify-between gap-3 ${
                      isLight ? 'hover:bg-emerald-50/70' : 'hover:bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 uppercase">
                        {contact.name[0] || 'C'}
                      </div>
                      <div className="min-w-0">
                        <div className="text-xs font-extrabold text-slate-900 dark:text-white truncate">
                          {contact.name}
                        </div>
                        <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 truncate">
                          {contact.phone}
                          {contact.company && (
                            <span className="text-slate-400"> · {contact.company}</span>
                          )}
                        </div>
                      </div>
                    </div>
                    <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-extrabold shrink-0">
                      Chat →
                    </span>
                  </div>
                ))
              )
            ) : filteredConversations.length === 0 ? (
              <div className="py-10 px-4 text-center space-y-2.5">
                <MessageSquare className="w-8 h-8 text-emerald-400 mx-auto opacity-50" />
                <p className="text-xs font-bold text-slate-500">No WhatsApp chats yet</p>
                <p className="text-[11px] text-slate-400">
                  Click <strong>"Sync Chats &amp; Contacts"</strong> above or open the{' '}
                  <button
                    type="button"
                    onClick={() => setFilterTab('contacts')}
                    className="text-emerald-500 font-bold underline cursor-pointer"
                  >
                    Contacts ({allDirectoryContacts.length})
                  </button>{' '}
                  tab to start chatting in 1 click.
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
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-extrabold text-xs flex items-center justify-center shrink-0 uppercase">
                      {conv.contactName[0] || 'W'}
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
                      <div className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                        {conv.contactPhone}
                        {conv.company && <span className="text-slate-400"> · {conv.company}</span>}
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

          {/* Quick-Start from Synced WhatsApp & CRM Contacts (1-Click Direct Open) */}
          <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
            <div className="flex items-center justify-between mb-2">
              <div className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                Quick Contacts ({allDirectoryContacts.length})
              </div>
              <button
                type="button"
                onClick={() => setFilterTab('contacts')}
                className="text-[10px] font-bold text-emerald-500 hover:underline cursor-pointer"
              >
                View All →
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
              {allDirectoryContacts.slice(0, 15).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleInstantChatWithContact(c)}
                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:border-emerald-500 text-[11px] font-semibold text-slate-700 dark:text-slate-200 truncate max-w-[180px] cursor-pointer"
                  title={`${c.name} (${c.phone})`}
                >
                  {c.name}
                </button>
              ))}
            </div>
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
                Select a WhatsApp conversation or pick any contact on the left
              </h3>
              <p className="text-xs text-slate-400 max-w-sm">
                Click any contact in the <strong>Contacts ({allDirectoryContacts.length})</strong> tab to open their chat window directly, or click <strong>"Sync Chats &amp; Contacts"</strong> to pull your latest WhatsApp messages.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterTab('contacts')}
                  className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md cursor-pointer"
                >
                  Browse All Contacts ({allDirectoryContacts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setIsNewChatOpen(true)}
                  className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-extrabold cursor-pointer"
                >
                  + Dial New Number
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Active Chat Header */}
              <div className="px-5 py-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-emerald-500 to-teal-600 text-white font-extrabold text-sm flex items-center justify-center uppercase">
                    {selectedChat.contactName[0] || 'W'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                        {selectedChat.contactName}
                      </h3>
                      {selectedChat.company && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sky-500/10 text-sky-500">
                          {selectedChat.company}
                        </span>
                      )}
                    </div>
                    <div className="text-xs font-mono text-emerald-600 dark:text-emerald-400">
                      {selectedChat.contactPhone}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
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
                className={`flex-1 p-5 overflow-y-auto space-y-3 max-h-[400px] ${
                  isLight ? 'bg-slate-50/70' : 'bg-[#090e1a]'
                }`}
              >
                {selectedChat.messages.length === 0 ? (
                  <div className="h-full py-16 text-center space-y-2">
                    <p className="text-xs font-bold text-slate-500">
                      Start chatting with {selectedChat.contactName} ({selectedChat.contactPhone})
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Type a message below or click a template pill to send directly via your linked WhatsApp.
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
      {/* NEW WHATSAPP CHAT / ADD CONTACT MODAL                               */}
      {/* =================================================================== */}
      {isNewChatOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs">
          <div className={`w-full max-w-lg rounded-2xl border shadow-2xl overflow-hidden ${cardBg}`}>
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-500/15 text-emerald-500">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                    New WhatsApp Chat / Add Contact
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Pick from your contacts or enter any WhatsApp number
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
              <div>
                <label className="font-bold block mb-1">
                  Quick Pick from Synced WhatsApp &amp; CRM Contacts ({allDirectoryContacts.length})
                </label>
                <select
                  value=""
                  onChange={(e) => {
                    const found = allDirectoryContacts.find((c) => c.phone === e.target.value);
                    if (found) {
                      setNewChatName(found.name);
                      setNewChatPhone(found.phone);
                      setNewChatCompany(found.company || '');
                    }
                  }}
                  className={inputCls}
                >
                  <option value="">Choose a contact...</option>
                  {allDirectoryContacts.map((c) => (
                    <option key={c.id} value={c.phone}>
                      {c.name} — {c.phone} ({c.company || 'WhatsApp'})
                    </option>
                  ))}
                </select>
              </div>

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
                  <label className="font-bold block mb-1">Contact Name</label>
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
                  First Message (Optional — leave blank to just open chat / save contact)
                </label>
                <textarea
                  rows={3}
                  value={newChatText}
                  onChange={(e) => setNewChatText(e.target.value)}
                  placeholder="Write your WhatsApp message or leave blank to open chat..."
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
                  <span>
                    {isSending
                      ? 'Sending...'
                      : newChatText.trim()
                      ? 'Send WhatsApp Message'
                      : 'Save Contact & Open Chat'}
                  </span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
