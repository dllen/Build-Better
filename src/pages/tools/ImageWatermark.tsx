import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { Upload, X, Download, Stamp, RefreshCw, Archive, Settings, Type } from "lucide-react";
import JSZip from "jszip";

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  processedBlob: Blob | null;
  processedPreview: string | null;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
}

type Position = "center" | "top-left" | "top-right" | "bottom-left" | "bottom-right";

export default function ImageWatermark() {
  const { t } = useTranslation();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [text, setText] = useState("Watermark");
  const [fontSize, setFontSize] = useState(48);
  const [color, setColor] = useState("#ffffff");
  const [opacity, setOpacity] = useState(0.5);
  const [rotation, setRotation] = useState(-45);
  const [position, setPosition] = useState<Position>("center");
  const [isProcessing, setIsProcessing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const newImages: ImageItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      file: file,
      preview: URL.createObjectURL(file),
      processedBlob: null,
      processedPreview: null,
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
        if (target.processedPreview) URL.revokeObjectURL(target.processedPreview);
      }
      return prev.filter((i) => i.id !== id);
    });
  };

  const processImage = async (item: ImageItem): Promise<ImageItem> => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = item.preview;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        
        canvas.width = img.width;
        canvas.height = img.height;
        
        if (ctx) {
          // Draw original image
          ctx.drawImage(img, 0, 0);

          // Configure text style
          // Scale font size relative to image width to keep consistency? 
          // Or just use raw pixels? Raw pixels can be tricky if images vary wildly in size.
          // Let's use the slider as a "base" size but scale slightly with image size or just raw.
          // For now, let's treat the slider as relative size to image width (e.g. 5% of width) or just pixels.
          // Usually raw pixels is confusing if mixing 4k and 500px images. 
          // Let's try to interpret fontSize as "percent of image height/width" roughly, or just use a multiplier.
          // Let's use: fontSize value is roughly "percent of image width" / 2 ? 
          // Or just keep it simple: Raw Pixels, but maybe default large.
          // Actually, let's use a scale factor. Let's say slider 10-100 represents 1%-10% of image width.
          const calculatedFontSize = (img.width * fontSize) / 500; // Just a heuristic
          
          ctx.font = `bold ${calculatedFontSize}px Arial, sans-serif`;
          ctx.fillStyle = color;
          ctx.globalAlpha = opacity;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";

          // Calculate position
          let x = canvas.width / 2;
          let y = canvas.height / 2;
          const padding = calculatedFontSize; // Padding from edges

          switch (position) {
            case "top-left":
              x = padding + (ctx.measureText(text).width / 2);
              y = padding;
              break;
            case "top-right":
              x = canvas.width - padding - (ctx.measureText(text).width / 2);
              y = padding;
              break;
            case "bottom-left":
              x = padding + (ctx.measureText(text).width / 2);
              y = canvas.height - padding;
              break;
            case "bottom-right":
              x = canvas.width - padding - (ctx.measureText(text).width / 2);
              y = canvas.height - padding;
              break;
            case "center":
            default:
              x = canvas.width / 2;
              y = canvas.height / 2;
              break;
          }

          // Apply rotation
          ctx.save();
          ctx.translate(x, y);
          ctx.rotate((rotation * Math.PI) / 180);
          ctx.fillText(text, 0, 0);
          ctx.restore();
        }

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve({
                ...item,
                processedBlob: blob,
                processedPreview: URL.createObjectURL(blob),
                status: "done",
              });
            } else {
              resolve({ ...item, status: "error", error: "Processing failed" });
            }
          },
          item.file.type === "image/png" ? "image/png" : "image/jpeg",
          0.95
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
      images.map(img => processImage(img))
    );
    
    setImages(results);
    setIsProcessing(false);
  };

  const downloadImage = (img: ImageItem) => {
    if (!img.processedBlob) return;
    const link = document.createElement("a");
    link.href = img.processedPreview!;
    
    const ext = img.file.type.split("/")[1] || "jpg";
    const originalName = img.file.name.substring(0, img.file.name.lastIndexOf("."));
    link.download = `${originalName}_watermarked.${ext}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadAll = async () => {
    const zip = new JSZip();
    let count = 0;

    images.forEach((img) => {
      if (img.status === "done" && img.processedBlob) {
        const ext = img.file.type.split("/")[1] || "jpg";
        const originalName = img.file.name.substring(0, img.file.name.lastIndexOf("."));
        zip.file(`${originalName}_watermarked.${ext}`, img.processedBlob);
        count++;
      }
    });

    if (count === 0) return;

    const content = await zip.generateAsync({ type: "blob" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(content);
    link.download = "watermarked_images.zip";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <SEO
        title={t("tools.image-watermark.title", "Image Watermark Tool")}
        description={t("tools.image-watermark.desc", "Add text watermarks to images. Custom position, opacity, and rotation.")}
      />

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("tools.image-watermark.title", "Image Watermark Tool")}
        </h1>
        <p className="text-gray-600">
          {t("tools.image-watermark.subtitle", "Batch add text watermarks to photos. Secure your images locally.")}
        </p>
      </div>

      {/* Settings */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
        <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
          <Settings className="w-5 h-5 text-gray-500" />
          {t("tools.image-watermark.settings", "Watermark Settings")}
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Text Input */}
          <div className="col-span-full">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t("tools.image-watermark.text", "Watermark Text")}
            </label>
            <div className="relative">
              <Type className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter text..."
              />
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("tools.image-watermark.size", "Size")}: {fontSize}
              </label>
              <input
                type="range"
                min="10"
                max="200"
                value={fontSize}
                onChange={(e) => setFontSize(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("tools.image-watermark.opacity", "Opacity")}: {Math.round(opacity * 100)}%
              </label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={opacity}
                onChange={(e) => setOpacity(parseFloat(e.target.value))}
                className="w-full"
              />
            </div>
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("tools.image-watermark.rotation", "Rotation")}: {rotation}°
              </label>
              <input
                type="range"
                min="-180"
                max="180"
                value={rotation}
                onChange={(e) => setRotation(parseInt(e.target.value))}
                className="w-full"
              />
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("tools.image-watermark.color", "Color")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="h-10 w-10 p-1 rounded border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={color}
                  onChange={(e) => setColor(e.target.value)}
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("tools.image-watermark.position", "Position")}
              </label>
              <div className="grid grid-cols-3 gap-2 w-32 h-24 bg-gray-100 p-2 rounded-md mx-auto md:mx-0">
                <button onClick={() => setPosition("top-left")} className={`rounded ${position === "top-left" ? "bg-blue-500" : "bg-gray-300 hover:bg-gray-400"}`}></button>
                <div className="invisible"></div>
                <button onClick={() => setPosition("top-right")} className={`rounded ${position === "top-right" ? "bg-blue-500" : "bg-gray-300 hover:bg-gray-400"}`}></button>
                
                <div className="invisible"></div>
                <button onClick={() => setPosition("center")} className={`rounded ${position === "center" ? "bg-blue-500" : "bg-gray-300 hover:bg-gray-400"}`}></button>
                <div className="invisible"></div>
                
                <button onClick={() => setPosition("bottom-left")} className={`rounded ${position === "bottom-left" ? "bg-blue-500" : "bg-gray-300 hover:bg-gray-400"}`}></button>
                <div className="invisible"></div>
                <button onClick={() => setPosition("bottom-right")} className={`rounded ${position === "bottom-right" ? "bg-blue-500" : "bg-gray-300 hover:bg-gray-400"}`}></button>
              </div>
            </div>
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
          {t("tools.image-watermark.drag_drop", "Drag & drop images here, or click to select")}
        </p>
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          multiple
          accept="image/*"
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {/* Action Bar */}
      {images.length > 0 && (
        <div className="flex justify-between items-center mb-6">
          <div className="text-sm text-gray-600">
            {images.length} {t("tools.image-watermark.images_selected", "images selected")}
          </div>
          <div className="space-x-4">
            <button
              onClick={processAll}
              disabled={isProcessing}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 inline-flex"
            >
              <Stamp className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
              {t("tools.image-watermark.process_all", "Add Watermark")}
            </button>
            <button
              onClick={downloadAll}
              disabled={images.filter(i => i.status === "done").length === 0}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 inline-flex"
            >
              <Archive className="w-4 h-4" />
              {t("tools.image-watermark.download_all", "Download All")}
            </button>
            <button
              onClick={() => setImages([])}
              className="px-4 py-2 text-red-600 border border-red-200 rounded-md hover:bg-red-50 flex items-center gap-2 inline-flex"
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
          <div key={img.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-center gap-4">
            <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative">
              <img
                src={img.processedPreview || img.preview}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>

            <div className="flex-grow min-w-0">
              <h3 className="font-medium text-gray-900 truncate" title={img.file.name}>
                {img.file.name}
              </h3>
              <div className="text-sm text-gray-500 mt-1">
                 {t("tools.image-watermark.original_size", "Size")}: {(img.file.size / 1024).toFixed(1)} KB
              </div>
              {img.status === "done" && (
                <div className="text-sm text-green-600 mt-1">
                  {t("tools.image-watermark.success", "Watermark added successfully")}
                </div>
              )}
              {img.error && (
                <div className="text-sm text-red-500 mt-1">{img.error}</div>
              )}
            </div>

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
