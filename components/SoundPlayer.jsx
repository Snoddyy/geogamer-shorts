"use client";
import HistoryBar from "@/components/HistoryBar";
import RulesVideo from "@/components/RulesVideo";
import TimerStartVideo from "@/components/TimerStartVideo";
import { Button } from "@/components/ui/button";
import Timer from "@/components/ui/timer";
import { AudioLines } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import io from "socket.io-client";
import useSound from "use-sound";

const SoundPlayer = ({
  playlist,
  onCorrect,
  onWrong,
  currentIndex,
  setCurrentIndex,
  handleSoundPlayed,
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const selectedPlaylist = JSON.parse(searchParams.get("playlist") || "[]");
  const [playSound] = useSound(playlist[currentIndex]);
  const [showRulesVideo, setShowRulesVideo] = useState(true);
  const [showBlendedVideo, setShowBlendedVideo] = useState(false);
  const [showTimerStartVideo, setShowTimerStartVideo] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [played, setPlayed] = useState(0);
  const [navigatedToScorePage, setNavigatedToScorePage] = useState(false);
  const [roundHistory, setRoundHistory] = useState(
    Array(selectedPlaylist.length).fill(0)
  );

  const handleReplaySound = useCallback(() => {
    playSound();
  }, [playSound]);

  const handleKeyDown = useCallback(
    (event) => {
      if (event.code === "Space") {
        handleReplaySound();
      }
    },
    [handleReplaySound]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const navigateToScorePage = useCallback(() => {
    if (played === playlist.length && !navigatedToScorePage) {
      handleSoundPlayed();
      setNavigatedToScorePage(true);
    }
  }, [played, playlist.length, handleSoundPlayed, navigatedToScorePage]);

  const handleTimerEnd = () => {
    const score = roundHistory.filter((value) => value === 1).length;
    router.push(`/score?score=${score}`);
  };

  const updateRoundHistory = useCallback(() => {
    setRoundHistory((prevHistory) => {
      const newHistory = [...prevHistory];
      if (newHistory[currentIndex] === 0) {
        newHistory[currentIndex] = 1;
        return newHistory;
      } else {
        console.warn("Sound at currentIndex has already been marked as found.");
        return newHistory;
      }
    });
  }, [currentIndex]);

  useEffect(() => {
    const socket = io("http://92.141.138.206:8080/");

    const handleCorrect = () => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < playlist.length) {
        setCurrentIndex(nextIndex);
        onCorrect();
        handleSoundPlayed();
        updateRoundHistory();
      } else {
        onCorrect();
        handleSoundPlayed();
        navigateToScorePage();
      }
    };

    const handleWrong = () => {
      onWrong();
    };

    const handlePass = () => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < playlist.length) {
        setCurrentIndex(nextIndex);
        handleSoundPlayed();
      } else {
        handleSoundPlayed();
        navigateToScorePage();
      }
    };

    const handleAdminMessage = (message) => {
      if (message === "Display Rules") {
        setShowRulesVideo(true);
        setShowBlendedVideo(true);
        setShowTimerStartVideo(false);
      } else if (message === "Start Game") {
        setShowTimerStartVideo(true);
        setShowBlendedVideo(false);
        setTimeout(() => {
          setShowRulesVideo(false);
          setShowTimerStartVideo(false);
          setGameStarted(true);
        }, 3000);
      } else if (message === "Correct") {
        handleCorrect();
      } else if (message === "Wrong") {
        handleWrong();
      } else if (message === "Pass") {
        handlePass();
      } else if (message === "Replay") {
        handleReplaySound();
      }
    };

    socket.on("adminMessage", handleAdminMessage);
    return () => {
      socket.off("adminMessage", handleAdminMessage);
      socket.disconnect();
    };
  }, [
    currentIndex,
    onCorrect,
    onWrong,
    playlist.length,
    setCurrentIndex,
    handleSoundPlayed,
    navigateToScorePage,
    handleReplaySound,
    updateRoundHistory,
  ]);

  return (
    <div className="relative flex content-center justify-center">
      {showRulesVideo && <RulesVideo showBlendedVideo={showBlendedVideo} />}
      {showTimerStartVideo && <TimerStartVideo />}
      {gameStarted && (
        <>
          <div className="flex flex-col items-center justify-center min-h-screen">
            <div className="flex flex-col items-center justify-center mb-4">
              <Button
                onClick={handleReplaySound}
                variant="outline"
                size="icon"
                className="w-24 h-24"
              >
                <AudioLines className="w-12 h-12" />
              </Button>
              <p className="mt-2">Press Spacebar to replay the sound</p>
            </div>
            <p className="text-lg font-bold">
              Sound {currentIndex + 1} of {playlist.length}
            </p>
          </div>
          <Timer
            duration={59}
            roundHistory={roundHistory}
            onTimerEnd={handleTimerEnd}
          />
          <HistoryBar
            totalRounds={playlist.length}
            roundHistory={roundHistory}
            currentRoundId={currentIndex}
          />
        </>
      )}
    </div>
  );
};

export default SoundPlayer;
