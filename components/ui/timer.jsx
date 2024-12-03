/* eslint-disable react/prop-types */
"use client";
import { soundDesign } from "@/components/soundDesign";
import { useEffect, useRef, useState } from "react";
import useSound from "use-sound";
import "./timer.css";

const Timer = ({ duration, roundHistory, onTimerEnd }) => {
  const [timer, setTimer] = useState(duration);
  const videoRef = useRef(null);

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

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        const nextTimer = prevTimer - 1;
        if (prevTimer === duration) {
          videoRef.current?.play();
        }
        if (nextTimer === 3) {
          playWarning();
        }
        if (nextTimer <= 0) {
          clearInterval(interval);
          onTimerEnd();
        }
        return Math.max(0, nextTimer);
      });
    }, 990);

    return () => clearInterval(interval);
  }, [onTimerEnd, playTimerStart, playWarning]);

  useEffect(() => {
    if (timer === 0) {
      console.log("played death sound");
      playDeath();
    }
  }, [timer, playDeath]);

  return (
    <div className="TimerContainer">
      <div className="TimerWrapper">
        <video
          ref={videoRef}
          src={`https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/assets/video/timer-squared${
            duration === 90 ? "-90" : ""
          }.webm`}
          loop
          muted
          playsInline
          style={{
            width: "180px",
            height: "180px",
            objectFit: "cover",
          }}
        />
      </div>
    </div>
  );
};

export default Timer;
