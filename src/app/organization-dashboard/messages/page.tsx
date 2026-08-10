'use client';
import MessagesCenter from '@/components/messages-center';
import { useLanguage } from '@/components/language-provider';
export default function OrgMessagesPage() {
  const { lang } = useLanguage();
  return <MessagesCenter title={lang === 'en' ? 'Message center' : 'مركز الرسائل'} />;
}
