// components/BlendedVideo.jsx
"use client";
import { useEffect, useRef } from "react";

const BlendedVideo = ({ videoUrl, showVideo }) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current && showVideo) {
      videoRef.current.style.mixBlendMode = "screen";
      videoRef.current.play();
    } else if (videoRef.current && !showVideo) {
      videoRef.current.pause();
    }
  }, [showVideo]);

  return (
    <video ref={videoRef} className="absolute" src={videoUrl} muted loop />
  );
};

export default BlendedVideo;
