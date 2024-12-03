"use client";
import RotatedHistoryBar from "@/components/RotatedHistoryBar";
import RulesVideo from "@/components/RulesVideo";
import TimerStartVideo from "@/components/TimerStartVideo";
import Viewer360 from "@/components/Viewer360";
import { locations } from "@/components/locations";
import { soundDesign } from "@/components/soundDesign";
import Timer from "@/components/ui/timer";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import useSound from "use-sound";

const LocationPlayer = () => {
  // State declarations
  const [selectedPlaylist, setSelectedPlaylist] = useState([]);
  const [roundHistory, setRoundHistory] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [gameStarted, setGameStarted] = useState(false);
  const [showRulesVideo, setShowRulesVideo] = useState(true);
  const [showBlendedVideo, setShowBlendedVideo] = useState(false);
  const [showTimerStartVideo, setShowTimerStartVideo] = useState(false);
  const [expectedIndex, setExpectedIndex] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);

  const timerRef = useRef(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Define handleNextImage before using it in useEffect
  const handleNextImage = useCallback(() => {
    if (currentIndex < selectedPlaylist.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setExpectedIndex((prev) => prev + 1);
    } else {
      const score = roundHistory.filter((value) => value === 1).length;
      router.push(`/score?score=${score}&total=${selectedPlaylist.length}`);
    }
  }, [currentIndex, selectedPlaylist.length, roundHistory, router]);

  const updateRoundHistory = useCallback(() => {
    setRoundHistory((prev) => {
      const newHistory = [...prev];
      newHistory[currentIndex] = 1;
      return newHistory;
    });
  }, [currentIndex]);

  const handleTimerEnd = useCallback(() => {
    console.log("Timer ended callback");
    if (gameStarted && isTimerActive) {
      const score = roundHistory.filter((value) => value === 1).length;
      console.log("Game over, score:", score);
      router.push(`/score?score=${score}&total=${selectedPlaylist.length}`);
    }
  }, [gameStarted, isTimerActive, roundHistory, router]);

  // Sound hooks
  const [playRules] = useSound(
    soundDesign.find((sound) => sound.id === "rules").url
  );
  const [playAmbiance, { stop: stopAmbiance }] = useSound(
    soundDesign.find((sound) => sound.id === "ambiance").url,
    { volume: 0.5 }
  );
  const [playTimerStart] = useSound(
    soundDesign.find((sound) => sound.id === "timerStart").url
  );
  const [playCorrect] = useSound(
    soundDesign.find((sound) => sound.id === "correct").url
  );
  const [playWrong] = useSound(
    soundDesign.find((sound) => sound.id === "wrong").url
  );
  const [playPass] = useSound(
    soundDesign.find((sound) => sound.id === "pass").url
  );

  // Initialize playlist and round history
  useEffect(() => {
    const playlistParam = searchParams.get("playlist");
    console.log("LocationPlayer - Raw playlist param:", playlistParam);

    if (!playlistParam) {
      console.log("No playlist parameter found");
      router.replace("/playlist-selection");
      return;
    }

    try {
      const decodedParam = decodeURIComponent(playlistParam);
      const parsed = JSON.parse(decodedParam);

      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Invalid playlist data");
      }

      console.log("Setting initial state with playlist:", parsed);
      setSelectedPlaylist(parsed);
      setRoundHistory(Array(parsed.length).fill(0));
      setGameStarted(false);
      setIsTimerActive(false);
      if (timerRef.current) {
        timerRef.current.reset();
      }
    } catch (error) {
      console.error("Parse error:", error);
      router.replace("/playlist-selection");
    }
  }, [searchParams, router]);

  // Socket connection effect
  useEffect(() => {
    const socket = io("http://15.188.53.144:80/");

    const handleAdminMessage = (message) => {
      console.log("Admin message received:", message);

      if (message === "Display Rules") {
        setShowRulesVideo(true);
        playRules();
        playAmbiance();
        setShowBlendedVideo(true);
        setShowTimerStartVideo(false);
        setGameStarted(false);
        setIsTimerActive(false);
        if (timerRef.current) {
          timerRef.current.reset();
        }
      } else if (message === "Start Game") {
        setShowTimerStartVideo(true);
        playTimerStart();
        setShowBlendedVideo(false);
        setTimeout(() => {
          setShowRulesVideo(false);
          setShowTimerStartVideo(false);
          setGameStarted(true);
          setIsTimerActive(true);
          if (timerRef.current) {
            timerRef.current.start();
          }
          setExpectedIndex(currentIndex);
          stopAmbiance();
        }, 3000);
      } else if (message === "Correct") {
        if (currentIndex === expectedIndex) {
          playCorrect();
          updateRoundHistory();
          handleNextImage();
        }
      } else if (message === "Wrong") {
        playWrong();
      } else if (message === "Pass") {
        playPass();
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
    playAmbiance,
    playCorrect,
    playPass,
    playRules,
    playTimerStart,
    playWrong,
    stopAmbiance,
    updateRoundHistory,
  ]);

  // Updated helper function to check if image is from locations dataset
  const isImagePanorama = useCallback((imageUrl) => {
    return locations.some((location) =>
      location.images.some((img) => img === imageUrl)
    );
  }, []);

  return (
    <div className="relative flex content-center justify-center cursor-custom-move">
      {showRulesVideo && (
        <RulesVideo
          showBlendedVideo={showBlendedVideo}
          videoUrl="https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/geogamer-shorts/assets/videos/rules_wow.webm"
        />
      )}
      {showTimerStartVideo && <TimerStartVideo />}
      {gameStarted && selectedPlaylist.length > 0 && (
        <>
          {isImagePanorama(selectedPlaylist[currentIndex]) ? (
            <Viewer360
              key={currentIndex}
              imageUrl={selectedPlaylist[currentIndex]}
            />
          ) : (
            <div className="relative w-full h-screen">
              <Image
                key={currentIndex}
                src={selectedPlaylist[currentIndex]}
                alt="Game location"
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
          <Timer
            ref={timerRef}
            key={`timer-${isTimerActive}`}
            duration={59}
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

export default LocationPlayer;
