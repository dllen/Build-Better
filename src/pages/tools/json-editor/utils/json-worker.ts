// src/pages/tools/json-editor/utils/json-worker.ts

const workerScript = `
self.onmessage = function(e) {
  var id = e.data.id;
  var data = e.data.data;
  try {
    if (data.type === 'format') {
      var parsed = JSON.parse(data.payload);
      var result = JSON.stringify(parsed, null, data.indent || 2);
      self.postMessage({ id: id, ok: true, payload: result });
    } else if (data.type === 'minify') {
      var parsed = JSON.parse(data.payload);
      self.postMessage({ id: id, ok: true, payload: JSON.stringify(parsed) });
    } else if (data.type === 'validate') {
      JSON.parse(data.payload);
      self.postMessage({ id: id, ok: true, valid: true, error: null });
    }
  } catch (err) {
    if (data.type === 'validate') {
      self.postMessage({ id: id, ok: true, valid: false, error: err.message });
    } else {
      self.postMessage({ id: id, ok: false, error: err.message });
    }
  }
};
`;

let worker: Worker | null = null;
let nextId = 0;

function getWorker(): Worker {
  if (!worker) {
    const blob = new Blob([workerScript], { type: "application/javascript" });
    worker = new Worker(URL.createObjectURL(blob));
  }
  return worker;
}

export const jsonWorker = {
  async format(text: string, indent = 2): Promise<string> {
    const id = String(nextId++);
    const w = getWorker();
    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.data.id !== id) return;
        w.removeEventListener("message", handler);
        if (e.data.ok) resolve(e.data.payload);
        else reject(new Error(e.data.error));
      };
      w.addEventListener("message", handler);
      w.postMessage({ id, data: { type: "format", payload: text, indent } });
    });
  },

  async minify(text: string): Promise<string> {
    const id = String(nextId++);
    const w = getWorker();
    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.data.id !== id) return;
        w.removeEventListener("message", handler);
        if (e.data.ok) resolve(e.data.payload);
        else reject(new Error(e.data.error));
      };
      w.addEventListener("message", handler);
      w.postMessage({ id, data: { type: "minify", payload: text } });
    });
  },

  async validate(text: string): Promise<{ valid: boolean; error: string | null }> {
    const id = String(nextId++);
    const w = getWorker();
    return new Promise((resolve, reject) => {
      const handler = (e: MessageEvent) => {
        if (e.data.id !== id) return;
        w.removeEventListener("message", handler);
        if (e.data.ok) resolve({ valid: e.data.valid, error: e.data.error });
        else reject(new Error(e.data.error));
      };
      w.addEventListener("message", handler);
      w.postMessage({ id, data: { type: "validate", payload: text } });
    });
  },

  destroy(): void {
    if (worker) { worker.terminate(); worker = null; }
  },
};
