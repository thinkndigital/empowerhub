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
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Send, PlusCircle, ArrowRight, MessageSquare, Search, Users, Trash2, MoreVertical, Ban, ShieldOff } from 'lucide-react';

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
  const [blockedUsers, setBlockedUsers] = useState<string[]>([]);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const [showUnblockConfirm, setShowUnblockConfirm] = useState(false);
  const [hoveredMsgId, setHoveredMsgId] = useState<string | null>(null);
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

  const fetchBlockedUsers = useCallback(async () => {
    const token = await getToken();
    if (!token) return;
    try {
      const res = await fetch('/api/messages/block', { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setBlockedUsers(data.blockedUsers || []);
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

  useEffect(() => {
    fetchConversations();
    fetchContacts();
    fetchBlockedUsers();
  }, [fetchConversations, fetchContacts, fetchBlockedUsers]);

  useEffect(() => {
    convIntervalRef.current = setInterval(fetchConversations, 8000);
    return () => { if (convIntervalRef.current) clearInterval(convIntervalRef.current); };
  }, [fetchConversations]);

  useEffect(() => {
    if (msgIntervalRef.current) clearInterval(msgIntervalRef.current);
    if (!selectedConv) return;
    fetchMessages(selectedConv.id);
    msgIntervalRef.current = setInterval(() => fetchMessages(selectedConv.id), 5000);
    return () => { if (msgIntervalRef.current) clearInterval(msgIntervalRef.current); };
  }, [selectedConv, fetchMessages]);

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

    const existing = conversations.find(c => c.otherUser.id === contact.id);
    if (existing) {
      selectConversation(existing);
      return;
    }

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ toUserId: contact.id, content: '' }),
      });
      if (res.ok) {
        const { conversationId } = await res.json();
        const newConv: Conversation = {
          id: conversationId,
          participants: [],
          lastMessage: '',
          lastUpdated: new Date().toISOString(),
          unreadCount: 0,
          otherUser: { id: contact.id, name: contact.name, role: contact.role },
        };
        await fetchConversations();
        setSelectedConv(newConv);
        setMobileView('chat');
        await fetchMessages(conversationId);
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

  const deleteMessage = async (msgId: string) => {
    if (!selectedConv) return;
    const token = await getToken();
    if (!token) return;
    setMessages(prev => prev.filter(m => m.id !== msgId));
    setHoveredMsgId(null);
    try {
      await fetch(`/api/messages/${selectedConv.id}?msgId=${msgId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await fetchConversations();
    } catch { /* silent */ }
  };

  const blockUser = async () => {
    if (!selectedConv) return;
    const userId = selectedConv.otherUser.id;
    const token = await getToken();
    if (!token) return;
    setBlockedUsers(prev => [...prev, userId]);
    setShowBlockConfirm(false);
    try {
      await fetch('/api/messages/block', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      fetchContacts();
    } catch { /* silent */ }
  };

  const unblockUser = async () => {
    if (!selectedConv) return;
    const userId = selectedConv.otherUser.id;
    const token = await getToken();
    if (!token) return;
    setBlockedUsers(prev => prev.filter(id => id !== userId));
    setShowUnblockConfirm(false);
    try {
      await fetch('/api/messages/block', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      fetchContacts();
    } catch { /* silent */ }
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

  const isBlocked = selectedConv ? blockedUsers.includes(selectedConv.otherUser.id) : false;

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
                        {blockedUsers.includes(conv.otherUser.id) && (
                          <span className="mr-1 text-destructive">• محظور</span>
                        )}
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
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm">{selectedConv.otherUser.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {ROLE_LABELS[selectedConv.otherUser.role] || selectedConv.otherUser.role}
                    {isBlocked && <span className="mr-1 text-destructive font-medium">• محظور</span>}
                  </p>
                </div>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 flex-shrink-0">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start"><div dir="rtl">
                    {isBlocked ? (
                      <DropdownMenuItem
                        className="gap-2 text-green-600 focus:text-green-600"
                        onClick={() => setShowUnblockConfirm(true)}
                      >
                        <ShieldOff className="h-4 w-4" />
                        إلغاء الحظر
                      </DropdownMenuItem>
                    ) : (
                      <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          className="gap-2 text-destructive focus:text-destructive"
                          onClick={() => setShowBlockConfirm(true)}
                        >
                          <Ban className="h-4 w-4" />
                          حظر المستخدم
                        </DropdownMenuItem>
                      </>
                    )}
                  </div></DropdownMenuContent>
                </DropdownMenu>
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
                        <div
                          key={msg.id}
                          className={`flex items-end gap-1 ${isOwn ? 'justify-start' : 'justify-end'}`}
                          onMouseEnter={() => isOwn && setHoveredMsgId(msg.id)}
                          onMouseLeave={() => setHoveredMsgId(null)}
                        >
                          {/* Delete button for own messages — appears on hover */}
                          {isOwn && hoveredMsgId === msg.id && (
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-muted-foreground hover:text-destructive flex-shrink-0 mb-1"
                              onClick={() => deleteMessage(msg.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          )}
                          <div className={`max-w-[72%] rounded-2xl px-4 py-2 ${isOwn ? 'bg-primary text-primary-foreground rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                            <p className="text-sm leading-relaxed">{msg.content}</p>
                            <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
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
              {isBlocked ? (
                <div className="p-3 border-t flex items-center justify-center bg-muted/30 flex-shrink-0">
                  <p className="text-sm text-muted-foreground flex items-center gap-2">
                    <Ban className="h-4 w-4 text-destructive" />
                    لقد قمت بحظر هذا المستخدم —
                    <button
                      className="text-primary underline text-sm"
                      onClick={() => setShowUnblockConfirm(true)}
                    >
                      إلغاء الحظر
                    </button>
                  </p>
                </div>
              ) : (
                <div className="p-3 border-t flex gap-2 flex-shrink-0 bg-background">
                  <Input
                    value={newMessage}
                    onChange={e => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك..."
                    className="flex-1"
                    disabled={sending}
                    autoComplete="off"
                    dir="rtl"
                  />
                  <Button size="icon" onClick={sendMessage} disabled={sending || !newMessage.trim()} className="flex-shrink-0">
                    <Send className="h-4 w-4 scale-x-[-1]" />
                  </Button>
                </div>
              )}
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
              dir="rtl"
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

      {/* ── Block Confirmation ── */}
      <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>حظر المستخدم</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد من حظر <strong>{selectedConv?.otherUser.name}</strong>؟
              لن يتمكن من إرسال رسائل إليك وسيُزال من قائمة جهات الاتصال.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={blockUser}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حظر
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ── Unblock Confirmation ── */}
      <AlertDialog open={showUnblockConfirm} onOpenChange={setShowUnblockConfirm}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>إلغاء الحظر</AlertDialogTitle>
            <AlertDialogDescription>
              هل تريد إلغاء حظر <strong>{selectedConv?.otherUser.name}</strong>؟
              سيتمكن من إرسال رسائل إليك مجدداً.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-row-reverse gap-2">
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction onClick={unblockUser}>إلغاء الحظر</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
