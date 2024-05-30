// components/RulesVideo.jsx
"use client";
import BlendedVideo from "./BlendedVideo";

const RulesVideo = ({ showBlendedVideo, videoUrl }) => {
  const videoSource =
    "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/geogamer-shorts/assets/videos/loop_with_logo.webm";

  return (
    <div className="fixed flex items-center justify-center">
      <video
        className="object-cover w-[1080px] h-[1080px]"
        src={videoSource}
        autoPlay
        loop
        muted
      />
      {showBlendedVideo && (
        <BlendedVideo videoUrl={videoUrl} showVideo={showBlendedVideo} />
      )}
    </div>
  );
};

export default RulesVideo;
