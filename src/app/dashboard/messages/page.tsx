'use client';
import MessagesCenter from '@/components/messages-center';
import { useLanguage } from '@/components/language-provider';
export default function DashboardMessagesPage() {
  const { lang } = useLanguage();
  return <MessagesCenter title={lang === 'en' ? 'Messages' : 'الرسائل'} />;
}
