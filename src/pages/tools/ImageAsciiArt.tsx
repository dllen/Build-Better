
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Upload, Download, RefreshCw, Image as ImageIcon, Copy, Check } from 'lucide-react';
import { processImage, DENSITY_SETS, AsciiResult } from '@/utils/asciiArt';
import { SEO } from '@/components/SEO';

export default function ImageAsciiArt() {
  const { t } = useTranslation();
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [asciiResult, setAsciiResult] = useState<AsciiResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copied, setCopied] = useState(false);

  // Settings
  const [width, setWidth] = useState(80);
  const [inverted, setInverted] = useState(false);
  const [colorMode, setColorMode] = useState<'black-white' | 'gray' | 'color'>('black-white');
  const [charSet, setCharSet] = useState<keyof typeof DENSITY_SETS | 'custom'>('standard');
  const [customChars, setCustomChars] = useState('');

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setImageSrc(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const generateAscii = useCallback(() => {
    if (!imageSrc || !canvasRef.current) return;

    setIsProcessing(true);
    const img = new Image();
    img.src = imageSrc;
    img.onload = () => {
      const canvas = canvasRef.current!;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;

      // Aspect ratio correction (fonts are usually ~1:2)
      const fontAspectRatio = 0.5;
      const height = Math.floor((width / img.width) * img.height * fontAspectRatio);

      canvas.width = width;
      canvas.height = height;

      ctx.drawImage(img, 0, 0, width, height);

      const chars = charSet === 'custom' && customChars ? customChars : (DENSITY_SETS[charSet as keyof typeof DENSITY_SETS] || DENSITY_SETS.standard);
      
      const result = processImage(ctx, width, height, {
        width,
        chars,
        inverted,
        colorMode
      });

      setAsciiResult(result);
      setIsProcessing(false);
    };
  }, [imageSrc, width, inverted, colorMode, charSet, customChars]);

  useEffect(() => {
    generateAscii();
  }, [generateAscii]);

  const downloadText = () => {
    if (!asciiResult) return;
    const blob = new Blob([asciiResult.text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'ascii-art.txt';
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = async () => {
    if (!asciiResult) return;
    try {
      await navigator.clipboard.writeText(asciiResult.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO 
        title={t('tools.image-ascii.title', 'Image to ASCII Art')} 
        description={t('tools.image-ascii.desc', 'Convert images to ASCII art with customizable options.')} 
      />
      
      <div className="max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-gray-900 dark:text-gray-100 flex items-center gap-3">
          <FileText className="h-8 w-8 text-primary" />
          {t('tools.image-ascii.title', 'Image to ASCII Art')}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Controls & Upload */}
          <div className="lg:col-span-1 space-y-6">
            <div 
              className="border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-lg p-6 text-center hover:border-primary transition-colors cursor-pointer bg-white dark:bg-gray-800"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*"
                onChange={handleImageUpload}
              />
              <Upload className="h-10 w-10 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-500 font-medium">
                {t('tools.image-ascii.drag_drop', 'Click or drag image here')}
              </p>
              <p className="text-xs text-gray-400 mt-1">JPG, PNG, GIF</p>
            </div>

            {imageSrc && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 space-y-4">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  {t('tools.image-ascii.settings', 'Settings')}
                </h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('tools.image-ascii.width', 'Width (chars)')}: {width}
                    </label>
                    <input 
                      type="range" 
                      min="20" 
                      max="200" 
                      value={width} 
                      onChange={(e) => setWidth(Number(e.target.value))}
                      className="w-full"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('tools.image-ascii.mode', 'Color Mode')}
                    </label>
                    <select 
                      value={colorMode} 
                      onChange={(e) => setColorMode(e.target.value as any)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="black-white">{t('tools.image-ascii.mode_bw', 'Black & White')}</option>
                      <option value="gray">{t('tools.image-ascii.mode_gray', 'Grayscale')}</option>
                      <option value="color">{t('tools.image-ascii.mode_color', 'True Color')}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      {t('tools.image-ascii.charset', 'Character Set')}
                    </label>
                    <select 
                      value={charSet} 
                      onChange={(e) => setCharSet(e.target.value as any)}
                      className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600"
                    >
                      <option value="standard">Standard (@%#*+=-:. )</option>
                      <option value="simple">Simple (#+-. )</option>
                      <option value="complex">Complex (Detailed)</option>
                      <option value="blocks">Blocks (█▓▒░ )</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>

                  {charSet === 'custom' && (
                    <div>
                      <input 
                        type="text" 
                        value={customChars}
                        onChange={(e) => setCustomChars(e.target.value)}
                        placeholder="Enter characters..."
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-primary focus:ring focus:ring-primary focus:ring-opacity-50 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  )}

                  <div className="flex items-center">
                    <input 
                      type="checkbox" 
                      id="inverted" 
                      checked={inverted} 
                      onChange={(e) => setInverted(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary"
                    />
                    <label htmlFor="inverted" className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                      {t('tools.image-ascii.inverted', 'Inverted')}
                    </label>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-2">
                  <button 
                    onClick={downloadText}
                    disabled={!asciiResult}
                    className="flex-1 flex items-center justify-center gap-2 bg-primary text-white py-2 px-4 rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Download className="h-4 w-4" />
                    {t('common.download', 'Download')}
                  </button>
                  <button 
                    onClick={copyToClipboard}
                    disabled={!asciiResult}
                    className="flex items-center justify-center gap-2 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            )}
            
            {/* Original Image Preview (Small) */}
            {imageSrc && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
                <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-2 text-sm">
                  {t('tools.image-ascii.original', 'Original Image')}
                </h3>
                <img src={imageSrc} alt="Original" className="w-full rounded object-contain max-h-48" />
              </div>
            )}
          </div>

          {/* Output Area */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 h-full flex flex-col min-h-[500px]">
              <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-gray-50 dark:bg-gray-900/50 rounded-t-lg">
                <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                  {t('tools.image-ascii.preview', 'ASCII Preview')}
                </h2>
                {isProcessing && <span className="text-sm text-gray-500">Processing...</span>}
              </div>
              
              <div className="flex-1 p-4 overflow-auto bg-black rounded-b-lg flex items-center justify-center">
                {!imageSrc ? (
                  <div className="text-center text-gray-500">
                    <ImageIcon className="h-16 w-16 mx-auto mb-4 opacity-20" />
                    <p>{t('tools.image-ascii.placeholder', 'Upload an image to see the magic')}</p>
                  </div>
                ) : (
                  <pre 
                    className="font-mono text-[8px] leading-[8px] whitespace-pre"
                    style={{ 
                      fontFamily: '"Courier New", Courier, monospace',
                      transformOrigin: 'top left'
                    }}
                  >
                    {colorMode === 'black-white' ? (
                      <span className="text-white">{asciiResult?.text}</span>
                    ) : (
                      <div dangerouslySetInnerHTML={{ __html: asciiResult?.html || '' }} />
                    )}
                  </pre>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Hidden Canvas for Processing */}
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}

// Helper icon component since FileText is used in imports
function FileText(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  );
}
