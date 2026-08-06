import { useEffect, useRef, useState, useCallback } from "react";

export function useUpdateGuard() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const isDirtyRef = useRef(false);

  const setDirty = useCallback((dirty: boolean) => {
    isDirtyRef.current = dirty;
    setHasUnsavedChanges(dirty);
  }, []);

  useEffect(() => {
    if (!window.electronAPI) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirtyRef.current) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, []);

  return { hasUnsavedChanges, setDirty };
}
