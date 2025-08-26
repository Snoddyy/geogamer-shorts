"use client";
import ImagePlayer from "@/components/ImagePlayer";
import SoundPlayer from "@/components/SoundPlayer";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const PlayerContent = () => {
  const searchParams = useSearchParams();
  const selectedPlaylist = JSON.parse(searchParams.get("playlist") || "[]");
  const playlistType = searchParams.get("playlistType") || "image";

  return (
    <div className="relative flex content-center justify-center">
      {(playlistType === "image" || playlistType === "panorama") && (
        <ImagePlayer
          playlist={selectedPlaylist}
          isPanorama={playlistType === "panorama"}
        />
      )}
      {playlistType === "sound" && <SoundPlayer />}
    </div>
  );
};

const PlayerPage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <PlayerContent />
    </Suspense>
  );
};

export default PlayerPage;
