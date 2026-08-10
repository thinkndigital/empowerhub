'use client';
import MessagesCenter from '@/components/messages-center';
import { useLanguage } from '@/components/language-provider';
export default function BeneficiaryMessagesPage() {
  const { lang } = useLanguage();
  return <MessagesCenter title={lang === 'en' ? 'My messages' : 'رسائلي'} />;
}
