import React, { useState, useRef } from 'react';
import { Mic, Square, Trash2, Check, X } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob) => void;
  onClear: () => void;
  hasAudio: boolean;
}

export const AudioRecorder: React.FC<AudioRecorderProps> = ({ onRecordingComplete, onClear, hasAudio }) => {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        onRecordingComplete(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      timerRef.current = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error(err);
      alert("Microphone access needed.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const handleClear = () => {
    onClear();
    setRecordingTime(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden group hover:border-indigo-200 transition-colors">
      <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Mic className="w-4 h-4 text-indigo-600" />
          <span className="text-sm font-semibold text-slate-700">Symptom Voice</span>
        </div>
        {hasAudio && (
          <button onClick={handleClear} className="text-slate-400 hover:text-red-500">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="p-4 flex flex-col items-center justify-center min-h-[120px]">
        {!hasAudio && !isRecording && (
           <button 
             onClick={startRecording}
             className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white flex items-center justify-center transition-all shadow-sm"
           >
             <Mic className="w-6 h-6" />
           </button>
        )}

        {isRecording && (
          <div className="flex flex-col items-center gap-3">
            <span className="text-xl font-mono text-indigo-900 font-bold">{formatTime(recordingTime)}</span>
            <div className="flex items-center gap-2">
               <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
               <span className="text-xs text-indigo-600 font-medium">Recording</span>
            </div>
            <button onClick={stopRecording} className="mt-1 bg-slate-800 text-white p-2 rounded-full hover:bg-slate-700">
               <Square className="w-4 h-4 fill-current" />
            </button>
          </div>
        )}

        {hasAudio && (
           <div className="flex flex-col items-center gap-2">
             <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
               <Check className="w-6 h-6 text-indigo-600" />
             </div>
             <div className="text-center">
                <p className="text-xs font-medium text-indigo-900">Audio Ready</p>
                <p className="text-[10px] text-slate-400">{formatTime(recordingTime)}</p>
             </div>
           </div>
        )}
      </div>
    </div>
  );
};