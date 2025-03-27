"use client";
import BackgroundVideo from "@/components/BackgroundVideo";
import RotatedHistoryBar from "@/components/RotatedHistoryBar";
import RulesVideo from "@/components/RulesVideo";
import TimerStartVideo from "@/components/TimerStartVideo";
import Viewer360 from "@/components/Viewer360";
import { locations } from "@/components/locations";
import { soundDesign } from "@/components/soundDesign";
import Timer from "@/components/ui/timer";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { listenToCommands } from "@/utils/gameService";
import useSound from "use-sound";
import { images } from "@/components/images";

const ImagePlayer = () => {
  const searchParams = useSearchParams();
  const selectedPlaylist = JSON.parse(searchParams.get("playlist") || "[]");
  const router = useRouter();

  // Convert any string URLs in the playlist to their corresponding image objects
  const processedPlaylist = useMemo(() => {
    return selectedPlaylist.map((item) => {
      // If item is already an object with url property, return it as is
      if (typeof item === "object" && item.url) return item;

      // If item is a string (URL), find the corresponding image object in locations
      for (const location of locations) {
        for (const img of location.images) {
          if (typeof img === "object" && img.url === item) {
            return img;
          } else if (img === item) {
            // For backward compatibility with any strings still in locations
            return { url: item, yaw: 0, fov: 50 };
          }
        }
      }

      // If not found in locations, return a default object
      return { url: item, yaw: 0, fov: 50 };
    });
  }, [selectedPlaylist]);

  const initialVideoUrl = (() => {
    if (selectedPlaylist.length > 0) {
      // Get the first image URL (whether it's an object or string)
      const firstImageUrl =
        typeof selectedPlaylist[0] === "object"
          ? selectedPlaylist[0].url
          : selectedPlaylist[0];

      // Try to find in locations first
      const locationWithImage = locations.find((location) =>
        location.images.some((img) =>
          typeof img === "object"
            ? img.url === firstImageUrl
            : img === firstImageUrl
        )
      );

      if (locationWithImage) {
        return locationWithImage.videoUrl;
      }

      // Try to find in images collection
      const imageSetWithImage = images.find((imageSet) =>
        imageSet.images.includes(firstImageUrl)
      );

      if (imageSetWithImage) {
        return imageSetWithImage.videoUrl;
      }
    }
    // Fallback to classic rules video if no match found
    return "https://red-bull-checkpoint.s3.eu-west-3.amazonaws.com/geogamer-shorts/assets/videos/rules_logo.webm";
  })();

  const [videoUrl, setVideoUrl] = useState(initialVideoUrl);

  const [playTimerStart] = useSound(
    soundDesign.find((sound) => sound.id === "timerStart").url
  );
  const [playAmbiance, { stop: stopAmbiance }] = useSound(
    soundDesign.find((sound) => sound.id === "ambiance").url,
    { loop: true }
  );
  const [playPass] = useSound(
    soundDesign.find((sound) => sound.id === "pass").url
  );
  const [playCorrect] = useSound(
    soundDesign.find((sound) => sound.id === "correct").url
  );
  const [playRules] = useSound(
    soundDesign.find((sound) => sound.id === "rules").url
  );
  const [playWrong] = useSound(
    soundDesign.find((sound) => sound.id === "wrong").url
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [roundHistory, setRoundHistory] = useState(
    Array(selectedPlaylist.length).fill(0)
  );
  const [showRulesVideo, setShowRulesVideo] = useState(true);
  const [showBlendedVideo, setShowBlendedVideo] = useState(false);
  const [showTimerStartVideo, setShowTimerStartVideo] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [destroyingViewer, setDestroyingViewer] = useState(false);
  const [expectedIndex, setExpectedIndex] = useState(0);

  // Add timerKey state to force Timer to persist
  const [timerKey] = useState("persistent-timer");

  const handleTimerEnd = () => {
    // Only handle timer end if we're using a timer for this location
    if (shouldShowTimer()) {
      const score = roundHistory.filter((value) => value === 1).length;
      router.push(`/score?score=${score}&total=${selectedPlaylist.length}`);
    }
  };

  const handleNextImage = useCallback(() => {
    setDestroyingViewer(true);
  }, []);

  const updateRoundHistory = useCallback(() => {
    setRoundHistory((prevHistory) => {
      const newHistory = [...prevHistory];
      if (newHistory[expectedIndex] === 0) {
        newHistory[expectedIndex] = 1;
        setExpectedIndex((prevExpectedIndex) => {
          const nextIndex = (prevExpectedIndex + 1) % selectedPlaylist.length;
          return nextIndex;
        });
        return newHistory;
      } else if (newHistory[expectedIndex] === 1) {
        console.warn(
          "Image at expectedIndex has already been marked as found."
        );
        setExpectedIndex((prevExpectedIndex) => {
          const nextIndex = (prevExpectedIndex + 1) % selectedPlaylist.length;
          return nextIndex;
        });
        return newHistory;
      } else {
        console.warn("Unexpected value in roundHistory array.");
        return newHistory;
      }
      selectedPlaylist;
    });
  }, [expectedIndex, selectedPlaylist.length]);

  useEffect(() => {
    const allImagesFound = roundHistory.every((value) => value === 1);
    if (allImagesFound) {
      const score = roundHistory.filter((value) => value === 1).length;
      router.push(`/score?score=${score}&total=${selectedPlaylist.length}`);
    }
  }, [roundHistory, router]);

  useEffect(() => {
    if (destroyingViewer) {
      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          let nextIndex = prevIndex;
          let startIndex = prevIndex;
          do {
            nextIndex = (nextIndex + 1) % selectedPlaylist.length;

            // Check if this is a special location (ER+DS3 or Stanley)
            const currentImage = processedPlaylist[prevIndex];
            const currentImageUrl =
              typeof currentImage === "object" && currentImage.url
                ? currentImage.url
                : currentImage;

            let isSpecialLocation = false;
            for (const location of locations) {
              if (location.id === 3 || location.id === 4) {
                isSpecialLocation = location.images.some((img) =>
                  typeof img === "object"
                    ? img.url === currentImageUrl
                    : img === currentImageUrl
                );

                if (isSpecialLocation) break;
              }
            }

            // For special locations, if we've gone through all images, go to score screen
            if (isSpecialLocation && nextIndex === 0) {
              const score = roundHistory.filter((value) => value === 1).length;
              router.push(
                `/score?score=${score}&total=${selectedPlaylist.length}`
              );
              return prevIndex; // Return current index as we're navigating away
            }

            // Normal loop check - if we've seen all images
            if (nextIndex === startIndex) {
              setDestroyingViewer(false);
              setExpectedIndex(nextIndex);
              return nextIndex;
            }
          } while (roundHistory[nextIndex] === 1);

          setDestroyingViewer(false);
          setExpectedIndex(nextIndex);
          return nextIndex;
        });
      }, 300);
    }
  }, [
    destroyingViewer,
    roundHistory,
    selectedPlaylist.length,
    processedPlaylist,
    router,
  ]);

  useEffect(() => {
    const unsubscribe = listenToCommands((message, ruleType) => {
      if (ruleType) {
        if (ruleType === "classic") {
          const classicRules =
            locations.find((location) =>
              location.videoUrl.includes("rules_classic")
            ) ||
            images.find((imageSet) =>
              imageSet.videoUrl.includes("rules_classic")
            );

          if (classicRules) {
            setVideoUrl(classicRules.videoUrl);
          }
        }
      }

      if (message === "Display Rules") {
        setShowRulesVideo(true);
        playRules();
        playAmbiance();
        setShowBlendedVideo(true);
        setShowTimerStartVideo(false);
      } else if (message === "Start Game") {
        setShowTimerStartVideo(true);
        playTimerStart();
        setShowBlendedVideo(false);
        setTimeout(() => {
          setShowRulesVideo(false);
          setShowTimerStartVideo(false);
          setGameStarted(true);
          setExpectedIndex(currentIndex);
          stopAmbiance();
        }, 3000);
      } else if (message === "Correct") {
        if (currentIndex === expectedIndex) {
          playCorrect();
          updateRoundHistory();
          handleNextImage();
        }
      } else if (message === "Wrong") {
        playWrong();

        // For ER+DS3 (id: 3) or Stanley (id: 4), "Wrong" acts like "Pass"
        const currentImage = processedPlaylist[currentIndex];
        const currentImageUrl =
          typeof currentImage === "object" && currentImage.url
            ? currentImage.url
            : currentImage;

        let isSpecialLocation = false;
        for (const location of locations) {
          if (location.id === 3 || location.id === 4) {
            // Check if image is from DS3-ER or Stanley
            isSpecialLocation = location.images.some((img) =>
              typeof img === "object"
                ? img.url === currentImageUrl
                : img === currentImageUrl
            );

            if (isSpecialLocation) break;
          }
        }

        if (isSpecialLocation) {
          handleNextImage();
        }
      } else if (message === "Pass") {
        playPass();
        handleNextImage();
      }
    });

    return () => unsubscribe();
  }, [
    currentIndex,
    expectedIndex,
    handleNextImage,
    playAmbiance,
    playCorrect,
    playPass,
    playRules,
    playTimerStart,
    playWrong,
    selectedPlaylist.length,
    stopAmbiance,
    updateRoundHistory,
  ]);

  const isImagePanorama = useCallback((imageItem) => {
    // Get the URL, whether imageItem is an object or string
    const imageUrl =
      typeof imageItem === "object" && imageItem.url
        ? imageItem.url
        : imageItem;

    return locations.some((location) =>
      location.images.some((img) =>
        typeof img === "object" ? img.url === imageUrl : img === imageUrl
      )
    );
  }, []);

  // Helper function to get image details
  const getImageDetails = useCallback((imageUrl) => {
    for (const location of locations) {
      for (const img of location.images) {
        if (typeof img === "object" && img.url === imageUrl) {
          return img;
        } else if (img === imageUrl) {
          return { url: imageUrl };
        }
      }
    }
    return { url: imageUrl };
  }, []);

  // Add a helper function to determine if timer should be shown
  const shouldShowTimer = useCallback(() => {
    if (
      selectedPlaylist.length === 0 ||
      currentIndex >= selectedPlaylist.length
    ) {
      return false;
    }

    // Get the URL of the current image
    const currentImage = processedPlaylist[currentIndex];
    const currentImageUrl =
      typeof currentImage === "object" && currentImage.url
        ? currentImage.url
        : currentImage;

    // Check if this image belongs to Stanley (id: 4) or DS3-ER (id: 3)
    for (const location of locations) {
      if (location.id === 3 || location.id === 4) {
        // DS3-ER or Stanley
        const isFromTimerlessLocation = location.images.some((img) =>
          typeof img === "object"
            ? img.url === currentImageUrl
            : img === currentImageUrl
        );

        if (isFromTimerlessLocation) {
          return false; // Don't show timer for Stanley or DS3-ER
        }
      }
    }

    return true; // Show timer for all other locations
  }, [currentIndex, processedPlaylist, selectedPlaylist.length]);

  return (
    <div className="relative flex content-center justify-center cursor-custom-move">
      {showRulesVideo && (
        <RulesVideo showBlendedVideo={showBlendedVideo} videoUrl={videoUrl} />
      )}
      {showTimerStartVideo && <TimerStartVideo />}

      {gameStarted && (
        <>
          {isImagePanorama(processedPlaylist[currentIndex]) ? (
            <Viewer360
              key={`panorama-${currentIndex}`}
              imageUrl={processedPlaylist[currentIndex].url}
              defaultYaw={processedPlaylist[currentIndex].yaw}
              defaultFov={processedPlaylist[currentIndex].fov}
            />
          ) : (
            <div className="relative w-full h-screen">
              <BackgroundVideo />
              <Image
                key={`image-${currentIndex}`}
                src={
                  typeof processedPlaylist[currentIndex] === "object"
                    ? processedPlaylist[currentIndex].url
                    : processedPlaylist[currentIndex]
                }
                alt="Game location"
                className="object-contain relative"
                height={1080}
                width={1080}
                priority
              />
            </div>
          )}
        </>
      )}

      {/* Conditionally render the Timer based on the location */}
      {gameStarted && shouldShowTimer() && (
        <Timer
          key={timerKey}
          duration={60}
          roundHistory={roundHistory}
          onTimerEnd={handleTimerEnd}
        />
      )}

      {gameStarted && (
        <RotatedHistoryBar
          totalRounds={selectedPlaylist.length}
          roundHistory={roundHistory}
          currentRoundId={currentIndex}
        />
      )}
    </div>
  );
};

export default ImagePlayer;
