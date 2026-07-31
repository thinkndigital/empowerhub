import { SiteHeader } from "@/components/site-header";

export default function ProjectsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
