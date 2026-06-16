"use client";

import { ChatInterface } from "@/components/chat-interface";
import { useUser } from "@/firebase/auth/use-user";

export default function OrgMessagesPage() {
  const { userProfile } = useUser();
  return (
    <ChatInterface
      title="مركز رسائل المنظمة"
      description="التواصل مع المستفيدين والمرشدين والمدربين."
      organizationId={userProfile?.organizationId}
    />
  );
}
