import { createContext, useContext, type ReactNode } from "react";
import { useVirtualKeyboard } from "../hooks/useVirtualKeyboard";

type KeyboardUiValue = ReturnType<typeof useVirtualKeyboard>;

const KeyboardUiContext = createContext<KeyboardUiValue | null>(null);

export function KeyboardUiProvider({ children }: { children: ReactNode }) {
  const value = useVirtualKeyboard();
  return <KeyboardUiContext.Provider value={value}>{children}</KeyboardUiContext.Provider>;
}

export function useKeyboardUi(): KeyboardUiValue {
  const ctx = useContext(KeyboardUiContext);
  if (!ctx) {
    throw new Error("useKeyboardUi must be used within KeyboardUiProvider");
  }
  return ctx;
}
