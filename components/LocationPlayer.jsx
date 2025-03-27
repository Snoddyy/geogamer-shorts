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
import { listenToCommands } from "@/utils/gameService";
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

  // Find the associated location and its video URL
  const [videoUrlForRules, setVideoUrlForRules] = useState("");

  // Use a stable timerKey that won't change during navigation
  const [timerKey] = useState("persistent-location-timer");

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
    // Only handle timer end if we're using a timer for this location
    if (shouldShowTimer()) {
      const score = roundHistory.filter((value) => value === 1).length;
      console.log("Game over, score:", score);
      router.push(`/score?score=${score}&total=${selectedPlaylist.length}`);
    }
  }, [roundHistory, router, selectedPlaylist.length, shouldShowTimer]);

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
    // No sessionId check needed
    const unsubscribe = listenToCommands((message, ruleType) => {
      // Handle rule type if needed
      if (ruleType) {
        // Set appropriate video URL based on rule type
        // (Add this if you want different rule videos)
      }

      // Same command handling logic
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

          // Only activate the timer if this location should have one
          if (shouldShowTimer()) {
            setIsTimerActive(true);
            if (timerRef.current) {
              timerRef.current.start();
            }
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
    });

    return () => unsubscribe();
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

  useEffect(() => {
    if (selectedPlaylist.length > 0) {
      // Find which location this image belongs to
      const locationWithImage = locations.find((location) =>
        location.images.includes(selectedPlaylist[0])
      );

      if (locationWithImage) {
        setVideoUrlForRules(locationWithImage.videoUrl);
      } else {
        // Default fallback video
        setVideoUrlForRules(
          "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/geogamer-shorts/assets/videos/gg_background_short_rules_classic.webm"
        );
      }
    }
  }, [selectedPlaylist]);

  // Updated helper function to check if image is from locations dataset
  const isImagePanorama = useCallback((imageUrl) => {
    return locations.some((location) =>
      location.images.some((img) =>
        typeof img === "object" ? img.url === imageUrl : img === imageUrl
      )
    );
  }, []);

  // Add a helper function to determine if timer should be shown
  const shouldShowTimer = useCallback(() => {
    if (
      selectedPlaylist.length === 0 ||
      currentIndex >= selectedPlaylist.length
    ) {
      return false;
    }

    // Get the current image/location
    const currentImage = selectedPlaylist[currentIndex];

    // Find which location this image belongs to
    for (const location of locations) {
      const isImageFromLocation = location.images.some((img) =>
        typeof img === "object"
          ? img.url === currentImage || img === currentImage
          : img === currentImage
      );

      if (isImageFromLocation) {
        // Don't show timer for Stanley (id: 4) or DS3-ER (id: 3)
        return location.id !== 3 && location.id !== 4;
      }
    }

    return true; // Default to showing timer
  }, [currentIndex, selectedPlaylist]);

  return (
    <div className="relative flex content-center justify-center cursor-custom-move">
      {showRulesVideo && (
        <RulesVideo
          showBlendedVideo={showBlendedVideo}
          videoUrl={videoUrlForRules}
        />
      )}
      {showTimerStartVideo && <TimerStartVideo />}

      {gameStarted && selectedPlaylist.length > 0 && (
        <>
          {isImagePanorama(selectedPlaylist[currentIndex]) ? (
            (() => {
              // Find the matching image with its yaw and fov values
              for (const location of locations) {
                const panoramaImage = location.images.find(
                  (img) =>
                    typeof img === "object" &&
                    img.url === selectedPlaylist[currentIndex]
                );
                if (panoramaImage) {
                  return (
                    <Viewer360
                      key={`panorama-${currentIndex}`}
                      imageUrl={panoramaImage.url}
                      defaultYaw={panoramaImage.yaw}
                      defaultFov={panoramaImage.fov}
                    />
                  );
                }
              }
              // Fallback if not found
              return (
                <Viewer360
                  key={`panorama-${currentIndex}`}
                  imageUrl={selectedPlaylist[currentIndex]}
                />
              );
            })()
          ) : (
            <div className="relative w-full h-screen">
              <Image
                key={`image-${currentIndex}`}
                src={selectedPlaylist[currentIndex]}
                alt="Game location"
                fill
                className="object-contain"
                priority
              />
            </div>
          )}
        </>
      )}

      {/* Conditionally render the Timer based on the location */}
      {gameStarted && shouldShowTimer() && (
        <Timer
          ref={timerRef}
          key={timerKey}
          duration={60}
          roundHistory={roundHistory}
          onTimerEnd={handleTimerEnd}
        />
      )}

      {gameStarted && (
        <RotatedHistoryBar
          totalRounds={selectedPlaylist.length}
          roundHistory={roundHistory}
          currentRoundId={currentIndex}
        />
      )}
    </div>
  );
};

export default LocationPlayer;
