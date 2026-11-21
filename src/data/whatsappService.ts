import { useState, useEffect, useCallback } from 'react';
import { addNotification } from './notificationService';
import { getActiveMailUser } from './emailService';

export type WaConnectionMode = 'qr' | 'meta_api';

export interface WaUserConfig {
  ownerUserId: string;
  mode: WaConnectionMode;
  connectedPhone: string;
  connectedName: string;
  qrConnected: boolean;
  // Optional Official Meta WhatsApp Cloud API credentials
  metaPhoneNumberId: string;
  metaWabaId: string;
  metaAccessToken: string;
  metaVerifyToken: string;
  updatedAt: string;
}

export interface WaChatMessage {
  id: string;
  chatId: string;
  fromMe: boolean;
  senderName: string;
  senderPhone: string;
  text: string;
  timestamp: string;
  status: 'sent' | 'delivered' | 'read' | 'received';
  via: 'Live WhatsApp' | 'Meta Cloud API' | 'WhatsApp Web';
}

export interface WaConversation {
  id: string; // normalized digits e.g. '919876543210'
  ownerUserId: string;
  contactName: string;
  contactPhone: string;
  company?: string;
  unreadCount: number;
  pinned?: boolean;
  lastMessageText: string;
  lastMessageAt: string;
  messages: WaChatMessage[];
}

export function getWaConfigKey(userId?: string): string {
  const id = userId || getActiveMailUser().id;
  return `ozostack_wa_config_user_v1_${id}`;
}

export function getWaChatsKey(userId?: string): string {
  const id = userId || getActiveMailUser().id;
  return `ozostack_wa_chats_user_v1_${id}`;
}

export function normalizePhoneDigits(raw: string): string {
  const digits = String(raw || '').replace(/[^0-9]/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function formatDisplayPhone(digits: string): string {
  const clean = normalizePhoneDigits(digits);
  if (!clean) return '';
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  return `+${clean}`;
}

export function getWaConfig(forUserId?: string): WaUserConfig {
  const activeUser = getActiveMailUser();
  const targetUserId = forUserId || activeUser.id;
  const defaultCfg: WaUserConfig = {
    ownerUserId: targetUserId,
    mode: 'qr',
    connectedPhone: '',
    connectedName: '',
    qrConnected: false,
    metaPhoneNumberId: '',
    metaWabaId: '',
    metaAccessToken: '',
    metaVerifyToken: 'ozostack_wa_verify_token',
    updatedAt: new Date().toISOString(),
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(getWaConfigKey(targetUserId));
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return { ...defaultCfg, ...parsed, ownerUserId: targetUserId };
        }
      }
    }
  } catch {
    /* ignore */
  }
  return defaultCfg;
}

export function saveWaConfig(partial: Partial<WaUserConfig>, forUserId?: string): WaUserConfig {
  const targetUserId = forUserId || getActiveMailUser().id;
  const current = getWaConfig(targetUserId);
  const updated: WaUserConfig = {
    ...current,
    ...partial,
    ownerUserId: targetUserId,
    updatedAt: new Date().toISOString(),
  };

  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(getWaConfigKey(targetUserId), JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('ozostack-wa-changed'));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    }
  } catch {
    /* ignore */
  }
  return updated;
}

export function getWaConversations(forUserId?: string): WaConversation[] {
  const targetUserId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const raw = window.localStorage.getItem(getWaChatsKey(targetUserId));
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed.filter(
            (c: WaConversation) => !c.ownerUserId || c.ownerUserId === targetUserId
          );
        }
      }
    }
  } catch {
    /* ignore */
  }
  return [];
}

export function saveWaConversations(conversations: WaConversation[], forUserId?: string): void {
  const targetUserId = forUserId || getActiveMailUser().id;
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const tagged = conversations.map((c) => ({ ...c, ownerUserId: targetUserId }));
      window.localStorage.setItem(getWaChatsKey(targetUserId), JSON.stringify(tagged));
      window.dispatchEvent(new CustomEvent('ozostack-wa-changed'));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    }
  } catch {
    /* ignore */
  }
}

export function upsertWaMessage(
  params: {
    contactPhone: string;
    contactName?: string;
    company?: string;
    fromMe: boolean;
    text: string;
    messageId?: string;
    timestamp?: string;
    via?: WaChatMessage['via'];
  },
  triggerNotification = true
): WaConversation | null {
  const activeUser = getActiveMailUser();
  const digits = normalizePhoneDigits(params.contactPhone);
  if (!digits) return null;

  const current = getWaConversations(activeUser.id);
  const existingIdx = current.findIndex((c) => c.id === digits);
  const nowIso = params.timestamp || new Date().toISOString();
  const msgId = params.messageId || `wa-msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  // Check if messageId already exists in conversation to avoid duplicates
  if (existingIdx >= 0 && current[existingIdx].messages.some((m) => m.id === msgId)) {
    return current[existingIdx];
  }

  const displayPhone = formatDisplayPhone(digits);
  const displayName =
    params.contactName ||
    (existingIdx >= 0 ? current[existingIdx].contactName : '') ||
    displayPhone;

  const newMsg: WaChatMessage = {
    id: msgId,
    chatId: digits,
    fromMe: params.fromMe,
    senderName: params.fromMe ? activeUser.name : displayName,
    senderPhone: params.fromMe ? getWaConfig(activeUser.id).connectedPhone : displayPhone,
    text: params.text,
    timestamp: nowIso,
    status: params.fromMe ? 'delivered' : 'received',
    via: params.via || 'Live WhatsApp',
  };

  let targetConv: WaConversation;
  let nextList: WaConversation[];

  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    targetConv = {
      ...existing,
      contactName:
        existing.contactName && !existing.contactName.startsWith('+')
          ? existing.contactName
          : displayName,
      company: params.company || existing.company,
      unreadCount: params.fromMe ? existing.unreadCount : existing.unreadCount + 1,
      lastMessageText: params.text,
      lastMessageAt: nowIso,
      messages: [...existing.messages, newMsg],
    };
    nextList = [targetConv, ...current.filter((_, idx) => idx !== existingIdx)];
  } else {
    targetConv = {
      id: digits,
      ownerUserId: activeUser.id,
      contactName: displayName,
      contactPhone: displayPhone,
      company: params.company,
      unreadCount: params.fromMe ? 0 : 1,
      pinned: false,
      lastMessageText: params.text,
      lastMessageAt: nowIso,
      messages: [newMsg],
    };
    nextList = [targetConv, ...current];
  }

  saveWaConversations(nextList, activeUser.id);

  if (triggerNotification && !params.fromMe) {
    addNotification({
      title: `New WhatsApp from ${targetConv.contactName}`,
      subtitle: `${params.text.slice(0, 90)} · ${targetConv.contactPhone}`,
      type: 'lead',
      read: false,
      targetNav: 'WhatsApp',
      targetId: targetConv.id,
      owner: activeUser.name,
      recipient: activeUser.name,
      priority: 'high',
    });
  }

  return targetConv;
}

export async function startWaQrSession(): Promise<{
  ok: boolean;
  status: string;
  qrDataUrl?: string;
  phoneNumber?: string;
  pushName?: string;
  error?: string;
}> {
  const activeUser = getActiveMailUser();
  try {
    const res = await fetch('/api/whatsapp/connect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: activeUser.id }),
    });
    const data = await res.json().catch(() => null);
    if (res.ok && data) {
      if (data.status === 'connected') {
        saveWaConfig(
          {
            qrConnected: true,
            connectedPhone: data.phoneNumber || '',
            connectedName: data.pushName || activeUser.name,
          },
          activeUser.id
        );
      }
      return data;
    }
    return { ok: false, status: 'error', error: data?.error || 'Could not start WhatsApp QR session.' };
  } catch (err: any) {
    return { ok: false, status: 'error', error: err?.message || 'Network error.' };
  }
}

export async function pollWaSessionStatus(): Promise<{
  ok: boolean;
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  qrDataUrl?: string;
  phoneNumber?: string;
  pushName?: string;
  newMessagesCount: number;
}> {
  const activeUser = getActiveMailUser();
  try {
    const res = await fetch(
      `/api/whatsapp/status?userId=${encodeURIComponent(activeUser.id)}`,
      { cache: 'no-store' }
    );
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      return { ok: false, status: 'disconnected', newMessagesCount: 0 };
    }

    if (data.status === 'connected') {
      saveWaConfig(
        {
          qrConnected: true,
          connectedPhone: data.phoneNumber || '',
          connectedName: data.pushName || activeUser.name,
        },
        activeUser.id
      );
    } else if (data.status === 'disconnected') {
      const currentCfg = getWaConfig(activeUser.id);
      if (currentCfg.qrConnected) {
        saveWaConfig({ qrConnected: false }, activeUser.id);
      }
    }

    let added = 0;
    if (Array.isArray(data.incomingMessages) && data.incomingMessages.length > 0) {
      for (const m of data.incomingMessages) {
        upsertWaMessage(
          {
            contactPhone: m.phone,
            contactName: m.pushName || m.phone,
            fromMe: Boolean(m.fromMe),
            text: m.text,
            messageId: m.id,
            timestamp: m.timestamp,
            via: 'Live WhatsApp',
          },
          !m.fromMe
        );
        added++;
      }
    }

    return {
      ok: true,
      status: data.status || 'disconnected',
      qrDataUrl: data.qrDataUrl,
      phoneNumber: data.phoneNumber,
      pushName: data.pushName,
      newMessagesCount: added,
    };
  } catch {
    return { ok: false, status: 'disconnected', newMessagesCount: 0 };
  }
}

export async function disconnectWaSession(): Promise<void> {
  const activeUser = getActiveMailUser();
  try {
    await fetch('/api/whatsapp/disconnect', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: activeUser.id }),
    });
  } catch {
    /* ignore */
  }
  saveWaConfig(
    {
      qrConnected: false,
      connectedPhone: '',
      connectedName: '',
    },
    activeUser.id
  );
}

export async function sendDirectWhatsApp(params: {
  toPhone: string;
  contactName?: string;
  company?: string;
  text: string;
  allowWebFallback?: boolean;
}): Promise<{
  ok: boolean;
  realDelivered: boolean;
  via: WaChatMessage['via'];
  message: string;
}> {
  const activeUser = getActiveMailUser();
  const config = getWaConfig(activeUser.id);
  const digits = normalizePhoneDigits(params.toPhone);
  const text = (params.text || '').trim();
  const allowFallback = params.allowWebFallback !== false;

  if (!digits || !text) {
    return {
      ok: false,
      realDelivered: false,
      via: 'Live WhatsApp',
      message: 'Valid recipient phone number and message text are required.',
    };
  }

  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUser.id,
        toPhone: digits,
        text,
        metaConfig:
          config.mode === 'meta_api' && config.metaPhoneNumberId && config.metaAccessToken
            ? {
                phoneNumberId: config.metaPhoneNumberId,
                accessToken: config.metaAccessToken,
              }
            : undefined,
      }),
    });
    const data = await res.json().catch(() => null);

    if (res.ok && data && data.ok && data.realDelivered) {
      const viaMode: WaChatMessage['via'] =
        data.via === 'meta_api' ? 'Meta Cloud API' : 'Live WhatsApp';
      upsertWaMessage(
        {
          contactPhone: digits,
          contactName: params.contactName,
          company: params.company,
          fromMe: true,
          text,
          messageId: data.messageId,
          via: viaMode,
        },
        false
      );
      return {
        ok: true,
        realDelivered: true,
        via: viaMode,
        message: `WhatsApp message delivered directly to ${formatDisplayPhone(digits)} via ${viaMode}!`,
      };
    }

    if (!allowFallback) {
      return {
        ok: false,
        realDelivered: false,
        via: 'Live WhatsApp',
        message:
          data?.error ||
          'Please link your WhatsApp via QR Code Scan first to send directly inside the CRM.',
      };
    }
  } catch (err: any) {
    if (!allowFallback) {
      return {
        ok: false,
        realDelivered: false,
        via: 'Live WhatsApp',
        message: err?.message || 'Network error while sending WhatsApp message.',
      };
    }
  }

  // Fallback: Open WhatsApp Web / App with pre-filled message and log in CRM conversation
  const waUrl = `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  upsertWaMessage(
    {
      contactPhone: digits,
      contactName: params.contactName,
      company: params.company,
      fromMe: true,
      text,
      via: 'WhatsApp Web',
    },
    false
  );

  return {
    ok: true,
    realDelivered: false,
    via: 'WhatsApp Web',
    message: `Opened WhatsApp Web for ${formatDisplayPhone(digits)}. Link your WhatsApp via QR Scan in WhatsApp Messenger for 1-click in-app sending without opening a new tab!`,
  };
}

export function useWhatsAppCenter() {
  const [config, setConfig] = useState<WaUserConfig>(() => getWaConfig());
  const [conversations, setConversations] = useState<WaConversation[]>(() => getWaConversations());

  const refresh = useCallback(() => {
    setConfig(getWaConfig());
    setConversations(getWaConversations());
  }, []);

  useEffect(() => {
    refresh();
    window.addEventListener('ozostack-wa-changed', refresh);
    window.addEventListener('ozostack-crm-config-changed', refresh);
    window.addEventListener('storage', refresh);
    return () => {
      window.removeEventListener('ozostack-wa-changed', refresh);
      window.removeEventListener('ozostack-crm-config-changed', refresh);
      window.removeEventListener('storage', refresh);
    };
  }, [refresh]);

  const updateConfig = useCallback((partial: Partial<WaUserConfig>) => {
    const next = saveWaConfig(partial);
    setConfig(next);
    return next;
  }, []);

  return { config, conversations, updateConfig, refresh };
}
