import React from 'react';
import Typewriter from 'typewriter-effect';

const TypewriterEffect = () => {
  return (
    <Typewriter
      options={{
        strings: [
          'elevate',
          'celebrate',
          'resonate',
          'gravitate',
          'levitate',
          'radiate',
          'captivate',
          'fascinate'
        ],
        autoStart: true,
        loop: true,
        deleteSpeed: 50,
        delay: 50,
        wrapperClassName: "font-semibold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-pink-600",
        cursorClassName: "text-purple-600",
        // Additional customization
        pauseFor: 1500, // Pause at end of word
        skipAddStyles: false, // Don't add default styles
        stringSplitter: null, // Custom string splitter if needed
      }}
      onInit={(typewriter) => {
        // Custom initialization if needed
        typewriter
          .pauseFor(500)
          .start();
      }}
    />
  );
};

export default TypewriterEffect;