import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { Upload, X, Download, FileImage, RefreshCw, Trash2, Archive } from "lucide-react";
import JSZip from "jszip";

interface CompressedImage {
  id: string;
  originalFile: File;
  compressedBlob: Blob | null;
  status: "pending" | "processing" | "done" | "error";
  originalPreview: string;
  compressedPreview: string | null;
  error?: string;
}

export default function ImageCompressor() {
  const { t } = useTranslation();
  const [images, setImages] = useState<CompressedImage[]>([]);
  const [scale, setScale] = useState<number>(75);
  const [quality, setQuality] = useState<number>(0.8);
  const [format, setFormat] = useState<"original" | "image/jpeg" | "image/png" | "image/webp">("original");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const newImages: CompressedImage[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      originalFile: file,
      compressedBlob: null,
      status: "pending",
      originalPreview: URL.createObjectURL(file),
      compressedPreview: null,
    }));

    setImages((prev) => [...prev, ...newImages]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    handleFiles(e.dataTransfer.files);
  };

  const processImage = async (img: CompressedImage) => {
    return new Promise<CompressedImage>((resolve) => {
      const image = new Image();
      image.src = img.originalPreview;
      image.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        const targetScale = scale / 100;
        const width = image.width * targetScale;
        const height = image.height * targetScale;
        
        canvas.width = width;
        canvas.height = height;
        
        if (ctx) {
          ctx.drawImage(image, 0, 0, width, height);
        }

        let outputFormat = format;
        if (format === "original") {
          if (img.originalFile.type === "image/png" || img.originalFile.type === "image/webp") {
            outputFormat = img.originalFile.type as any;
          } else {
            outputFormat = "image/jpeg";
          }
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                ...img,
                compressedBlob: blob,
                compressedPreview: URL.createObjectURL(blob),
                status: "done",
              });
            } else {
              resolve({ ...img, status: "error", error: "Compression failed" });
            }
          },
          outputFormat,
          quality
        );
      };
      image.onerror = () => {
        resolve({ ...img, status: "error", error: "Failed to load image" });
      };
    });
  };

  const processAll = async () => {
    setIsProcessing(true);
    const updatedImages = [...images];
    
    // Process strictly sequentially or use Promise.all. 
    // Promise.all is better for performance but UI updates might feel jumpy.
    // Let's use map and Promise.all to update state once or incrementally.
    // For better UX, let's update state as we go, but we can process in parallel.
    
    const promises = updatedImages.map(async (img) => {
      if (img.status === "done") {
         // Re-process if settings changed? Yes, let's assume "Process All" means re-run everything that is pending or done but with new settings.
         // Actually, usually user wants to apply settings to everything.
      }
      // Let's mark all as processing first
      return img;
    });

    // Actually, simpler approach: Filter out already processing ones? 
    // Let's just re-process everything that matches the current list.
    
    // First, set all to processing visually (optional, but good feedback)
    setImages(prev => prev.map(img => ({ ...img, status: "processing" })));

    const results = await Promise.all(
      images.map(img => processImage(img))
    );
    
    setImages(results);
    setIsProcessing(false);
  };
  
  // Auto-process new images or on setting change? 
  // Usually explicit "Start" or auto. Let's make it manual "Compress" button or auto? 
  // The requirement says "Batch processing". 
  // Let's adding a "Compress All" button. But also maybe auto-compress on add?
  // Let's stick to a "Compress" button for clarity, especially since settings might change.
  // Actually, reactive is cooler. Let's try to make it reactive to settings changes with a debounce?
  // Or just a big "Compress" button. "Compress" button is safer for performance with many large images.
  
  const removeImage = (id: string) => {
    setImages((prev) => {
      const target = prev.find(i => i.id === id);
      if (target) {
        URL.revokeObjectURL(target.originalPreview);
        if (target.compressedPreview) URL.revokeObjectURL(target.compressedPreview);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const downloadImage = (img: CompressedImage) => {
    if (!img.compressedBlob) return;
    const link = document.createElement("a");
    link.href = img.compressedPreview!;
    
    // Determine extension
    let ext = "jpg";
    if (img.compressedBlob.type === "image/png") ext = "png";
    if (img.compressedBlob.type === "image/webp") ext = "webp";
    
    const originalName = img.originalFile.name.substring(0, img.originalFile.name.lastIndexOf("."));
    link.download = `${originalName}_compressed.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    let count = 0;

    images.forEach((img) => {
      if (img.status === "done" && img.compressedBlob) {
        let ext = "jpg";
        if (img.compressedBlob.type === "image/png") ext = "png";
        if (img.compressedBlob.type === "image/webp") ext = "webp";
        const originalName = img.originalFile.name.substring(0, img.originalFile.name.lastIndexOf("."));
        zip.file(`${originalName}_compressed.${ext}`, img.compressedBlob);
        count++;
      }
    });

    if (count === 0) return;

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "compressed_images.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatSize = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO
        title={t("tools.image-compressor.title", "Image Compressor")}
        description={t("tools.image-compressor.desc", "Compress and resize JPG, PNG, WebP images locally.")}
      />

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("tools.image-compressor.title", "Image Compressor")}
        </h1>
        <p className="text-gray-600">
          {t("tools.image-compressor.subtitle", "Compress, resize, and convert images locally. No files uploaded to server.")}
        </p>
      </div>

      {/* Settings Panel */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Format */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("tools.image-compressor.format", "Output Format")}
            </label>
            <select
              value={format}
              onChange={(e) => setFormat(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="original">{t("tools.image-compressor.keep_original", "Keep Original")}</option>
              <option value="image/jpeg">JPEG</option>
              <option value="image/png">PNG</option>
              <option value="image/webp">WebP</option>
            </select>
          </div>

          {/* Scale */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("tools.image-compressor.scale", "Scale")}: {scale}%
            </label>
            <input
              type="range"
              min="10"
              max="100"
              value={scale}
              onChange={(e) => setScale(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Quality */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("tools.image-compressor.quality", "Quality")}: {Math.round(quality * 100)}%
            </label>
            <input
              type="range"
              min="0.1"
              max="1.0"
              step="0.05"
              value={quality}
              onChange={(e) => setQuality(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Upload Area */}
      <div
        className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 mb-6"
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-lg font-medium text-gray-700 mb-1">
          {t("tools.image-compressor.drag_drop", "Drag & drop images here, or click to select")}
        </p>
        <p className="text-sm text-gray-500">
          JPG, PNG, WebP supported
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
          <div className="text-sm text-gray-600">
            {images.length} {t("tools.image-compressor.images_selected", "images selected")}
          </div>
          <div className="space-x-4">
            <button
              onClick={processAll}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 inline-flex"
            >
              <RefreshCw className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
              {t("tools.image-compressor.compress_all", "Compress All")}
            </button>
            <button
              onClick={downloadAll}
              disabled={images.filter(i => i.status === "done").length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 inline-flex"
            >
              <Archive className="w-4 h-4" />
              {t("tools.image-compressor.download_all", "Download All")}
            </button>
            <button
              onClick={() => setImages([])}
              className="px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 flex items-center gap-2 inline-flex"
            >
              <Trash2 className="w-4 h-4" />
              {t("common.clear", "Clear")}
            </button>
          </div>
        </div>
      )}

      {/* Image List */}
      <div className="space-y-4">
        {images.map((img) => (
          <div key={img.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
            {/* Thumbnail */}
            <div className="w-20 h-20 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative">
              <img
                src={img.compressedPreview || img.originalPreview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            {/* Info */}
            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-gray-900 truncate" title={img.originalFile.name}>
                {img.originalFile.name}
              </h3>
              <div className="text-sm text-gray-500 mt-1 flex items-center gap-4">
                <span>
                  {t("tools.image-compressor.original", "Original")}: {formatSize(img.originalFile.size)}
                </span>
                {img.status === "done" && img.compressedBlob && (
                  <>
                    <span className="text-gray-300">|</span>
                    <span className="font-medium text-green-600">
                      {t("tools.image-compressor.compressed", "Compressed")}: {formatSize(img.compressedBlob.size)}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">
                      -{Math.round((1 - img.compressedBlob.size / img.originalFile.size) * 100)}%
                    </span>
                  </>
                )}
              </div>
              {img.error && (
                <div className="text-sm text-red-500 mt-1">{img.error}</div>
              )}
            </div>

            {/* Actions */}
            <div className="flex-shrink-0">
              {img.status === "done" && (
                <button
                  onClick={() => downloadImage(img)}
                  className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                  title={t("common.download", "Download")}
                >
                  <Download className="w-5 h-5" />
                </button>
              )}
              <button
                onClick={() => removeImage(img.id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
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
