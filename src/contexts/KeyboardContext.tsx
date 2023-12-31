import React, { useEffect, useState, useContext } from "react";
import { EventEmitter } from "events";

const keyboardEmitter = new EventEmitter();
keyboardEmitter.setMaxListeners(100);

const KeyboardContext = React.createContext({ keyEmitter: keyboardEmitter });

export function KeyboardProvider({ children }: { children: React.ReactNode }) {
  const [keyEmitter] = useState(keyboardEmitter);
  useEffect(() => {
    function handleKeyDown(event: Event) {
      // Ignore text input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      keyEmitter.emit("keyDown", event);
    }

    function handleKeyUp(event: Event) {
      // Ignore text input
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      keyEmitter.emit("keyUp", event);
    }

    document.body.addEventListener("keydown", handleKeyDown);
    document.body.addEventListener("keyup", handleKeyUp);
    document.body.tabIndex = 1;
    return () => {
      document.body.removeEventListener("keydown", handleKeyDown);
      document.body.removeEventListener("keyup", handleKeyUp);
      document.body.tabIndex = 0;
    };
  }, [keyEmitter]);

  return (
    <KeyboardContext.Provider value={{ keyEmitter }}>
      {children}
    </KeyboardContext.Provider>
  );
}

export function useKeyboard(
  onKeyDown?: (event: KeyboardEvent) => void,
  onKeyUp?: (event: KeyboardEvent) => void
) {
  const context = useContext(KeyboardContext);
  if (context === undefined) {
    throw new Error("useKeyboard must be used within a KeyboardProvider");
  }
  const { keyEmitter } = context;
  useEffect(() => {
    if (onKeyDown) {
      keyEmitter.on("keyDown", onKeyDown);
    }
    if (onKeyUp) {
      keyEmitter.on("keyUp", onKeyUp);
    }

    return () => {
      if (onKeyDown) {
        keyEmitter.off("keyDown", onKeyDown);
      }
      if (onKeyUp) {
        keyEmitter.off("keyUp", onKeyUp);
      }
    };
  });
}

/**
 * Handler to handle a blur event. Useful when using a shortcut that uses the Alt or Cmd
 * @param {FocusEvent} onBlur
 */
export function useBlur(onBlur: EventListenerOrEventListenerObject) {
  useEffect(() => {
    if (onBlur) {
      window.addEventListener("blur", onBlur);
    }
    return () => {
      if (onBlur) {
        window.removeEventListener("blur", onBlur);
      }
    };
  });
}

export default KeyboardContext;
