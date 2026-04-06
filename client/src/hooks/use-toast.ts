import { useState, useCallback, useEffect } from "react";

export interface Toast {
  id: string;
  title?: string;
  description?: string;
  variant?: "default" | "destructive";
}

let toastCount = 0;
const listeners: Array<(toasts: Toast[]) => void> = [];
let memoryState: Toast[] = [];

function dispatch(toasts: Toast[]) {
  memoryState = toasts;
  listeners.forEach((listener) => listener(toasts));
}

export function toast({
  title,
  description,
  variant = "default",
}: Omit<Toast, "id">) {
  const id = String(toastCount++);
  const newToast: Toast = { id, title, description, variant };
  dispatch([...memoryState, newToast]);

  setTimeout(() => {
    dispatch(memoryState.filter((t) => t.id !== id));
  }, 5000);

  return id;
}

export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>(memoryState);

  useEffect(() => {
    listeners.push(setToasts);
    return () => {
      const index = listeners.indexOf(setToasts);
      if (index > -1) listeners.splice(index, 1);
    };
  }, []);

  const dismiss = useCallback((id: string) => {
    dispatch(memoryState.filter((t) => t.id !== id));
  }, []);

  return { toasts, toast, dismiss };
}
