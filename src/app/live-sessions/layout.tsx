import { SiteHeader } from "@/components/site-header";

export default function LiveSessionsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
