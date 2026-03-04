import React, { useEffect, useRef, useState } from 'react';
import { Nostalgist } from 'nostalgist';
import { Maximize, Pause, Play, RotateCcw, Save, Upload, Gamepad2 } from 'lucide-react';

interface NesEmulatorProps {
  romUrl: string;
  core?: 'fceumm' | 'nestopia';
  onError?: (error: Error) => void;
}

export const NesEmulator: React.FC<NesEmulatorProps> = ({ romUrl, core = 'fceumm', onError }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const emulatorInstance = useRef<Nostalgist | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setIsLoading(true);
    setError(null);

    const startEmulator = async () => {
      if (!canvasRef.current) return;

      try {
        // Since we are using placeholders, we might fail here if the file doesn't exist.
        // But nostalgist handles fetching.
        // Note: For this to work without a real backend, we might need a way to verify the ROM exists.
        // For now, we assume it tries to fetch.

        // Fix: Nostalgist treats relative paths with .nes extension as retrobrews repo paths.
        // We need to convert local paths to absolute URLs to bypass this behavior.
        const fullRomUrl = romUrl.startsWith('/') 
          ? window.location.origin + romUrl 
          : romUrl;

        const nost = await Nostalgist.launch({
          element: canvasRef.current,
          rom: fullRomUrl,
          core: core,
        });

        if (active) {
          emulatorInstance.current = nost;
          setIsPlaying(true);
          setIsLoading(false);
        } else {
          nost.exit();
        }
      } catch (err: any) {
        console.error("Failed to launch emulator:", err);
        if (active) {
          setIsLoading(false);
          const msg = err.message || "Failed to load ROM";
          setError(msg);
          if (onError) onError(err);
        }
      }
    };

    startEmulator();

    return () => {
      active = false;
      if (emulatorInstance.current) {
        emulatorInstance.current.exit();
      }
    };
  }, [romUrl, core, onError]);

  const handlePauseResume = async () => {
    if (!emulatorInstance.current) return;
    if (isPlaying) {
      await emulatorInstance.current.pause();
    } else {
      await emulatorInstance.current.resume();
    }
    setIsPlaying(!isPlaying);
  };

  const handleReset = async () => {
    if (!emulatorInstance.current) return;
    await emulatorInstance.current.restart();
    setIsPlaying(true);
  };

  const handleSaveState = async () => {
    if (!emulatorInstance.current) return;
    try {
      const state = await emulatorInstance.current.saveState();
      // In a real app, we would save this blob to IndexedDB or download it
      // For now, let's trigger a download
      const url = URL.createObjectURL(state.state);
      const a = document.createElement('a');
      a.href = url;
      a.download = `save_${Date.now()}.state`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Save failed", e);
    }
  };

  const handleLoadState = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!emulatorInstance.current || !e.target.files?.[0]) return;
    try {
      const file = e.target.files[0];
      await emulatorInstance.current.loadState(file);
    } catch (e) {
      console.error("Load failed", e);
    }
  };

  const handleFullscreen = async () => {
    if (!canvasRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      canvasRef.current.requestFullscreen();
    }
  };

  return (
    <div className="flex flex-col items-center bg-gray-900 p-4 rounded-xl shadow-2xl w-full max-w-4xl mx-auto">
      <div className="relative w-full aspect-[4/3] bg-black rounded-lg overflow-hidden border-4 border-gray-700 mb-4">
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center text-white">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
            Loading Emulator...
          </div>
        )}
        
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-red-400 p-8 text-center bg-gray-900/90 z-10">
            <p className="text-xl font-bold mb-2">Error Loading Game</p>
            <p>{error}</p>
            <p className="text-sm text-gray-400 mt-4">
              Note: This demo uses placeholder ROM URLs. To play, you need valid .nes files in your public/roms directory.
            </p>
          </div>
        )}

        <canvas 
          ref={canvasRef} 
          className="w-full h-full object-contain"
          style={{ display: error ? 'none' : 'block' }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full">
        <button 
          onClick={handlePauseResume}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors"
        >
          {isPlaying ? <Pause size={18} /> : <Play size={18} />}
          {isPlaying ? 'Pause' : 'Resume'}
        </button>

        <button 
          onClick={handleReset}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors"
        >
          <RotateCcw size={18} />
          Reset
        </button>

        <button 
          onClick={handleSaveState}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition-colors"
        >
          <Save size={18} />
          Save State
        </button>

        <label className="flex items-center justify-center gap-2 px-4 py-2 bg-yellow-600 hover:bg-yellow-700 text-white rounded transition-colors cursor-pointer">
          <Upload size={18} />
          Load State
          <input type="file" onChange={handleLoadState} accept=".state" className="hidden" />
        </label>
      </div>

      <div className="mt-4 flex justify-between w-full text-gray-400 text-sm px-2">
        <div className="flex items-center gap-2">
          <Gamepad2 size={16} />
          <span>Controls: Arrows (Move), Z (A), X (B), Enter (Start), Shift (Select)</span>
        </div>
        <button onClick={handleFullscreen} className="hover:text-white flex items-center gap-1">
          <Maximize size={16} /> Fullscreen
        </button>
      </div>
    </div>
  );
};
