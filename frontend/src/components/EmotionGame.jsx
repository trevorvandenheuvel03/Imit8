import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Scan } from 'lucide-react';
import { Alert, AlertDescription } from '../components/ui/alert';
import { Button } from '../components/ui/button';
import * as faceapi from 'face-api.js';

const EmotionGame = () => {
  const [gameState, setGameState] = useState('loading');
  const [currentEmoji, setCurrentEmoji] = useState('');
  const [score, setScore] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [detectionStatus, setDetectionStatus] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const scoresRef = useRef([]);

  const emojiMap = {
    '😀': {
      primary: 'happy',
      related: ['neutral'],
      opposite: ['sad', 'angry', 'disgusted'], 
      weights: {
        primary: 1.2,      
        related: 0.2,       
        opposite: -1.0       
      }
    },
    '😢': {
      primary: 'sad',
      related: ['neutral'],
      opposite: ['happy', 'surprised', 'angry'],
      weights: {
        primary: 1.2,
        related: 0.2,
        opposite: -1.0
      }
    },
    '😡': {
      primary: 'angry',
      related: ['disgusted'],
      opposite: ['happy', 'neutral', 'surprised'],
      weights: {
        primary: 1.2,
        related: 0.2,
        opposite: -1.0
      }
    },
    '😲': {
      primary: 'surprised',
      related: ['fearful'],
      opposite: ['neutral', 'sad', 'angry'],
      weights: {
        primary: 1.2,
        related: 0.2,
        opposite: -1.0
      }
    },
    '😍': {
      primary: 'happy',
      related: ['neutral'],
      opposite: ['sad', 'angry', 'disgusted', 'fearful'], 
      weights: {
        primary: 1.2,
        related: 0.2,
        opposite: -1.0
      }
    }
  };

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

  const calculateScore = (detections, targetEmoji) => {
    if (!detections || !targetEmoji || !emojiMap[targetEmoji]) {
      return { score: 0, debug: { error: 'Invalid parameters' } };
    }
    
    try {
      const emotionConfig = emojiMap[targetEmoji];
      let totalScore = 0;
      
      // Calculate primary emotion score
      const primaryValue = detections.expressions[emotionConfig.primary] || 0;
      const primaryScore = primaryValue * 5 * emotionConfig.weights.primary;
      totalScore += primaryScore;

      // Calculate related emotions scores
      emotionConfig.related.forEach(emotion => {
        const value = detections.expressions[emotion] || 0;
        totalScore += value * 5 * emotionConfig.weights.related;
      });

      // Calculate penalties for opposite emotions
      emotionConfig.opposite.forEach(emotion => {
        const value = detections.expressions[emotion] || 0;
        totalScore += value * 5 * emotionConfig.weights.opposite;
      });

      // Normalize and round the score
      const finalScore = Math.min(5, Math.max(0, Math.round(totalScore)));

      return {
        score: finalScore,
        debug: {
          primaryValue,
          totalScore,
          finalScore,
          expressions: detections.expressions
        }
      };
    } catch (error) {
      console.error('Score calculation error:', error);
      return { score: 0, debug: { error: error.message } };
    }
  };

  const getFinalScore = (scores) => {
    if (!scores || scores.length === 0) return 0;

    const validScores = scores.slice(3);
    if (validScores.length === 0) return 0;

    const sortedScores = [...validScores].sort((a, b) => b - a);
    const topScores = sortedScores.slice(0, Math.ceil(sortedScores.length * 0.4));
    
    const sum = topScores.reduce((a, b) => a + b, 0);
    const avgScore = Math.round(sum / topScores.length);

    console.log('Score calculation details:', {
      allScores: scores,
      validScores,
      topScores,
      sum,
      avgScore
    });

    return avgScore;
  };

  const startGame = async () => {
    scoresRef.current = []; // Clear previous scores
    const emoji = getRandomEmoji();
    setCurrentEmoji(emoji);
    const cameraStarted = await startCamera();
    if (cameraStarted) {
      setGameState('playing');
      await startDetection(emoji); // Wait for detection to complete
    }
  };

  const startDetection = (initialEmoji) => {
    let detectionCount = 0;
    const statusMessages = [
      "Analyzing facial features...",
      "Processing emotions...",
      "Detecting expression...",
      "Calculating match..."
    ];

    return new Promise((resolve) => {
      detectionIntervalRef.current = setInterval(async () => {
        if (videoRef.current) {
          try {
            setDetectionStatus(statusMessages[detectionCount % statusMessages.length]);
            detectionCount++;

            const detections = await faceapi.detectSingleFace(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions()
            ).withFaceExpressions();

            if (detections) {
              const { score: calculatedScore, debug: debugData } = calculateScore(detections, initialEmoji);
              scoresRef.current.push(calculatedScore);
              
              // Show real-time score
              setScore(calculatedScore);
              setDebugInfo({
                ...debugData,
                currentScore: calculatedScore,
                scoresHistory: [...scoresRef.current]
              });
            } else {
              scoresRef.current.push(0);
              setDebugInfo({ error: 'No face detected' });
            }
          } catch (error) {
            console.error('Detection error:', error);
            scoresRef.current.push(0);
            setDebugInfo({ error: error.message });
          }
        }
      }, 100);

      setTimeout(() => {
        clearInterval(detectionIntervalRef.current);
        stopCamera();
        
        const calculatedFinalScore = getFinalScore([...scoresRef.current]);
        setFinalScore(calculatedFinalScore); // Set the final score
        setGameState('finished');
        scoresRef.current = []; // Clear for next round
        resolve();
      }, 3000);
    });
  };

  const resetGame = () => {
    stopCamera();
    setGameState('ready');
    setCurrentEmoji('');
    setScore(null);
    setFinalScore(null); // Reset final score
    setAlertMessage('');
    setDetectionStatus('');
    setDebugInfo(null);
    scoresRef.current = [];
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
              {detectionStatus && (
                <div className="absolute bottom-4 left-4 right-4 bg-black bg-opacity-50 text-white p-3 rounded-lg backdrop-blur-sm flex items-center gap-2">
                  <Scan className="w-5 h-5 animate-pulse" />
                  <p className="text-sm">{detectionStatus}</p>
                </div>
              )}
            </div>
            <div className="bg-yellow-50 rounded-lg p-4">
              <p className="text-sm text-yellow-700">
                Recording will stop automatically in 3 seconds...
              </p>
            </div>
          </div>
        </div>

        {gameState === 'playing' && debugInfo && (
          <div className="mt-4 p-4 bg-gray-100 rounded-lg text-xs font-mono overflow-auto max-h-48">
            <h3 className="font-bold mb-2">Debug Info:</h3>
            <pre className="whitespace-pre-wrap">
              {JSON.stringify(debugInfo, null, 2)}
            </pre>
          </div>
        )}

        {gameState === 'finished' && (
                <div className="text-center space-y-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
                    <h2 className="text-xl text-gray-700 mb-3">Your Score:</h2>
                    <p className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
                      {finalScore}/5
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