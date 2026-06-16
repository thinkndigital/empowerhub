"use client";

import { ChatInterface } from "@/components/chat-interface";
import { useUser } from "@/firebase/auth/use-user";

export default function BeneficiaryMessagesPage() {
  const { userProfile } = useUser();
  return (
    <ChatInterface
      title="مركز الرسائل"
      description="التواصل مع مرشدك ومدير منظمتك."
      organizationId={userProfile?.organizationId}
    />
  );
}
