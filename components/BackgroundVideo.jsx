"use client";
import { useEffect, useRef } from "react";

const BackgroundVideo = ({
  src = "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/assets/video/main-loop.webm",
}) => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.play();
    }
  }, []);

  return (
    <video
      ref={videoRef}
      className="absolute w-[1080px] h-[1080px] object-cover"
      src={src}
      muted
      loop
      playsInline
    />
  );
};

export default BackgroundVideo;
