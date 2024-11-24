import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import * as faceapi from 'face-api.js';

const EmotionGame = () => {
  const [gameState, setGameState] = useState('loading'); // loading, ready, playing, finished
  const [currentEmoji, setCurrentEmoji] = useState('');
  const [score, setScore] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);

  const emojiMap = {
    '😀': 'happy',
    '😢': 'sad',
    '😡': 'angry',
    '😲': 'surprised',
    '😍': 'happy',
  };

  // Load ML models
  useEffect(() => {
    loadModels();
    return () => stopCamera();
  }, []);

  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      ]);
      setGameState('ready');
    } catch (error) {
      setAlertMessage('Error loading models. Please refresh the page.');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        await videoRef.current.play();
        return true;
      }
      return false;
    } catch (error) {
      setAlertMessage('Please allow camera access to play.');
      return false;
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    if (detectionIntervalRef.current) {
      clearInterval(detectionIntervalRef.current);
    }
  };

  const getRandomEmoji = () => {
    const emojis = Object.keys(emojiMap);
    return emojis[Math.floor(Math.random() * emojis.length)];
  };

  const startGame = async () => {
    const cameraStarted = await startCamera();
    if (cameraStarted) {
      setCurrentEmoji(getRandomEmoji());
      setGameState('playing');
      startDetection();
    }
  };

  const startDetection = () => {
    detectionIntervalRef.current = setInterval(async () => {
      if (videoRef.current) {
        try {
          const detections = await faceapi.detectSingleFace(
            videoRef.current,
            new faceapi.TinyFaceDetectorOptions()
          ).withFaceExpressions();

          if (detections) {
            const targetEmotion = emojiMap[currentEmoji];
            const score = Math.round(detections.expressions[targetEmotion] * 5);
            setScore(score);
          }
        } catch (error) {
          console.error('Detection error:', error);
        }
      }
    }, 100);

    // End game after 10 seconds
    setTimeout(() => {
      stopCamera();
      setGameState('finished');
    }, 10000);
  };

  const resetGame = () => {
    stopCamera();
    setGameState('ready');
    setCurrentEmoji('');
    setScore(null);
    setAlertMessage('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto backdrop-blur-sm bg-opacity-90">
        <h1 className="text-3xl font-bold text-center mb-8 text-purple-800">
          Imit8
        </h1>

        {gameState === 'loading' && (
          <div className="text-center py-4">
            <p className="text-gray-600">Loading emotion detection models...</p>
          </div>
        )}

        {gameState === 'ready' && (
          <div className="flex flex-col items-center">
            <Button
              onClick={startGame}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-3"
            >
              <Camera className="w-6 h-6" />
              Click Now
            </Button>
            <p className="mt-6 text-gray-600 text-center">
              Click to start the game and mimic the emoji that appears!
            </p>
          </div>
        )}

        <div className={gameState === 'playing' ? 'block' : 'hidden'}>
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
              <p className="text-lg text-gray-700 mb-3">Mimic this emotion:</p>
              <span className="text-8xl block mb-2 animate-bounce">{currentEmoji}</span>
            </div>
            <div className="relative w-full aspect-video">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full rounded-xl shadow-lg border-4 border-purple-200 object-cover transform scale-x-[-1]"
              />
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-700">
                Recording will stop automatically in 10 seconds...
              </p>
            </div>
          </div>
        </div>

        {gameState === 'finished' && (
          <div className="text-center space-y-6">
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
              <h2 className="text-xl text-gray-700 mb-3">Your Score:</h2>
              <p className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                {score}/5
              </p>
            </div>
            <Button
              onClick={resetGame}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-full font-semibold transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
            >
              <RefreshCw className="w-5 h-5" />
                Retake 👾
            </Button>
          </div>
        )}

        {alertMessage && (
          <Alert className="mt-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {alertMessage}
            </AlertDescription>
          </Alert>
        )}
      </div>
    </div>
  );
};

export default EmotionGame;