import React, { useState, useEffect } from 'react';
import { Card } from './ui/card';
import { Wallet, Star, Clock } from 'lucide-react';

const PhotoWall = () => {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPhotos();
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  const handleStorageChange = (e) => {
    if (e.key === 'photoWall') {
      loadPhotos();
    }
  };

  const loadPhotos = () => {
    try {
      const savedPhotos = JSON.parse(localStorage.getItem('photoWall') || '[]');
      setPhotos(savedPhotos);
    } catch (error) {
      console.error('Error loading photos:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {[...Array(6)].map((_, i) => (
          <div 
            key={i} 
            className="aspect-square bg-white/50 animate-pulse rounded-xl shadow-lg"
          />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h2 className="text-3xl font-bold text-center text-purple-800">
        Recent Captures
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {photos.map((photo, index) => (
          <Card 
            key={`${photo.wallet}-${photo.timestamp}-${index}`} 
            className="group bg-white/80 backdrop-blur-sm transform transition-all duration-300 hover:scale-105 hover:shadow-xl"
          >
            <div className="relative">
              {/* Image Container */}
              <div className="aspect-square relative overflow-hidden">
                {photo.imageUrl ? (
                  <img
                    src={photo.imageUrl}
                    alt={`Emotion Capture ${index + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 100 100"><rect width="100" height="100" fill="%23f0f0f0"/><text x="50" y="50" font-family="Arial" font-size="14" text-anchor="middle" dy=".3em" fill="%23666">Image not found</text></svg>';
                      e.target.className = 'w-full h-full object-cover opacity-50';
                    }}
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-purple-50 to-pink-50 flex items-center justify-center">
                    <span className="text-6xl">{photo.emoji || '📷'}</span>
                  </div>
                )}
                
                {/* Challenge Emoji */}
                <div className="absolute top-4 left-4 bg-white/90 backdrop-blur-sm rounded-full w-12 h-12 shadow-lg flex items-center justify-center">
                  <span className="text-2xl">{photo.emoji}</span>
                </div>

                {/* Score Badge */}
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg flex items-center gap-2">
                  <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                  <span className="font-bold text-gray-800 text-lg">{photo.score}/5</span>
                </div>
              </div>

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-6">
                <div className="text-white space-y-3 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{photo.emoji}</span>
                      <div className="flex items-center gap-2">
                        <Star className="w-5 h-5 text-yellow-500 fill-yellow-500" />
                        <span className="font-bold text-lg">{photo.score}/5</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white/80">
                    <Clock className="w-4 h-4" />
                    <span className="text-sm">
                      {new Date(photo.timestamp).toLocaleString()}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-2 text-white/60">
                    <Wallet className="w-4 h-4" />
                    <span className="text-sm font-mono">
                      {photo.wallet?.slice(0, 6)}...{photo.wallet?.slice(-4)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        ))}

        {photos.length === 0 && (
          <div className="col-span-full">
            <Card className="p-12 text-center bg-white/80 backdrop-blur-sm">
              <div className="text-gray-500 space-y-2">
                <p className="text-lg font-medium">No photos yet</p>
                <p className="text-sm">Be the first to capture an emotion!</p>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default PhotoWall;