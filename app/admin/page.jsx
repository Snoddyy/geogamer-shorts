"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://92.141.138.206:8080/");

const AdminPage = () => {
  const router = useRouter();

  const sendMessage = useCallback((message) => {
    console.log("Sending message:", message);
    socket.emit("adminMessage", message);
  }, []);

  const handleDisplayRules = useCallback(() => {
    sendMessage("Display Rules");
  }, [sendMessage]);

  const handleStartGame = useCallback(() => {
    sendMessage("Start Game");
  }, [sendMessage]);

  const handleCorrect = useCallback(() => {
    sendMessage("Correct");
  }, [sendMessage]);

  const handleFalse = useCallback(() => {
    sendMessage("Wrong");
  }, [sendMessage]);

  const handlePass = useCallback(() => {
    sendMessage("Pass");
  }, [sendMessage]);

  const handleReplay = useCallback(() => {
    sendMessage("Replay");
  }, [sendMessage]);

  const handlePlayAgain = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleStopSound = useCallback(() => {
    sendMessage("Stop Sound");
  }, [sendMessage]);

  const handleSetRulesLol = useCallback(() => {
    sendMessage("lol");
  }, [sendMessage]);

  const handleSetRulesMusic = useCallback(() => {
    sendMessage("music");
  }, [sendMessage]);

  useEffect(() => {
    const handleKeydown = (event) => {
      switch (event.key) {
        case "q":
          handleCorrect();
          break;
        case "s":
          handleFalse();
          break;
        case "d":
          handlePass();
          break;
        case "f":
          handleReplay();
          break;
        case "g":
          handleStopSound();
        default:
          break;
      }
    };

    window.addEventListener("keydown", handleKeydown);
    return () => {
      window.removeEventListener("keydown", handleKeydown);
    };
  }, [handleCorrect, handleFalse, handlePass, handleReplay, handleStopSound]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="flex flex-col space-y-12">
        <div className="flex items-center justify-center space-x-4">
          <div className="flex flex-col">
            <h1 className="pb-4 text-2xl font-bold text-center">Pre-Game</h1>
            <div className="flex items-center justify-start gap-4">
              <Button
                onClick={handleSetRulesLol}
                className="w-48 h-24 px-4 py-2"
                variant="default"
              >
                Set Rules LoL
              </Button>
              <Button
                onClick={handleSetRulesMusic}
                className="w-48 h-24 px-4 py-2"
                variant="default"
              >
                Set Rules Music
              </Button>
              <Button
                onClick={handleDisplayRules}
                className="w-48 h-24 px-4 py-2"
                variant="default"
              >
                Display Rules
              </Button>
              <Button
                onClick={handleStartGame}
                className="w-48 h-24 px-4 py-2"
                variant="default"
              >
                Start Game
              </Button>
            </div>
          </div>
        </div>
        <div className="flex flex-col pb-12">
          <h1 className="pb-4 text-2xl font-bold text-center">Game Control</h1>
          <div className="flex space-x-4">
            <Button
              onClick={handleCorrect}
              variant="default"
              className="w-48 h-24 px-4 py-2"
            >
              Correct (Keybind: Q)
            </Button>
            <Button
              onClick={handleFalse}
              variant="default"
              className="w-48 h-24 px-4 py-2"
            >
              False (Keybind: S)
            </Button>
            <Button
              onClick={handlePass}
              variant="default"
              className="w-48 h-24 px-4 py-2"
            >
              Pass (Keybind: D)
            </Button>
            <Button
              onClick={handleReplay}
              variant="default"
              className="w-48 h-24 px-4 py-2"
            >
              Replay (Keybind: F)
            </Button>
          </div>
        </div>
        <Button
          onClick={handleStopSound}
          className="self-center h-24 px-4 text-xl font-bold w-96"
          variant="destructive"
        >
          Stop Sound (Keybind: G)
        </Button>
        <Button
          onClick={handlePlayAgain}
          className="self-center h-24 px-4 text-xl font-bold w-96"
          variant="destructive"
        >
          Mode Selection
        </Button>
      </div>
    </div>
  );
};

export default AdminPage;
