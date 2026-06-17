"use client";

import { ChatInterface } from "@/components/chat-interface";
import { useUser } from "@/firebase/auth/use-user";

export default function BeneficiaryMessagesPage() {
  const { userProfile } = useUser();
  return (
    <ChatInterface
      title="مركز رسائلي"
      description="التواصل مع المرشدين والمدربين."
      organizationId={userProfile?.organizationId}
    />
  );
}
