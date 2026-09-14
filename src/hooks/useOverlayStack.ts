"use client";

import { useEffect, useRef } from "react";

const stack: symbol[] = [];

/**
 * Registra un overlay (modal / diálogo) abierto: bloquea el scroll del body
 * mientras exista al menos uno y cierra con Escape sólo el superior.
 */
export function useOverlayStack(open: boolean, onClose: () => void) {
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    if (!open) return;
    const token = Symbol("overlay");
    stack.push(token);
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && stack[stack.length - 1] === token) {
        e.stopPropagation();
        onCloseRef.current();
      }
    };
    window.addEventListener("keydown", onKey);

    return () => {
      window.removeEventListener("keydown", onKey);
      stack.splice(stack.indexOf(token), 1);
      if (stack.length === 0) document.body.style.overflow = "";
    };
  }, [open]);
}
