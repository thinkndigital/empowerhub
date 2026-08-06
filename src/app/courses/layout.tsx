import { SiteHeader } from "@/components/site-header";

export default function CoursesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      {children}
    </>
  );
}
