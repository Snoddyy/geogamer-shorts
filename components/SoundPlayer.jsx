"use client";
import AudioVisualizer from "@/components/AudioVisualizer";
import BackgroundVideo from "@/components/BackgroundVideo";
import RotatedHistoryBar from "@/components/RotatedHistoryBar";
import RulesVideo from "@/components/RulesVideo";
import TimerStartVideo from "@/components/TimerStartVideo";
import { sounds } from "@/components/sounds";
import { soundDesign } from "@/components/soundDesign";
import Timer from "@/components/ui/timer";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useRef } from "react";
import { listenToCommands, setAudioPlayingState } from "@/utils/gameService";
import useSound from "use-sound";

const SoundPlayer = () => {
  const searchParams = useSearchParams();
  const selectedPlaylist = JSON.parse(searchParams.get("playlist") || "[]");
  const router = useRouter();

  // Audio ref for the main game audio
  const gameAudioRef = useRef(null);
  const playLockRef = useRef(false); // prevent race conditions
  const shouldBePlayingRef = useRef(false); // track if audio should be playing
  const currentSoundSessionRef = useRef(""); // track which sound session is active
  const isTransitioningRef = useRef(false); // track if we're transitioning between sounds

  // Find the video URL for rules based on selected playlist
  const initialVideoUrl = (() => {
    if (selectedPlaylist.length > 0) {
      const firstSoundUrl = selectedPlaylist[0];
      const soundSetWithSound = sounds.find((soundSet) =>
        soundSet.sounds.includes(firstSoundUrl)
      );

      if (soundSetWithSound) {
        return soundSetWithSound.videoUrl;
      }
    }
    return "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/geogamer-shorts/assets/videos/rules_sound.webm";
  })();

  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);

  // Sound design effects with reduced volume (80% reduction)
  const [playTimerStart] = useSound(
    soundDesign.find((sound) => sound.id === "timerStart").url,
    { volume: 0.2 }
  );
  const [playAmbiance, { stop: stopAmbiance }] = useSound(
    soundDesign.find((sound) => sound.id === "ambiance").url,
    { loop: true, volume: 0.2 }
  );
  const [playPass] = useSound(
    soundDesign.find((sound) => sound.id === "pass").url,
    { volume: 0.2 }
  );
  const [playCorrect] = useSound(
    soundDesign.find((sound) => sound.id === "correct").url,
    { volume: 0.2 }
  );
  const [playRules] = useSound(
    soundDesign.find((sound) => sound.id === "rules").url,
    { volume: 0.2 }
  );
  const [playWrong] = useSound(
    soundDesign.find((sound) => sound.id === "wrong").url,
    { volume: 0.2 }
  );

  // Game state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [roundHistory, setRoundHistory] = useState(
    Array(selectedPlaylist.length).fill(0)
  );
  const [showRulesVideo, setShowRulesVideo] = useState(true);
  const [showBlendedVideo, setShowBlendedVideo] = useState(false);
  const [showTimerStartVideo, setShowTimerStartVideo] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [expectedIndex, setExpectedIndex] = useState(0);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [currentAudioUrl, setCurrentAudioUrl] = useState("");
  const [isManuallyPaused, setIsManuallyPaused] = useState(false);
  const [forcePlayTrigger, setForcePlayTrigger] = useState(0);
  const [currentSoundEvent, setCurrentSoundEvent] = useState(null);

  const [timerKey] = useState("persistent-sound-timer");

  // Helper function to trigger sound events for the visualizer
  const triggerSoundEvent = useCallback((eventType) => {
    const eventId = Date.now(); // Unique ID to ensure the effect triggers
    setCurrentSoundEvent({ type: eventType, id: eventId });

    // Clear the event after a short delay to allow for re-triggering
    setTimeout(() => {
      setCurrentSoundEvent(null);
    }, 100);
  }, []);

  const handleTimerEnd = useCallback(() => {
    if (gameAudioRef.current) {
      gameAudioRef.current.pause();
      setIsAudioPlaying(false);
    }
    const score = roundHistory.filter((value) => value === 1).length;
    console.log("SoundPlayer - Timer ended. RoundHistory:", roundHistory);
    console.log(
      "SoundPlayer - Calculated score:",
      score,
      "out of",
      selectedPlaylist.length
    );
    router.push(`/score?score=${score}&total=${selectedPlaylist.length}`);
  }, [roundHistory, selectedPlaylist.length, router]);

  const stopCurrentTrack = useCallback(() => {
    if (gameAudioRef.current) {
      shouldBePlayingRef.current = false;
      gameAudioRef.current.pause();
      setIsAudioPlaying(false);
    }
    // Set transitioning state to prevent audio restart
    isTransitioningRef.current = true;
    // Reset manual pause state when moving to next sound
    setIsManuallyPaused(false);
  }, []);

  const handleNextSound = useCallback(() => {
    stopCurrentTrack();
    setTimeout(() => {
      setCurrentIndex((prevIndex) => {
        let nextIndex = prevIndex;
        let startIndex = prevIndex;

        do {
          nextIndex = (nextIndex + 1) % selectedPlaylist.length;
          if (nextIndex === startIndex) {
            setExpectedIndex(nextIndex);
            // Reset session and transitioning state when we actually change index
            currentSoundSessionRef.current = "";
            isTransitioningRef.current = false;
            return nextIndex;
          }
        } while (roundHistory[nextIndex] === 1);

        setExpectedIndex(nextIndex);
        // Reset session and transitioning state when we actually change index
        currentSoundSessionRef.current = "";
        isTransitioningRef.current = false;
        return nextIndex;
      });
    }, 300);
  }, [roundHistory, selectedPlaylist.length, stopCurrentTrack]);

  const updateRoundHistory = useCallback(() => {
    setRoundHistory((prevHistory) => {
      const newHistory = [...prevHistory];
      console.log(
        "SoundPlayer - Updating round history. Expected index:",
        expectedIndex
      );
      console.log("SoundPlayer - Previous history:", prevHistory);
      if (newHistory[expectedIndex] === 0) {
        newHistory[expectedIndex] = 1;
        console.log("SoundPlayer - Updated history:", newHistory);
        setExpectedIndex((prevExpectedIndex) => {
          const nextIndex = (prevExpectedIndex + 1) % selectedPlaylist.length;
          return nextIndex;
        });
        return newHistory;
      } else if (newHistory[expectedIndex] === 1) {
        console.warn(
          "Sound at expectedIndex has already been marked as found."
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
    const allSoundsFound = roundHistory.every((value) => value === 1);
    if (allSoundsFound && gameStarted) {
      if (gameAudioRef.current) {
        gameAudioRef.current.pause();
        setIsAudioPlaying(false);
      }
      const score = roundHistory.filter((value) => value === 1).length;
      router.push(`/score?score=${score}&total=${selectedPlaylist.length}`);
    }
  }, [roundHistory, router, gameStarted, selectedPlaylist.length]);

  // 🔊 Safe sound playback
  useEffect(() => {
    console.log("Sound playback useEffect triggered:", {
      gameStarted,
      currentIndex,
      hasSound: !!selectedPlaylist[currentIndex],
      isManuallyPaused,
      isAudioPlaying,
      playLockRef: playLockRef.current,
      currentSession: currentSoundSessionRef.current,
      isTransitioning: isTransitioningRef.current,
    });

    // Don't start audio if it's already playing, manually paused, or transitioning
    if (
      gameStarted &&
      selectedPlaylist[currentIndex] &&
      !isManuallyPaused &&
      !isAudioPlaying &&
      !isTransitioningRef.current
    ) {
      const soundUrl = selectedPlaylist[currentIndex];
      const soundSession = `${soundUrl}-${currentIndex}`;

      // Check if this sound session has already been started
      if (currentSoundSessionRef.current === soundSession) {
        console.log("Sound session already started, skipping:", soundSession);
        return;
      }

      // Additional check: if we have an active session but different index, don't start
      if (
        currentSoundSessionRef.current &&
        currentSoundSessionRef.current !== soundSession
      ) {
        console.log(
          "Different session active, waiting for proper reset. Current:",
          currentSoundSessionRef.current,
          "Requested:",
          soundSession
        );
        return;
      }

      // Check if this is the same sound that's already loaded
      if (
        currentAudioUrl === soundUrl &&
        gameAudioRef.current &&
        !gameAudioRef.current.paused
      ) {
        console.log("Audio already playing this sound, skipping");
        return;
      }

      console.log("Starting new sound session:", soundSession);
      currentSoundSessionRef.current = soundSession;
      setCurrentAudioUrl(soundUrl);

      if (gameAudioRef.current && !playLockRef.current) {
        playLockRef.current = true;
        console.log("Starting audio playback for:", soundUrl);

        try {
          // Reset shouldBePlaying before starting
          shouldBePlayingRef.current = false;
          gameAudioRef.current.pause();
          gameAudioRef.current.src = soundUrl;
          gameAudioRef.current.load();
          gameAudioRef.current.currentTime = 0;

          const playPromise = gameAudioRef.current.play();
          if (playPromise !== undefined) {
            playPromise
              .then(() => {
                console.log("Audio started successfully");
                shouldBePlayingRef.current = true;
                setIsAudioPlaying(true);
                setAudioPlayingState(true);
              })
              .catch((error) => {
                console.warn("Audio play blocked/aborted:", error);
                shouldBePlayingRef.current = false;
                setIsAudioPlaying(false);
                setAudioPlayingState(false);
              })
              .finally(() => {
                playLockRef.current = false;
              });
          } else {
            playLockRef.current = false;
          }
        } catch (err) {
          console.error("Error starting audio:", err);
          shouldBePlayingRef.current = false;
          playLockRef.current = false;
        }
      }
    }
  }, [
    currentIndex,
    gameStarted,
    selectedPlaylist,
    isManuallyPaused,
    forcePlayTrigger,
    isAudioPlaying,
    currentAudioUrl,
  ]);

  useEffect(() => {
    const unsubscribe = listenToCommands((message, ruleType) => {
      console.log("Command received:", message, "Current index:", currentIndex);
      if (ruleType) {
        if (ruleType === "classic") {
          const classicRules = sounds.find((soundSet) =>
            soundSet.videoUrl.includes("rules_classic")
          );
          if (classicRules) {
            setVideoUrl(classicRules.videoUrl);
          }
        }
      }

      if (message === "Display Rules") {
        setShowRulesVideo(true);
        playRules();
        playAmbiance();
        setShowBlendedVideo(true);
        setShowTimerStartVideo(false);
        if (gameAudioRef.current) {
          gameAudioRef.current.pause();
          setIsAudioPlaying(false);
        }
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
          stopCurrentTrack(); // Stop current track immediately
          playCorrect();
          triggerSoundEvent("correct");
          updateRoundHistory();
          // Delay next sound to let the correct sound effect finish
          setTimeout(() => {
            handleNextSound();
          }, 800); // 800ms delay
        }
      } else if (message === "Wrong") {
        playWrong();
        triggerSoundEvent("wrong");
      } else if (message === "Pass") {
        stopCurrentTrack(); // Stop current track immediately
        playPass();
        triggerSoundEvent("pass");
        // Delay next sound to let the pass sound effect finish
        setTimeout(() => {
          handleNextSound();
        }, 600); // 600ms delay (pass sound is typically shorter)
      } else if (message === "Stop Sound") {
        if (gameAudioRef.current) {
          shouldBePlayingRef.current = false;
          currentSoundSessionRef.current = ""; // Reset session
          gameAudioRef.current.pause();
          setIsAudioPlaying(false);
          setAudioPlayingState(false);
          setIsManuallyPaused(true);
        }
      } else if (message === "Play Sound") {
        console.log("Play Sound command - checking conditions:", {
          hasAudioRef: !!gameAudioRef.current,
          gameStarted,
          currentIndex,
          hasSound: !!selectedPlaylist[currentIndex],
          soundUrl: selectedPlaylist[currentIndex],
        });

        if (gameAudioRef.current && selectedPlaylist[currentIndex]) {
          const soundUrl = selectedPlaylist[currentIndex];
          const soundSession = `${soundUrl}-${currentIndex}`;

          console.log("Play Sound command received, directly playing:", {
            currentIndex,
            soundUrl,
            soundSession,
            isManuallyPaused,
            gameStarted,
          });

          // Reset manually paused state, transitioning state, and set new session
          setIsManuallyPaused(false);
          isTransitioningRef.current = false; // Allow manual play to override transition
          currentSoundSessionRef.current = soundSession;
          setCurrentAudioUrl(soundUrl);

          // Directly play the audio without relying on useEffect
          if (!playLockRef.current) {
            playLockRef.current = true;

            try {
              // Reset shouldBePlaying before starting
              shouldBePlayingRef.current = false;
              gameAudioRef.current.pause();
              gameAudioRef.current.src = soundUrl;
              gameAudioRef.current.load();
              gameAudioRef.current.currentTime = 0;

              const playPromise = gameAudioRef.current.play();
              if (playPromise !== undefined) {
                playPromise
                  .then(() => {
                    console.log("Play Sound: Audio started successfully");
                    shouldBePlayingRef.current = true;
                    setIsAudioPlaying(true);
                    setAudioPlayingState(true);
                  })
                  .catch((error) => {
                    console.warn(
                      "Play Sound: Audio play blocked/aborted:",
                      error
                    );
                    shouldBePlayingRef.current = false;
                    setIsAudioPlaying(false);
                    setAudioPlayingState(false);
                  })
                  .finally(() => {
                    playLockRef.current = false;
                  });
              } else {
                playLockRef.current = false;
              }
            } catch (err) {
              console.error("Play Sound: Error starting audio:", err);
              shouldBePlayingRef.current = false;
              playLockRef.current = false;
            }
          }
        } else {
          console.log("Play Sound command - conditions not met, skipping");
        }
      }
    });

    return () => unsubscribe();
  }, [
    currentIndex,
    expectedIndex,
    gameStarted,
    handleNextSound,
    playAmbiance,
    playCorrect,
    playPass,
    playRules,
    playTimerStart,
    playWrong,
    stopAmbiance,
    updateRoundHistory,
    triggerSoundEvent,
    stopCurrentTrack,
  ]);

  const handleAudioEnded = () => {
    console.log("Audio ended naturally");
    shouldBePlayingRef.current = false;
    currentSoundSessionRef.current = ""; // Reset session
    setIsAudioPlaying(false);
    setAudioPlayingState(false);
    // Set manually paused to prevent automatic restart
    setIsManuallyPaused(true);
  };
  const handleAudioPause = () => {
    console.log("Audio paused, shouldBePlaying:", shouldBePlayingRef.current);
    // Only update state if we're not expecting this pause (like during loading)
    if (shouldBePlayingRef.current) {
      console.log("Unexpected pause, updating state");
      setIsAudioPlaying(false);
      setAudioPlayingState(false);
    }
  };
  const handleAudioPlay = () => {
    console.log("Audio play event triggered");
    shouldBePlayingRef.current = true;
    setIsAudioPlaying(true);
    setAudioPlayingState(true);
  };

  return (
    <>
      {gameStarted && (
        <Timer
          key={timerKey}
          duration={999}
          roundHistory={roundHistory}
          onTimerEnd={handleTimerEnd}
        />
      )}
      <div className="relative flex content-center justify-center cursor-default">
        <audio
          ref={gameAudioRef}
          crossOrigin="anonymous"
          preload="auto"
          loop={false}
          volume={0.2}
          onEnded={handleAudioEnded}
          onPause={handleAudioPause}
          onPlay={handleAudioPlay}
        />

        {showRulesVideo && (
          <RulesVideo showBlendedVideo={showBlendedVideo} videoUrl={videoUrl} />
        )}
        {showTimerStartVideo && <TimerStartVideo />}

        {gameStarted && (
          <>
            <div className="relative w-full h-screen">
              <BackgroundVideo />
              <AudioVisualizer
                audioRef={gameAudioRef}
                isPlaying={isAudioPlaying}
                soundEvent={currentSoundEvent}
              />
            </div>
          </>
        )}

        {gameStarted && (
          <RotatedHistoryBar
            totalRounds={selectedPlaylist.length}
            roundHistory={roundHistory}
            currentRoundId={currentIndex}
          />
        )}

        {/* Return to Main Menu Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <Link href="/">
            <Button
              variant="outline"
              size="lg"
              className="bg-background/80 backdrop-blur-sm hover:bg-background/90 border-2 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <span>🏠</span>
                <span>Main Menu</span>
              </div>
            </Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default SoundPlayer;
