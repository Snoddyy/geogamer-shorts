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

  const [playTimerStart] = useSound(
    soundDesign.find((sound) => sound.id === "timerStart").url
  );
  const [playDeath] = useSound(
    soundDesign.find((sound) => sound.id === "death").url
  );
  const [playWarning] = useSound(
    soundDesign.find((sound) => sound.id === "warning").url
  );

  const formatTime = (time) => {
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    if (minutes === 0) return `${seconds.toString().padStart(2, "0")}`;
    else
      return `${minutes.toString().padStart(2, "0")}:${seconds
        .toString()
        .padStart(2, "0")}`;
  };

  // Function to force play the video
  const playVideo = () => {
    if (videoRef.current && videoRef.current.paused) {
      console.log("Attempting to play timer video...");
      videoRef.current.currentTime = 0;

      const playPromise = videoRef.current.play();

      if (playPromise !== undefined) {
        playPromise
          .then(() => {
            console.log("Timer video started playing successfully");
            videoPlayedRef.current = true;
          })
          .catch((err) => {
            console.error("Error playing timer video:", err);
            // Try again in 500ms - might help with browser autoplay restrictions
            setTimeout(playVideo, 500);
          });
      }
    }
  };

  // Initialize timer once
  useEffect(() => {
    console.log(`Initializing timer with duration: ${duration}s`);

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

    // Clean up function
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
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

    // Check if video is playing, if not try to play it
    if (videoRef.current && videoRef.current.paused && !hasEndedRef.current) {
      playVideo();
    }

    // Play warning sound at 3 seconds remaining
    if (remainingSeconds <= 3 && !hasPlayedWarningRef.current) {
      console.log(`Warning sound played at ${remainingSeconds}s remaining`);
      playWarning();
      hasPlayedWarningRef.current = true;
    }

    // Handle timer end
    if (remainingMs <= 0 && !hasEndedRef.current) {
      console.log("Timer ended");
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
            console.log("Timer video can play now");
            playVideo();
          }}
          onError={(e) => console.error("Timer video error:", e)}
        />
      </div>
      {/* Add a text overlay of the timer to ensure it's always visible */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "36px",
          fontWeight: "bold",
          color: "white",
          textShadow: "2px 2px 4px rgba(0, 0, 0, 0.8)",
          zIndex: 51,
        }}
      >
        {formatTime(displayTime)}
      </div>
    </div>
  );
};

export default Timer;
