import React, { createContext, ReactNode, useContext, useState } from "react";

interface LessonNavigationContextType {
  allowNext: boolean;
  setAllowNext: (allow: boolean) => void;
  isNavigationLocked: boolean;
  setNavigationLocked: (locked: boolean) => void;
}

const LessonNavigationContext = createContext<LessonNavigationContextType | undefined>(undefined);

export function LessonNavigationProvider({
  children,
  initialAllowNext = false,
}: {
  children: ReactNode;
  initialAllowNext?: boolean;
}) {
  const [allowNext, setAllowNext] = useState(initialAllowNext);
  const [isNavigationLocked, setNavigationLocked] = useState(false);

  return (
    <LessonNavigationContext.Provider value={{ allowNext, setAllowNext, isNavigationLocked, setNavigationLocked }}>
      {children}
    </LessonNavigationContext.Provider>
  );
}

export function useLessonNavigation() {
  const context = useContext(LessonNavigationContext);
  if (context === undefined) {
    throw new Error("useLessonNavigation must be used within a LessonNavigationProvider");
  }
  return context;
}
