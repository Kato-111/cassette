"use client";

import { createContext, useContext, type ReactNode } from "react";

type ImporterContextValue = {
  enabled: boolean;
};

const ImporterContext = createContext<ImporterContextValue | null>(null);

export const ImporterProvider = ({
  enabled,
  children,
}: {
  enabled: boolean;
  children: ReactNode;
}) => (
  <ImporterContext.Provider value={{ enabled }}>
    {children}
  </ImporterContext.Provider>
);

export const useImporter = () => {
  const ctx = useContext(ImporterContext);
  if (!ctx) {
    throw new Error("useImporter must be used within ImporterProvider");
  }
  return ctx;
};
