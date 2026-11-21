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
  id: string; // normalized digits e.g. '919876543210' OR @lid digits OR group JID '120363...@g.us'
  ownerUserId: string;
  isGroup?: boolean;
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

export function isGroupChatId(raw: string): boolean {
  return String(raw || '').trim().endsWith('@g.us');
}

export function normalizePhoneDigits(raw: string): string {
  const s = String(raw || '').trim();
  if (s.endsWith('@g.us')) return `${s.split('@')[0]}@g.us`;
  const digits = s.replace(/[^0-9]/g, '');
  if (digits.length === 10) return `91${digits}`;
  return digits;
}

export function isValidChatIdentifier(id: string, isGroup?: boolean): boolean {
  const s = String(id || '').trim();
  if (isGroup || s.endsWith('@g.us')) return s.endsWith('@g.us');
  const digits = s.replace(/[^0-9]/g, '');
  return digits.length >= 7;
}

export function formatDisplayPhone(digitsOrJid: string, isGroup?: boolean): string {
  if (isGroup || isGroupChatId(digitsOrJid)) return 'WhatsApp Group';
  const clean = normalizePhoneDigits(digitsOrJid);
  if (!clean) return '';
  if (clean.length === 12 && clean.startsWith('91')) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }
  if (clean.length >= 14) {
    return 'WhatsApp Direct Chat';
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
      window.localStorage.removeItem(`ozostack_wa_contacts_user_v1_${targetUserId}`);
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
      window.localStorage.removeItem(`ozostack_wa_contacts_user_v1_${targetUserId}`);
      const raw = window.localStorage.getItem(getWaChatsKey(targetUserId));
      if (raw !== null) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          return parsed
            .filter(
              (c: WaConversation) =>
                c &&
                (!c.ownerUserId || c.ownerUserId === targetUserId) &&
                isValidChatIdentifier(c.id, c.isGroup)
            )
            .map((c: WaConversation) => ({
              ...c,
              isGroup: Boolean(c.isGroup || isGroupChatId(c.id)),
            }));
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
      const tagged = conversations
        .filter((c) => c && isValidChatIdentifier(c.id, c.isGroup))
        .map((c) => ({
          ...c,
          ownerUserId: targetUserId,
          isGroup: Boolean(c.isGroup || isGroupChatId(c.id)),
        }));
      window.localStorage.setItem(getWaChatsKey(targetUserId), JSON.stringify(tagged));
      window.dispatchEvent(new CustomEvent('ozostack-wa-changed'));
      window.dispatchEvent(new CustomEvent('ozostack-crm-config-changed'));
    }
  } catch {
    /* ignore */
  }
}

export function openOrCreateWaConversation(params: {
  contactPhone: string;
  contactName?: string;
  company?: string;
}): WaConversation | null {
  const activeUser = getActiveMailUser();
  const digits = normalizePhoneDigits(params.contactPhone);
  if (!digits) return null;

  const current = getWaConversations(activeUser.id);
  const existingIdx = current.findIndex((c) => c.id === digits);
  const displayPhone = formatDisplayPhone(digits);
  const displayName = (params.contactName || '').trim() || displayPhone;

  if (existingIdx >= 0) {
    const existing = current[existingIdx];
    const updatedConv: WaConversation = {
      ...existing,
      contactName:
        existing.contactName && !existing.contactName.startsWith('+')
          ? existing.contactName
          : displayName,
      company: params.company || existing.company,
      unreadCount: 0,
    };
    const nextList = [updatedConv, ...current.filter((_, idx) => idx !== existingIdx)];
    saveWaConversations(nextList, activeUser.id);
    return updatedConv;
  }

  const nowIso = new Date().toISOString();
  const newConv: WaConversation = {
    id: digits,
    ownerUserId: activeUser.id,
    isGroup: false,
    contactName: displayName,
    contactPhone: displayPhone,
    company: params.company,
    unreadCount: 0,
    pinned: false,
    lastMessageText: 'Ready to chat on WhatsApp',
    lastMessageAt: nowIso,
    messages: [],
  };

  saveWaConversations([newConv, ...current], activeUser.id);
  return newConv;
}

export function upsertWaMessage(
  params: {
    contactPhone: string;
    contactName?: string;
    company?: string;
    isGroup?: boolean;
    participantSender?: string;
    fromMe: boolean;
    text: string;
    messageId?: string;
    timestamp?: string;
    via?: WaChatMessage['via'];
  },
  triggerNotification = true
): WaConversation | null {
  const activeUser = getActiveMailUser();
  const isGroup = Boolean(params.isGroup || isGroupChatId(params.contactPhone));
  const chatId = isGroup
    ? `${String(params.contactPhone).split('@')[0]}@g.us`
    : normalizePhoneDigits(params.contactPhone);
  if (!chatId || !isValidChatIdentifier(chatId, isGroup)) return null;

  const current = getWaConversations(activeUser.id);
  const existingIdx = current.findIndex((c) => c.id === chatId);
  const nowIso = params.timestamp || new Date().toISOString();
  const msgId = params.messageId || `wa-msg-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;

  if (existingIdx >= 0 && current[existingIdx].messages.some((m) => m.id === msgId)) {
    return current[existingIdx];
  }

  const displayPhone = isGroup ? 'WhatsApp Group' : formatDisplayPhone(chatId);
  const displayName =
    params.contactName ||
    (existingIdx >= 0 ? current[existingIdx].contactName : '') ||
    displayPhone;

  const newMsg: WaChatMessage = {
    id: msgId,
    chatId,
    fromMe: params.fromMe,
    senderName: params.fromMe
      ? activeUser.name
      : params.participantSender || displayName,
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
    const mergedMessages = [...existing.messages, newMsg].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
    const latestMsg = mergedMessages[mergedMessages.length - 1] || newMsg;
    targetConv = {
      ...existing,
      isGroup,
      contactName:
        existing.contactName &&
        !existing.contactName.startsWith('+') &&
        existing.contactName !== 'WhatsApp Group'
          ? existing.contactName
          : displayName,
      company: params.company || existing.company,
      unreadCount: params.fromMe ? existing.unreadCount : existing.unreadCount + 1,
      lastMessageText: latestMsg.text,
      lastMessageAt: latestMsg.timestamp,
      messages: mergedMessages,
    };
    nextList = [targetConv, ...current.filter((_, idx) => idx !== existingIdx)];
  } else {
    targetConv = {
      id: chatId,
      ownerUserId: activeUser.id,
      isGroup,
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

function mergeServerSyncData(data: {
  incomingMessages?: any[];
  syncedChats?: any[];
}): { newMessagesCount: number; syncedChatsCount: number } {
  const activeUser = getActiveMailUser();
  const userId = activeUser.id;
  const myPhoneDigits = normalizePhoneDigits(getWaConfig(userId).connectedPhone);

  const currentConvs = getWaConversations(userId);
  const convMap = new Map<string, WaConversation>();
  for (const conv of currentConvs) {
    if (conv && conv.id && isValidChatIdentifier(conv.id, conv.isGroup)) {
      convMap.set(conv.id, conv);
    }
  }

  let convsChanged = false;

  // 1. Sync actual Direct Chats & WhatsApp Groups from server
  if (Array.isArray(data.syncedChats)) {
    for (const ch of data.syncedChats) {
      const isGroup = Boolean(ch?.isGroup || isGroupChatId(ch?.id || ch?.jid || ''));
      const chatId = isGroup
        ? `${String(ch?.id || ch?.jid).split('@')[0]}@g.us`
        : normalizePhoneDigits(ch?.id || ch?.phone || '');
      if (!chatId || !isValidChatIdentifier(chatId, isGroup)) continue;
      if (!isGroup && myPhoneDigits && chatId === myPhoneDigits) continue;

      const displayPhone = isGroup
        ? ch?.phone || 'WhatsApp Group'
        : formatDisplayPhone(chatId);
      const rawChatName = String(ch?.name || '').trim();
      const bestName =
        rawChatName && !rawChatName.startsWith('+')
          ? rawChatName
          : isGroup
          ? 'WhatsApp Group'
          : `+${chatId}`;

      const existing = convMap.get(chatId);
      if (!existing) {
        convMap.set(chatId, {
          id: chatId,
          ownerUserId: userId,
          isGroup,
          contactName: bestName,
          contactPhone: displayPhone,
          company: isGroup ? 'Group' : undefined,
          unreadCount: Number(ch?.unreadCount) > 0 ? Number(ch.unreadCount) : 0,
          pinned: false,
          lastMessageText: isGroup ? 'WhatsApp Group synced' : 'WhatsApp Chat synced',
          lastMessageAt: ch?.lastTimestamp || new Date().toISOString(),
          messages: [],
        });
        convsChanged = true;
      } else {
        if (existing.isGroup !== isGroup) {
          existing.isGroup = isGroup;
          convsChanged = true;
        }
        if (
          bestName &&
          !bestName.startsWith('+') &&
          bestName !== 'WhatsApp Group' &&
          (!existing.contactName ||
            existing.contactName.startsWith('+') ||
            existing.contactName === 'WhatsApp Group')
        ) {
          existing.contactName = bestName;
          convsChanged = true;
        }
        if (isGroup && ch?.phone && existing.contactPhone !== ch.phone) {
          existing.contactPhone = ch.phone;
          convsChanged = true;
        }
      }
    }
  }

  // 2. Sync Messages (Direct Chats & Group Messages)
  let addedMessages = 0;
  const liveNotificationsToFire: { name: string; phone: string; text: string; convId: string }[] = [];

  if (Array.isArray(data.incomingMessages) && data.incomingMessages.length > 0) {
    for (const m of data.incomingMessages) {
      const isGroup = Boolean(m?.isGroup || isGroupChatId(m?.chatId || m?.phone || ''));
      const chatId = isGroup
        ? `${String(m?.chatId || m?.phone).split('@')[0]}@g.us`
        : normalizePhoneDigits(m?.chatId || m?.phone || m?.contactPhone || '');
      const text = String(m?.text || m?.body || '').trim();
      if (!chatId || !text || !isValidChatIdentifier(chatId, isGroup)) continue;
      if (!isGroup && myPhoneDigits && chatId === myPhoneDigits) continue;

      const displayPhone = isGroup
        ? m?.contactPhone || 'WhatsApp Group'
        : formatDisplayPhone(chatId);
      const fromMe = Boolean(m?.fromMe);
      const isHistory = Boolean(m?.isHistory);
      const msgId = m?.id || `wa-live-${chatId}-${m?.timestamp || Date.now()}`;
      const tsIso = m?.timestamp || new Date().toISOString();

      const candidateName = String(m?.contactName || m?.pushName || '').trim();
      const bestName =
        candidateName && !candidateName.startsWith('+')
          ? candidateName
          : isGroup
          ? 'WhatsApp Group'
          : `+${chatId}`;

      let conv = convMap.get(chatId);
      if (!conv) {
        conv = {
          id: chatId,
          ownerUserId: userId,
          isGroup,
          contactName: bestName,
          contactPhone: displayPhone,
          company: isGroup ? 'Group' : undefined,
          unreadCount: 0,
          pinned: false,
          lastMessageText: text,
          lastMessageAt: tsIso,
          messages: [],
        };
        convMap.set(chatId, conv);
        convsChanged = true;
      } else if (
        bestName &&
        !bestName.startsWith('+') &&
        bestName !== 'WhatsApp Group' &&
        (!conv.contactName ||
          conv.contactName.startsWith('+') ||
          conv.contactName === 'WhatsApp Group')
      ) {
        conv.contactName = bestName;
        convsChanged = true;
      }

      if (conv.messages.some((existingMsg) => existingMsg.id === msgId)) {
        continue;
      }

      const senderLabel = fromMe
        ? activeUser.name
        : isGroup
        ? m?.participantSender || 'Group Member'
        : conv.contactName;

      const newMsg: WaChatMessage = {
        id: msgId,
        chatId,
        fromMe,
        senderName: senderLabel,
        senderPhone: fromMe ? getWaConfig(userId).connectedPhone : displayPhone,
        text,
        timestamp: tsIso,
        status: fromMe ? 'delivered' : 'received',
        via: m?.via === 'meta_cloud_api' ? 'Meta Cloud API' : 'Live WhatsApp',
      };

      conv.messages.push(newMsg);
      if (!fromMe && !isHistory) {
        conv.unreadCount = (conv.unreadCount || 0) + 1;
        liveNotificationsToFire.push({
          name: conv.contactName,
          phone: conv.contactPhone,
          text: isGroup && m?.participantSender ? `${m.participantSender}: ${text}` : text,
          convId: conv.id,
        });
      }

      addedMessages++;
      convsChanged = true;
    }
  }

  if (convsChanged) {
    const allConvs = Array.from(convMap.values()).map((conv) => {
      if (conv.messages.length > 0) {
        conv.messages.sort(
          (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        );
        const latest = conv.messages[conv.messages.length - 1];
        conv.lastMessageText =
          conv.isGroup && !latest.fromMe && latest.senderName
            ? `${latest.senderName}: ${latest.text}`
            : latest.text;
        conv.lastMessageAt = latest.timestamp;
      }
      return conv;
    });

    allConvs.sort(
      (a, b) => new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
    );
    saveWaConversations(allConvs, userId);
  }

  for (const alert of liveNotificationsToFire.slice(0, 3)) {
    addNotification({
      title: `New WhatsApp from ${alert.name}`,
      subtitle: `${alert.text.slice(0, 90)} · ${alert.phone}`,
      type: 'lead',
      read: false,
      targetNav: 'WhatsApp',
      targetId: alert.convId,
      owner: activeUser.name,
      recipient: activeUser.name,
      priority: 'high',
    });
  }

  return {
    newMessagesCount: addedMessages,
    syncedChatsCount: convMap.size,
  };
}

export async function startWaQrSession(forceReset = false): Promise<{
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
      body: JSON.stringify({ userId: activeUser.id, forceReset }),
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

export async function pollWaSessionStatus(fullSync = false): Promise<{
  ok: boolean;
  status: 'disconnected' | 'connecting' | 'qr_ready' | 'connected';
  qrDataUrl?: string;
  phoneNumber?: string;
  pushName?: string;
  newMessagesCount: number;
  syncedChatsCount: number;
}> {
  const activeUser = getActiveMailUser();
  try {
    const res = await fetch(
      `/api/whatsapp/status?userId=${encodeURIComponent(activeUser.id)}${fullSync ? '&full=1' : ''}`,
      { cache: 'no-store' }
    );
    const data = await res.json().catch(() => null);
    if (!res.ok || !data) {
      return { ok: false, status: 'disconnected', newMessagesCount: 0, syncedChatsCount: 0 };
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

      const { newMessagesCount, syncedChatsCount } = mergeServerSyncData({
        incomingMessages: data.incomingMessages,
        syncedChats: data.syncedChats,
      });

      return {
        ok: true,
        status: 'connected',
        qrDataUrl: data.qrDataUrl,
        phoneNumber: data.phoneNumber,
        pushName: data.pushName,
        newMessagesCount,
        syncedChatsCount,
      };
    }

    // Not connected via QR: if Meta Cloud API is not configured, ensure stale synced chats/groups are cleared
    const currentCfg = getWaConfig(activeUser.id);
    if (currentCfg.qrConnected) {
      saveWaConfig({ qrConnected: false, connectedPhone: '', connectedName: '' }, activeUser.id);
    }
    const isMetaActive = Boolean(
      currentCfg.mode === 'meta_api' &&
        currentCfg.metaPhoneNumberId.trim() &&
        currentCfg.metaAccessToken.trim()
    );
    if (!isMetaActive && getWaConversations(activeUser.id).length > 0) {
      saveWaConversations([], activeUser.id);
    }

    const mappedStatus =
      data.status === 'qr_pending' && data.qrDataUrl ? 'qr_ready' : data.status || 'disconnected';

    return {
      ok: true,
      status: mappedStatus,
      qrDataUrl: data.qrDataUrl,
      phoneNumber: data.phoneNumber,
      pushName: data.pushName,
      newMessagesCount: 0,
      syncedChatsCount: 0,
    };
  } catch {
    return { ok: false, status: 'disconnected', newMessagesCount: 0, syncedChatsCount: 0 };
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
  saveWaConversations([], activeUser.id);
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(getWaChatsKey(activeUser.id));
    }
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
  isGroup?: boolean;
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
  const isGroup = Boolean(params.isGroup || isGroupChatId(params.toPhone));
  const targetId = isGroup
    ? `${String(params.toPhone).split('@')[0]}@g.us`
    : normalizePhoneDigits(params.toPhone);
  const text = (params.text || '').trim();
  const allowFallback = !isGroup && targetId.length <= 13 && params.allowWebFallback !== false;

  if (!targetId || !text) {
    return {
      ok: false,
      realDelivered: false,
      via: 'Live WhatsApp',
      message: 'Valid recipient phone number / group and message text are required.',
    };
  }

  try {
    const res = await fetch('/api/whatsapp/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: activeUser.id,
        toPhone: targetId,
        text,
        metaConfig:
          !isGroup &&
          config.mode === 'meta_api' &&
          config.metaPhoneNumberId &&
          config.metaAccessToken
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
        data.via === 'meta_cloud_api' ? 'Meta Cloud API' : 'Live WhatsApp';
      upsertWaMessage(
        {
          contactPhone: targetId,
          contactName: params.contactName,
          company: params.company,
          isGroup,
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
        message: `WhatsApp message delivered directly to ${
          params.contactName || formatDisplayPhone(targetId, isGroup)
        } via ${viaMode}!`,
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

  // Fallback for 1-on-1 phone chats: Open WhatsApp Web / App with pre-filled message
  const waUrl = `https://wa.me/${targetId}?text=${encodeURIComponent(text)}`;
  window.open(waUrl, '_blank', 'noopener,noreferrer');

  upsertWaMessage(
    {
      contactPhone: targetId,
      contactName: params.contactName,
      company: params.company,
      isGroup: false,
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
    message: `Opened WhatsApp Web for ${formatDisplayPhone(targetId)}. Link your WhatsApp via QR Scan in WhatsApp Messenger for 1-click in-app sending!`,
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
