"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { sendCommand, setRuleType } from "@/utils/gameService";

const AdminPage = () => {
  const router = useRouter();
  const [selectedRuleType, setSelectedRuleType] = useState("classic");

  // Update rule type when selected
  const handleSelectRuleType = useCallback((ruleType) => {
    setSelectedRuleType(ruleType);
    setRuleType(ruleType);
    console.log("Selected rule type:", ruleType);
  }, []);

  // Send command to all players
  const handleCommand = useCallback((command) => {
    console.log("Broadcasting command:", command);
    sendCommand(command);
  }, []);

  const handleDisplayRules = useCallback(() => {
    handleCommand("Display Rules");
  }, [handleCommand]);

  const handleStartGame = useCallback(() => {
    handleCommand("Start Game");
  }, [handleCommand]);

  const handleCorrect = useCallback(() => {
    handleCommand("Correct");
  }, [handleCommand]);

  const handleFalse = useCallback(() => {
    handleCommand("Wrong");
  }, [handleCommand]);

  const handlePass = useCallback(() => {
    handleCommand("Pass");
  }, [handleCommand]);

  const handleReplay = useCallback(() => {
    handleCommand("Replay");
  }, [handleCommand]);

  const handlePlayAgain = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleStopSound = useCallback(() => {
    handleCommand("Stop Sound");
  }, [handleCommand]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="mb-6 text-3xl font-bold">Admin Control Panel</h1>

      {/* Rule Type Selection */}

      {/* Game Controls */}
      <div className="grid grid-cols-2 gap-4">
        <Button
          onClick={handleDisplayRules}
          className="bg-blue-500 hover:bg-blue-600"
        >
          Display Rules
        </Button>
        <Button
          onClick={handleStartGame}
          className="bg-green-500 hover:bg-green-600"
        >
          Start Game
        </Button>
        <Button
          onClick={handleCorrect}
          className="bg-emerald-500 hover:bg-emerald-600"
        >
          Correct
        </Button>
        <Button onClick={handleFalse} className="bg-red-500 hover:bg-red-600">
          Wrong
        </Button>
        <Button
          onClick={handlePass}
          className="bg-yellow-500 hover:bg-yellow-600"
        >
          Pass
        </Button>
        <Button
          onClick={handleReplay}
          className="bg-purple-500 hover:bg-purple-600"
        >
          Replay
        </Button>
        <Button
          onClick={handleStopSound}
          className="bg-gray-500 hover:bg-gray-600"
        >
          Stop Sound
        </Button>
      </div>

      <Button
        onClick={handlePlayAgain}
        className="self-center h-12 px-4 text-md w-56 mt-6"
        variant="destructive"
      >
        Mode Sélection
      </Button>
    </div>
  );
};

export default AdminPage;
