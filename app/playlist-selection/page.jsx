// app/playlist-selection/page.jsx
"use client";
import { images } from "@/components/images";
import { locations } from "@/components/locations";
import { sounds } from "@/components/sounds";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { clearAllCommands } from "@/utils/gameService";

const PlaylistSelection = () => {
  const router = useRouter();

  useEffect(() => {
    // Clear all game-related localStorage items
    localStorage.removeItem("gameState");
    localStorage.removeItem("currentIndex");
    localStorage.removeItem("roundHistory");
    localStorage.removeItem("expectedIndex");
    localStorage.removeItem("lastProcessedTimestamp");
    // If you have any other game state in localStorage, add them here

    // Clear all commands from Firebase to prevent replay in new games
    clearAllCommands();

    console.log(
      "All game state cleared from localStorage and Firebase commands cleared"
    );
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
    } else if (playlistType === "sound") {
      const selectedPlaylist = sounds.find(
        (playlist) => playlist.id === playlistId
      );
      if (selectedPlaylist) {
        router.push(
          `/player?playlist=${JSON.stringify(
            selectedPlaylist.sounds
          )}&playlistType=sound&t=${timestamp}`
        );
      }
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Select a Playlist
          </h1>
          <p className="text-muted-foreground text-lg">
            Choose your preferred content type to begin the game
          </p>
        </div>

        {/* Playlist Categories */}
        <div className="grid gap-8 md:grid-cols-3">
          {/* Panorama Section */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-white text-xl">🌍</span>
              </div>
              <h2 className="text-xl font-semibold text-card-foreground mb-2">
                Panorama
              </h2>
              <p className="text-muted-foreground text-sm">
                360° immersive experiences
              </p>
            </div>
            <div className="space-y-3">
              {locations.map((playlist) => (
                <Button
                  key={playlist.id}
                  onClick={() =>
                    handlePlaylistSelection(playlist.id, "panorama")
                  }
                  variant="outline"
                  size="lg"
                  className="w-full h-12 justify-start border-blue-200 hover:bg-blue-50/30 hover:border-blue-300/50 dark:border-blue-800 dark:hover:bg-blue-900/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-blue-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-xs">🗺️</span>
                    </div>
                    <span>{playlist.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-white text-xl">🖼️</span>
              </div>
              <h2 className="text-xl font-semibold text-card-foreground mb-2">
                Images
              </h2>
              <p className="text-muted-foreground text-sm">
                Visual geography challenges
              </p>
            </div>
            <div className="space-y-3">
              {images.map((playlist) => (
                <Button
                  key={playlist.id}
                  onClick={() => handlePlaylistSelection(playlist.id, "image")}
                  variant="outline"
                  size="lg"
                  className="w-full h-12 justify-start border-purple-200 hover:bg-purple-50/30 hover:border-purple-300/50 dark:border-purple-800 dark:hover:bg-purple-900/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-purple-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-xs">📸</span>
                    </div>
                    <span>{playlist.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Sounds Section */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-amber-500 rounded-full mx-auto mb-3 flex items-center justify-center">
                <span className="text-white text-xl">🔊</span>
              </div>
              <h2 className="text-xl font-semibold text-card-foreground mb-2">
                Sounds
              </h2>
              <p className="text-muted-foreground text-sm">
                Audio-based location guessing
              </p>
            </div>
            <div className="space-y-3">
              {sounds.map((playlist) => (
                <Button
                  key={playlist.id}
                  onClick={() => handlePlaylistSelection(playlist.id, "sound")}
                  variant="outline"
                  size="lg"
                  className="w-full h-12 justify-start border-amber-200 hover:bg-amber-50/30 hover:border-amber-300/50 dark:border-amber-800 dark:hover:bg-amber-900/10"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-6 h-6 bg-amber-500 rounded-md flex items-center justify-center">
                      <span className="text-white text-xs">🎵</span>
                    </div>
                    <span>{playlist.name}</span>
                  </div>
                </Button>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation */}
        <div className="mt-8 flex justify-center">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <Link href="/">
              <Button
                variant="outline"
                size="lg"
                className="h-12 px-6 border-gray-200 hover:bg-gray-50/30 hover:border-gray-300/50 dark:border-gray-800 dark:hover:bg-gray-900/10"
              >
                <div className="flex items-center gap-2">
                  <span>⬅️</span>
                  <span>Back to Mode Selection</span>
                </div>
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaylistSelection;
