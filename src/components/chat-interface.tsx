
"use client";

import { useState, useMemo, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageSquare, PlusCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUser, type UserProfile } from '@/firebase/auth/use-user';
import { useFirestore, useMemoFirebase } from '@/firebase/provider';
import { useCollection } from '@/firebase/firestore/use-collection';
import { query, collection, where, orderBy, doc, getDoc, addDoc, serverTimestamp, updateDoc, Timestamp } from 'firebase/firestore';
import { Skeleton } from './ui/skeleton';
import { sendNotification } from '@/lib/notifications';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface Message {
  id: string;
  senderId: string;
  text: string;
  timestamp?: Timestamp;
}

interface Conversation {
  id: string;
  participants: string[];
  lastMessage: string;
  lastUpdated?: Timestamp;
}

type ConversationWithDetails = Conversation & {
    otherUser: Partial<UserProfile>;
};

interface ChatInterfaceProps {
  title: string;
  description: string;
  organizationId?: string;
}

const roleLabel: Record<string, string> = {
  beneficiary: 'مستفيد',
  mentor: 'مرشد',
  coach: 'مدرب',
  organization: 'مدير منظمة',
  admin: 'مشرف',
};

export function ChatInterface({ title, description, organizationId }: ChatInterfaceProps) {
  const { user: authUser, userProfile } = useUser();
  const firestore = useFirestore();

  const [conversationsWithDetails, setConversationsWithDetails] = useState<ConversationWithDetails[]>([]);
  const [convLoading, setConvLoading] = useState(true);
  const [selectedConversationId, setSelectedConversationId] = useState<string | null>(null);
  const [newMessage, setNewMessage] = useState('');
  const [isNewChatOpen, setIsNewChatOpen] = useState(false);

  // 1. Fetch conversations for the current user
  const conversationsQuery = useMemoFirebase(() => {
    if (!authUser || !firestore) return null;
    return query(collection(firestore, "conversations"), where("participants", "array-contains", authUser.uid), orderBy("lastUpdated", "desc"));
  }, [firestore, authUser]);
  const { data: conversations, isLoading: conversationsLoading } = useCollection<Conversation>(conversationsQuery);

  // 2. Fetch org members for new conversation dialog
  const orgMembersQuery = useMemoFirebase(() => {
    if (!firestore || !organizationId || !authUser) return null;
    return query(collection(firestore, "users"), where("organizationId", "==", organizationId));
  }, [firestore, organizationId, authUser]);
  const { data: orgMembers } = useCollection<UserProfile>(orgMembersQuery);

  const availableMembers = useMemo(() =>
    orgMembers?.filter(m => m.id !== authUser?.uid) ?? [],
    [orgMembers, authUser]
  );

  // 3. When conversations are fetched, fetch details of the other participants
  useEffect(() => {
    if (!conversations || !authUser || !firestore) {
        if (!conversationsLoading) {
            setConversationsWithDetails([]);
            setConvLoading(false);
        }
        return;
    };
    setConvLoading(true);

    const fetchParticipantDetails = async () => {
        const conversationsPromises = conversations.map(async (convo) => {
            const otherUserId = convo.participants.find(p => p !== authUser.uid);
            if (!otherUserId) {
                return { ...convo, otherUser: { name: "Unknown Group", avatarUrl: '' } };
            }
            const userDocRef = doc(firestore, "users", otherUserId);
            const userDocSnap = await getDoc(userDocRef);
            const otherUser = userDocSnap.exists() ? { id: userDocSnap.id, ...userDocSnap.data() } as UserProfile : { name: "Unknown User", avatarUrl: '', id: otherUserId };
            return { ...convo, otherUser };
        });
        const resolvedConversations = await Promise.all(conversationsPromises);
        setConversationsWithDetails(resolvedConversations as ConversationWithDetails[]);
        setConvLoading(false);
    }

    fetchParticipantDetails();

}, [conversations, authUser, firestore, conversationsLoading]);


  // 4. Auto-select the first conversation
  useEffect(() => {
    if (!selectedConversationId && conversationsWithDetails.length > 0) {
        setSelectedConversationId(conversationsWithDetails[0].id);
    }
  }, [conversationsWithDetails, selectedConversationId]);

  const selectedConversation = useMemo(() => conversationsWithDetails.find(c => c.id === selectedConversationId), [conversationsWithDetails, selectedConversationId]);

  // 5. Fetch messages for the selected conversation
  const messagesQuery = useMemoFirebase(() => {
    if (!firestore || !selectedConversationId) return null;
    return query(collection(firestore, "conversations", selectedConversationId, "messages"), orderBy("timestamp", "asc"));
  }, [firestore, selectedConversationId]);
  const { data: messages, isLoading: messagesLoading } = useCollection<Message>(messagesQuery);

  // 6. Start or find existing conversation
  const startConversation = async (otherUserId: string) => {
    if (!firestore || !authUser) return;

    const existingConvo = conversationsWithDetails.find(c => c.participants.includes(otherUserId));
    if (existingConvo) {
      setSelectedConversationId(existingConvo.id);
      setIsNewChatOpen(false);
      return;
    }

    const newConvo = await addDoc(collection(firestore, "conversations"), {
      participants: [authUser.uid, otherUserId],
      lastMessage: "",
      lastUpdated: serverTimestamp(),
    });

    setSelectedConversationId(newConvo.id);
    setIsNewChatOpen(false);
  };

  // 7. Handle sending a new message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newMessage.trim() === '' || !selectedConversation || !authUser || !firestore) return;

    const messagesColRef = collection(firestore, "conversations", selectedConversation.id, "messages");
    const convoRef = doc(firestore, "conversations", selectedConversation.id);

    const messageData = {
        senderId: authUser.uid,
        text: newMessage,
        timestamp: serverTimestamp(),
    };

    setNewMessage('');

    await addDoc(messagesColRef, messageData);
    await updateDoc(convoRef, {
        lastMessage: newMessage,
        lastUpdated: serverTimestamp(),
    });

    if (selectedConversation.otherUser.id && userProfile) {
        sendNotification(firestore, {
            userId: selectedConversation.otherUser.id,
            title: `رسالة جديدة من ${userProfile.name}`,
            description: newMessage,
            link: '/messages'
        });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 h-[calc(100vh-220px)] md:h-[650px]">
            {/* Conversations List */}
            <div className="col-span-1 border-l rounded-lg flex flex-col">
              {organizationId && (
                <div className="p-2 border-b">
                  <Button size="sm" variant="outline" className="w-full" onClick={() => setIsNewChatOpen(true)}>
                    <PlusCircle className="ml-2 h-4 w-4" />
                    محادثة جديدة
                  </Button>
                </div>
              )}
              <ScrollArea className="flex-1">
                <div className="p-2 space-y-2">
                  {convLoading && [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  {!convLoading && conversationsWithDetails.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-40" />
                      لا توجد محادثات بعد
                    </div>
                  )}
                  {!convLoading && conversationsWithDetails.map((convo) => (
                    <button
                      key={convo.id}
                      onClick={() => setSelectedConversationId(convo.id)}
                      className={cn(
                        'w-full text-right p-3 rounded-lg flex items-center gap-3 transition-colors',
                        selectedConversationId === convo.id ? 'bg-muted' : 'hover:bg-muted/50'
                      )}
                    >
                      <Avatar>
                        <AvatarImage src={convo.otherUser.avatarUrl || `https://picsum.photos/seed/${convo.otherUser.id}/40/40`} alt={convo.otherUser.name} />
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

            {/* Chat Window */}
            <div className="col-span-1 md:col-span-2 lg:col-span-3 flex flex-col border rounded-lg">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b flex items-center gap-3">
                    <Avatar>
                      <AvatarImage src={selectedConversation.otherUser.avatarUrl || `https://picsum.photos/seed/${selectedConversation.otherUser.id}/40/40`} alt={selectedConversation.otherUser.name} />
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
                      {!messagesLoading && messages?.length === 0 && (
                        <div className="text-center py-12 text-muted-foreground">
                          <p>ابدأ المحادثة بإرسال رسالة</p>
                        </div>
                      )}
                      {messages?.map((msg) => (
                        <div
                          key={msg.id}
                          className={cn(
                            'flex items-end gap-2',
                            msg.senderId === authUser?.uid ? 'justify-end' : 'justify-start'
                          )}
                        >
                          {msg.senderId !== authUser?.uid && (
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={selectedConversation.otherUser.avatarUrl || `https://picsum.photos/seed/${selectedConversation.otherUser.id}/40/40`} alt={selectedConversation.otherUser.name} />
                              <AvatarFallback>{selectedConversation.otherUser.name?.charAt(0)}</AvatarFallback>
                            </Avatar>
                          )}
                          <div
                            className={cn(
                              'p-3 rounded-lg max-w-xs lg:max-w-md break-words',
                               msg.senderId === authUser?.uid
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted'
                            )}
                          >
                            <p className="text-sm">{msg.text}</p>
                             <p className={cn("text-xs mt-1", msg.senderId === authUser?.uid ? "text-primary-foreground/70 text-left" : "text-muted-foreground/70 text-right")}>
                                  {msg.timestamp?.toDate().toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }) || 'الآن'}
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

      {/* New Conversation Dialog */}
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
                    <AvatarImage src={member.avatarUrl || `https://picsum.photos/seed/${member.id}/40/40`} alt={member.name} />
                    <AvatarFallback>{member.name?.charAt(0) || '؟'}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <p className="font-medium">{member.name || 'مستخدم'}</p>
                    <p className="text-xs text-muted-foreground">{roleLabel[member.role || ''] || member.role}</p>
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
