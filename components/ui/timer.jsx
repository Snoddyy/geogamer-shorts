/* eslint-disable react/prop-types */
"use client";
import { useEffect, useRef, useState } from "react";

const Timer = ({ duration, roundHistory, onTimerEnd }) => {
  const pathRef = useRef(null);
  const [timer, setTimer] = useState(duration);

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
    const path = pathRef.current;
    if (!path) return;

    const length = path.getTotalLength();
    path.style.strokeDasharray = `${length}`;
    path.style.strokeDashoffset = `${length}`;

    let start = null;
    const animate = (timestamp) => {
      if (!start) start = timestamp;
      const progress = (timestamp - start) / (duration * 1000);
      const currentOffset = length * (1 - Math.min(progress, 1));
      path.style.strokeDashoffset = currentOffset.toString();

      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    requestAnimationFrame(animate);
  }, [duration]);

  useEffect(() => {
    const interval = setInterval(() => {
      setTimer((prevTimer) => {
        const nextTimer = prevTimer - 1;
        if (nextTimer <= 0) {
          clearInterval(interval);
          onTimerEnd();
        }
        return Math.max(0, nextTimer);
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [onTimerEnd]);

  const isFinal = timer <= 10;
  let timerTextClass = `${isFinal ? "animate-glowAndPulse" : ""}`;
  const timerTextStyle = {
    fontSize: timer <= 59 ? "52px" : undefined,
    fill: isFinal ? "#d2003c" : "white",
    fontWeight: 900,
  };
  return (
    <div className="absolute inset-0 z-10 flex justify-center pointer-events-none top-5">
      <div className="relative w-32 h-32">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 200"
          className="absolute base"
        >
          <path
            d="M 100 0 L 200 100 L 100 200 L 0 100 Z"
            style={{
              stroke: "#FFFFFF",
              strokeWidth: 6,
              strokeLinecap: "square",
              strokeLinejoin: "miter",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1,
            }}
            className="animated-path"
          />
        </svg>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 200 200"
          className="absolute filter-red-glow"
        >
          <path
            d="M 100 0 L 200 100 L 100 200 L 0 100 Z"
            style={{
              stroke: "#d2003c",
              strokeWidth: 6,
              strokeLinecap: "square",
              strokeLinejoin: "miter",
              strokeMiterlimit: 4,
              fill: "none",
              fillRule: "nonzero",
              opacity: 1,
            }}
            className="animated-path"
            ref={pathRef}
          />
          <defs>
            <filter
              id="red-glow"
              filterUnits="userSpaceOnUse"
              x="-50%"
              y="-50%"
              width="200%"
              height="200%"
            >
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="0.5"
                result="blur0.5"
              />
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="1"
                result="blur1"
              />
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="1.5"
                result="blur1.5"
              />
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="2"
                result="blur2"
              />
              <feGaussianBlur
                in="SourceGraphic"
                stdDeviation="2.5"
                result="blur2.5"
              />

              <feMerge result="blur-merged">
                <feMergeNode in="blur1" />
                <feMergeNode in="blur1.5" />
                <feMergeNode in="blur2" />
                <feMergeNode in="blur2.5" />
              </feMerge>

              <feColorMatrix
                result="red-blur"
                in="blur-merged"
                type="matrix"
                values="1 0 0 0 0
                                 0 0.06 0 0 0
                                 0 0 0.44 0 0
                                 0 0 0 1 0"
              />
              <feMerge>
                <feMergeNode in="red-blur" />

                <feMergeNode in="blur0.5" />

                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <text
            x="50%"
            y="50%"
            textAnchor="middle"
            alignmentBaseline="central"
            className={`${timerTextClass}`}
            style={timerTextStyle}
          >
            {formatTime(timer)}
          </text>
        </svg>
      </div>
      <style>
        {`
          @keyframes glowAndPulse {
            0% {
              transform: scale(1);
              transform-origin: center;
              text-shadow: none;
            }
            50% {
              transform: scale(1.1);
              transform-origin: center;
              text-shadow: 0 0 1px #d2003c, 0 0 2px #d2003c, 0 0 3px #d2003c, 0 0 4px #d2003c;
            }
            100% {
              transform: scale(1);
              transform-origin: center;
              text-shadow: none;
            }
          }
          .animate-glowAndPulse {
            animation: glowAndPulse 2s infinite;
          }
        `}
      </style>
    </div>
  );
};

export default Timer;
