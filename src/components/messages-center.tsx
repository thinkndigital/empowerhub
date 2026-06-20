'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { Send, PlusCircle, ArrowRight, MessageSquare, Search, Users } from 'lucide-react';

const ROLE_LABELS: Record<string, string> = {
  beneficiary: 'مستفيد',
  mentor: 'مرشد',
  coach: 'مدرب',
  organization: 'مدير جهة',
  admin: 'مشرف',
};

interface Contact {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
}

interface OtherUser {
  id: string;
  name: string;
  role: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastUpdated: string;
  unreadCount: number;
  otherUser: OtherUser;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface MessagesCenterProps {
  title?: string;
}

export default function MessagesCenter({ title = 'الرسائل' }: MessagesCenterProps) {
  const { user } = useUser();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [contactSearch, setContactSearch] = useState('');
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const convIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const msgIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const getToken = useCallback(async () => {
    if (!user) return null;
    return user.getIdToken();
  }, [user]);

  const fetchConversations = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/messages', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch { /* silent */ } finally {
      setLoadingConvs(false);
    }
  }, [getToken]);

  const fetchContacts = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/messages/contacts', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setContacts(data.contacts || []);
      }
    } catch { /* silent */ }
  }, [getToken]);

  const fetchMessages = useCallback(async (convId: string) => {
    const token = await getToken();
    if (!token) return;
    setLoadingMsgs(true);
    try {
      const res = await fetch(`/api/messages/${convId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch { /* silent */ } finally {
      setLoadingMsgs(false);
    }
  }, [getToken]);

  // Initial load
  useEffect(() => {
    fetchConversations();
    fetchContacts();
  }, [fetchConversations, fetchContacts]);

  // Poll conversations every 8s
  useEffect(() => {
    convIntervalRef.current = setInterval(fetchConversations, 8000);
    return () => { if (convIntervalRef.current) clearInterval(convIntervalRef.current); };
  }, [fetchConversations]);

  // Poll messages for selected conversation every 5s
  useEffect(() => {
    if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    if (!selectedConv) return;
    fetchMessages(selectedConv.id);
    msgIntervalRef.current = setInterval(() => fetchMessages(selectedConv.id), 5000);
    return () => { if (msgIntervalRef.current) clearInterval(msgIntervalRef.current); };
  }, [selectedConv, fetchMessages]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const selectConversation = (conv: Conversation) => {
    setSelectedConv(conv);
    setMobileView('chat');
    setConversations(prev => prev.map(c => c.id === conv.id ? { ...c, unreadCount: 0 } : c));
  };

  const startNewConversation = async (contact: Contact) => {
    setShowNewChat(false);
    setContactSearch('');
    const token = await getToken();
    if (!token) return;

    // Check if conversation already exists
    const existing = conversations.find(c => c.otherUser.id === contact.id);
    if (existing) {
      selectConversation(existing);
      return;
    }

    // Send an empty placeholder to create the conversation
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: contact.id, content: '' }),
      });
      if (res.ok) {
        await fetchConversations();
        setTimeout(async () => {
          const updated = conversations.find(c => c.otherUser.id === contact.id)
            || { id: (await res.json()).conversationId, participants: [], lastMessage: '', lastUpdated: '', unreadCount: 0, otherUser: contact };
          setSelectedConv(updated as Conversation);
          setMobileView('chat');
          await fetchMessages((updated as Conversation).id);
        }, 300);
      }
    } catch { /* silent */ }
  };

  const sendMessage = async () => {
    if (!selectedConv || !newMessage.trim()) return;
    setSending(true);
    const token = await getToken();
    if (!token) { setSending(false); return; }
    const text = newMessage.trim();
    setNewMessage('');
    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: selectedConv.otherUser.id, content: text }),
      });
      if (res.ok) {
        await fetchMessages(selectedConv.id);
        await fetchConversations();
      } else {
        setNewMessage(text);
      }
    } catch {
      setNewMessage(text);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const filteredContacts = contacts.filter(c =>
    c.name.toLowerCase().includes(contactSearch.toLowerCase()) ||
    c.roleLabel.includes(contactSearch)
  );

  const groupedContacts = filteredContacts.reduce<Record<string, Contact[]>>((acc, c) => {
    const label = c.roleLabel || c.role;
    if (!acc[label]) acc[label] = [];
    acc[label].push(c);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-4 h-[calc(100vh-120px)] min-h-[500px]" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Button onClick={() => setShowNewChat(true)} size="sm" className="gap-2">
          <PlusCircle className="h-4 w-4" />
          رسالة جديدة
        </Button>
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* ── Conversations Panel ── */}
        <Card className={`w-full md:w-72 lg:w-80 flex-shrink-0 flex flex-col overflow-hidden ${mobileView === 'chat' ? 'hidden md:flex' : 'flex'}`}>
          <CardHeader className="py-3 px-4 border-b">
            <CardTitle className="text-base">المحادثات</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {loadingConvs ? (
                <div className="p-3 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full flex-shrink-0" />
                      <div className="space-y-1 flex-1">
                        <Skeleton className="h-3 w-24" />
                        <Skeleton className="h-3 w-32" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : conversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-2">
                  <MessageSquare className="h-8 w-8 opacity-40" />
                  <p className="text-sm">لا توجد محادثات</p>
                  <Button variant="outline" size="sm" onClick={() => setShowNewChat(true)} className="mt-1 text-xs gap-1">
                    <PlusCircle className="h-3 w-3" />
                    ابدأ محادثة
                  </Button>
                </div>
              ) : (
                conversations.map(conv => (
                  <button
                    key={conv.id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full flex items-center gap-3 p-3 hover:bg-accent/50 transition-colors border-b text-right ${selectedConv?.id === conv.id ? 'bg-accent' : ''}`}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                        {conv.otherUser.name?.charAt(0) || '؟'}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-medium text-sm truncate">{conv.otherUser.name}</span>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="h-5 min-w-5 flex items-center justify-center p-0 px-1 text-xs flex-shrink-0">
                            {conv.unreadCount > 9 ? '9+' : conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {ROLE_LABELS[conv.otherUser.role] || conv.otherUser.role}
                      </p>
                      {conv.lastMessage && (
                        <p className="text-xs text-muted-foreground truncate mt-0.5">{conv.lastMessage}</p>
                      )}
                    </div>
                  </button>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        {/* ── Chat Panel ── */}
        <Card className={`flex-1 flex flex-col overflow-hidden ${mobileView === 'list' ? 'hidden md:flex' : 'flex'}`}>
          {selectedConv ? (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 p-4 border-b flex-shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden h-8 w-8 flex-shrink-0"
                  onClick={() => setMobileView('list')}
                >
                  <ArrowRight className="h-4 w-4" />
                </Button>
                <Avatar className="h-9 w-9 flex-shrink-0">
                  <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                    {selectedConv.otherUser.name?.charAt(0) || '؟'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-sm">{selectedConv.otherUser.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[selectedConv.otherUser.role] || selectedConv.otherUser.role}
                  </p>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                {loadingMsgs ? (
                  <div className="space-y-3">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`flex ${i % 2 === 0 ? 'justify-start' : 'justify-end'}`}>
                        <Skeleton className="h-10 w-40 rounded-lg" />
                      </div>
                    ))}
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-2">
                    <MessageSquare className="h-8 w-8 opacity-30" />
                    <p className="text-sm">ابدأ المحادثة بإرسال رسالة</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {messages.map(msg => {
                      const isOwn = msg.senderId === user?.uid;
                      if (!msg.content) return null;
                      return (
                        <div key={msg.id} className={`flex ${isOwn ? 'justify-start' : 'justify-end'}`}>
                          <div className={`max-w-[72%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'} text-left`}>
                              {(() => {
                                try { return new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }); }
                                catch { return ''; }
                              })()}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </ScrollArea>

              {/* Input */}
              <div className="p-3 border-t flex gap-2 flex-shrink-0 bg-background">
                <Button size="icon" onClick={sendMessage} disabled={sending || !newMessage.trim()} className="flex-shrink-0">
                  <Send className="h-4 w-4" />
                </Button>
                <Input
                  value={newMessage}
                  onChange={e => setNewMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="اكتب رسالتك..."
                  className="flex-1"
                  disabled={sending}
                  autoComplete="off"
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-3">
              <MessageSquare className="h-12 w-12 opacity-20" />
              <p className="text-sm">اختر محادثة أو ابدأ محادثة جديدة</p>
              <Button variant="outline" size="sm" onClick={() => setShowNewChat(true)} className="gap-2">
                <PlusCircle className="h-4 w-4" />
                رسالة جديدة
              </Button>
            </div>
          )}
        </Card>
      </div>

      {/* ── New Conversation Dialog ── */}
      <Dialog open={showNewChat} onOpenChange={v => { setShowNewChat(v); if (!v) setContactSearch(''); }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              اختر جهة الاتصال
            </DialogTitle>
          </DialogHeader>

          <div className="relative mt-1">
            <Search className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={contactSearch}
              onChange={e => setContactSearch(e.target.value)}
              placeholder="ابحث بالاسم أو الدور..."
              className="pr-9"
            />
          </div>

          <ScrollArea className="max-h-96 mt-2">
            {Object.keys(groupedContacts).length === 0 ? (
              <p className="text-center text-muted-foreground py-8 text-sm">
                {contacts.length === 0 ? 'لا يوجد أعضاء للتواصل معهم بعد' : 'لا نتائج'}
              </p>
            ) : (
              <div className="space-y-4 px-1">
                {Object.entries(groupedContacts).map(([label, members]) => (
                  <div key={label}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">{label}</p>
                    <div className="space-y-1">
                      {members.map(contact => (
                        <button
                          key={contact.id}
                          onClick={() => startNewConversation(contact)}
                          className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-accent transition-colors text-right border border-transparent hover:border-border"
                        >
                          <Avatar className="h-9 w-9 flex-shrink-0">
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                              {contact.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">{contact.name}</p>
                            <p className="text-xs text-muted-foreground">{contact.roleLabel}</p>
                          </div>
                          {conversations.some(c => c.otherUser.id === contact.id) && (
                            <Badge variant="secondary" className="text-xs flex-shrink-0">محادثة موجودة</Badge>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
