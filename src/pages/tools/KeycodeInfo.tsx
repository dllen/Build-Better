import { useEffect, useMemo, useRef, useState } from "react";
import { Keyboard, ClipboardCopy, Check } from "lucide-react";

type EvInfo = {
  type: string;
  key: string;
  code: string;
  keyCode: number;
  which: number;
  location: number;
  altKey: boolean;
  ctrlKey: boolean;
  shiftKey: boolean;
  metaKey: boolean;
  repeat: boolean;
  isComposing: boolean;
  time: number;
};

function locName(n: number): string {
  if (n === 1) return "Left";
  if (n === 2) return "Right";
  if (n === 3) return "Numpad";
  return "Standard";
}

export default function KeycodeInfo() {
  const [last, setLast] = useState<EvInfo | null>(null);
  const [history, setHistory] = useState<EvInfo[]>([]);
  const [copied, setCopied] = useState("");
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const handler = (e: KeyboardEvent) => {
      const info: EvInfo = {
        type: e.type,
        key: e.key,
        code: e.code,
        keyCode: (e as unknown as { keyCode?: number }).keyCode || 0,
        which: (e as unknown as { which?: number }).which || 0,
        location: e.location,
        altKey: e.altKey,
        ctrlKey: e.ctrlKey,
        shiftKey: e.shiftKey,
        metaKey: e.metaKey,
        repeat: e.repeat,
        isComposing: e.isComposing,
        time: Date.now(),
      };
      setLast(info);
      setHistory((h) => [info, ...h].slice(0, 50));
    };
    el.addEventListener("keydown", handler);
    el.addEventListener("keyup", handler);
    el.addEventListener("keypress", handler);
    el.focus();
    return () => {
      el.removeEventListener("keydown", handler);
      el.removeEventListener("keyup", handler);
      el.removeEventListener("keypress", handler);
    };
  }, []);

  const json = useMemo(() => (last ? JSON.stringify(last, null, 2) : ""), [last]);

  function copy(text: string) {
    if (!text) return;
    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopied("ok");
        setTimeout(() => setCopied(""), 1000);
      })
      .catch(() => {});
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-gray-100 text-gray-600">
          <Keyboard className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">Keycode 信息</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="font-medium">按键捕获</div>
          <div
            ref={boxRef}
            tabIndex={0}
            className="rounded-md border border-dashed border-gray-300 px-3 py-16 text-center select-none outline-none focus:ring-2 focus:ring-blue-400"
          >
            按下任意键
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              type: {last?.type || "—"}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              key: {last?.key || "—"}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              code: {last?.code || "—"}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              keyCode: {last?.keyCode ?? "—"}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              which: {last?.which ?? "—"}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              location: {last ? `${last.location} (${locName(last.location)})` : "—"}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              alt: {last?.altKey ? "true" : "false"}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              ctrl: {last?.ctrlKey ? "true" : "false"}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              shift: {last?.shiftKey ? "true" : "false"}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              meta: {last?.metaKey ? "true" : "false"}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              repeat: {last?.repeat ? "true" : "false"}
            </div>
            <div className="rounded-md border border-gray-200 px-3 py-2 text-sm">
              isComposing: {last?.isComposing ? "true" : "false"}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex-1 rounded-md border border-gray-200 px-3 py-2 font-mono text-xs break-all">
              {json || "—"}
            </div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => copy(json)}
              disabled={!json}
            >
              <ClipboardCopy className="h-4 w-4" /> 复制{" "}
              {copied ? <Check className="h-4 w-4 text-green-600" /> : null}
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <div className="font-medium">历史记录</div>
            <button
              className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-md text-sm"
              onClick={() => setHistory([])}
              disabled={!history.length}
            >
              清空
            </button>
          </div>
          <div className="rounded-md border border-gray-200 p-3 space-y-2">
            {history.length
              ? history.map((e, i) => (
                  <div key={i} className="text-xs font-mono grid grid-cols-2 gap-2">
                    <div>{new Date(e.time).toLocaleTimeString()}</div>
                    <div className="truncate">
                      {e.type} {e.key} {e.code} kc={e.keyCode} loc={e.location}
                    </div>
                  </div>
                ))
              : "—"}
          </div>
        </div>
      </div>
    </div>
  );
}
