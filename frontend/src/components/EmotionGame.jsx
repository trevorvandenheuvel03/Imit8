import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, RefreshCw, Scan, Wallet, Sparkles } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import * as faceapi from 'face-api.js';
import { uploadToIpfs, uploadMetadata } from '../utils/storageUtils';
import { sendAVAX } from '../scripts/send';

const EmotionGame = ({ userWallet }) => {
  // Game state management
  const [gameState, setGameState] = useState('loading');
  const [currentEmoji, setCurrentEmoji] = useState('');
  const [score, setScore] = useState(null);
  const [alertMessage, setAlertMessage] = useState('');
  const [detectionStatus, setDetectionStatus] = useState('');
  const [debugInfo, setDebugInfo] = useState(null);
  const [finalScore, setFinalScore] = useState(null);
  const [attemptsLeft, setAttemptsLeft] = useState(5);
  const [lastAttemptTime, setLastAttemptTime] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [error, setError] = useState('');
  const [sentTokens, setSentTokens] = useState(0);

  // Refs
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const detectionIntervalRef = useRef(null);
  const scoresRef = useRef([]);
  const canvasRef = useRef(null);

  const clientId = import.meta.env.VITE_CLIENT_ID;

  const emojiMap = {
    '😀': {
      primary: 'happy',
      related: ['neutral'],
      opposite: ['sad', 'angry', 'disgusted'],
      weights: { primary: 1.2, related: 0.2, opposite: -1.0 }
    },
    '😢': {
      primary: 'sad',
      related: ['neutral'],
      opposite: ['happy', 'surprised', 'angry'],
      weights: { primary: 1.2, related: 0.2, opposite: -1.0 }
    },
    '😡': {
      primary: 'angry',
      related: ['disgusted'],
      opposite: ['happy', 'neutral', 'surprised'],
      weights: { primary: 1.2, related: 0.2, opposite: -1.0 }
    },
    '😲': {
      primary: 'surprised',
      related: ['fearful'],
      opposite: ['neutral', 'sad', 'angry'],
      weights: { primary: 1.2, related: 0.2, opposite: -1.0 }
    },
    '😍': {
      primary: 'happy',
      related: ['neutral'],
      opposite: ['sad', 'angry', 'disgusted', 'fearful'],
      weights: { primary: 1.2, related: 0.2, opposite: -1.0 }
    }
  };

  // Initialize game
  useEffect(() => {
    loadModels();
    checkAttempts();
    return () => stopCamera();
  }, [userWallet]);

  useEffect(() => {
    if (!clientId) {
      setError('Client ID is not configured. Please check your settings.');
      console.error('Missing client ID');
    }
  }, []);

  // Load face detection models
  const loadModels = async () => {
    try {
      await Promise.all([
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      ]);
      setGameState('ready');
    } catch (error) {
      console.error('Error loading models:', error);
      setAlertMessage('Error loading detection models. Please refresh the page.');
    }
  };

  // Check remaining attempts
  const checkAttempts = () => {
    const storedAttempts = localStorage.getItem(`attempts_${userWallet}`);
    const storedTime = localStorage.getItem(`lastAttempt_${userWallet}`);
    
    if (storedAttempts && storedTime) {
      const lastTime = new Date(parseInt(storedTime));
      const now = new Date();
      
      // Reset after 1 minute
      if (now - lastTime >= 60 * 1000) {
        setAttemptsLeft(5);
        setLastAttemptTime(null);
        localStorage.removeItem(`attempts_${userWallet}`);
        localStorage.removeItem(`lastAttempt_${userWallet}`);
      } else {
        setAttemptsLeft(parseInt(storedAttempts));
        setLastAttemptTime(lastTime);
      }
    }
  };

  // Camera handling
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
      console.error('Camera error:', error);
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

  // Game mechanics
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
      
      const primaryValue = detections.expressions[emotionConfig.primary] || 0;
      const primaryScore = primaryValue * 5 * emotionConfig.weights.primary;
      totalScore += primaryScore;

      emotionConfig.related.forEach(emotion => {
        const value = detections.expressions[emotion] || 0;
        totalScore += value * 5 * emotionConfig.weights.related;
      });

      emotionConfig.opposite.forEach(emotion => {
        const value = detections.expressions[emotion] || 0;
        totalScore += value * 5 * emotionConfig.weights.opposite;
      });

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
    return Math.round(topScores.reduce((a, b) => a + b, 0) / topScores.length);
  };

  const getTimeUntilReset = () => {
    if (!lastAttemptTime) return '1 minute';
    const now = new Date();
    const timeDiff = 60 * 1000 - (now - lastAttemptTime);
    const seconds = Math.ceil(timeDiff / 1000);
    return `${seconds} seconds`;
  };

  // Photo capture and upload
  const captureAndUploadPhoto = async (emoji, score, imageBlob) => {
    if (!imageBlob) {
      console.error('No image blob provided');
      setError('Failed to save photo: No image captured');
      return;
    }
  
    if (!emoji || score === null || score === undefined) {
      console.error('Missing required data:', { emoji, score });
      setError('Failed to save photo: Missing required data');
      return;
    }
    
    setUploadingPhoto(true);
  
    try {
      const file = new File([imageBlob], `emotion-capture-${Date.now()}.jpg`, {
        type: 'image/jpeg'
      });
  
      console.log('Starting upload with data:', {
        emoji,
        score,
        wallet: userWallet,
        fileSize: file.size
      });
  
      const { uri: imageUri, url: imageUrl } = await uploadToIpfs(file, clientId);
  
      const metadata = {
        name: "Imit8 Capture",
        description: `Emotion score: ${score}/5 - Emoji: ${emoji}`,
        properties: {
          score: score,
          timestamp: new Date().toISOString(),
          wallet: userWallet,
          emoji: emoji
        }
      };
  
      console.log('Uploading metadata:', metadata);
      const metadataUri = await uploadMetadata(imageUri, metadata, clientId);
  
      const photoData = {
        imageUrl,
        metadataUri,
        score,
        timestamp: new Date().toISOString(),
        wallet: userWallet,
        emoji
      };
  
      const existingPhotos = JSON.parse(localStorage.getItem('photoWall') || '[]');
      existingPhotos.unshift(photoData);
      localStorage.setItem('photoWall', JSON.stringify(existingPhotos));
  
      console.log('Successfully saved photo:', photoData);

      const tokenReward = score * 100;
      await sendAVAX(userWallet, tokenReward.toString());
      setSentTokens(tokenReward);

      console.log('Tokens sent:', tokenReward);

    } catch (error) {
      console.error('Error in capture and upload:', error);
      setError('Failed to save photo. Please try again.');
      throw error;
    } finally {
      setUploadingPhoto(false);
    }
  };
  

  // Game flow control
  const startGame = async () => {
    if (attemptsLeft <= 0) {
      const timeLeft = getTimeUntilReset();
      setAlertMessage(`No attempts left. Please try again in ${timeLeft}`);
      return;
    }

    scoresRef.current = [];
    const emoji = getRandomEmoji();
    setCurrentEmoji(emoji);
    const cameraStarted = await startCamera();
    if (cameraStarted) {
      setGameState('playing');
      await startDetection(emoji);
    }
  };

  const startDetection = (initialEmoji) => {
    let detectionCount = 0;
    let lastValidFrame = null;
    let bestScore = 0;
    let bestImageBlob = null;
    let framesInLastSecond = [];  // Store frames from the last second
    
    const statusMessages = [
      "Analyzing facial features...",
      "Processing emotions...",
      "Detecting expression...",
      "Calculating match..."
    ];
  
    const captureCurrentFrame = async () => {
      if (!videoRef.current || !canvasRef.current) return null;
      
      try {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        if (video.readyState < 2 || video.videoWidth === 0) {
          console.log('Video not ready yet, waiting...');
          return null;
        }
  
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(video, 0, 0);
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        if (imageData.data.every(pixel => pixel === 0)) {
          console.log('Empty frame detected, skipping');
          return null;
        }
  
        return new Promise(resolve => 
          canvas.toBlob(resolve, 'image/jpeg', 0.9)
        );
      } catch (error) {
        console.error('Frame capture error:', error);
        return null;
      }
    };
  
    return new Promise((resolve) => {
      const totalDuration = 3000; // 3 seconds total
      const startTime = Date.now();
  
      detectionIntervalRef.current = setInterval(async () => {
        if (videoRef.current) {
          try {
            const elapsedTime = Date.now() - startTime;
            const timeRemaining = totalDuration - elapsedTime;
            
            setDetectionStatus(
              timeRemaining < 1000 
                ? "Almost done... Hold your expression! 📸"
                : statusMessages[detectionCount % statusMessages.length]
            );
            
            detectionCount++;
  
            const currentFrame = await captureCurrentFrame();
            if (currentFrame) {
              // If we're in the last second, store the frame with its score
              if (timeRemaining <= 1000) {
                lastValidFrame = currentFrame;
              }
            }
  
            const detections = await faceapi.detectSingleFace(
              videoRef.current,
              new faceapi.TinyFaceDetectorOptions()
            ).withFaceExpressions();
  
            if (detections) {
              const { score: calculatedScore, debug: debugData } = calculateScore(detections, initialEmoji);
              scoresRef.current.push(calculatedScore);
              setScore(calculatedScore);
              
              // For the last second, store both score and frame
              if (timeRemaining <= 1000) {
                framesInLastSecond.push({
                  score: calculatedScore,
                  frame: currentFrame,
                  timestamp: Date.now()
                });
              }
  
              setDebugInfo({
                ...debugData,
                currentScore: calculatedScore,
                scoresHistory: [...scoresRef.current],
                timeRemaining: Math.round(timeRemaining / 1000)
              });
            } else {
              scoresRef.current.push(0);
              setDebugInfo({ 
                error: 'No face detected',
                hasLastValidFrame: !!lastValidFrame,
                timeRemaining: Math.round(timeRemaining / 1000)
              });
            }
          } catch (error) {
            console.error('Detection error:', error);
            scoresRef.current.push(0);
            setDebugInfo({ error: error.message });
          }
        }
      }, 100);
  
      setTimeout(async () => {
        clearInterval(detectionIntervalRef.current);
        
        const calculatedFinalScore = getFinalScore([...scoresRef.current]);
        
        await Promise.all([
          new Promise(resolve => {
            setFinalScore(calculatedFinalScore);
            resolve();
          }),
          new Promise(resolve => {
            setCurrentEmoji(initialEmoji);
            resolve();
          })
        ]);
  
        await new Promise(resolve => setTimeout(resolve, 100));
  
        try {
          // Find the best frame from the last second
          let frameToUse = null;
          if (framesInLastSecond.length > 0) {
            // Sort by score and get the best frame from the last second
            const bestFrameData = framesInLastSecond
              .filter(f => f.frame) // Ensure we have valid frames
              .sort((a, b) => b.score - a.score)[0];
            
            if (bestFrameData) {
              frameToUse = bestFrameData.frame;
              console.log('Using best frame from last second, score:', bestFrameData.score);
            }
          }
  
          // Fallback to last valid frame if no good frames in last second
          if (!frameToUse) {
            frameToUse = lastValidFrame;
            console.log('Using fallback last valid frame');
          }
  
          if (!frameToUse) {
            throw new Error('Unable to capture valid frame');
          }
  
          if (!initialEmoji || calculatedFinalScore === null) {
            throw new Error('Missing emoji or score for upload');
          }
  
          await captureAndUploadPhoto(initialEmoji, calculatedFinalScore, frameToUse);
  
          const newAttempts = attemptsLeft - 1;
          setAttemptsLeft(newAttempts);
          const now = new Date();
          setLastAttemptTime(now);
          localStorage.setItem(`attempts_${userWallet}`, newAttempts.toString());
          localStorage.setItem(`lastAttempt_${userWallet}`, now.getTime().toString());
  
          setGameState('finished');
        } catch (error) {
          console.error('Capture process failed:', error);
          setError(error.message || 'Failed to save your attempt. Please try again.');
        } finally {
          stopCamera();
        }
  
        scoresRef.current = [];
        resolve();
      }, 3000);
    });
  };



  const resetGame = () => {
    stopCamera();
    setGameState('ready');
    setCurrentEmoji('');
    setScore(null);
    setFinalScore(null);
    setAlertMessage('');
    setDetectionStatus('');
    setDebugInfo(null);
    scoresRef.current = [];
  };

  // Render component
  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-100 to-pink-100 p-4 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md mx-auto backdrop-blur-sm bg-opacity-90">
      <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold text-purple-800 mb-4">How to Play & Win! 🎮</h2>
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-left">
              <div className="bg-purple-100 p-2 rounded-full">
                <Wallet className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-gray-700">1. Connect your wallet (you're already crushing it! 🎉)</p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="bg-purple-100 p-2 rounded-full">
                <Camera className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-gray-700">2. Hit that camera button & make your best emoji face in 3 secs! 🤪</p>
            </div>
            <div className="flex items-center gap-3 text-left">
              <div className="bg-purple-100 p-2 rounded-full">
                <Sparkles className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-gray-700">3. Score high = more IMIT tokens in your wallet & refresh to see yourself on the wall! ⭐</p>
            </div>
          </div>
        </div>

        
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-purple-800">Imit8</h1>
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Wallet className="w-4 h-4" />
            <span className="font-mono">
              {userWallet.slice(0, 6)}...{userWallet.slice(-4)}
            </span>
          </div>
        </div>

        <div className="mb-4 bg-purple-50 rounded-lg p-3 flex justify-between items-center">
          <span className="text-purple-700">Attempts left:</span>
          <span className="font-bold text-purple-800">{attemptsLeft}/5</span>
        </div>

        {gameState === 'loading' && (
          <div className="text-center py-4">
            <p className="text-gray-600">Loading emotion detection models...</p>
          </div>
        )}

        {gameState === 'ready' && (
          <div className="flex flex-col items-center">
            <Button
              onClick={startGame}
              disabled={attemptsLeft <= 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8 py-4 rounded-full font-semibold text-lg shadow-lg transform hover:scale-105 transition-all duration-200 flex items-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Camera className="w-6 h-6" />
              Click Now
            </Button>
            <p className="mt-6 text-gray-600 text-center">
              {attemptsLeft > 0 
                ? "Click to start the game and mimic the emoji that appears!"
                : `No attempts left. Try again in ${getTimeUntilReset()}`
              }
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
              <p className="mt-4 text-sm text-gray-600">
                {attemptsLeft > 0 
                  ? `You have ${attemptsLeft} attempt${attemptsLeft === 1 ? '' : 's'} left`
                  : `Come back in ${getTimeUntilReset()} for more attempts!`
                }
              </p>
              {sentTokens > 0 && (
                <div className="mt-4 p-4 rounded-lg">
                  <p className="flex items-center gap-2 text-sm">
                    <Wallet className="w-5 h-5" />
                    {`Congratulations! You earned ${sentTokens} IMIT tokens and they've been sent to your wallet.`}
                  </p>
                  <div className="flex justify-center mt-2">
                    {sentTokens >= 500 && (
                      <span className="text-4xl">🤑</span>
                    )}
                    {sentTokens >= 400 && sentTokens < 500 && (
                      <span className="text-4xl">😄</span>
                    )}
                    {sentTokens >= 100 && sentTokens < 400 && (
                      <span className="text-4xl">😊</span>
                    )}
                    {sentTokens > 0 && sentTokens < 100 && (
                      <span className="text-4xl">🙂</span>
                    )}
                    {sentTokens === 0 && (
                      <span className="text-4xl">😕</span>
                    )}
                  </div>
                </div>
              )}
            </div>
            <Button
              onClick={resetGame}
              disabled={attemptsLeft <= 0}
              className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-full font-semibold transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <RefreshCw className="w-5 h-5" />
              {attemptsLeft > 0 ? 'Try Again 👾' : 'No Attempts Left'}
            </Button>
            
            {finalScore >= 3 && (
              <div className="mt-4 bg-green-50 p-4 rounded-lg">
                <p className="text-green-700 text-sm">
                  Great job! Tokens will be sent to your wallet shortly.
                </p>
              </div>
            )}
          </div>
        )}

        {alertMessage && (
          <Alert className="mt-6 border-red-200 bg-red-50">
            <AlertDescription className="text-red-700">
              {alertMessage}
            </AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert className="mt-6 border-red-200 bg-red-50">
              <AlertDescription className="text-red-700">
                {error}
              </AlertDescription>
          </Alert>
        )}

        {/* Upload state indicator */}
        {uploadingPhoto && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Saving your photo...</p>
            </div>
          </div>
        )}

        {/* Hidden canvas for photo capture */}
        <canvas ref={canvasRef} style={{ display: 'none' }} />
      </div>
    </div>
  );
};

export default EmotionGame;