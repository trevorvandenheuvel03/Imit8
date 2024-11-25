import React from 'react';
import Typewriter from 'typewriter-effect';

const FunHeader = () => {
  return (
    <div className="text-center space-y-2">
      <h1 className="text-7xl font-paytone relative group animate-pulse">
        <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-purple-600 text-transparent bg-clip-text inline-block transform hover:scale-110 transition-transform duration-200">
          Imit8
        </span>
        <span className="absolute -top-4 right-0 text-3xl animate-bounce">✨</span>
        <span className="absolute -bottom-2 left-0 text-3xl animate-bounce delay-100">🎭</span>
      </h1>

      <div className="flex items-center justify-center gap-2 text-2xl font-paytone">
        <span className="text-purple-600/80 font-medium">
          Imitate and
        </span>
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-500 to-pink-500 min-w-[120px] inline-block">
          <Typewriter
            options={{
              strings: [
                "Elevate! ",
                "Celebrate! ",
                "Levitate! ",
                "Radiate! ",
                "Captivate! ",
                "Fascinate! "
              ],
              autoStart: true,
              loop: true,
              delay: 80,
              deleteSpeed: 60,
              cursorClassName: "text-pink-400"
            }}
          />
        </span>
      </div>
    </div>
  );
};

export default FunHeader;