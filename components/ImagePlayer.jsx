"use client";
import RotatedHistoryBar from "@/components/RotatedHistoryBar";
import RulesVideo from "@/components/RulesVideo";
import TimerStartVideo from "@/components/TimerStartVideo";
import Viewer360 from "@/components/Viewer360";
import Timer from "@/components/ui/timer";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import io from "socket.io-client";

const ImagePlayer = () => {
  const searchParams = useSearchParams();
  const selectedPlaylist = JSON.parse(searchParams.get("playlist") || "[]");
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [roundHistory, setRoundHistory] = useState(
    Array(selectedPlaylist.length).fill(0)
  );
  const [showRulesVideo, setShowRulesVideo] = useState(true);
  const [showBlendedVideo, setShowBlendedVideo] = useState(false);
  const [showTimerStartVideo, setShowTimerStartVideo] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [destroyingViewer, setDestroyingViewer] = useState(false);
  const [expectedIndex, setExpectedIndex] = useState(0);

  const handleTimerEnd = () => {
    const score = roundHistory.filter((value) => value === 1).length;
    router.push(`/score?score=${score}`);
  };

  const handleNextImage = useCallback(() => {
    setDestroyingViewer(true);
  }, []);

  const updateRoundHistory = useCallback(() => {
    setRoundHistory((prevHistory) => {
      const newHistory = [...prevHistory];
      if (newHistory[expectedIndex] === 0) {
        newHistory[expectedIndex] = 1;
        setExpectedIndex((prevExpectedIndex) => {
          const nextIndex = (prevExpectedIndex + 1) % selectedPlaylist.length;
          return nextIndex;
        });
        return newHistory;
      } else if (newHistory[expectedIndex] === 1) {
        console.warn(
          "Image at expectedIndex has already been marked as found."
        );
        setExpectedIndex((prevExpectedIndex) => {
          const nextIndex = (prevExpectedIndex + 1) % selectedPlaylist.length;
          return nextIndex;
        });
        return newHistory;
      } else {
        console.warn("Unexpected value in roundHistory array.");
        return newHistory;
      }
    });
  }, [expectedIndex, selectedPlaylist.length]);

  useEffect(() => {
    const allImagesFound = roundHistory.every((value) => value === 1);
    if (allImagesFound) {
      const score = roundHistory.filter((value) => value === 1).length;
      router.push(`/score?score=${score}`);
    }
  }, [roundHistory, router]);

  useEffect(() => {
    if (destroyingViewer) {
      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          let nextIndex = prevIndex;
          let startIndex = prevIndex;
          do {
            nextIndex = (nextIndex + 1) % selectedPlaylist.length;
            if (nextIndex === startIndex) {
              setDestroyingViewer(false);
              setExpectedIndex(nextIndex);
              return nextIndex;
            }
          } while (roundHistory[nextIndex] === 1);

          setDestroyingViewer(false);
          setExpectedIndex(nextIndex);
          return nextIndex;
        });
      }, 300);
    }
  }, [destroyingViewer, roundHistory, selectedPlaylist.length]);

  useEffect(() => {
    const socket = io("https://geogamer-shorts.onrender.com");

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
          setExpectedIndex(currentIndex);
        }, 3000);
      } else if (message === "Correct") {
        if (currentIndex === expectedIndex) {
          updateRoundHistory();
          handleNextImage();
        }
      } else if (message === "Wrong") {
        console.log("Wrong");
      } else if (message === "Pass") {
        handleNextImage();
      }
    };

    socket.on("adminMessage", handleAdminMessage);
    return () => {
      socket.off("adminMessage", handleAdminMessage);
      socket.disconnect();
    };
  }, [
    currentIndex,
    expectedIndex,
    handleNextImage,
    selectedPlaylist.length,
    updateRoundHistory,
  ]);

  return (
    <div className="relative flex content-center justify-center">
      {showRulesVideo && <RulesVideo showBlendedVideo={showBlendedVideo} />}
      {showTimerStartVideo && <TimerStartVideo />}
      {gameStarted && selectedPlaylist.length > 0 && (
        <>
          <Viewer360 imageUrl={selectedPlaylist[currentIndex]} />
          <Timer
            duration={5}
            roundHistory={roundHistory}
            onTimerEnd={handleTimerEnd}
          />
          <RotatedHistoryBar
            totalRounds={selectedPlaylist.length}
            roundHistory={roundHistory}
            currentRoundId={currentIndex}
          />
        </>
      )}
    </div>
  );
};

export default ImagePlayer;
