const EmojiDisplay = ({ emoji }) => (
    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
      <p className="text-lg text-gray-700 mb-3">Mimic this emotion:</p>
      <span className="text-8xl block mb-2 animate-bounce">{emoji}</span>
    </div>
  );

export default EmojiDisplay;
