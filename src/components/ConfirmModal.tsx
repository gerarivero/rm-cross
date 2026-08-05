"use client";

import { useEffect } from "react";
import { Modal } from "./Modal";

export function ConfirmModal({
  title,
  message,
  confirmLabel = "Confirmar",
  danger = false,
  pending = false,
  onConfirm,
  onCancel,
}: {
  title: string;
  message: string;
  confirmLabel?: string;
  danger?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Enter" && !pending) onConfirm();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onConfirm, pending]);

  return (
    <Modal title={title} onClose={onCancel} maxWidth="max-w-md">
      <p className="text-body-sm text-on-surface-variant">{message}</p>
      <div className="flex justify-end gap-sm mt-lg">
        <button
          disabled={pending}
          onClick={onCancel}
          className="px-lg py-2 rounded-lg border border-border text-on-surface-variant font-label-bold text-label-bold disabled:opacity-50"
        >
          Cancelar
        </button>
        <button
          disabled={pending}
          onClick={onConfirm}
          className={`px-lg py-2 rounded-lg font-label-bold text-label-bold text-on-primary disabled:opacity-50 ${
            danger ? "bg-error" : "bg-primary-container text-on-primary-container"
          }`}
        >
          {pending ? "Procesando..." : confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
