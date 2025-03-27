// app/playlist-selection/page.jsx
"use client";
import { images } from "@/components/images";
import { locations } from "@/components/locations";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

const PlaylistSelection = () => {
  const router = useRouter();

  useEffect(() => {
    localStorage.removeItem("gameState");
    console.log("Game state reset on playlist selection page");
  }, []);

  const handlePlaylistSelection = (playlistId, playlistType) => {
    const timestamp = Date.now();

    if (playlistType === "panorama") {
      const selectedPlaylist = locations.find(
        (playlist) => playlist.id === playlistId
      );
      if (selectedPlaylist) {
        router.push(
          `/player?playlist=${JSON.stringify(
            selectedPlaylist.images
          )}&playlistType=panorama&t=${timestamp}`
        );
      }
    } else if (playlistType === "image") {
      const selectedPlaylist = images.find(
        (playlist) => playlist.id === playlistId
      );
      if (selectedPlaylist) {
        router.push(
          `/player?playlist=${JSON.stringify(
            selectedPlaylist.images
          )}&playlistType=image&t=${timestamp}`
        );
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="mb-6 text-3xl ">Select a Playlist</h1>
      <div className="flex space-x-4">
        <div className="flex flex-col items-center justify-start gap-4">
          <h2 className="mb-2 text-xl ">Panorama</h2>
          {locations.map((playlist) => (
            <Button
              key={playlist.id}
              onClick={() => handlePlaylistSelection(playlist.id, "panorama")}
              className="w-48 h-12 px-4 py-2"
              variant="default"
            >
              {playlist.name}
            </Button>
          ))}
        </div>
        <div className="flex flex-col items-center justify-start gap-4">
          <h2 className="mb-2 text-xl ">Images</h2>
          {images.map((playlist) => (
            <Button
              key={playlist.id}
              onClick={() => handlePlaylistSelection(playlist.id, "image")}
              className="w-48 h-12 px-4 py-2"
              variant="default"
            >
              {playlist.name}
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PlaylistSelection;
