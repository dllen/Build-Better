import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/seo";
import { Upload, X, Download, RefreshCw, Archive, Settings } from "lucide-react";

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  convertedBlob: Blob | null;
  convertedPreview: string | null;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
}

type TargetFormat = "image/jpeg" | "image/png" | "image/webp";

export default function ImageConverter() {
  const { t } = useTranslation();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [targetFormat, setTargetFormat] = useState<TargetFormat>("image/png");
  const [backgroundColor, setBackgroundColor] = useState<string>("#FFFFFF");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const newImages: ImageItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      file: file,
      preview: URL.createObjectURL(file),
      convertedBlob: null,
      convertedPreview: null,
      status: "pending",
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find(i => i.id === id);
      if (target) {
        URL.revokeObjectURL(target.preview);
        if (target.convertedPreview) URL.revokeObjectURL(target.convertedPreview);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const convertImage = async (item: ImageItem): Promise<ImageItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = item.preview;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          // If converting to JPEG (which doesn't support transparency), fill background
          // Also useful if user wants to flatten PNGs to a specific color
          if (targetFormat === "image/jpeg") {
            ctx.fillStyle = backgroundColor;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
          }
          
          ctx.drawImage(img, 0, 0);
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                ...item,
                convertedBlob: blob,
                convertedPreview: URL.createObjectURL(blob),
                status: "done",
              });
            } else {
              resolve({ ...item, status: "error", error: "Conversion failed" });
            }
          },
          targetFormat,
          0.92 // Quality
        );
      };
      img.onerror = () => {
        resolve({ ...item, status: "error", error: "Failed to load image" });
      };
    });
  };

  const processAll = async () => {
    setIsProcessing(true);
    
    // Mark pending
    setImages(prev => prev.map(img => ({ ...img, status: "processing" })));

    const results = await Promise.all(
      images.map(img => convertImage(img))
    );
    
    setImages(results);
    setIsProcessing(false);
  };

  const downloadImage = (img: ImageItem) => {
    if (!img.convertedBlob) return;
    const link = document.createElement("a");
    link.href = img.convertedPreview!;
    
    let ext = "png";
    if (targetFormat === "image/jpeg") ext = "jpg";
    if (targetFormat === "image/webp") ext = "webp";
    
    const originalName = img.file.name.substring(0, img.file.name.lastIndexOf("."));
    link.download = `${originalName}.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = async () => {
    const JSZip = (await import("jszip")).default;
    const zip = new JSZip();
    let count = 0;

    images.forEach((img) => {
      if (img.status === "done" && img.convertedBlob) {
        let ext = "png";
        if (targetFormat === "image/jpeg") ext = "jpg";
        if (targetFormat === "image/webp") ext = "webp";
        
        const originalName = img.file.name.substring(0, img.file.name.lastIndexOf("."));
        zip.file(`${originalName}.${ext}`, img.convertedBlob);
        count++;
      }
    });

    if (count === 0) return;

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "converted_images.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const getFormatLabel = (fmt: TargetFormat) => {
    switch (fmt) {
      case "image/jpeg": return "JPG";
      case "image/png": return "PNG";
      case "image/webp": return "WebP";
      default: return "";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO
        title={t("tools.image-converter.title", "Image Format Converter")}
        description={t("tools.image-converter.desc", "Convert images between JPG, PNG, and WebP formats.")}
      />

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-foreground mb-2">
          {t("tools.image-converter.title", "Image Format Converter")}
        </h1>
        <p className="text-muted-foreground">
          {t("tools.image-converter.subtitle", "Convert between JPG, PNG, and WebP. Support for background color filling.")}
        </p>
      </div>

      {/* Settings */}
      <div className="bg-card p-6 rounded-xl border border-border mb-6">
        <h3 className="text-lg font-medium text-foreground mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-muted-foreground" />
          {t("tools.image-converter.settings", "Conversion Settings")}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-muted-foreground mb-2">
              {t("tools.image-converter.target_format", "Target Format")}
            </label>
            <div className="flex gap-2">
              {(["image/png", "image/jpeg", "image/webp"] as TargetFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setTargetFormat(fmt)}
                  className={`flex-1 px-4 py-2 text-sm rounded-md border transition-colors ${ targetFormat === fmt ? "bg-primary/10 border-border text-primary" : "border-border hover:bg-muted text-muted-foreground" }`}
                >
                  {getFormatLabel(fmt)}
                </button>
              ))}
            </div>
          </div>

          {targetFormat === "image/jpeg" && (
            <div>
              <label className="block text-sm font-medium text-muted-foreground mb-2">
                {t("tools.image-converter.bg_color", "Background Color (for Transparency)")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-10 w-10 p-1 rounded border border-border cursor-pointer"
                />
                <input
                  type="text"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="flex-grow px-3 py-2 border border-border rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-border rounded-xl p-8 text-center hover:border-border transition-colors cursor-pointer bg-muted mb-6"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg font-medium text-muted-foreground mb-1">
          {t("tools.image-converter.drag_drop", "Drag & drop images here, or click to select")}
        </p>
        <p className="text-sm text-muted-foreground">
          JPG, PNG, WebP supported (HEIC not supported)
        </p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/jpeg,image/png,image/webp"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Action Bar */}
      {images.length > 0 && (
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-muted-foreground">
            {images.length} {t("tools.image-converter.images_selected", "images selected")}
          </div>
          <div className="space-x-4">
            <button
              onClick={processAll}
              disabled={isProcessing}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary disabled:opacity-50 flex items-center gap-2 inline-flex"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
              {t("tools.image-converter.convert_all", "Convert All")}
            </button>
            <button
              onClick={downloadAll}
              disabled={images.filter(i => i.status === "done").length === 0}
              className="px-4 py-2 bg-success text-success-foreground rounded-md hover:bg-success disabled:opacity-50 flex items-center gap-2 inline-flex"
            >
              <Archive className="w-4 h-4" />
              {t("tools.image-converter.download_all", "Download All")}
            </button>
            <button
              onClick={() => setImages([])}
              className="px-4 py-2 text-destructive border border-border rounded-md hover:bg-destructive/10 flex items-center gap-2 inline-flex"
            >
              <X className="w-4 h-4" />
              {t("common.clear", "Clear")}
            </button>
          </div>
        </div>
      )}

      {/* Image List */}
      <div className="space-y-4">
        {images.map((img) => (
          <div key={img.id} className="bg-card p-4 rounded-lg border border-border flex items-center gap-4">
            <div className="w-20 h-20 flex-shrink-0 bg-muted rounded-md overflow-hidden relative">
              <img
                src={img.convertedPreview || img.preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-foreground truncate" title={img.file.name}>
                {img.file.name}
              </h3>
              <div className="text-sm text-muted-foreground mt-1">
                {t("tools.image-converter.original_size", "Size")}: {(img.file.size / 1024).toFixed(1)} KB
              </div>
              {img.status === "done" && img.convertedBlob && (
                <div className="text-sm text-success mt-1">
                  {t("tools.image-converter.converted_to", "Converted to")} {getFormatLabel(targetFormat)} ({(img.convertedBlob.size / 1024).toFixed(1)} KB)
                </div>
              )}
              {img.error && (
                <div className="text-sm text-destructive mt-1">{img.error}</div>
              )}
            </div>

            <div className="flex-shrink-0">
              {img.status === "done" && (
                <button
                  onClick={() => downloadImage(img)}
                  className="p-2 text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-full transition-colors"
                  title={t("common.download", "Download")}
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => removeImage(img.id)}
                className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-full transition-colors"
                title={t("common.remove", "Remove")}
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
