"use client";

import { createContext, useContext } from "react";

export interface HeaderConfig {
  navLinks: { label: string }[];
  teamLabel: string;
  teamLinks: { label: string }[];
  loginText: string;
  registerText: string;
  registerTextMobile: string;
}

interface PlatformBrand {
  logoUrl: string;
  platformName: string;
  header?: HeaderConfig;
}

const PlatformBrandContext = createContext<PlatformBrand>({ logoUrl: "", platformName: "EmpowerHub" });

export function PlatformBrandProvider({
  logoUrl,
  platformName,
  header,
  children,
}: PlatformBrand & { children: React.ReactNode }) {
  return (
    <PlatformBrandContext.Provider value={{ logoUrl, platformName, header }}>
      {children}
    </PlatformBrandContext.Provider>
  );
}

export function usePlatformBrand() {
  return useContext(PlatformBrandContext);
}
