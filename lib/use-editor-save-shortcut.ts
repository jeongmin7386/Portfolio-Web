"use client";

import { useEffect, useRef } from "react";

type SaveShortcutOptions = {
  onSave: () => Promise<void>;
  onPublish?: () => Promise<void>;
};

export function useEditorSaveShortcut(options: SaveShortcutOptions) {
  const actionsRef = useRef(options);

  useEffect(() => {
    actionsRef.current = options;
  });

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        !(event.ctrlKey || event.metaKey) ||
        event.altKey ||
        event.key.toLowerCase() !== "s"
      ) {
        return;
      }

      event.preventDefault();
      if (event.repeat || event.isComposing || event.keyCode === 229) return;

      const action = event.shiftKey
        ? actionsRef.current.onPublish
        : actionsRef.current.onSave;
      if (action) void action();
    };

    // Capture also handles shortcuts inside editable blocks and floating panels.
    window.addEventListener("keydown", handleKeyDown, true);
    return () => window.removeEventListener("keydown", handleKeyDown, true);
  }, []);
}
