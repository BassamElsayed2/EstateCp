"use client";

import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useEffect,
} from "react";

export type HiddenPages = {
  news: boolean;
  ads: boolean;
  ecomerce: boolean;
  realestate: boolean;
  profile: boolean;
};

const defaultHiddenPages: HiddenPages = {
  news: false,
  ads: false,
  ecomerce: false,
  realestate: false,
  profile: false,
};

interface HiddenPagesContextType {
  hiddenPages: HiddenPages;
  setHiddenPages: React.Dispatch<React.SetStateAction<HiddenPages>>;
}

const HiddenPagesContext = createContext<HiddenPagesContextType | undefined>(
  undefined
);

export function HiddenPagesProvider({ children }: { children: ReactNode }) {
  const [hiddenPages, setHiddenPages] =
    useState<HiddenPages>(defaultHiddenPages);

  // Load hidden pages from localStorage on initial render
  useEffect(() => {
    const savedHiddenPages = localStorage.getItem("hiddenPages");
    if (savedHiddenPages) {
      try {
        const parsedHiddenPages = JSON.parse(savedHiddenPages);
        setHiddenPages(parsedHiddenPages);
      } catch (error) {
        console.error("Error parsing hidden pages from localStorage:", error);
      }
    }
  }, []);

  // Save hidden pages to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem("hiddenPages", JSON.stringify(hiddenPages));
  }, [hiddenPages]);

  return (
    <HiddenPagesContext.Provider value={{ hiddenPages, setHiddenPages }}>
      {children}
    </HiddenPagesContext.Provider>
  );
}

export function useHiddenPages() {
  const context = useContext(HiddenPagesContext);
  if (context === undefined) {
    throw new Error("useHiddenPages must be used within a HiddenPagesProvider");
  }
  return context;
}
