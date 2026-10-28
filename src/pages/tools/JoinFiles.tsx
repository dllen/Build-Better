import { useState, useRef, useCallback } from "react";
import { Link2, Download, Upload, File, GripVertical, X, ArrowUp, ArrowDown } from "lucide-react";
import { EditorSplitLayout } from "@/components/common/EditorSplitLayout";

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function JoinFiles() {
  const [files, setFiles] = useState<File[]>([]);
  const [mergedBlob, setMergedBlob] = useState<Blob | null>(null);
  const [mergedName, setMergedName] = useState("");
  const [outputName, setOutputName] = useState("merged");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const totalSize = files.reduce((sum, f) => sum + f.size, 0);

  const handleFilesAdded = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newFiles = Array.from(e.target.files || []);
    if (newFiles.length === 0) return;
    setFiles((prev) => {
      const combined = [...prev, ...newFiles];
      // Derive output name from first file's name without extension
      if (prev.length === 0) {
        const base = newFiles[0].name.replace(/\.[^.]+$/, "");
        setOutputName(`${base}_merged`);
      }
      return combined;
    });
    setMergedBlob(null);
  }, []);

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
    setMergedBlob(null);
  };

  const moveFile = (index: number, direction: -1 | 1) => {
    setFiles((prev) => {
      const next = [...prev];
      const newIndex = index + direction;
      if (newIndex < 0 || newIndex >= next.length) return prev;
      [next[index], next[newIndex]] = [next[newIndex], next[index]];
      return next;
    });
    setMergedBlob(null);
  };

  const handleJoin = () => {
    if (files.length === 0) return;
    const blob = new Blob(files);
    setMergedBlob(blob);
    setMergedName(`${outputName}${getExtension(files[0].name)}`);
  };

  const getExtension = (filename: string) => {
    const dot = filename.lastIndexOf(".");
    return dot > 0 ? filename.substring(dot) : "";
  };

  const download = () => {
    if (!mergedBlob) return;
    const url = URL.createObjectURL(mergedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = mergedName;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <EditorSplitLayout
      title={
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <Link2 className="h-5 w-5" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Join Files</h1>
        </div>
      }
      toolbar={
        <div className="flex flex-wrap items-center gap-3">
          <input
            ref={fileInputRef}
            type="file"
            multiple
            onChange={handleFilesAdded}
            className="text-sm text-muted-foreground file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary/10 file:text-primary hover:file:bg-primary/10 file:cursor-pointer"
          />

          <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
            <span>Output name:</span>
            <input
              type="text"
              value={outputName}
              onChange={(e) => setOutputName(e.target.value)}
              className="w-36 rounded-lg border border-border px-2 py-1.5 text-sm focus:border-border focus:ring-1 focus:ring-ring outline-none"
              placeholder="merged"
            />
          </div>

          <button
            onClick={handleJoin}
            disabled={files.length < 2}
            className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Link2 className="h-3.5 w-3.5" />
            Join
          </button>
        </div>
      }
      inputLabel={
        files.length > 0 ? (
          <span>
            Files to Join{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({files.length} files · {formatSize(totalSize)})
            </span>
          </span>
        ) : (
          "Files to Join"
        )
      }
      inputActions={
        files.length > 0 ? (
          <button
            onClick={() => {
              setFiles([]);
              setMergedBlob(null);
            }}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-destructive rounded transition-colors"
          >
            <X className="h-3 w-3" />
            Clear all
          </button>
        ) : undefined
      }
      input={
        <div className="h-full overflow-auto rounded-lg border border-border bg-card">
          {files.length > 0 ? (
            <div className="p-2 space-y-1">
              {files.map((f, i) => (
                <div
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted hover:bg-muted transition-colors group"
                >
                  <div className="flex items-center gap-0.5 shrink-0">
                    <button
                      onClick={() => moveFile(i, -1)}
                      disabled={i === 0}
                      className="p-0.5 text-muted-foreground hover:text-muted-foreground disabled:opacity-30 rounded"
                    >
                      <ArrowUp className="h-3 w-3" />
                    </button>
                    <button
                      onClick={() => moveFile(i, 1)}
                      disabled={i === files.length - 1}
                      className="p-0.5 text-muted-foreground hover:text-muted-foreground disabled:opacity-30 rounded"
                    >
                      <ArrowDown className="h-3 w-3" />
                    </button>
                  </div>
                  <GripVertical className="h-4 w-4 text-muted-foreground shrink-0" />
                  <File className="h-4 w-4 text-primary shrink-0" />
                  <span className="text-sm font-mono text-muted-foreground truncate flex-1 min-w-0">
                    {f.name}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{formatSize(f.size)}</span>
                  <button
                    onClick={() => removeFile(i)}
                    className="shrink-0 p-1 text-muted-foreground hover:text-destructive rounded opacity-0 group-hover:opacity-100 transition-colors transition-opacity"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
              <div className="text-center space-y-2">
                <Upload className="h-12 w-12 text-muted-foreground mx-auto" />
                <p>Add files to join them together</p>
                <p className="text-xs">Files are joined in the order shown above</p>
              </div>
            </div>
          )}
        </div>
      }
      outputLabel={
        mergedBlob ? (
          <span>
            Merged File{" "}
            <span className="text-xs font-normal text-muted-foreground">
              ({formatSize(mergedBlob.size)})
            </span>
          </span>
        ) : (
          "Merged File"
        )
      }
      outputActions={
        mergedBlob ? (
          <button
            onClick={download}
            className="inline-flex items-center gap-1 px-2 py-1 text-xs text-muted-foreground hover:text-muted-foreground hover:bg-muted rounded transition-colors"
          >
            <Download className="h-3.5 w-3.5" />
            Download
          </button>
        ) : undefined
      }
      output={
        <div className="h-full flex items-center justify-center rounded-lg border-2 border-dashed border-border bg-muted/50 p-6">
          {mergedBlob ? (
            <div className="text-center space-y-3">
              <File className="h-12 w-12 text-primary mx-auto" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">{mergedName}</p>
                <p className="text-xs text-muted-foreground">{formatSize(mergedBlob.size)}</p>
              </div>
              <p className="text-xs text-success font-medium">
                ✓ {files.length} files joined successfully
              </p>
            </div>
          ) : (
            <div className="text-center space-y-2">
              <Link2 className="h-12 w-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">
                {files.length > 0
                  ? `Click Join to merge ${files.length} files`
                  : "Add at least 2 files to join"}
              </p>
            </div>
          )}
        </div>
      }
    />
  );
}