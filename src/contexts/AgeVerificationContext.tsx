"use client";

import React, { createContext, useContext, ReactNode } from "react";

export type RequestAgeVerificationFn = (action: () => void) => void;

const AgeVerificationContext = createContext<RequestAgeVerificationFn | null>(null);

export function useAgeVerification(): RequestAgeVerificationFn | null {
  return useContext(AgeVerificationContext);
}

interface AgeVerificationProviderProps {
  children: ReactNode;
  requestAgeVerification: RequestAgeVerificationFn;
}

export function AgeVerificationProvider({ children, requestAgeVerification }: AgeVerificationProviderProps) {
  return (
    <AgeVerificationContext.Provider value={requestAgeVerification}>
      {children}
    </AgeVerificationContext.Provider>
  );
}
