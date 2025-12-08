import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Camera, RefreshCcw, Check, X } from 'lucide-react';

interface CameraCaptureProps {
  onCapture: (imageData: string) => void;
  onClear: () => void;
  hasImage: boolean;
}

export const CameraCapture: React.FC<CameraCaptureProps> = ({ onCapture, onClear, hasImage }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsStreaming(true);
      }
    } catch (err) {
      setError("Camera access denied");
      console.error(err);
    }
  };

  const stopCamera = useCallback(() => {
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
      setIsStreaming(false);
    }
  }, []);

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => stopCamera();
  }, [stopCamera]);

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:border-teal-200 transition-colors">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Camera className="w-4 h-4 text-teal-600" />
          <span className="text-sm font-semibold text-slate-700">Visual Cues</span>
        </div>
        {hasImage && (
          <button onClick={onClear} className="text-slate-400 hover:text-red-500">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="relative aspect-video bg-slate-100 flex flex-col items-center justify-center">
        {error && <p className="text-xs text-red-500 px-2 text-center">{error}</p>}

        {!isStreaming && !hasImage && (
          <button 
            onClick={startCamera}
            className="flex flex-col items-center gap-2 text-slate-500 hover:text-teal-600 transition-colors"
          >
            <Camera className="w-8 h-8 opacity-50" />
            <span className="text-xs font-medium">Enable Camera</span>
          </button>
        )}

        {isStreaming && !hasImage && (
          <>
            <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
            <button 
              onClick={takeSnapshot}
              className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 text-teal-900 px-4 py-1.5 rounded-full text-xs font-bold shadow-sm hover:bg-white"
            >
              Capture Frame
            </button>
          </>
        )}

        {hasImage && (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-xs font-medium text-green-700">Face Captured</span>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};