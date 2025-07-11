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
  const maxRounds = 10;

  const playMove = async (move) => {
    if (round > maxRounds) return;
    try {
      const response = await axios.post("https://snake-water-gun-ai.onrender.com/move", { move });
      const data = response.data;

      setUserMove(data.userMove);
      setCompMove(data.compMove);
      setResult(results[data.result]);

      if (data.result === "User") setUserScore(prev => prev + 1);
      else if (data.result === "Computer") setCompScore(prev => prev + 1);

      setSoundUrl(moves[move].sound);
      setRound(prev => prev + 1);
    } catch (err) {
      console.error("❌ Backend Error:", err);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 gap-4 min-h-screen bg-gradient-to-br from-indigo-900 to-black text-white">
      <h1 className="text-4xl font-bold tracking-wide mb-2">🐍 Snake - Water - Gun</h1>
      <p className="text-lg text-gray-300">Round {Math.min(round, maxRounds)} / {maxRounds}</p>

      <div className="flex gap-6 mt-4">
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

      <div className="flex mt-10 gap-10 items-center">
        {userMove && (
          <div className="text-center">
            <p className="text-xl font-semibold mb-1">🧑 You</p>
            <Player autoplay loop src={moves[userMove].animation} style={{ height: 120, width: 120 }} />
            <p className="text-lg">{moves[userMove].name}</p>
          </div>
        )}
        {compMove && (
          <div className="text-center">
            <p className="text-xl font-semibold mb-1">🤖 Computer</p>
            <Player autoplay loop src={moves[compMove].animation} style={{ height: 120, width: 120 }} />
            <p className="text-lg">{moves[compMove].name}</p>
          </div>
        )}
      </div>

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

      <p className="mt-4 text-xl">Score: You {userScore} - {compScore} Computer</p>

      {round > maxRounds && (
        <div className="mt-4 text-yellow-300 font-semibold">
          🎯 Game Over! Refresh to play again.
        </div>
      )}
    </div>
  );
}
