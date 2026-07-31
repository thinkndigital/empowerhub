import { SiteHeader } from "@/components/site-header";

export default function MentorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
