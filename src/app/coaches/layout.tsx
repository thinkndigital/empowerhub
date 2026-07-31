import { SiteHeader } from "@/components/site-header";

export default function CoachesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
