// src/Game.js

import { useState } from "react";
import { Player } from "@lottiefiles/react-lottie-player";
import { motion } from "framer-motion";
import Howler from "react-howler";
import axios from "axios";

const moves = {
  s: {
    name: "Snake",
    animation: "/animations/snake.json",
    sound: "https://assets.mixkit.co/sfx/preview/mixkit-angry-snake-hissing-56.mp3"
  },
  w: {
    name: "Water",
    animation: "/animations/water.json",
    sound: "https://assets.mixkit.co/sfx/preview/mixkit-water-splash-1315.mp3"
  },
  g: {
    name: "Gun",
    animation: "/animations/gun.json",
    sound: "https://assets.mixkit.co/sfx/preview/mixkit-game-gun-shot-2769.mp3"
  }
};

const results = {
  Draw: "🤝 It's a draw!",
  User: "🏆 You win!",
  Computer: "🤖 Computer wins!"
};

export default function SnakeWaterGunGame() {
  const [userMove, setUserMove] = useState(null);
  const [compMove, setCompMove] = useState(null);
  const [result, setResult] = useState("");
  const [userScore, setUserScore] = useState(0);
  const [compScore, setCompScore] = useState(0);
  const [soundUrl, setSoundUrl] = useState(null);
  const [round, setRound] = useState(1);
  const [finalMessage, setFinalMessage] = useState("");
  const maxRounds = 15;

  const playMove = async (move) => {
    if (round > maxRounds) return;

    try {
      const response = await axios.post("https://snake-water-gun-ai.onrender.com/move", { move });
      const data = response.data;

      setUserMove(data.userMove);
      setCompMove(data.compMove);
      setResult(results[data.result]);
      setFinalMessage(data.finalMessage || "");

      if (data.result === "User") setUserScore(prev => prev + 1);
      else if (data.result === "Computer") setCompScore(prev => prev + 1);

      setSoundUrl(moves[move].sound);
      setRound(prev => prev + 1);
    } catch (err) {
      console.error("❌ Backend Error:", err);
    }
  };

  const resetGame = () => {
    setUserMove(null);
    setCompMove(null);
    setResult("");
    setUserScore(0);
    setCompScore(0);
    setSoundUrl(null);
    setRound(1);
    setFinalMessage("");
  };

  return (
    <div className="flex flex-col items-center justify-center px-4 py-6 gap-4 min-h-screen bg-gradient-to-br from-indigo-900 to-black text-white">
      <h1 className="text-4xl font-bold tracking-wide text-center">🐍 Snake - Water - Gun</h1>
      <p className="text-lg text-gray-300">Round {Math.min(round, maxRounds)} / {maxRounds}</p>

      {/* Buttons */}
      <div className="flex flex-wrap justify-center gap-4 mt-4 w-full max-w-md">
        {Object.entries(moves).map(([key, val]) => (
          <button
            key={key}
            onClick={() => playMove(key)}
            disabled={round > maxRounds}
            className="bg-white text-black px-4 py-2 rounded-xl text-lg shadow-lg hover:scale-105 transition disabled:opacity-40"
          >
            {val.name}
          </button>
        ))}
      </div>

      {soundUrl && <Howler src={soundUrl} playing={true} volume={0.8} />}

      {/* Animations */}
      <div className="flex flex-col sm:flex-row gap-10 mt-10 items-center justify-center w-full">
        {userMove && (
          <div className="text-center">
            <p className="text-xl font-semibold mb-1">🧑 You</p>
            <Player
              autoplay
              loop
              src={moves[userMove].animation}
              className="w-32 sm:w-40 mx-auto"
            />
            <p className="text-lg">{moves[userMove].name}</p>
          </div>
        )}
        {compMove && (
          <div className="text-center">
            <p className="text-xl font-semibold mb-1">🤖 Computer</p>
            <Player
              autoplay
              loop
              src={moves[compMove].animation}
              className="w-32 sm:w-40 mx-auto"
            />
            <p className="text-lg">{moves[compMove].name}</p>
          </div>
        )}
      </div>

      {/* Result */}
      {result && (
        <motion.p
          className="text-2xl mt-6 font-bold"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
        >
          {result}
        </motion.p>
      )}

      {/* Score */}
      <p className="mt-4 text-xl">Score: You {userScore} - {compScore} Computer</p>

      {/* Game Over */}
      {round > maxRounds && (
        <>
          <motion.div
            className="mt-6 text-yellow-300 font-semibold text-center text-xl"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            🎯 Game Over!
          </motion.div>

          {finalMessage && (
            <motion.p
              className="text-2xl font-bold mt-2 text-green-400 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
            >
              {finalMessage}
            </motion.p>
          )}

          {/* Play Again Button */}
          <motion.button
            onClick={resetGame}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            className="mt-6 px-6 py-2 bg-green-500 hover:bg-green-600 text-white font-semibold rounded-2xl shadow-xl"
          >
            🔁 Play Again
          </motion.button>
        </>
      )}
    </div>
  );
}
