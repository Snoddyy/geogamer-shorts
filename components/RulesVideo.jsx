// components/RulesVideo.jsx
"use client";
import BlendedVideo from "./BlendedVideo";

const RulesVideo = ({ showBlendedVideo }) => {
  const videoSource =
    "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/assets/video/main-loop.webm";

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
        <BlendedVideo
          videoUrl="https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/assets/video/palier1.webm"
          showVideo={showBlendedVideo}
        />
      )}
    </div>
  );
};

export default RulesVideo;
