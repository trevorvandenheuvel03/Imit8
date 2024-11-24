import React, { useRef, useEffect } from 'react';
import { Alert, AlertDescription } from '../components/ui/alert';

const CameraComponent = ({ onCameraReady, onCameraError }) => {
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  const initializeCamera = async () => {
    try {
      console.log("Requesting camera access...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      console.log("Camera access granted");
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        
        videoRef.current.onloadedmetadata = async () => {
          try {
            await videoRef.current.play();
            console.log("Video playing");
            onCameraReady(true);
          } catch (error) {
            console.error("Error playing video:", error);
            onCameraError("Failed to start video playback");
          }
        };
      }
    } catch (error) {
      console.error("Camera access error:", error);
      onCameraError("Please allow camera access to play the game");
    }
  };

  useEffect(() => {
    initializeCamera();
    
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  return (
    <div className="relative w-full aspect-video">
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted
        className="w-full h-full rounded-xl shadow-lg border-4 border-purple-200 object-cover transform scale-x-[-1]"
      />
    </div>
  );
};

export default CameraComponent;