"use client";

import { useEffect } from "react";

export function Modal({
  title,
  onClose,
  children,
  maxWidth = "max-w-2xl",
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidth?: string;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-md"
      onClick={onClose}
    >
      <div
        className={`bg-surface-white rounded-xl shadow-[0_8px_32px_rgba(0,0,0,0.2)] w-full ${maxWidth} max-h-[90vh] overflow-y-auto`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-lg py-md border-b border-border flex items-center justify-between">
          <h3 className="font-headline-md text-headline-md text-on-surface">{title}</h3>
          <button
            onClick={onClose}
            className="p-1 text-on-surface-variant hover:bg-surface-container-low rounded-lg transition-colors"
            title="Cerrar"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="p-lg">{children}</div>
      </div>
    </div>
  );
}
