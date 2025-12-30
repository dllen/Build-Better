import React, { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { SEO } from "@/components/SEO";
import {
  Upload,
  Download,
  X,
  GripVertical,
  ArrowDown,
  ArrowRight,
  Settings,
  Trash2,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface ImageItem {
  id: string;
  file: File;
  src: string;
  width: number;
  height: number;
}

function SortableItem({
  id,
  image,
  onRemove,
}: {
  id: string;
  image: ImageItem;
  onRemove: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 p-2 bg-white rounded-lg border border-gray-200 shadow-sm group"
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600"
      >
        <GripVertical size={20} />
      </div>
      <div className="w-12 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
        <img
          src={image.src}
          alt="preview"
          className="w-full h-full object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-700 truncate">
          {image.file.name}
        </p>
        <p className="text-xs text-gray-500">
          {image.width} x {image.height}
        </p>
      </div>
      <button
        onClick={() => onRemove(id)}
        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors"
      >
        <X size={18} />
      </button>
    </div>
  );
}

export default function ImageJoiner() {
  const { t } = useTranslation();
  const [images, setImages] = useState<ImageItem[]>([]);
  const [direction, setDirection] = useState<"vertical" | "horizontal">("vertical");
  const [spacing, setSpacing] = useState(0);
  const [backgroundColor, setBackgroundColor] = useState("#ffffff");
  const [autoScale, setAutoScale] = useState(true);
  const [outputFormat, setOutputFormat] = useState<"png" | "jpeg">("png");
  const [isProcessing, setIsProcessing] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (active.id !== over?.id) {
      setImages((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over?.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files?.length) return;
    setIsProcessing(true);

    const newImages: ImageItem[] = [];
    const files = Array.from(e.target.files);

    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      
      try {
        const src = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });

        const img = await new Promise<HTMLImageElement>((resolve) => {
          const image = new Image();
          image.onload = () => resolve(image);
          image.src = src;
        });

        newImages.push({
          id: Math.random().toString(36).substr(2, 9),
          file,
          src,
          width: img.width,
          height: img.height,
        });
      } catch (err) {
        console.error("Error loading image:", err);
      }
    }

    setImages((prev) => [...prev, ...newImages]);
    setIsProcessing(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeImage = (id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  };

  const clearAll = () => {
    setImages([]);
  };

  const drawCanvas = useCallback(async () => {
    if (!canvasRef.current || images.length === 0) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Load all images first to ensure they are ready
    const loadedImages = await Promise.all(
      images.map(
        (item) =>
          new Promise<HTMLImageElement>((resolve) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.src = item.src;
          })
      )
    );

    let totalWidth = 0;
    let totalHeight = 0;
    
    // Calculate dimensions based on direction and settings
    if (direction === "vertical") {
      const maxWidth = Math.max(...images.map((img) => img.width));
      const targetWidth = autoScale ? maxWidth : maxWidth; // Currently logic implies we always use max width for canvas size
      
      totalWidth = targetWidth;
      totalHeight = images.reduce((acc, img) => {
        const h = autoScale ? (img.height * (targetWidth / img.width)) : img.height;
        return acc + h;
      }, 0) + (images.length - 1) * spacing;
    } else {
      const maxHeight = Math.max(...images.map((img) => img.height));
      const targetHeight = autoScale ? maxHeight : maxHeight;

      totalHeight = targetHeight;
      totalWidth = images.reduce((acc, img) => {
        const w = autoScale ? (img.width * (targetHeight / img.height)) : img.width;
        return acc + w;
      }, 0) + (images.length - 1) * spacing;
    }

    // Update canvas size
    canvas.width = totalWidth;
    canvas.height = totalHeight;

    // Fill background
    ctx.fillStyle = backgroundColor;
    ctx.fillRect(0, 0, totalWidth, totalHeight);

    // Draw images
    let currentX = 0;
    let currentY = 0;

    loadedImages.forEach((img, index) => {
      let drawW = img.width;
      let drawH = img.height;

      if (direction === "vertical") {
        if (autoScale) {
          drawW = canvas.width;
          drawH = img.height * (canvas.width / img.width);
        } else {
            // Center if not auto-scaled
            currentX = (canvas.width - img.width) / 2;
        }
        
        ctx.drawImage(img, currentX, currentY, drawW, drawH);
        currentY += drawH + spacing;
        currentX = 0; // Reset X for next line
      } else {
        if (autoScale) {
          drawH = canvas.height;
          drawW = img.width * (canvas.height / img.height);
        } else {
            // Center vertically if not auto-scaled
            currentY = (canvas.height - img.height) / 2;
        }

        ctx.drawImage(img, currentX, currentY, drawW, drawH);
        currentX += drawW + spacing;
        currentY = 0; // Reset Y
      }
    });

  }, [images, direction, spacing, backgroundColor, autoScale]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement("a");
    link.download = `joined-image.${outputFormat}`;
    link.href = canvasRef.current.toDataURL(`image/${outputFormat}`);
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SEO
        title={t("tools.image-joiner.title", "Image Joiner")}
        description={t("tools.image-joiner.desc", "Join multiple images vertically or horizontally. Supports drag sorting and auto alignment.")}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          {t("tools.image-joiner.title", "Image Joiner")}
        </h1>
        <p className="text-lg text-gray-600">
          {t("tools.image-joiner.subtitle", "Combine multiple photos into one long image. Drag to sort, auto resize, and customize spacing.")}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Sidebar: Controls & List */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Upload Area */}
          <div
            className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-indigo-500 transition-colors cursor-pointer bg-gray-50"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              className="hidden"
              multiple
              accept="image/*"
            />
            <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-sm font-medium text-gray-900">
              {t("tools.image-joiner.click_upload", "Click to upload images")}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              {t("tools.image-joiner.drag_hint", "Support multiple selection")}
            </p>
          </div>

          {/* Settings */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 space-y-4">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Settings size={18} />
              {t("tools.image-joiner.settings", "Settings")}
            </h3>

            {/* Direction */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("tools.image-joiner.direction", "Direction")}
              </label>
              <div className="flex gap-2">
                <button
                  onClick={() => setDirection("vertical")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border ${
                    direction === "vertical"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ArrowDown size={18} />
                  {t("tools.image-joiner.vertical", "Vertical")}
                </button>
                <button
                  onClick={() => setDirection("horizontal")}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg border ${
                    direction === "horizontal"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "border-gray-300 text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <ArrowRight size={18} />
                  {t("tools.image-joiner.horizontal", "Horizontal")}
                </button>
              </div>
            </div>

            {/* Auto Scale */}
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                {t("tools.image-joiner.auto_scale", "Auto Scale")}
              </label>
              <input
                type="checkbox"
                checked={autoScale}
                onChange={(e) => setAutoScale(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
            </div>

            {/* Spacing */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("tools.image-joiner.spacing", "Spacing")}: {spacing}px
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={spacing}
                onChange={(e) => setSpacing(Number(e.target.value))}
                className="w-full"
              />
            </div>

            {/* Background Color */}
            <div>
               <label className="block text-sm font-medium text-gray-700 mb-1">
                {t("tools.image-joiner.bg_color", "Background Color")}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={backgroundColor}
                  onChange={(e) => setBackgroundColor(e.target.value)}
                  className="h-8 w-14 p-0 border-0 rounded cursor-pointer"
                />
                <span className="text-sm text-gray-500">{backgroundColor}</span>
              </div>
            </div>

            {/* Output Format */}
             <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {t("tools.image-joiner.format", "Output Format")}
              </label>
              <div className="flex gap-2">
                 <button
                  onClick={() => setOutputFormat("png")}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-sm ${
                    outputFormat === "png"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  PNG
                </button>
                <button
                  onClick={() => setOutputFormat("jpeg")}
                  className={`flex-1 py-1.5 px-3 rounded-lg border text-sm ${
                    outputFormat === "jpeg"
                      ? "bg-indigo-50 border-indigo-500 text-indigo-700"
                      : "border-gray-300 text-gray-700"
                  }`}
                >
                  JPEG
                </button>
              </div>
            </div>

             <button
              onClick={handleDownload}
              disabled={images.length === 0}
              className="w-full flex items-center justify-center gap-2 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Download size={20} />
              {t("tools.image-joiner.download", "Download Image")}
            </button>
          </div>

          {/* Image List */}
          {images.length > 0 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">
                  {t("tools.image-joiner.images", "Images")} ({images.length})
                </h3>
                <button
                  onClick={clearAll}
                  className="text-sm text-red-500 hover:text-red-600 flex items-center gap-1"
                >
                  <Trash2 size={14} />
                  {t("tools.image-joiner.clear", "Clear All")}
                </button>
              </div>
              
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={images.map((img) => img.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-2">
                    {images.map((image) => (
                      <SortableItem
                        key={image.id}
                        id={image.id}
                        image={image}
                        onRemove={removeImage}
                      />
                    ))}
                  </div>
                </SortableContext>
              </DndContext>
            </div>
          )}
        </div>

        {/* Right Area: Preview */}
        <div className="lg:col-span-2">
          <div className="bg-gray-100 rounded-xl p-4 min-h-[600px] flex items-center justify-center overflow-auto border border-gray-200">
            {images.length === 0 ? (
              <div className="text-center text-gray-400">
                <p>{t("tools.image-joiner.preview_hint", "Upload images to see preview")}</p>
              </div>
            ) : (
              <div className="shadow-lg max-w-full max-h-full overflow-auto bg-white">
                <canvas
                  ref={canvasRef}
                  className="max-w-full h-auto block"
                />
              </div>
            )}
          </div>
          {images.length > 0 && (
             <div className="mt-2 text-right text-sm text-gray-500">
               {canvasRef.current && `${canvasRef.current.width} x ${canvasRef.current.height} px`}
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
