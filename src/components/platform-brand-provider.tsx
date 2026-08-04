"use client";

import { createContext, useContext } from "react";

interface PlatformBrand {
  logoUrl: string;
  platformName: string;
}

const PlatformBrandContext = createContext<PlatformBrand>({ logoUrl: "", platformName: "EmpowerHub" });

export function PlatformBrandProvider({
  logoUrl,
  platformName,
  children,
}: PlatformBrand & { children: React.ReactNode }) {
  return (
    <PlatformBrandContext.Provider value={{ logoUrl, platformName }}>
      {children}
    </PlatformBrandContext.Provider>
  );
}

export function usePlatformBrand() {
  return useContext(PlatformBrandContext);
}
