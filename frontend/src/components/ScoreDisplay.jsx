

const ScoreDisplay = ({ score, onReset }) => (
    <div className="text-center space-y-6">
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-6 rounded-xl">
        <h2 className="text-xl text-gray-700 mb-3">Your Score:</h2>
        <p className="text-6xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 text-transparent bg-clip-text">
          {score}/5
        </p>
      </div>
      <Button
        onClick={onReset}
        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-full font-semibold transform hover:scale-105 transition-all duration-200 flex items-center gap-2 mx-auto"
      >
        <RefreshCw className="w-5 h-5" />
        Play Again
      </Button>
    </div>
  );

export default ScoreDisplay;