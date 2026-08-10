'use client';
import MessagesCenter from '@/components/messages-center';
import { useLanguage } from '@/components/language-provider';
export default function CoachMessagesPage() {
  const { lang } = useLanguage();
  return <MessagesCenter title={lang === 'en' ? 'Coach Messages' : 'رسائل المدرب'} />;
}
