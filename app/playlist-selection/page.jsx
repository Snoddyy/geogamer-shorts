// app/playlist-selection/page.jsx
"use client";
import { images } from "@/components/images";
import { soundPlaylists } from "@/components/sounds";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

const PlaylistSelection = () => {
  const router = useRouter();

  const handlePlaylistSelection = (playlistId, playlistType) => {
    if (playlistType === "image") {
      const selectedPlaylist = images.find(
        (playlist) => playlist.id === playlistId
      );
      if (selectedPlaylist) {
        router.push(
          `/player?playlist=${JSON.stringify(
            selectedPlaylist.images
          )}&playlistType=image`
        );
      }
    } else if (playlistType === "sound") {
      const selectedPlaylist = soundPlaylists.find(
        (playlist) => playlist.id === playlistId
      );
      if (selectedPlaylist) {
        router.push(
          `/player?playlist=${JSON.stringify(
            selectedPlaylist.sounds
          )}&playlistType=sound`
        );
      }
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="mb-6 text-3xl font-bold">Select a Playlist</h1>
      <div className="flex space-x-4">
        <div className="flex flex-col items-center justify-start gap-4">
          <h2 className="mb-2 text-xl font-bold">Panorama</h2>
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
        <div className="flex flex-col items-center justify-center gap-4">
          <h2 className="mb-2 text-xl font-bold">Sound</h2>
          {soundPlaylists.map((playlist) => (
            <Button
              key={playlist.id}
              onClick={() => handlePlaylistSelection(playlist.id, "sound")}
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
