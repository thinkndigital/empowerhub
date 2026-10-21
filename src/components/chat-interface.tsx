"use client";

import { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, PlusCircle, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser } from '@/hooks/use-user';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

interface Contact {
  id: string;
  name: string;
  role: string;
  roleLabel: string;
}

interface ConversationWithDetails {
  id: string;
  lastMessage: string;
  lastUpdated: string | null;
  unreadCount: number;
  otherUser: { id: string; name: string; role: string };
}

interface ChatInterfaceProps {
  title: string;
  description: string;
  organizationId?: string;
}

const roleLabel: Record<string, string> = {
  beneficiary: 'مستفيد',
  mentor: 'مرشد',
  coach: 'مدرب',
  organization: 'مدير جهة',
  admin: 'مشرف',
};

export function ChatInterface({ title, description, organizationId }: ChatInterfaceProps) {
  const { user: authUser, userProfile } = useUser();

  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [mobileView, setMobileView] = useState<'list' | 'chat'>('list');
  const didSelectDefault = useRef(false);

  const fetchConversations = useCallback(async () => {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      const res = await fetch('/api/messages', { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      setConversations(data.conversations || []);
    } catch { /* ignore */ } finally {
      setConvLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 8000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (!didSelectDefault.current && conversations.length > 0 && !selectedConversationId) {
      didSelectDefault.current = true;
      setSelectedConversationId(conversations[0].id);
    }
  }, [conversations, selectedConversationId]);

  useEffect(() => {
    if (!organizationId || !authUser) return;
    authUser.getIdToken().then(token =>
      fetch('/api/messages/contacts', { headers: { authorization: `Bearer ${token}` } })
        .then(r => r.json()).then(d => setContacts(d.contacts || []))
        .catch(() => {})
    );
  }, [organizationId, authUser]);

  const availableMembers = useMemo(() => contacts, [contacts]);

  const selectedConversation = useMemo(
    () => conversations.find(c => c.id === selectedConversationId),
    [conversations, selectedConversationId]
  );

  const fetchMessages = useCallback(async (convId: string) => {
    if (!authUser) return;
    try {
      const token = await authUser.getIdToken();
      const res = await fetch(`/api/messages/${convId}`, { headers: { authorization: `Bearer ${token}` } });
      const data = await res.json();
      setMessages(data.messages || []);
    } catch { /* ignore */ } finally {
      setMessagesLoading(false);
    }
  }, [authUser]);

  useEffect(() => {
    if (!selectedConversationId) { setMessages([]); return; }
    setMessagesLoading(true);
    fetchMessages(selectedConversationId);
    const interval = setInterval(() => fetchMessages(selectedConversationId), 4000);
    return () => clearInterval(interval);
  }, [selectedConversationId, fetchMessages]);

  const handleSelectConversation = (id: string) => {
    setSelectedConversationId(id);
    setMobileView('chat');
  };

  const startConversation = async (otherUserId: string) => {
    if (!authUser) return;

    const existingConvo = conversations.find(c => c.otherUser.id === otherUserId);
    if (existingConvo) {
      setSelectedConversationId(existingConvo.id);
      setIsNewChatOpen(false);
      setMobileView('chat');
      return;
    }

    const token = await authUser.getIdToken();
    const res = await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ toUserId: otherUserId, content: '' }),
    });
    const data = await res.json();
    await fetchConversations();
    if (data.conversationId) setSelectedConversationId(data.conversationId);
    setIsNewChatOpen(false);
    setMobileView('chat');
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedConversation || !authUser) return;

    const text = newMessage;
    setNewMessage('');

    const token = await authUser.getIdToken();
    await fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', authorization: `Bearer ${token}` },
      body: JSON.stringify({ toUserId: selectedConversation.otherUser.id, content: text }),
    });

    await Promise.all([fetchMessages(selectedConversation.id), fetchConversations()]);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent className="p-0 sm:p-6">
          <div className="flex flex-col md:grid md:grid-cols-3 lg:grid-cols-4 gap-0 md:gap-4 h-[calc(100vh-280px)] min-h-[400px] md:h-[650px]">

            {/* Conversations List — hidden on mobile when chat is open */}
            <div className={cn(
              "col-span-1 border-l flex flex-col",
              "md:flex",
              mobileView === 'chat' ? "hidden md:flex" : "flex"
            )}>
              {organizationId && (
                <div className="p-2 border-b">
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setIsNewChatOpen(true)}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    محادثة جديدة
                  </Button>
                </div>
              )}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-1">
                  {convLoading && [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  {!convLoading && conversations.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      لا توجد محادثات بعد
                    </div>
                  )}
                  {!convLoading && conversations.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => handleSelectConversation(convo.id)}
                      className={cn(
                        'w-full text-right p-3 rounded-lg flex items-center gap-3 transition-colors',
                        selectedConversationId === convo.id ? 'bg-muted' : 'hover:bg-muted/50'
                      )}
                    >
                      <Avatar>
                        <AvatarImage src={`https://picsum.photos/seed/${convo.otherUser.id}/40/40`} alt={convo.otherUser.name} />
                        <AvatarFallback>{convo.otherUser.name?.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 truncate">
                        <p className="font-semibold">{convo.otherUser.name}</p>
                        <p className="text-sm text-muted-foreground truncate">{convo.lastMessage || 'ابدأ المحادثة...'}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </ScrollArea>
            </div>

            {/* Chat Window — hidden on mobile when list is open */}
            <div className={cn(
              "col-span-1 md:col-span-2 lg:col-span-3 flex flex-col border rounded-lg",
              "md:flex",
              mobileView === 'list' ? "hidden md:flex" : "flex"
            )}>
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b flex items-center gap-3">
                    {/* Back button — mobile only */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden h-8 w-8 flex-shrink-0"
                      onClick={() => setMobileView('list')}
                    >
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Avatar>
                      <AvatarImage src={`https://picsum.photos/seed/${selectedConversation.otherUser.id}/40/40`} alt={selectedConversation.otherUser.name} />
                      <AvatarFallback>{selectedConversation.otherUser.name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-lg">{selectedConversation.otherUser.name}</h3>
                      {selectedConversation.otherUser.role && (
                        <p className="text-xs text-muted-foreground">{roleLabel[selectedConversation.otherUser.role] || selectedConversation.otherUser.role}</p>
                      )}
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messagesLoading && <p className="text-center text-muted-foreground text-sm">جاري تحميل الرسائل...</p>}
                      {!messagesLoading && messages.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>ابدأ المحادثة بإرسال رسالة</p>
                        </div>
                      )}
                      {messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex items-end gap-2',
                            msg.senderId === authUser?.uid ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {msg.senderId !== authUser?.uid && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={`https://picsum.photos/seed/${selectedConversation.otherUser.id}/40/40`} alt={selectedConversation.otherUser.name} />
                              <AvatarFallback>{selectedConversation.otherUser.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              'p-3 rounded-lg max-w-[75%] break-words',
                               msg.senderId === authUser?.uid
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}
                          >
                            <p className="text-sm">{msg.content}</p>
                             <p className={cn("text-xs mt-1", msg.senderId === authUser?.uid ? "text-primary-foreground/70 text-left" : "text-muted-foreground/70 text-right")}>
                                  {msg.createdAt ? new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) : 'الآن'}
                             </p>
                          </div>
                           {msg.senderId === authUser?.uid && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={userProfile?.avatarUrl || `https://picsum.photos/seed/${authUser?.uid}/40/40`} alt={userProfile?.name} />
                              <AvatarFallback>{userProfile?.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                  <div className="p-4 border-t bg-background/95">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      <Input
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="اكتب رسالتك هنا..."
                        autoComplete="off"
                      />
                      <Button type="submit" size="icon" disabled={!newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex flex-1 items-center justify-center flex-col gap-2">
                   <MessageSquare className="h-10 w-10 text-muted-foreground" />
                  <p className="text-muted-foreground">اختر محادثة لبدء الدردشة.</p>
                  {organizationId && availableMembers.length > 0 && (
                    <Button variant="outline" size="sm" className="mt-2" onClick={() => setIsNewChatOpen(true)}>
                      <PlusCircle className="ml-2 h-4 w-4" />
                      ابدأ محادثة جديدة
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isNewChatOpen} onOpenChange={setIsNewChatOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>بدء محادثة جديدة</DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-80 mt-2">
            <div className="space-y-2 pl-1">
              {availableMembers.length === 0 && (
                <p className="text-center text-muted-foreground py-8">لا يوجد أعضاء آخرون في المنظمة.</p>
              )}
              {availableMembers.map(member => (
                <button
                  key={member.id}
                  onClick={() => startConversation(member.id)}
                  className="w-full text-right p-3 rounded-lg flex items-center gap-3 hover:bg-muted transition-colors border"
                >
                  <Avatar>
                    <AvatarImage src={`https://picsum.photos/seed/${member.id}/40/40`} alt={member.name} />
                    <AvatarFallback>{member.name?.charAt(0) || '؟'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{member.name || 'مستخدم'}</p>
                    <p className="text-xs text-muted-foreground">{member.roleLabel || roleLabel[member.role || ''] || member.role}</p>
                  </div>
                </button>
              ))}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}
