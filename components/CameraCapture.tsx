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
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      setError(null);
      const mediaStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      setStream(mediaStream);
      setIsStreaming(true);
    } catch (err) {
      setError("Camera access denied");
      console.error(err);
    }
  };

  // Attach stream to video element once it is rendered
  useEffect(() => {
    if (isStreaming && stream && videoRef.current) {
      videoRef.current.srcObject = stream;
    }
  }, [isStreaming, stream]);

  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsStreaming(false);
  }, [stream]);

  const takeSnapshot = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const context = canvas.getContext('2d');

      if (context) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Translate and scale to draw the mirrored image correctly on the canvas
        context.translate(canvas.width, 0);
        context.scale(-1, 1);
        
        context.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg');
        onCapture(dataUrl);
        stopCamera();
      }
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

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

      <div className="relative aspect-video bg-slate-900 flex flex-col items-center justify-center overflow-hidden">
        {error && <p className="text-xs text-red-500 px-2 text-center z-10">{error}</p>}

        {!isStreaming && !hasImage && (
          <button 
            onClick={startCamera}
            className="flex flex-col items-center gap-2 text-slate-400 hover:text-teal-400 transition-colors w-full h-full justify-center bg-slate-100 hover:bg-slate-50"
          >
            <Camera className="w-8 h-8 opacity-50" />
            <span className="text-xs font-medium text-slate-500">Enable Camera</span>
          </button>
        )}

        {isStreaming && !hasImage && (
          <>
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="absolute inset-0 w-full h-full object-cover scale-x-[-1]" 
            />
            
            {/* Viewfinder Overlay */}
            <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10">
              <div className="w-40 h-56 border-2 border-white/40 rounded-[3rem] border-dashed relative">
                 <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-black/50 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-md">
                   Face Here
                 </div>
              </div>
            </div>

            {/* Shutter Button */}
            <div className="absolute bottom-4 left-0 right-0 flex justify-center z-20">
              <button 
                onClick={takeSnapshot}
                className="group relative flex items-center justify-center"
                aria-label="Take Photo"
              >
                 <div className="w-16 h-16 rounded-full border-4 border-white/80 bg-black/20 backdrop-blur-sm flex items-center justify-center transition-all group-active:scale-95">
                    <div className="w-12 h-12 bg-white rounded-full group-hover:scale-90 transition-transform shadow-sm"></div>
                 </div>
              </button>
            </div>
          </>
        )}

        {hasImage && (
          <div className="w-full h-full bg-slate-50 flex flex-col items-center justify-center gap-2">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-1">
              <Check className="w-6 h-6 text-green-600" />
            </div>
            <span className="text-sm font-semibold text-green-700">Image Captured</span>
            <button 
              onClick={onClear} 
              className="text-xs text-slate-400 hover:text-teal-600 flex items-center gap-1 mt-2"
            >
              <RefreshCcw className="w-3 h-3" /> Retake
            </button>
          </div>
        )}
        
        <canvas ref={canvasRef} className="hidden" />
      </div>
    </div>
  );
};