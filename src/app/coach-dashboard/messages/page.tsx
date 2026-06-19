'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@/firebase/auth/use-user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Send } from 'lucide-react';

interface OtherUser {
  id: string;
  name: string;
  role: string;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  updatedAt: string;
  unreadCount: number;
  otherUser: OtherUser;
}

interface Message {
  id: string;
  senderId: string;
  content: string;
  createdAt: string;
}

const PAGE_TITLE = 'مركز رسائل المدرب';

export default function MessagesPage() {
  const { user } = useUser();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const fetchConversations = useCallback(async () => {
    if (!user) return;
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/messages', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations || []);
      }
    } catch (err) {
      console.error('Failed to fetch conversations:', err);
    } finally {
      setLoadingConvs(false);
    }
  }, [user]);

  const fetchMessages = useCallback(async (convId: string) => {
    if (!user) return;
    setLoadingMsgs(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/messages/${convId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
        setConversations((prev) =>
          prev.map((c) => (c.id === convId ? { ...c, unreadCount: 0 } : c))
        );
      }
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setLoadingMsgs(false);
    }
  }, [user]);

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, [fetchConversations]);

  useEffect(() => {
    if (selectedConv) {
      fetchMessages(selectedConv.id);
      const interval = setInterval(() => fetchMessages(selectedConv.id), 10000);
      return () => clearInterval(interval);
    }
  }, [selectedConv, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = async () => {
    if (!user || !selectedConv || !newMessage.trim()) return;
    setSending(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          toUserId: selectedConv.otherUser.id,
          content: newMessage.trim(),
        }),
      });
      if (res.ok) {
        setNewMessage('');
        await fetchMessages(selectedConv.id);
        await fetchConversations();
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <div className="container mx-auto p-4 h-[calc(100vh-80px)]" dir="rtl">
      <h1 className="text-2xl font-bold mb-4">{PAGE_TITLE}</h1>
      <div className="flex flex-col md:flex-row gap-4 h-[calc(100%-60px)]">
        <Card className="w-full md:w-80 flex-shrink-0 flex flex-col max-h-[300px] md:max-h-none">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">المحادثات</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 p-0 overflow-hidden">
            <ScrollArea className="h-full">
              {loadingConvs ? (
                <div className="p-4 text-center text-sm text-muted-foreground">جارٍ التحميل...</div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-sm text-muted-foreground">لا توجد محادثات</div>
              ) : (
                conversations.map((conv) => (
                  <div
                    key={conv.id}
                    className={`flex items-center gap-3 p-3 cursor-pointer hover:bg-accent transition-colors border-b ${
                      selectedConv?.id === conv.id ? 'bg-accent' : ''
                    }`}
                    onClick={() => setSelectedConv(conv)}
                  >
                    <Avatar className="h-10 w-10 flex-shrink-0">
                      <AvatarFallback>{conv.otherUser.name.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-sm truncate">{conv.otherUser.name}</span>
                        {conv.unreadCount > 0 && (
                          <Badge variant="destructive" className="text-xs h-5 w-5 flex items-center justify-center p-0 flex-shrink-0">
                            {conv.unreadCount}
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{conv.lastMessage}</p>
                    </div>
                  </div>
                ))
              )}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card className="flex-1 flex flex-col overflow-hidden">
          {selectedConv ? (
            <>
              <CardHeader className="pb-2 border-b flex-shrink-0">
                <div className="flex items-center gap-3">
                  <Avatar className="h-8 w-8">
                    <AvatarFallback>{selectedConv.otherUser.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <CardTitle className="text-base">{selectedConv.otherUser.name}</CardTitle>
                    {selectedConv.otherUser.role && (
                      <p className="text-xs text-muted-foreground">{selectedConv.otherUser.role}</p>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-0 overflow-hidden flex flex-col">
                <ScrollArea className="flex-1 p-4">
                  {loadingMsgs ? (
                    <div className="text-center text-sm text-muted-foreground">جارٍ التحميل...</div>
                  ) : messages.length === 0 ? (
                    <div className="text-center text-sm text-muted-foreground">لا توجد رسائل بعد</div>
                  ) : (
                    <div className="space-y-3">
                      {messages.map((msg) => {
                        const isOwn = msg.senderId === user?.uid;
                        return (
                          <div
                            key={msg.id}
                            className={`flex ${isOwn ? 'justify-start' : 'justify-end'}`}
                          >
                            <div
                              className={`max-w-[70%] rounded-lg px-4 py-2 ${
                                isOwn
                                  ? 'bg-primary text-primary-foreground'
                                  : 'bg-muted'
                              }`}
                            >
                              <p className="text-sm">{msg.content}</p>
                              <p className={`text-xs mt-1 ${isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </ScrollArea>
                <div className="p-3 border-t flex gap-2 flex-shrink-0">
                  <Button
                    size="icon"
                    onClick={sendMessage}
                    disabled={sending || !newMessage.trim()}
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                  <Input
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="اكتب رسالتك..."
                    className="flex-1"
                    disabled={sending}
                  />
                </div>
              </CardContent>
            </>
          ) : (
            <CardContent className="flex-1 flex items-center justify-center">
              <p className="text-muted-foreground">اختر محادثة للبدء</p>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
