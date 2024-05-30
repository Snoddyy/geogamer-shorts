"use client";
import ImagePlayer from "@/components/ImagePlayer";
import SoundPlayer from "@/components/SoundPlayer";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const PlayerPage = () => {
  const searchParams = useSearchParams();
  const selectedPlaylist = JSON.parse(searchParams.get("playlist") || "[]");
  const playlistType = searchParams.get("playlistType") || "image";
  const router = useRouter();

  const [currentIndex, setCurrentIndex] = useState(0);
  const [roundHistory, setRoundHistory] = useState(
    Array(selectedPlaylist.length).fill(0)
  );
  const [soundsPlayed, setSoundsPlayed] = useState(0);

  const updateRoundHistory = () => {
    setRoundHistory((prevHistory) => {
      const newHistory = [...prevHistory];
      const currentIndex = prevHistory.findIndex((value) => value === 0);
      if (currentIndex === -1) {
        return newHistory;
      }
      newHistory[currentIndex] = 1;
      return newHistory;
    });
  };

  const handleSoundPlayed = () => {
    setSoundsPlayed((prevSoundsPlayed) => prevSoundsPlayed + 1);
  };

  useEffect(() => {
    const allSoundsPlayed =
      playlistType === "sound" && soundsPlayed === selectedPlaylist.length;
    const allImagesFound = roundHistory.every((value) => value === 1);
    if (allSoundsPlayed || allImagesFound) {
      const score = roundHistory.filter((value) => value === 1).length;
      router.push(`/score?score=${score}`);
    }
  }, [
    roundHistory,
    router,
    currentIndex,
    selectedPlaylist.length,
    playlistType,
    soundsPlayed,
  ]);

  return (
    <div className="relative flex content-center justify-center">
      {playlistType === "image" && <ImagePlayer playlist={selectedPlaylist} />}
      {playlistType === "sound" && (
        <SoundPlayer
          playlist={selectedPlaylist}
          onCorrect={updateRoundHistory}
          onWrong={() => {}}
          roundHistory={roundHistory}
          currentIndex={currentIndex}
          setCurrentIndex={setCurrentIndex}
          handleSoundPlayed={handleSoundPlayed}
        />
      )}
    </div>
  );
};

export default PlayerPage;
