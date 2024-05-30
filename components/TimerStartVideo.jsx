// components/TimerStartVideo.jsx
"use client";
// import { soundUrls } from "../data/soundUrls";

const TimerStartVideo = () => {
  // const [play] = useSound(soundUrls.countdownSound, { volume: 0.5 });
  const videoSource =
    "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/assets/video/timer.webm";

  // useEffect(() => {
  //   play();
  // }, [play]);

  return (
    <div className="fixed z-50 bottom-52 mix-blend-screen ">
      <video className="" src={videoSource} autoPlay muted />
    </div>
  );
};

export default TimerStartVideo;
