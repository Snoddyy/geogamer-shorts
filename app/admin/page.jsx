"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCallback, useEffect } from "react";
import io from "socket.io-client";

const socket = io("http://15.188.53.144:80/");

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

  const handleSetRulesClassic = useCallback(() => {
    sendMessage("classic");
  }, [sendMessage]);

  const handleSetRulesWarcraft = useCallback(() => {
    sendMessage("warcraft");
  }, [sendMessage]);

  const handleSetRulesMenus = useCallback(() => {
    sendMessage("menus");
  }, [sendMessage]);

  const handleSetRulesLogos = useCallback(() => {
    sendMessage("logos");
  }, [sendMessage]);

  const handleSetRulesEcrans = useCallback(() => {
    sendMessage("ecrans");
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
            <h1 className="pb-4 text-2xl text-center">Pre-Game</h1>
            <div className="flex flex-col items-center justify-start gap-4">
              <h2 className="text-1xl text-center">Type de la partie</h2>
              <div className="flex items-center justify-start gap-4 ">
                <Button
                  onClick={handleSetRulesClassic}
                  className="w-48 h-12 px-4 py-2"
                  variant="default"
                >
                  Classic
                </Button>
                <Button
                  onClick={handleSetRulesMenus}
                  className="w-48 h-12 px-4 py-2"
                  variant="default"
                >
                  Menus Principaux
                </Button>
                <Button
                  onClick={handleSetRulesLogos}
                  className="w-48 h-12 px-4 py-2"
                  variant="default"
                >
                  Logos Fictifs
                </Button>
                <Button
                  onClick={handleSetRulesEcrans}
                  className="w-48 h-12 px-4 py-2"
                  variant="default"
                >
                  Ecrans de chargement
                </Button>
                <Button
                  onClick={handleSetRulesWarcraft}
                  className="w-48 h-12 px-4 py-2"
                  variant="default"
                >
                  Sons Warcraft
                </Button>
              </div>
              <h2 className="text-1xl text-center">Démarage de la partie</h2>
              <div className="flex items-center justify-start gap-4 ">
                <Button
                  onClick={handleDisplayRules}
                  className="w-48 h-12 px-4 py-2"
                  variant="default"
                >
                  Afficher Règles
                </Button>
                <Button
                  onClick={handleStartGame}
                  className="w-48 h-12 px-4 py-2"
                  variant="default"
                >
                  Démarrer la partie
                </Button>
              </div>
            </div>
          </div>
        </div>
        <div className="flex flex-col pb-12">
          <h1 className="pb-4 text-2xl text-center">Contrôle de la partie</h1>
          <div className="flex flex-col items-center justify-start gap-4">
            <div className="flex items-center justify-start gap-4">
              <Button
                onClick={handleCorrect}
                variant="default"
                className="w-48 h-12 px-4 py-2"
              >
                Correct (Q)
              </Button>
              <Button
                onClick={handleFalse}
                variant="default"
                className="w-48 h-12 px-4 py-2"
              >
                Faux (S)
              </Button>
              <Button
                onClick={handlePass}
                variant="default"
                className="w-48 h-12 px-4 py-2"
              >
                Pass (D)
              </Button>
            </div>
            <div className="flex items-center justify-start gap-4">
              <Button
                onClick={handleReplay}
                variant="default"
                className="w-48 h-12 px-4 py-2"
              >
                Jouer le son (F)
              </Button>
              <Button
                onClick={handleStopSound}
                className="self-center w-48 h-12 px-4 py-2"
                variant="destructive"
              >
                Arrêter le son (G)
              </Button>
            </div>
          </div>
        </div>

        <Button
          onClick={handlePlayAgain}
          className="self-center h-12 px-4 text-md w-56"
          variant="destructive"
        >
          Mode Sélection
        </Button>
      </div>
    </div>
  );
};

export default AdminPage;
