"use client";
import BackgroundVideo from "@/components/BackgroundVideo";
import RotatedHistoryBar from "@/components/RotatedHistoryBar";
import RulesVideo from "@/components/RulesVideo";
import TimerStartVideo from "@/components/TimerStartVideo";
import Viewer360 from "@/components/Viewer360";
import { locations } from "@/components/locations";
import { soundDesign } from "@/components/soundDesign";
import Timer from "@/components/ui/timer";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import io from "socket.io-client";
import useSound from "use-sound";

const ImagePlayer = () => {
  const searchParams = useSearchParams();
  const selectedPlaylist = JSON.parse(searchParams.get("playlist") || "[]");
  const router = useRouter();

  const [videoUrl, setVideoUrl] = useState(
    "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/geogamer-shorts/assets/videos/gg_background_short_rules_classic.webm.webm"
  );

  const [playTimerStart] = useSound(
    soundDesign.find((sound) => sound.id === "timerStart").url
  );
  const [playAmbiance, { stop: stopAmbiance }] = useSound(
    soundDesign.find((sound) => sound.id === "ambiance").url,
    { loop: true }
  );
  const [playPass] = useSound(
    soundDesign.find((sound) => sound.id === "pass").url
  );
  const [playCorrect] = useSound(
    soundDesign.find((sound) => sound.id === "correct").url
  );
  const [playRules] = useSound(
    soundDesign.find((sound) => sound.id === "rules").url
  );
  const [playWrong] = useSound(
    soundDesign.find((sound) => sound.id === "wrong").url
  );

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
    router.push(`/score?score=${score}&total=${selectedPlaylist.length}`);
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
      selectedPlaylist;
    });
  }, [expectedIndex, selectedPlaylist.length]);

  useEffect(() => {
    const allImagesFound = roundHistory.every((value) => value === 1);
    if (allImagesFound) {
      const score = roundHistory.filter((value) => value === 1).length;
      router.push(`/score?score=${score}&total=${selectedPlaylist.length}`);
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
    const socket = io("http://15.188.53.144:80/");

    socket.on("connect", () => {
      console.log("Connected to Socket.IO server");
    });

    // Log when the client disconnects
    socket.on("disconnect", () => {
      console.log("Disconnected from Socket.IO server");
    });

    const handleAdminMessage = (message) => {
      console.log("Message received from server:", message);
      if (message === "warcraft") {
        setVideoUrl(
          "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/geogamer-shorts/assets/videos/gg_background_short_rules_sons_wc_sc.webm"
        );
      }
      if (message === "menus") {
        setVideoUrl(
          "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/geogamer-shorts/assets/videos/gg_background_short_rules_main_menu.webm"
        );
      }
      if (message === "logos") {
        setVideoUrl(
          "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/geogamer-shorts/assets/videos/gg_background_short_rules_logos.webm"
        );
      }
      if (message === "ecrans") {
        setVideoUrl(
          "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/geogamer-shorts/assets/videos/gg_background_short_rules_loading.webm"
        );
      }
      if (message === "classic") {
        setVideoUrl(
          "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/geogamer-shorts/assets/videos/gg_background_short_rules_classic.webm"
        );
      }

      if (message === "Display Rules") {
        setShowRulesVideo(true);
        playRules();
        playAmbiance();
        setShowBlendedVideo(true);
        setShowTimerStartVideo(false);
      } else if (message === "Start Game") {
        setShowTimerStartVideo(true);
        playTimerStart();
        setShowBlendedVideo(false);
        setTimeout(() => {
          setShowRulesVideo(false);
          setShowTimerStartVideo(false);
          setGameStarted(true);
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
        console.log("Wrong");
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
    selectedPlaylist.length,
    stopAmbiance,
    updateRoundHistory,
  ]);

  const isImagePanorama = useCallback((imageUrl) => {
    return locations.some((location) =>
      location.images.some((img) => img === imageUrl)
    );
  }, []);

  return (
    <div className="relative w-[1080px] h-[1080px] flex content-center justify-center cursor-custom-move">
      <BackgroundVideo />
      {showRulesVideo && (
        <RulesVideo showBlendedVideo={showBlendedVideo} videoUrl={videoUrl} />
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
            <div className="relative w-[1080px] h-[1080px] mx-auto top-0">
              <Image
                key={currentIndex}
                src={selectedPlaylist[currentIndex]}
                alt="Game location"
                fill
                sizes="1000px"
                className="object-contain"
                priority
              />
            </div>
          )}
          <Timer
            duration={60}
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
