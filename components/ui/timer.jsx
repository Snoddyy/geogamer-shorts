/* eslint-disable react/prop-types */
"use client";
import { soundDesign } from "@/components/soundDesign";
import { useEffect, useRef, useState } from "react";
import useSound from "use-sound";
import "./timer.css";

const Timer = ({ duration, roundHistory, onTimerEnd }) => {
  const [displayTime, setDisplayTime] = useState(duration);
  const videoRef = useRef(null);
  const startTimeRef = useRef(null);
  const endTimeRef = useRef(null);
  const animationFrameRef = useRef(null);
  const hasEndedRef = useRef(false);
  const videoPlayedRef = useRef(false);
  const hasPlayedWarningRef = useRef(false);
  const lastSyncTimeRef = useRef(null);
  const videoStartTimeRef = useRef(null);
  const syncAttemptsRef = useRef(0);
  const maxSyncAttempts = 3;

  const [playTimerStart] = useSound(
    soundDesign.find((sound) => sound.id === "timerStart").url
  );
  const [playDeath] = useSound(
    soundDesign.find((sound) => sound.id === "death").url
  );
  const warningSound = soundDesign.find((sound) => sound.id === "warning");
  const warningUrl = warningSound?.url;

  const [playWarning] = useSound(warningUrl, {
    volume: 1.0,
    preload: true,
    onLoad: () => console.log("Warning sound loaded successfully:", warningUrl),
    onError: (error) =>
      console.error("Warning sound load error:", error, warningUrl),
    onPlay: () => console.log("Warning sound started playing"),
    onEnd: () => console.log("Warning sound finished playing"),
  });

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    if (minutes === 0) return `${seconds.toString().padStart(2, "0")}`;
    else
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
  };

  // Function to synchronize video with timer
  const syncVideoWithTimer = () => {
    if (!videoRef.current || hasEndedRef.current) return;

    const now = Date.now();
    const elapsedMs = now - startTimeRef.current;
    const elapsedSeconds = elapsedMs / 1000;

    // Calculate where the video should be based on timer
    const videoDuration = duration; // Assuming video duration matches timer duration
    const expectedVideoTime = elapsedSeconds % videoDuration;

    // Get current video time
    const currentVideoTime = videoRef.current.currentTime;

    // Check if video is significantly out of sync (more than 1 second difference)
    const timeDifference = Math.abs(currentVideoTime - expectedVideoTime);

    if (timeDifference > 1.0) {
      // If we've tried to sync too many times, restart the video completely
      if (syncAttemptsRef.current >= maxSyncAttempts) {
        restartVideo();
        syncAttemptsRef.current = 0;
      } else {
        // Try to sync by adjusting currentTime
        videoRef.current.currentTime = expectedVideoTime;
        syncAttemptsRef.current++;
        lastSyncTimeRef.current = now;
      }
    } else {
      // Video is in sync, reset sync attempts counter
      syncAttemptsRef.current = 0;
      lastSyncTimeRef.current = now;
    }
  };

  // Function to completely restart the video when sync fails
  const restartVideo = () => {
    if (!videoRef.current || hasEndedRef.current) return;

    // Pause the video first
    videoRef.current.pause();

    // Calculate the correct starting position
    const now = Date.now();
    const elapsedMs = now - startTimeRef.current;
    const elapsedSeconds = elapsedMs / 1000;
    const videoDuration = duration;
    const startPosition = elapsedSeconds % videoDuration;

    // Set the correct time and restart
    videoRef.current.currentTime = startPosition;

    // Try to play again
    const playPromise = videoRef.current.play();

    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          videoPlayedRef.current = true;
          videoStartTimeRef.current = now;
          lastSyncTimeRef.current = now;
        })
        .catch(() => {
          // Try again in 1 second
          setTimeout(restartVideo, 1000);
        });
    }
  };

  // Function to force play the video with proper timing
  const playVideo = () => {
    if (videoRef.current && videoRef.current.paused) {
      // Calculate the correct starting position based on elapsed time
      const now = Date.now();
      const elapsedMs = startTimeRef.current ? now - startTimeRef.current : 0;
      const elapsedSeconds = elapsedMs / 1000;
      const videoDuration = duration;
      const startPosition = elapsedSeconds % videoDuration;

      videoRef.current.currentTime = startPosition;
      videoStartTimeRef.current = now;

      const playPromise = videoRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            videoPlayedRef.current = true;
            lastSyncTimeRef.current = now;
          })
          .catch(() => {
            // Try again in 500ms - might help with browser autoplay restrictions
            setTimeout(playVideo, 500);
          });
      }
    }
  };

  // Initialize timer once
  useEffect(() => {
    console.log("Timer initializing - Warning sound config:", {
      warningSound,
      warningUrl,
    });
    // Reset all flags for new timer
    hasEndedRef.current = false;
    hasPlayedWarningRef.current = false;
    videoPlayedRef.current = false;
    syncAttemptsRef.current = 0;
    lastSyncTimeRef.current = null;
    videoStartTimeRef.current = null;

    // Play the start sound
    playTimerStart();

    // Set initial display time
    setDisplayTime(duration);

    // Set start and end time references
    startTimeRef.current = Date.now();
    endTimeRef.current = Date.now() + duration * 1000;

    // Try to play the video
    if (videoRef.current) {
      playVideo();
    }

    // Start the animation frame loop for smooth updates
    updateTimer();

    // Handle visibility change to restart video when tab becomes active again
    const handleVisibilityChange = () => {
      if (
        !document.hidden &&
        videoRef.current &&
        videoRef.current.paused &&
        !hasEndedRef.current
      ) {
        setTimeout(() => {
          if (
            videoRef.current &&
            videoRef.current.paused &&
            !hasEndedRef.current
          ) {
            restartVideo();
          }
        }, 500);
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    // Clean up function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [duration]); // Only duration as dependency

  // Main timer update function using requestAnimationFrame for smoother updates
  const updateTimer = () => {
    // Calculate remaining time
    const now = Date.now();
    const remainingMs = endTimeRef.current - now;
    const remainingSeconds = Math.max(0, Math.ceil(remainingMs / 1000));

    // Update the display time
    setDisplayTime(remainingSeconds);

    // Log timer value every 5 seconds for debugging
    if (remainingSeconds % 5 === 0 && remainingSeconds > 0) {
      console.log("Current timer:", remainingSeconds, "seconds remaining");
    }

    // Check if video is playing, if not try to play it
    if (videoRef.current && videoRef.current.paused && !hasEndedRef.current) {
      playVideo();
    }

    // Synchronize video with timer every 2 seconds
    if (
      videoRef.current &&
      !videoRef.current.paused &&
      videoPlayedRef.current
    ) {
      if (!lastSyncTimeRef.current || now - lastSyncTimeRef.current > 2000) {
        syncVideoWithTimer();
      }
    }

    // Play warning sound at 3 seconds remaining
    if (
      remainingSeconds <= 3 &&
      remainingSeconds > 0 &&
      !hasPlayedWarningRef.current
    ) {
      console.log(
        "Playing 3-second warning sound at",
        remainingSeconds,
        "seconds remaining"
      );
      console.log("Warning sound URL:", warningUrl);
      console.log("playWarning function:", typeof playWarning, playWarning);
      hasPlayedWarningRef.current = true;
      try {
        const result = playWarning();
        console.log("playWarning() result:", result);

        // If playWarning returns undefined, try HTML5 audio fallback
        if (!result && warningUrl) {
          console.log(
            "playWarning returned undefined, trying HTML5 audio fallback"
          );
          const audio = new Audio(warningUrl);
          audio.volume = 1.0;
          audio
            .play()
            .then(() => console.log("HTML5 audio fallback played successfully"))
            .catch((error) => {
              console.error("HTML5 audio fallback failed:", error);
              console.log("Falling back to timer start sound");
              playTimerStart();
            });
        }
      } catch (error) {
        console.error("Error calling playWarning:", error);
        // Fallback to timer start sound if warning sound fails
        console.log("Falling back to timer start sound");
        playTimerStart();
      }
    }

    // Handle timer end
    if (remainingMs <= 0 && !hasEndedRef.current) {
      console.log("Timer - Timer ended, calling onTimerEnd callback");
      hasEndedRef.current = true;
      playDeath();
      onTimerEnd();
      return; // Stop updating
    }

    // Continue the animation frame loop
    if (!hasEndedRef.current) {
      animationFrameRef.current = requestAnimationFrame(updateTimer);
    }
  };

  return (
    <div className="TimerContainer" style={{ zIndex: 50 }}>
      <div className="TimerWrapper">
        <video
          ref={videoRef}
          src={`https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/assets/video/timer-squared${
            duration === 90 ? "-90" : ""
          }.webm`}
          loop
          muted
          playsInline
          preload="auto"
          autoPlay
          style={{
            width: "180px",
            height: "180px",
            objectFit: "cover",
          }}
          onCanPlay={() => {
            playVideo();
          }}
          onPlay={() => {
            videoStartTimeRef.current = Date.now();
          }}
          onPause={() => {
            // If the video pauses unexpectedly during gameplay, restart it
            if (!hasEndedRef.current && videoPlayedRef.current) {
              setTimeout(() => {
                if (
                  videoRef.current &&
                  videoRef.current.paused &&
                  !hasEndedRef.current
                ) {
                  restartVideo();
                }
              }, 100);
            }
          }}
          onTimeUpdate={() => {
            // Periodically sync video with timer during playback
            if (videoPlayedRef.current && !hasEndedRef.current) {
              const now = Date.now();
              if (
                !lastSyncTimeRef.current ||
                now - lastSyncTimeRef.current > 5000
              ) {
                syncVideoWithTimer();
              }
            }
          }}
          onError={() => {}}
        />
      </div>
    </div>
  );
};

export default Timer;
