import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import { Upload, X, Download, Image as ImageIcon, Check, Crop as CropIcon, Sliders, Layers } from "lucide-react";
import ReactCrop, { Crop, PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import JSZip from "jszip";

interface ImageItem {
  id: string;
  file: File;
  preview: string;
  processedBlob: Blob | null;
  processedPreview: string | null;
  status: "pending" | "processing" | "done" | "error";
  error?: string;
  width: number;
  height: number;
}

type Mode = "batch-resize" | "crop";

function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export default function ImageResizer() {
  const { t } = useTranslation();
  const [mode, setMode] = useState<Mode>("batch-resize");
  const [images, setImages] = useState<ImageItem[]>([]);
  
  // Batch Resize State
  const [resizeType, setResizeType] = useState<"preset" | "custom">("preset");
  const [preset, setPreset] = useState<string>("app-icon");
  const [customWidth, setCustomWidth] = useState<number>(800);
  const [customHeight, setCustomHeight] = useState<number>(600);
  const [maintainAspect, setMaintainAspect] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  // Crop State
  const [selectedImageId, setSelectedImageId] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const [aspect, setAspect] = useState<number | undefined>(undefined);
  const imgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const presets = {
    "app-icon": { label: "App Icon (512x512)", w: 512, h: 512, aspect: 1 },
    "avatar": { label: "Avatar (1:1)", w: 400, h: 400, aspect: 1 },
    "social-cover": { label: "Social Cover (1500x500)", w: 1500, h: 500, aspect: 3 },
    "post-landscape": { label: "Post Landscape (16:9)", w: 1280, h: 720, aspect: 16/9 },
    "post-portrait": { label: "Post Portrait (4:5)", w: 1080, h: 1350, aspect: 4/5 },
  };

  const handleFiles = (files: FileList | null) => {
    if (!files) return;
    
    const newImages: ImageItem[] = Array.from(files).map((file) => ({
      id: Math.random().toString(36).substring(2) + Date.now().toString(36),
      file: file,
      preview: URL.createObjectURL(file),
      processedBlob: null,
      processedPreview: null,
      status: "pending",
      width: 0,
      height: 0
    }));

    // Load dimensions
    newImages.forEach(img => {
      const image = new Image();
      image.src = img.preview;
      image.onload = () => {
        setImages(prev => prev.map(p => p.id === img.id ? { ...p, width: image.width, height: image.height } : p));
      };
    });

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
    if (selectedImageId === id) setSelectedImageId(null);
  };

  // --- Batch Processing Logic ---
  
  const processBatch = async () => {
    setIsProcessing(true);
    
    let targetW = customWidth;
    let targetH = customHeight;
    let targetAspect = maintainAspect ? undefined : targetW / targetH;

    if (resizeType === "preset") {
      const p = presets[preset as keyof typeof presets];
      targetW = p.w;
      targetH = p.h;
      targetAspect = p.aspect;
    }

    const processItem = async (item: ImageItem): Promise<ImageItem> => {
      return new Promise((resolve) => {
        const img = new Image();
        img.src = item.preview;
        img.onload = () => {
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          if (!ctx) return resolve({ ...item, status: "error" });

          // Determine output dimensions
          let w = targetW;
          let h = targetH;
          
          if (resizeType === "custom" && maintainAspect) {
             // If maintain aspect, we scale to fit within the box
             const ratio = Math.min(targetW / img.width, targetH / img.height);
             w = Math.round(img.width * ratio);
             h = Math.round(img.height * ratio);
             
             // If user only provided width (e.g. by not touching height), standard logic applies.
             // But here we have both inputs. Let's assume user wants to constrain max dimensions.
          }
          
          // If preset or custom without aspect maintenance, we might need to crop to fill?
          // Or just stretch? Usually "resize" implies stretch or fit. 
          // "Avatar" preset implies cropping usually.
          // Let's implement "Contain" logic for simple resize, but "Cover" (Center Crop) logic for Presets/Fixed Aspect.
          
          let sx = 0, sy = 0, sWidth = img.width, sHeight = img.height;
          
          // Logic: If preset has aspect ratio, we should probably Center Crop to match aspect, then resize.
          const shouldCrop = resizeType === "preset"; 
          
          if (shouldCrop) {
             const aspect = targetW / targetH;
             const imgAspect = img.width / img.height;
             
             if (imgAspect > aspect) {
               // Image is wider than target
               sHeight = img.height;
               sWidth = sHeight * aspect;
               sx = (img.width - sWidth) / 2;
             } else {
               // Image is taller
               sWidth = img.width;
               sHeight = sWidth / aspect;
               sy = (img.height - sHeight) / 2;
             }
          }

          canvas.width = targetW;
          canvas.height = targetH;
          
          // Use high quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';

          if (shouldCrop) {
            ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, targetW, targetH);
          } else {
            // Just draw resized
             if (maintainAspect) {
               // Canvas size matches calculated w/h
               canvas.width = w;
               canvas.height = h;
               ctx.drawImage(img, 0, 0, w, h);
             } else {
               // Stretch
               ctx.drawImage(img, 0, 0, targetW, targetH);
             }
          }

          canvas.toBlob((blob) => {
            if (blob) {
              resolve({
                ...item,
                processedBlob: blob,
                processedPreview: URL.createObjectURL(blob),
                status: "done"
              });
            } else {
              resolve({ ...item, status: "error" });
            }
          }, item.file.type === "image/png" ? "image/png" : "image/jpeg", 0.9);
        };
        img.onerror = () => resolve({ ...item, status: "error" });
      });
    };

    const results = await Promise.all(images.map(processItem));
    setImages(results);
    setIsProcessing(false);
  };

  // --- Single Crop Logic ---

  const onSelectImage = (id: string) => {
    setSelectedImageId(id);
    setMode("crop");
    setCrop(undefined);
    setCompletedCrop(undefined);
  };

  const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    if (aspect) {
      const { width, height } = e.currentTarget;
      setCrop(centerAspectCrop(width, height, aspect));
    }
  };

  const handleAspectChange = (value: number | undefined) => {
    setAspect(value);
    if (imgRef.current && value) {
      const { width, height } = imgRef.current;
      setCrop(centerAspectCrop(width, height, value));
    } else {
      setCrop(undefined);
    }
  };

  const saveCrop = async () => {
    if (!completedCrop || !imgRef.current || !selectedImageId) return;
    
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;

    canvas.width = completedCrop.width * scaleX;
    canvas.height = completedCrop.height * scaleY;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ctx.drawImage(
      image,
      completedCrop.x * scaleX,
      completedCrop.y * scaleY,
      completedCrop.width * scaleX,
      completedCrop.height * scaleY,
      0,
      0,
      canvas.width,
      canvas.height,
    );

    const currentImg = images.find(i => i.id === selectedImageId);
    if (!currentImg) return;

    canvas.toBlob((blob) => {
      if (!blob) return;
      const newUrl = URL.createObjectURL(blob);
      
      setImages(prev => prev.map(img => {
        if (img.id === selectedImageId) {
          return {
            ...img,
            processedBlob: blob,
            processedPreview: newUrl,
            status: "done"
          };
        }
        return img;
      }));
      setMode("batch-resize"); // Go back to list
      setSelectedImageId(null);
    }, currentImg.file.type === "image/png" ? "image/png" : "image/jpeg", 0.95);
  };

  const downloadImage = (img: ImageItem) => {
    if (!img.processedBlob) return;
    const link = document.createElement("a");
    link.href = img.processedPreview!;
    const ext = img.file.type.split("/")[1] || "jpg";
    const originalName = img.file.name.substring(0, img.file.name.lastIndexOf("."));
    link.download = `${originalName}_resized.${ext}`;
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
          zip.file(`${originalName}_resized.${ext}`, img.processedBlob);
          count++;
        }
      });
  
      if (count === 0) return;
  
      const content = await zip.generateAsync({ type: "blob" });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(content);
      link.download = "resized_images.zip";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    };

  const selectedImageItem = images.find(i => i.id === selectedImageId);

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl">
      <SEO
        title={t("tools.image-resizer.title", "Image Resizer & Cropper")}
        description={t("tools.image-resizer.desc", "Resize, crop, and convert images. Batch processing support.")}
      />

      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          {t("tools.image-resizer.title", "Image Resizer & Cropper")}
        </h1>
        <p className="text-gray-600">
          {t("tools.image-resizer.subtitle", "Batch resize images or crop them individually. Supports custom dimensions and presets.")}
        </p>
      </div>

      {/* Tabs / Mode Switch */}
      {selectedImageId ? (
        <div className="mb-6 flex items-center gap-4">
          <button 
            onClick={() => { setSelectedImageId(null); setMode("batch-resize"); }}
            className="text-gray-600 hover:text-gray-900 flex items-center gap-1"
          >
            <X className="w-4 h-4" /> {t("common.back", "Back")}
          </button>
          <h2 className="text-xl font-semibold">{t("tools.image-resizer.crop_mode", "Crop Image")}</h2>
        </div>
      ) : (
        <div className="flex gap-4 mb-6 border-b border-gray-200">
          <button
            className={`px-4 py-2 border-b-2 transition-colors ${mode === "batch-resize" ? "border-blue-500 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
            onClick={() => setMode("batch-resize")}
          >
            {t("tools.image-resizer.batch_mode", "Batch Resize")}
          </button>
          <div className="px-4 py-2 text-gray-400">
             {t("tools.image-resizer.crop_hint", "Select an image below to Crop")}
          </div>
        </div>
      )}

      {/* Main Content */}
      {mode === "crop" && selectedImageItem ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex flex-col md:flex-row gap-6">
            <div className="flex-grow bg-gray-100 rounded-lg flex items-center justify-center p-4 min-h-[400px]">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={aspect}
                className="max-h-[600px]"
              >
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={selectedImageItem.preview}
                  onLoad={onImageLoad}
                  style={{ maxHeight: "600px", maxWidth: "100%" }}
                />
              </ReactCrop>
            </div>
            
            <div className="w-full md:w-64 flex-shrink-0 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("tools.image-resizer.aspect_ratio", "Aspect Ratio")}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => handleAspectChange(undefined)}
                    className={`px-3 py-2 text-sm rounded-md border ${aspect === undefined ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-300 hover:bg-gray-50"}`}
                  >
                    {t("tools.image-resizer.free", "Free")}
                  </button>
                  <button
                    onClick={() => handleAspectChange(1)}
                    className={`px-3 py-2 text-sm rounded-md border ${aspect === 1 ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-300 hover:bg-gray-50"}`}
                  >
                    1:1 (Square)
                  </button>
                  <button
                    onClick={() => handleAspectChange(4/3)}
                    className={`px-3 py-2 text-sm rounded-md border ${aspect === 4/3 ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-300 hover:bg-gray-50"}`}
                  >
                    4:3
                  </button>
                  <button
                    onClick={() => handleAspectChange(16/9)}
                    className={`px-3 py-2 text-sm rounded-md border ${aspect === 16/9 ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-300 hover:bg-gray-50"}`}
                  >
                    16:9
                  </button>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">
                  {t("tools.image-resizer.crop_info", "Drag on image to select area.")}
                </p>
                <button
                  onClick={saveCrop}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  {t("tools.image-resizer.apply_crop", "Apply Crop")}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <>
          {/* Batch Settings */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-gray-500" />
              {t("tools.image-resizer.resize_settings", "Resize Settings")}
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t("tools.image-resizer.method", "Method")}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setResizeType("preset")}
                    className={`flex-1 px-3 py-2 text-sm rounded-md border ${resizeType === "preset" ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-300 hover:bg-gray-50"}`}
                  >
                    {t("tools.image-resizer.presets", "Presets")}
                  </button>
                  <button
                    onClick={() => setResizeType("custom")}
                    className={`flex-1 px-3 py-2 text-sm rounded-md border ${resizeType === "custom" ? "bg-blue-50 border-blue-500 text-blue-700" : "border-gray-300 hover:bg-gray-50"}`}
                  >
                    {t("tools.image-resizer.custom", "Custom")}
                  </button>
                </div>
              </div>

              {resizeType === "preset" ? (
                <div className="lg:col-span-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t("tools.image-resizer.select_preset", "Select Preset")}
                  </label>
                  <select
                    value={preset}
                    onChange={(e) => setPreset(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  >
                    {Object.entries(presets).map(([key, val]) => (
                      <option key={key} value={key}>{val.label}</option>
                    ))}
                  </select>
                </div>
              ) : (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("tools.image-resizer.width", "Width (px)")}
                    </label>
                    <input
                      type="number"
                      value={customWidth}
                      onChange={(e) => setCustomWidth(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      {t("tools.image-resizer.height", "Height (px)")}
                    </label>
                    <input
                      type="number"
                      value={customHeight}
                      onChange={(e) => setCustomHeight(Number(e.target.value))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    />
                  </div>
                  <div className="flex items-end pb-2">
                    <label className="flex items-center gap-2 cursor-pointer text-sm text-gray-700">
                      <input
                        type="checkbox"
                        checked={maintainAspect}
                        onChange={(e) => setMaintainAspect(e.target.checked)}
                        className="rounded text-blue-600 focus:ring-blue-500"
                      />
                      {t("tools.image-resizer.maintain_aspect", "Maintain Aspect Ratio")}
                    </label>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* File Upload */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-blue-500 transition-colors cursor-pointer bg-gray-50 mb-6"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-700 mb-1">
              {t("tools.image-resizer.drag_drop", "Drag & drop images here, or click to select")}
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
                {images.length} {t("tools.image-resizer.images_selected", "images selected")}
              </div>
              <div className="space-x-4">
                <button
                  onClick={processBatch}
                  disabled={isProcessing}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 inline-flex"
                >
                  <Layers className={`w-4 h-4 ${isProcessing ? "animate-spin" : ""}`} />
                  {t("tools.image-resizer.resize_all", "Resize All")}
                </button>
                <button
                  onClick={downloadAll}
                  disabled={images.filter(i => i.status === "done").length === 0}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 inline-flex"
                >
                  <Download className="w-4 h-4" />
                  {t("tools.image-resizer.download_all", "Download All")}
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

          {/* Image Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {images.map((img) => (
              <div key={img.id} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex items-start gap-4">
                <div className="w-24 h-24 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden relative group">
                  <img
                    src={img.processedPreview || img.preview}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-center justify-center">
                    <button 
                      onClick={(e) => { e.stopPropagation(); onSelectImage(img.id); }}
                      className="opacity-0 group-hover:opacity-100 p-2 bg-white rounded-full text-gray-800 shadow-sm hover:text-blue-600"
                      title={t("tools.image-resizer.crop_this", "Crop this image")}
                    >
                      <CropIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <div className="flex-grow min-w-0">
                  <h3 className="font-medium text-gray-900 truncate" title={img.file.name}>
                    {img.file.name}
                  </h3>
                  <div className="text-sm text-gray-500 mt-1">
                     {img.width} x {img.height} px
                  </div>
                  {img.status === "done" && (
                    <div className="text-sm text-green-600 mt-1 flex items-center gap-1">
                      <Check className="w-3 h-3" />
                      {t("tools.image-resizer.resized", "Processed")}
                    </div>
                  )}
                  {img.status === "error" && (
                     <div className="text-sm text-red-500 mt-1">Error processing</div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => onSelectImage(img.id)}
                    className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                    title={t("tools.image-resizer.crop_this", "Crop")}
                  >
                    <CropIcon className="w-5 h-5" />
                  </button>
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
        </>
      )}
    </div>
  );
}
