import { SiteHeader } from "@/components/site-header";

export default function StoresLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
