"use client";

import { ChatInterface } from "@/components/chat-interface";
import { useUser } from "@/firebase/auth/use-user";

export default function CoachMessagesPage() {
  const { userProfile } = useUser();
  return (
    <ChatInterface
      title="مركز رسائل المدرب"
      description="التواصل مع الطلاب المسجلين في دوراتك."
      organizationId={userProfile?.organizationId}
    />
  );
}
