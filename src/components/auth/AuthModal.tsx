import { X } from "lucide-react";
import { AuthForm } from "./AuthForm";

export function AuthModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-[60] bg-black/50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md bg-popover border border-border rounded-xl shadow-xl p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-1 rounded hover:bg-muted text-muted-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
        <AuthForm onSuccess={onClose} />
      </div>
    </div>
  );
}
