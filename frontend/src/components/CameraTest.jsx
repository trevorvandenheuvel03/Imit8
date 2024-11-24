import React, { useRef } from 'react';

const CameraTest = () => {
  const videoRef = useRef(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      videoRef.current.srcObject = stream;
    } catch (err) {
      console.error('Camera error:', err);
      alert(`Camera error: ${err.message}`);
    }
  };

  return (
    <div className="p-4">
      <button 
        onClick={startCamera}
        className="bg-blue-500 text-white p-2 rounded mb-4"
      >
        Test Camera
      </button>
      <video
        ref={videoRef}
        autoPlay
        playsInline
        className="w-full max-w-md border"
      />
    </div>
  );
};

export default CameraTest;