import { useState, useRef, useEffect, useCallback } from "react";
import {
  Upload,
  Image as ImageIcon,
  FileText,
  LogOut,
  X,
  Trash2,
  Share2,
  Check,
  Plus,
  Loader2,
  RefreshCw,
  KeyRound,
} from "lucide-react";
import { useSharePool } from "@/hooks/useSharePool";
import { SharePoolItem, getImageUrl, formatTokenExpiry } from "@/lib/sharepool";
import { SEO } from "@/components/SEO";

// ============================================================================
// Toast Notification System
// ============================================================================
type ToastType = "success" | "error" | "info";
interface Toast {
  id: number;
  message: string;
  type: ToastType;
}

function ToastContainer({ toasts, removeToast }: { toasts: Toast[]; removeToast: (id: number) => void }) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white animate-in slide-in-from-right ${
            toast.type === "success" ? "bg-green-600" : toast.type === "error" ? "bg-red-600" : "bg-blue-600"
          }`}
        >
          <span>{toast.message}</span>
          <button onClick={() => removeToast(toast.id)} className="p-1 hover:bg-white/20 rounded">
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// Login Gate
// ============================================================================
function LoginGate({ onLogin, loading, error, expired }: { onLogin: (token: string) => void; loading: boolean; error: string; expired: boolean }) {
  const [token, setToken] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (token.trim()) onLogin(token.trim());
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <div className="w-full max-w-md p-8 bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 rounded-xl bg-blue-100">
            <ImageIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SharePool</h1>
            <p className="text-sm text-gray-500">Share images and text across devices</p>
          </div>
        </div>

        {expired && (
          <p className="mb-4 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
            Your token has expired. Enter your AUTH_TOKEN to initialize a new 48-hour token.
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="token" className="block text-sm font-medium text-gray-700 mb-1">
              Access Token
            </label>
            <input
              id="token"
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Access token, or AUTH_TOKEN to initialize"
              className="w-full px-4 py-2 rounded-lg border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
              autoFocus
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={loading || !token.trim()}
            className="w-full py-2 px-4 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading && <Loader2 className="h-4 w-4 animate-spin" />}
            {loading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-500 text-center">
          Tokens expire after 48 hours. Reset anytime from the header.
        </p>
      </div>
    </div>
  );
}

// ============================================================================
// Image Cell Component
// ============================================================================
interface ImageCellProps {
  item: SharePoolItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick: (item: SharePoolItem) => void;
  selectMode: boolean;
}

function ImageCell({ item, selected, onSelect, onClick, selectMode }: ImageCellProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const thumbUrl = getImageUrl(item.id, "thumb");

  return (
    <div
      className={`relative group aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-transparent hover:border-gray-300"
      }`}
      onClick={() => (selectMode ? onSelect(item.id) : onClick(item))}
    >
      {!loaded && !error && (
        <div className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-300" />
        </div>
      )}
      {error ? (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center">
          <span className="text-xs text-gray-400">Failed</span>
        </div>
      ) : (
        <img
          src={thumbUrl}
          alt=""
          className={`w-full h-full object-cover transition-opacity ${loaded ? "opacity-100" : "opacity-0"}`}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          loading="lazy"
        />
      )}
      {selected && (
        <div className="absolute top-2 left-2 w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center">
          <Check className="h-4 w-4 text-white" />
        </div>
      )}
      {selectMode && !selected && (
        <div className="absolute top-2 left-2 w-6 h-6 border-2 border-white rounded-full bg-black/20" />
      )}
    </div>
  );
}

// ============================================================================
// Text Cell Component
// ============================================================================
interface TextCellProps {
  item: SharePoolItem;
  selected: boolean;
  onSelect: (id: string) => void;
  onClick: (item: SharePoolItem) => void;
  selectMode: boolean;
  getText: (id: string) => Promise<string>;
}

function TextCell({ item, selected, onSelect, onClick, selectMode, getText }: TextCellProps) {
  const [preview, setPreview] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getText(item.id)
      .then((text) => setPreview(text.slice(0, 200)))
      .catch(() => setPreview("Failed to load"))
      .finally(() => setLoading(false));
  }, [item.id, getText]);

  const date = new Date(item.time).toLocaleDateString();

  return (
    <div
      className={`p-4 bg-white rounded-lg border-2 transition-all cursor-pointer ${
        selected ? "border-blue-500 ring-2 ring-blue-200" : "border-gray-100 hover:border-gray-300"
      }`}
      onClick={() => (selectMode ? onSelect(item.id) : onClick(item))}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">{date}</span>
          </div>
          {loading ? (
            <div className="h-4 bg-gray-100 rounded animate-pulse w-3/4" />
          ) : (
            <p className="text-sm text-gray-700 line-clamp-3">{preview || "Empty note"}</p>
          )}
        </div>
        {selected && (
          <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
            <Check className="h-4 w-4 text-white" />
          </div>
        )}
        {selectMode && !selected && (
          <div className="w-6 h-6 border-2 border-gray-300 rounded-full flex-shrink-0" />
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Viewer Modal
// ============================================================================
interface ViewerModalProps {
  item: SharePoolItem | null;
  onClose: () => void;
  onShare: (id: string) => Promise<string>;
  onDelete: (id: string) => Promise<void>;
  getText: (id: string) => Promise<string>;
  showToast: (message: string, type: ToastType) => void;
}

function ViewerModal({ item, onClose, onShare, onDelete, getText, showToast }: ViewerModalProps) {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [sharing, setSharing] = useState(false);

  useEffect(() => {
    if (item && !item.contentType.startsWith("image/")) {
      setLoading(true);
      getText(item.id)
        .then(setText)
        .catch(() => setText("Failed to load"))
        .finally(() => setLoading(false));
    }
  }, [item, getText]);

  const handleShare = async () => {
    if (!item) return;
    setSharing(true);
    try {
      const url = await onShare(item.id);
      await navigator.clipboard.writeText(url);
      showToast("Share link copied to clipboard!", "success");
    } catch {
      showToast("Failed to create share link", "error");
    } finally {
      setSharing(false);
    }
  };

  const handleDelete = async () => {
    if (!item) return;
    if (!confirm("Delete this item?")) return;
    try {
      await onDelete(item.id);
      showToast("Item deleted", "success");
      onClose();
    } catch {
      showToast("Failed to delete", "error");
    }
  };

  if (!item) return null;

  const isImage = item.contentType.startsWith("image/");

  return (
    <div className="fixed inset-0 z-50 bg-black/90 flex flex-col" onClick={onClose}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black/50">
        <div className="flex items-center gap-4">
          <span className="text-white text-sm">{new Date(item.time).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); handleShare(); }}
            disabled={sharing}
            className="p-2 text-white hover:bg-white/20 rounded-lg flex items-center gap-2"
          >
            {sharing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Share2 className="h-5 w-5" />}
            Share
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(); }}
            className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg flex items-center gap-2"
          >
            <Trash2 className="h-5 w-5" />
            Delete
          </button>
          <button onClick={onClose} className="p-2 text-white hover:bg-white/20 rounded-lg">
            <X className="h-6 w-6" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center p-8" onClick={(e) => e.stopPropagation()}>
        {isImage ? (
          <div className="relative max-w-full max-h-full">
            <img
              src={getImageUrl(item.id, "full")}
              alt=""
              className="max-w-full max-h-[80vh] object-contain rounded-lg"
            />
          </div>
        ) : (
          <div className="w-full max-w-3xl bg-white rounded-lg p-6 overflow-auto max-h-[80vh]">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
              </div>
            ) : (
              <pre className="whitespace-pre-wrap font-mono text-sm text-gray-700">{text}</pre>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// Text Compose Modal
// ============================================================================
interface TextComposeModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (text: string) => Promise<void>;
}

function TextComposeModal({ open, onClose, onSubmit }: TextComposeModalProps) {
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim() || submitting) return;
    setSubmitting(true);
    try {
      await onSubmit(text.trim());
      setText("");
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl bg-white rounded-xl shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Compose Text Note</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="p-4">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Write your note here..."
              className="w-full h-64 p-3 rounded-lg border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-3 p-4 border-t bg-gray-50 rounded-b-xl">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-200 rounded-lg"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!text.trim() || submitting}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================================
// Token Reset Result Modal
// ============================================================================
function TokenResetModal({ result, onClose, showToast }: { result: { token: string; expiresAt: number } | null; onClose: () => void; showToast: (message: string, type: ToastType) => void }) {
  if (!result) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result.token);
      showToast("Token copied to clipboard", "success");
    } catch {
      showToast("Copy failed — select and copy manually", "error");
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-lg bg-white rounded-xl shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">New Access Token</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <p className="text-sm text-gray-600">
            Copy this token now — it is shown only once. It is valid until{" "}
            <span className="font-medium">{formatTokenExpiry(result.expiresAt)}</span> (48 hours).
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 px-3 py-2 bg-gray-100 rounded-lg text-sm font-mono break-all">
              {result.token}
            </code>
            <button
              onClick={handleCopy}
              className="px-3 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 flex items-center gap-1"
            >
              <Check className="h-4 w-4" />
              Copy
            </button>
          </div>
        </div>
        <div className="flex justify-end p-4 border-t bg-gray-50 rounded-b-xl">
          <button onClick={onClose} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Main SharePool Component
// ============================================================================
export default function SharePool() {
  const {
    items,
    loading,
    authenticated,
    error: authError,
    expired,
    tokenExp,
    refresh,
    login,
    logout,
    resetToken,
    uploadImage,
    uploadText,
    deleteItem,
    createShareLink,
    getTextContent,
  } = useSharePool();

  // UI State
  const [tab, setTab] = useState<"all" | "image" | "text">("all");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [toastId, setToastId] = useState(0);
  const [viewer, setViewer] = useState<SharePoolItem | null>(null);
  const [composeOpen, setComposeOpen] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [resetResult, setResetResult] = useState<{ token: string; expiresAt: number } | null>(null);
  const [resetting, setResetting] = useState(false);

  // Selection State
  const [selectMode, setSelectMode] = useState(false);
  const [selected, setSelected] = useState<Set<string>>(new Set());

  // Upload State
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Toast helper
  const showToast = useCallback((message: string, type: ToastType) => {
    const id = toastId;
    setToastId((prev) => prev + 1);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3000);
  }, [toastId]);

  const removeToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Handle login
  const handleLogin = async (token: string) => {
    setLoginError("");
    const ok = await login(token);
    if (!ok) {
      setLoginError("Invalid token. Please check and try again.");
    }
  };

  // Handle token reset
  const handleResetToken = async () => {
    if (!confirm("Reset your access token? The current token will stop working immediately.")) return;
    setResetting(true);
    try {
      const issued = await resetToken();
      setResetResult(issued);
      showToast("Access token reset", "success");
    } catch {
      showToast("Failed to reset token", "error");
    } finally {
      setResetting(false);
    }
  };

  // Handle file upload with thumbnail generation
  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);

    for (const file of Array.from(files)) {
      try {
        if (file.type.startsWith("image/")) {
          // Process image: create thumbnail and upload
          const thumbBlob = await createThumbnail(file);
          await uploadImage(file, thumbBlob);
          showToast(`Uploaded: ${file.name}`, "success");
        } else {
          showToast("Unsupported file type", "error");
        }
      } catch {
        showToast(`Upload failed: ${file.name}`, "error");
      }
    }

    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Create thumbnail using canvas (handles HEIC via createImageBitmap)
  const createThumbnail = async (file: File): Promise<Blob> => {
    const bitmap = await createImageBitmap(file);
    const canvas = document.createElement("canvas");
    const maxSize = 300;
    const scale = Math.min(maxSize / bitmap.width, maxSize / bitmap.height, 1);
    canvas.width = bitmap.width * scale;
    canvas.height = bitmap.height * scale;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Failed to create thumbnail"));
        },
        "image/jpeg",
        0.8
      );
    });
  };

  // Handle text compose
  const handleCompose = async (text: string) => {
    try {
      await uploadText(text);
      showToast("Note saved!", "success");
    } catch {
      showToast("Failed to save note", "error");
      throw new Error("Upload failed");
    }
  };

  // Handle batch delete
  const handleBatchDelete = async () => {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} item(s)?`)) return;

    try {
      for (const id of selected) {
        await deleteItem(id);
      }
      showToast(`Deleted ${selected.size} item(s)`, "success");
      setSelected(new Set());
      setSelectMode(false);
    } catch {
      showToast("Some deletions failed", "error");
    }
  };

  // Toggle selection
  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Filter items by tab
  const filteredItems = items.filter((item) => {
    if (tab === "all") return true;
    if (tab === "image") return item.contentType.startsWith("image/");
    return !item.contentType.startsWith("image/");
  });

  const imageItems = filteredItems.filter((i) => i.contentType.startsWith("image/"));
  const textItems = filteredItems.filter((i) => !i.contentType.startsWith("image/"));

  // Login gate
  if (!authenticated) {
    return (
      <div className="container mx-auto px-4 py-8">
        <SEO title="SharePool" description="Share images and text across devices" />
        <LoginGate onLogin={handleLogin} loading={loading} error={loginError || authError || ""} expired={expired} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO title="SharePool" description="Share images and text across devices" />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-blue-100">
            <ImageIcon className="h-8 w-8 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">SharePool</h1>
            <p className="text-sm text-gray-500">
              {items.length} items
              {tokenExp > 0 && (
                <span className="ml-2 text-xs text-gray-400">
                  · token valid until {formatTokenExpiry(tokenExp)}
                </span>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => refresh()}
            disabled={loading}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
          </button>
          <button
            onClick={() => { setSelectMode(!selectMode); setSelected(new Set()); }}
            className={`px-4 py-2 rounded-lg flex items-center gap-2 ${
              selectMode ? "bg-blue-100 text-blue-700" : "text-gray-600 hover:bg-gray-100"
            }`}
          >
            {selectMode ? "Cancel Selection" : "Select"}
          </button>
          {selectMode && selected.size > 0 && (
            <button
              onClick={handleBatchDelete}
              className="px-4 py-2 bg-red-600 text-white rounded-lg flex items-center gap-2 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4" />
              Delete ({selected.size})
            </button>
          )}
          <button
            onClick={handleResetToken}
            disabled={resetting}
            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50"
            title="Reset access token"
          >
            {resetting ? <Loader2 className="h-5 w-5 animate-spin" /> : <KeyRound className="h-5 w-5" />}
          </button>
          <button onClick={logout} className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg" title="Logout">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 mb-6 border-b">
        {(["all", "image", "text"] as const).map((tabName) => (
          <button
            key={tabName}
            onClick={() => setTab(tabName)}
            className={`px-4 py-2 border-b-2 transition-colors ${
              tab === tabName
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tabName === "all" ? "All" : tabName === "image" ? "Images" : "Text"}
            <span className="ml-2 text-xs">
              {tabName === "all" ? items.length : tabName === "image" ? imageItems.length : textItems.length}
            </span>
          </button>
        ))}
      </div>

      {/* Upload Area */}
      <div
        className={`mb-6 border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
          dragOver ? "border-blue-500 bg-blue-50" : "border-gray-300 hover:border-gray-400"
        }`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleUpload(e.dataTransfer.files);
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => handleUpload(e.target.files)}
          className="hidden"
        />
        <div className="flex flex-col items-center gap-3">
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 text-blue-600 animate-spin" />
              <p className="text-gray-600">Uploading...</p>
            </>
          ) : (
            <>
              <Upload className="h-10 w-10 text-gray-400" />
              <div>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-blue-600 hover:underline font-medium"
                >
                  Click to upload
                </button>
                <span className="text-gray-500"> or drag and drop</span>
              </div>
              <p className="text-xs text-gray-400">Images (HEIC, PNG, JPEG, WebP, GIF)</p>
            </>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => setComposeOpen(true)}
          className="px-4 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2 hover:bg-green-700"
        >
          <Plus className="h-4 w-4" />
          Compose Note
        </button>
      </div>

      {/* Content Grid */}
      {(tab === "all" || tab === "image") && imageItems.length > 0 && (
        <div className="mb-8">
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            {tab === "all" ? "Images" : ""}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {imageItems.map((item) => (
              <ImageCell
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onSelect={toggleSelect}
                onClick={setViewer}
                selectMode={selectMode}
              />
            ))}
          </div>
        </div>
      )}

      {/* Text Notes */}
      {(tab === "all" || tab === "text") && textItems.length > 0 && (
        <div>
          <h2 className="text-lg font-medium text-gray-700 mb-4">
            {tab === "all" ? "Text Notes" : ""}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {textItems.map((item) => (
              <TextCell
                key={item.id}
                item={item}
                selected={selected.has(item.id)}
                onSelect={toggleSelect}
                onClick={setViewer}
                selectMode={selectMode}
                getText={getTextContent}
              />
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredItems.length === 0 && !loading && (
        <div className="text-center py-12 text-gray-500">
          <ImageIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
          <p>No items yet. Upload an image or compose a note to get started.</p>
        </div>
      )}

      {/* Modals */}
      <ViewerModal
        item={viewer}
        onClose={() => setViewer(null)}
        onShare={createShareLink}
        onDelete={deleteItem}
        getText={getTextContent}
        showToast={showToast}
      />

      <TextComposeModal
        open={composeOpen}
        onClose={() => setComposeOpen(false)}
        onSubmit={handleCompose}
      />

      <TokenResetModal result={resetResult} onClose={() => setResetResult(null)} showToast={showToast} />

      {/* Toasts */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
