import React, { useState, useEffect, useRef } from "react";
import { Mail, MessageCircle, MessageSquare, Hash, MoreHorizontal, Archive, CheckCircle2, CornerUpLeft, Search, Sparkles, Send, Mic, Paperclip, Users } from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../contexts/AuthContext";

// ── Platform config ────────────────────────────────────────────────────────────
const PLATFORMS = [
  {
    id: "all",
    label: "All",
    icon: null,
    color: null,
  },
  {
    id: "whatsapp",
    label: "WhatsApp",
    color: "#25D366",
    icon: ({ size = 11 }) => <MessageCircle size={size} color="#25D366" fill="#25D366" />,
  },
  {
    id: "gmail",
    label: "Gmail",
    color: "#EA4335",
    icon: ({ size = 11 }) => <Mail size={size} color="#EA4335" fill="#EA4335" />,
  },
  {
    id: "slack",
    label: "Slack",
    color: "#7B68EE",
    icon: ({ size = 11 }) => (
      <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
        <path d="M5.8 14.4a2.4 2.4 0 1 1-2.4-2.4H5.8v2.4zm1.2 0a2.4 2.4 0 0 1 4.8 0v6a2.4 2.4 0 0 1-4.8 0v-6zm2.4-8.6a2.4 2.4 0 1 1 2.4-2.4V8H9.4zm0 1.2a2.4 2.4 0 0 1 0 4.8H3.6a2.4 2.4 0 0 1 0-4.8h5.8zm8.6 2.4a2.4 2.4 0 1 1 2.4 2.4H18.2V9.4zm-1.2 0a2.4 2.4 0 0 1-4.8 0V3.6a2.4 2.4 0 0 1 4.8 0V9.4zm-2.4 8.6a2.4 2.4 0 1 1-2.4 2.4V18h2.4zm0-1.2a2.4 2.4 0 0 1 0-4.8h5.8a2.4 2.4 0 0 1 0 4.8h-5.8z" fill="#7B68EE"/>
      </svg>
    ),
  },
  {
    id: "imessage",
    label: "iMessage",
    color: "#34AADC",
    icon: ({ size = 11 }) => <MessageSquare size={size} color="#34AADC" fill="#34AADC" />,
  },
];

// ── Threads (DMs) ──────────────────────────────────────────────────────────────
const INITIAL_THREADS = [
  {
    id: 1, type: "dm", platform: "whatsapp",
    sender: "Alice Freeman", avatar: "A", color: "#25D366",
    snippet: "That proposal looks great. Should we sync tomorrow?", time: "10:42 AM", unread: true,
    messages: [
      { id: 101, from: "Alice", text: "Hey! Did you get a chance to look over the new pricing proposal?", time: "10:30 AM" },
      { id: 102, from: "Me", text: "Yes! Currently reviewing it with the team. Looks promising so far.", time: "10:35 AM" },
      { id: 103, from: "Alice", text: "That proposal looks great. Should we sync tomorrow?", time: "10:42 AM" },
    ],
  },
  {
    id: 2, type: "dm", platform: "gmail",
    sender: "Bobby Tables", subject: "RE: Q3 Marketing Budget", avatar: "B", color: "#EA4335",
    snippet: "I've attached the revised budget constraints for next quarter...", time: "Yesterday", unread: false,
    messages: [
      { id: 201, from: "Bobby", text: "Hi,\n\nI've attached the revised budget constraints for next quarter. Let me know if we need to adjust the Facebook ad spend.\n\nBest,\nBobby", time: "Yesterday, 4:15 PM" },
    ],
  },
  {
    id: 3, type: "dm", platform: "imessage",
    sender: "Carolina Herr", avatar: "C", color: "#34AADC",
    snippet: "Perfect. Send me the coordinates.", time: "Tuesday", unread: false,
    messages: [
      { id: 301, from: "Carolina", text: "Are we still on for the site visit?", time: "Tuesday, 9:00 AM" },
      { id: 302, from: "Me", text: "Yes, definitely! I'll be there at 2PM.", time: "Tuesday, 9:05 AM" },
      { id: 303, from: "Carolina", text: "Perfect. Send me the coordinates.", time: "Tuesday, 9:10 AM" },
    ],
  },
  {
    id: 4, type: "dm", platform: "gmail",
    sender: "David Kim", subject: "Project Phoenix Launch", avatar: "D", color: "#EA4335",
    snippet: "Staging is fully deployed and migration is complete.", time: "Mon", unread: true,
    messages: [
      { id: 401, from: "David Kim", text: "Hi,\n\nJust confirming that the staging environment is fully deployed and the migration is complete. We are ready for UAT.\n\nThanks,\nDavid", time: "Monday, 11:20 AM" },
    ],
  },
  {
    id: 5, type: "dm", platform: "slack",
    sender: "Emma Wright", avatar: "E", color: "#7B68EE",
    snippet: "Can you review the new onboarding flow before EOD?", time: "Mon", unread: false,
    messages: [
      { id: 501, from: "Emma Wright", text: "Hey! Can you review the new onboarding flow before EOD? Added some nice micro-animations.", time: "Monday, 2:30 PM" },
      { id: 502, from: "Me", text: "On it — will send feedback by 5.", time: "Monday, 2:45 PM" },
    ],
  },
];

// ── Channels (team group chats) ────────────────────────────────────────────────
const INITIAL_CHANNELS = [
  {
    id: 101, type: "channel",
    name: "general", color: "#5AC8FA",
    members: ["A", "B", "C", "D", "E"], memberCount: 12,
    snippet: "Bobby: Q3 targets are ahead of schedule 📈", time: "11:30 AM", unread: 4,
    messages: [
      { id: 1001, from: "Alice", avatar: "A", color: "#AF52DE", text: "Morning everyone! Just sent over the client deck for review.", time: "9:15 AM" },
      { id: 1002, from: "Bobby", avatar: "B", color: "#EA4335", text: "Thanks Alice. The new case study section looks really sharp.", time: "10:00 AM" },
      { id: 1003, from: "Emma", avatar: "E", color: "#7B68EE", text: "Agreed. Clients are going to love the before/after section.", time: "10:45 AM" },
      { id: 1004, from: "Bobby", avatar: "B", color: "#EA4335", text: "Q3 targets are ahead of schedule 📈", time: "11:30 AM" },
    ],
  },
  {
    id: 102, type: "channel",
    name: "design", color: "#FF6259",
    members: ["A", "C", "E"], memberCount: 4,
    snippet: "Emma: Just pushed the new card designs 🎨", time: "10:20 AM", unread: 0,
    messages: [
      { id: 1011, from: "Emma", avatar: "E", color: "#7B68EE", text: "Just pushed the new card designs 🎨 — check Figma for the updated components.", time: "10:05 AM" },
      { id: 1012, from: "Alice", avatar: "A", color: "#AF52DE", text: "Love the gradient treatment on the stats cards. Very clean.", time: "10:15 AM" },
      { id: 1013, from: "Me", avatar: "M", color: "#34C759", text: "Merging this into main after QA signs off.", time: "10:20 AM" },
    ],
  },
  {
    id: 103, type: "channel",
    name: "sales", color: "#FFB340",
    members: ["B", "D"], memberCount: 6,
    snippet: "David: Proposal sent to Meridian Group ✓", time: "Yesterday", unread: 1,
    messages: [
      { id: 1021, from: "David Kim", avatar: "D", color: "#EA4335", text: "Proposal sent to Meridian Group ✓ — they want a call next Thursday.", time: "Yesterday, 3:40 PM" },
      { id: 1022, from: "Bobby", avatar: "B", color: "#EA4335", text: "Great work. I'll prep the pricing deck for the call.", time: "Yesterday, 4:00 PM" },
    ],
  },
];

// ── Platform icon helper ───────────────────────────────────────────────────────
const PlatformIcon = ({ platformId, size = 11 }) => {
  const p = PLATFORMS.find(p => p.id === platformId);
  if (!p?.icon) return null;
  const Icon = p.icon;
  return <Icon size={size} />;
};

export default function MessagesView({ t, dark, mobile, compact }) {
  const { user } = useAuth();
  const [activePlatform, setActivePlatform]   = useState("all");
  const [threads, setThreads]                 = useState(INITIAL_THREADS);
  const [channels, setChannels]               = useState(INITIAL_CHANNELS);
  const [activeThreadId, setActiveThreadId]   = useState(INITIAL_THREADS[0].id);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [messageText, setMessageText]         = useState('');
  const subscriptionRef                       = useRef(null);

  // ── Load WhatsApp threads from Supabase + realtime subscription ──────────
  useEffect(() => {
    if (!user) return;

    const loadWAThreads = async () => {
      // Get all WhatsApp channels for this user
      const { data: waChannels } = await supabase
        .from('channels')
        .select('id, name, external_phone, created_at')
        .eq('user_id', user.id)
        .eq('platform', 'whatsapp')
        .order('created_at', { ascending: false });

      if (!waChannels?.length) return;

      // Get latest message per channel
      const channelIds = waChannels.map(c => c.id);
      const { data: waMsgs } = await supabase
        .from('messages')
        .select('channel_id, content, sender_name, created_at')
        .in('channel_id', channelIds)
        .order('created_at', { ascending: false });

      // Build thread objects matching INITIAL_THREADS shape
      const waThreads = waChannels.map(ch => {
        const latestMsg = waMsgs?.find(m => m.channel_id === ch.id);
        const phone = ch.external_phone || ch.name;
        return {
          id:        `wa-${ch.id}`,
          _channelId: ch.id,
          type:      'dm',
          platform:  'whatsapp',
          sender:    phone,
          avatar:    phone.slice(-2),
          color:     '#25D366',
          snippet:   latestMsg?.content || 'New WhatsApp conversation',
          time:      latestMsg ? new Date(latestMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          unread:    true,
          messages:  [],  // loaded on demand below
          _loaded:   false,
        };
      });

      setThreads(prev => {
        // Remove stale WA threads, prepend fresh ones
        const non_wa = prev.filter(th => !String(th.id).startsWith('wa-'));
        return [...waThreads, ...non_wa];
      });
    };

    loadWAThreads();

    // Realtime: new messages on any of the user's WA channels
    const channel = supabase.channel('wa-messages')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `user_id=eq.${user.id}`,
      }, (payload) => {
        const msg = payload.new;
        if (msg.platform !== 'whatsapp') return;

        const newMsgObj = {
          id:   msg.id,
          from: msg.sender_name || msg.sender_phone,
          text: msg.content,
          time: new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        };

        setThreads(prev => prev.map(th => {
          if (th._channelId !== msg.channel_id) return th;
          return {
            ...th,
            snippet:  msg.content,
            time:     newMsgObj.time,
            unread:   true,
            messages: [...(th.messages || []), newMsgObj],
          };
        }));
      })
      .subscribe();

    subscriptionRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  // ── Load messages for a WA thread when opened ────────────────────────────
  const loadWAMessages = async (thread) => {
    if (!thread._channelId || thread._loaded) return;
    const { data: msgs } = await supabase
      .from('messages')
      .select('id, content, sender_name, sender_phone, created_at')
      .eq('channel_id', thread._channelId)
      .order('created_at', { ascending: true });

    if (!msgs) return;
    const formatted = msgs.map(m => ({
      id:   m.id,
      from: m.sender_name || m.sender_phone,
      text: m.content,
      time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    }));

    setThreads(prev => prev.map(th =>
      th.id === thread.id ? { ...th, messages: formatted, _loaded: true, unread: false } : th
    ));
  };

  const ease = "all 0.2s cubic-bezier(.4,0,.2,1)";
  const card = `1px solid ${t.cardBorder}`;

  const filteredThreads = activePlatform === "all"
    ? threads
    : threads.filter(th => th.platform === activePlatform);

  // Resolve what's currently open
  const activeThread  = activeThreadId  ? threads.find(th => th.id === activeThreadId)   : null;
  const activeChannel = activeChannelId ? channels.find(ch => ch.id === activeChannelId) : null;
  const activePaneItem = activeChannel || activeThread;

  const selectThread = (id) => {
    setActiveThreadId(id);
    setActiveChannelId(null);
    const th = threads.find(t => t.id === id);
    if (th?._channelId && !th._loaded) loadWAMessages(th);
  };
  const selectChannel = (id) => { setActiveChannelId(id); setActiveThreadId(null); };

  const aiSuggestion = activeThread?.platform === "whatsapp"
    ? "Sounds good Alice. Let's sync tomorrow at 10 AM."
    : activeThread?.platform === "gmail"
    ? "Hi Bobby, thanks for sending this over. I'll review the Facebook ad spend and get back to you by EOD."
    : "On it — will get back to you shortly.";

  const handleSendMessage = () => {
    if (!messageText.trim() || !activePaneItem) return;
    
    const newMsg = {
      id: Date.now(),
      from: "Me",
      text: messageText,
      time: "Just now",
      color: "#34C759"
    };

    if (activeThreadId) {
      setThreads(prev => prev.map(th => th.id === activeThreadId ? { ...th, messages: [...th.messages, newMsg], unread: false } : th));
    } else if (activeChannelId) {
      setChannels(prev => prev.map(ch => ch.id === activeChannelId ? { ...ch, messages: [...ch.messages, newMsg] } : ch));
    }
    
    setMessageText('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleSendMessage();
  };

  return (
    <div style={{ display: "flex", width: "100%", height: "100%", gap: 12, overflow: "hidden", animation: "fadeUp 0.4s ease backwards" }}>

      {/* ── LEFT PANE: Unified Inbox ──────────────────────────────────────── */}
      <div style={{
        width: mobile ? "100%" : compact ? 280 : 320,
        flexShrink: 0,
        display: mobile && activePaneItem ? "none" : "flex",
        flexDirection: "column",
        background: t.card, border: card, borderRadius: 20,
        boxShadow: t.cardShadow, backdropFilter: "blur(24px) saturate(1.6)",
        overflow: "hidden",
      }}>
        {/* Header */}
        <div style={{ padding: "18px 18px 12px", borderBottom: `1px solid ${t.divider}` }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h2 style={{ fontSize: 19, fontWeight: 700, letterSpacing: -0.5, color: t.text }}>Inbox</h2>
            <button style={{ width: 28, height: 28, borderRadius: "50%", background: t.input, border: "none", color: t.sub, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
              <CheckCircle2 size={14} />
            </button>
          </div>

          {/* Search */}
          <div style={{ display: "flex", alignItems: "center", gap: 8, background: t.input, border: `1px solid ${t.inputBorder}`, padding: "7px 12px", borderRadius: 12, color: t.sub, marginBottom: 12 }}>
            <Search size={14} />
            <input placeholder="Search…" style={{ border: "none", background: "transparent", color: t.text, fontSize: 13, outline: "none", width: "100%" }} />
          </div>

          {/* Platform filter pills */}
          <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 2 }}>
            {PLATFORMS.map(p => {
              const active = activePlatform === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => setActivePlatform(p.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    padding: "4px 10px", borderRadius: 20, border: "none",
                    background: active
                      ? (p.color ? `${p.color}22` : (dark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.08)"))
                      : (dark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)"),
                    color: active ? (p.color || t.text) : t.sub,
                    fontSize: 12, fontWeight: active ? 700 : 500,
                    cursor: "pointer", whiteSpace: "nowrap", flexShrink: 0,
                    outline: active && p.color ? `1.5px solid ${p.color}55` : "none",
                    transition: ease,
                  }}
                >
                  {p.icon && <p.icon size={11} />}
                  {p.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Thread list + Channels */}
        <div style={{ flex: 1, overflowY: "auto" }}>

          {/* DMs */}
          <div style={{ padding: "6px 0" }}>
            {filteredThreads.map(th => {
              const isActive = activeThreadId === th.id && !activeChannelId;
              const platDef = PLATFORMS.find(p => p.id === th.platform);
              return (
                <div key={th.id} onClick={() => selectThread(th.id)} style={{
                  padding: "12px 18px", cursor: "pointer", transition: ease,
                  background: isActive ? (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "transparent",
                  borderLeft: `3px solid ${isActive ? t.accent : "transparent"}`,
                  display: "flex", gap: 11, position: "relative",
                }}>
                  {/* Avatar + platform badge */}
                  <div style={{ position: "relative", width: 42, height: 42, flexShrink: 0 }}>
                    <div style={{ width: 42, height: 42, borderRadius: "50%", background: `linear-gradient(135deg, ${th.color}, ${th.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 15 }}>
                      {th.avatar}
                    </div>
                    <div style={{ position: "absolute", bottom: -2, right: -2, width: 17, height: 17, borderRadius: "50%", background: t.card, display: "flex", alignItems: "center", justifyContent: "center", border: `2px solid ${t.card}` }}>
                      {platDef?.icon && <platDef.icon size={10} />}
                    </div>
                  </div>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 2 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontSize: 13.5, fontWeight: th.unread ? 700 : 600, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{th.sender}</span>
                      <span style={{ fontSize: 10.5, color: th.unread ? t.accent : t.muted, fontWeight: th.unread ? 600 : 400, flexShrink: 0, marginLeft: 6 }}>{th.time}</span>
                    </div>
                    {th.subject && <div style={{ fontSize: 11.5, fontWeight: 600, color: t.text, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{th.subject}</div>}
                    <div style={{ fontSize: 12.5, color: th.unread ? t.text : t.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{th.snippet}</div>
                  </div>
                  {th.unread && <div style={{ position: "absolute", right: 18, top: "50%", transform: "translateY(-50%)", width: 7, height: 7, borderRadius: "50%", background: t.accent }} />}
                </div>
              );
            })}
          </div>

          <div style={{ padding: "10px 18px 6px", display: "flex", alignItems: "center", gap: 6, borderTop: `1px solid ${t.divider}` }}>
            <Users size={11} color={t.sub} />
            <span style={{ fontSize: 11, fontWeight: 700, color: t.sub, letterSpacing: "0.5px", textTransform: "uppercase" }}>Team Channels</span>
          </div>
          {channels.map(ch => {
            const isActive = activeChannelId === ch.id;
            return (
              <div key={ch.id} onClick={() => selectChannel(ch.id)} style={{
                padding: "10px 18px", cursor: "pointer", transition: ease,
                background: isActive ? (dark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)") : "transparent",
                borderLeft: `3px solid ${isActive ? ch.color : "transparent"}`,
                display: "flex", gap: 11, alignItems: "center",
              }}>
                {/* Channel icon */}
                <div style={{ width: 38, height: 38, borderRadius: 12, background: `${ch.color}22`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0, border: `1px solid ${ch.color}44` }}>
                  <Hash size={16} color={ch.color} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: 13.5, fontWeight: ch.unread ? 700 : 600, color: t.text }}>#{ch.name}</span>
                    <span style={{ fontSize: 10.5, color: ch.unread ? t.accent : t.muted, fontWeight: ch.unread ? 600 : 400, flexShrink: 0, marginLeft: 6 }}>{ch.time}</span>
                  </div>
                  <div style={{ fontSize: 12.5, color: ch.unread ? t.text : t.sub, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{ch.snippet}</div>
                </div>
                {ch.unread > 0 && (
                  <div style={{ minWidth: 18, height: 18, borderRadius: 9, background: ch.color, color: "#fff", fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", flexShrink: 0 }}>
                    {ch.unread}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ── RIGHT PANE: Thread / Channel View ────────────────────────────── */}
      {activePaneItem && (!mobile || activePaneItem) && (
        <div style={{
          flex: 1, display: "flex", flexDirection: "column",
          background: t.card, border: card, borderRadius: 20,
          boxShadow: t.cardShadow, backdropFilter: "blur(24px) saturate(1.6)",
          overflow: "hidden",
        }}>
          {/* Thread / Channel header */}
          <div style={{ padding: "14px 22px", borderBottom: `1px solid ${t.divider}`, display: "flex", justifyContent: "space-between", alignItems: "center", background: dark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.01)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {mobile && (
                <button onClick={() => { setActiveThreadId(null); setActiveChannelId(null); }} style={{ background: "transparent", border: "none", color: t.sub, padding: 0, cursor: "pointer" }}>
                  <CornerUpLeft size={17} />
                </button>
              )}
              {activeChannel ? (
                <>
                  <div style={{ width: 34, height: 34, borderRadius: 10, background: `${activeChannel.color}22`, display: "flex", alignItems: "center", justifyContent: "center", border: `1px solid ${activeChannel.color}44` }}>
                    <Hash size={16} color={activeChannel.color} />
                  </div>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>#{activeChannel.name}</span>
                    <div style={{ fontSize: 11, color: t.muted, marginTop: 1 }}>{activeChannel.memberCount} members</div>
                  </div>
                </>
              ) : activeThread && (
                <>
                  <div style={{ width: 34, height: 34, borderRadius: "50%", background: `linear-gradient(135deg, ${activeThread.color}, ${activeThread.color}88)`, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontWeight: 700, fontSize: 14 }}>
                    {activeThread.avatar}
                  </div>
                  <div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: t.text }}>{activeThread.sender}</span>
                    <div style={{ fontSize: 11, color: t.muted, marginTop: 1, display: "flex", alignItems: "center", gap: 4 }}>
                      via {PLATFORMS.find(p => p.id === activeThread.platform)?.label}
                      <PlatformIcon platformId={activeThread.platform} size={10} />
                    </div>
                  </div>
                </>
              )}
            </div>
            <div style={{ display: "flex", gap: 7 }}>
              {[Archive, MoreHorizontal].map((Icon, idx) => (
                <button key={idx} style={{ width: 30, height: 30, borderRadius: "50%", background: "transparent", border: `1px solid ${t.inputBorder}`, color: t.sub, display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}>
                  <Icon size={14} />
                </button>
              ))}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "22px", display: "flex", flexDirection: "column", gap: 14 }}>
            {activePaneItem.messages.map((msg) => {
              const isMe = msg.from === "Me";

              // Email style
              if (activeThread?.platform === "gmail") {
                return (
                  <div key={msg.id} style={{ display: "flex", flexDirection: "column", gap: 8, paddingBottom: 18, borderBottom: `1px solid ${t.divider}` }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: t.text, marginRight: 8 }}>{msg.from}</span>
                        <span style={{ fontSize: 12, color: t.sub }}>&lt;{msg.from.split(" ")[0].toLowerCase()}@domain.com&gt;</span>
                      </div>
                      <span style={{ fontSize: 11, color: t.muted }}>{msg.time}</span>
                    </div>
                    <div style={{ fontSize: 14, color: t.text, lineHeight: 1.6, whiteSpace: "pre-wrap", marginTop: 4 }}>{msg.text}</div>
                  </div>
                );
              }

              // Channel style — show sender name + colored avatar
              if (activeChannel) {
                return (
                  <div key={msg.id} style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
                    {!isMe && (
                      <div style={{ width: 30, height: 30, borderRadius: "50%", background: `${msg.color}33`, color: msg.color, fontWeight: 700, fontSize: 12, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                        {msg.avatar}
                      </div>
                    )}
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                      {!isMe && <span style={{ fontSize: 11.5, fontWeight: 700, color: msg.color, marginBottom: 3 }}>{msg.from}</span>}
                      <div style={{
                        maxWidth: "75%", padding: "10px 14px",
                        borderRadius: isMe ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                        background: isMe ? t.accentGrad : t.input,
                        color: isMe ? t.accentText : t.text,
                        fontSize: 13.5, lineHeight: 1.4,
                        boxShadow: isMe ? t.accentGlow : "none",
                      }}>
                        {msg.text}
                      </div>
                      <span style={{ fontSize: 10, color: t.muted, marginTop: 3, padding: "0 2px" }}>{msg.time}</span>
                    </div>
                  </div>
                );
              }

              // DM bubble style
              return (
                <div key={msg.id} style={{ display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                  <div style={{
                    maxWidth: "75%", padding: "11px 15px",
                    borderRadius: isMe ? "20px 20px 4px 20px" : "20px 20px 20px 4px",
                    background: isMe ? t.accentGrad : t.input,
                    color: isMe ? t.accentText : t.text,
                    fontSize: 14, lineHeight: 1.4,
                    boxShadow: isMe ? t.accentGlow : "0 2px 5px rgba(0,0,0,0.02)",
                  }}>
                    {msg.text}
                  </div>
                  <span style={{ fontSize: 10, color: t.muted, marginTop: 4, padding: "0 4px" }}>{msg.time}</span>
                </div>
              );
            })}
          </div>

          {/* AI draft + composer */}
          <div style={{ padding: "14px 22px", background: dark ? "rgba(255,255,255,0.015)" : "rgba(0,0,0,0.01)", borderTop: `1px solid ${t.divider}` }}>
            {!activeChannel && (
              <div style={{ display: "flex", alignItems: "flex-start", gap: 10, background: dark ? "rgba(204,253,1,0.08)" : "rgba(255,179,64,0.1)", border: `1px dashed ${dark ? "rgba(204,253,1,0.3)" : "rgba(255,179,64,0.4)"}`, padding: "11px 14px", borderRadius: 14, marginBottom: 12 }}>
                <Sparkles size={15} color={dark ? "#ccfd01" : "#FFB340"} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: dark ? "#ccfd01" : "#FFB340", textTransform: "uppercase", letterSpacing: 0.5, marginBottom: 3 }}>Kinso AI Draft</div>
                  <div style={{ fontSize: 13, color: t.text, lineHeight: 1.4 }}>"{aiSuggestion}"</div>
                </div>
                <button style={{ background: t.text, color: t.shell, border: "none", borderRadius: 10, padding: "5px 11px", fontSize: 12, fontWeight: 600, cursor: "pointer", flexShrink: 0 }}>Use</button>
              </div>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: 10, background: t.card, border: `1px solid ${t.inputBorder}`, padding: "7px 12px", borderRadius: 24 }}>
              <button style={{ background: "transparent", border: "none", color: t.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%" }}>
                <Paperclip size={15} />
              </button>
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={activeChannel ? `Message #${activeChannel.name}…` : activeThread?.platform === "gmail" ? "Reply via Gmail…" : `Message via ${PLATFORMS.find(p => p.id === activeThread?.platform)?.label}…`}
                style={{ flex: 1, border: "none", background: "transparent", color: t.text, fontSize: 14, outline: "none", padding: "0 4px" }}
              />
              <button style={{ background: "transparent", border: "none", color: t.sub, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 26, height: 26, borderRadius: "50%" }}>
                <Mic size={15} />
              </button>
              <button onClick={handleSendMessage} style={{ background: t.accentGrad, border: "none", color: t.accentText, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", width: 32, height: 32, borderRadius: "50%", boxShadow: t.accentGlow }}>
                <Send size={14} style={{ marginLeft: -1, marginTop: 2 }} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
