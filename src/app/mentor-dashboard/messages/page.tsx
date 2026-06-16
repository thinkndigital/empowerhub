"use client";

import { ChatInterface } from "@/components/chat-interface";
import { useUser } from "@/firebase/auth/use-user";

export default function MentorMessagesPage() {
  const { userProfile } = useUser();
  return (
    <ChatInterface
      title="مركز رسائل المرشد"
      description="التواصل مع المستفيدين الذين تشرف عليهم."
      organizationId={userProfile?.organizationId}
    />
  );
}
