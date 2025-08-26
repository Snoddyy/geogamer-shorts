"use client";

import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { useCallback, useState, useEffect } from "react";
import {
  sendCommand,
  setRuleType,
  listenToAudioState,
  clearAllCommands,
} from "@/utils/gameService";

const AdminPage = () => {
  const router = useRouter();
  const [selectedRuleType, setSelectedRuleType] = useState("classic");
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

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
    // Clear all commands before going back to mode selection
    clearAllCommands();
    router.push("/");
  }, [router]);

  const handleStopSound = useCallback(() => {
    handleCommand("Stop Sound");
  }, [handleCommand]);

  const handlePlaySound = useCallback(() => {
    handleCommand("Play Sound");
  }, [handleCommand]);

  const handleToggleSound = useCallback(() => {
    if (isAudioPlaying) {
      handleStopSound();
    } else {
      handlePlaySound();
    }
  }, [isAudioPlaying, handleStopSound, handlePlaySound]);

  // Listen for audio state changes
  useEffect(() => {
    const unsubscribe = listenToAudioState((playing) => {
      setIsAudioPlaying(playing);
    });

    return () => unsubscribe();
  }, []);

  // Add keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === "x") {
        handleFalse();
      } else if (event.key === " " || event.key === "Spacebar") {
        event.preventDefault(); // Prevent page scrolling on space
        handlePass();
      } else if (event.key === "e" || event.key === "E") {
        handleCorrect();
      } else if (event.key === "s" || event.key === "S") {
        handleStopSound();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    // Clean up event listener on component unmount
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [handleCorrect, handleFalse, handlePass, handleStopSound]);

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Admin Control Panel
          </h1>
          <p className="text-muted-foreground text-lg">
            Game Administration Dashboard
          </p>
        </div>

        {/* Keyboard Shortcuts Card */}
        <div className="bg-card border border-border rounded-lg p-4 mb-6 shadow-sm">
          <h3 className="text-sm font-semibold text-card-foreground mb-2 uppercase tracking-wide">
            Keyboard Shortcuts
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-mono">
                E
              </kbd>
              <span className="text-muted-foreground">Correct</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-mono">
                X
              </kbd>
              <span className="text-muted-foreground">Wrong</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-mono">
                Space
              </kbd>
              <span className="text-muted-foreground">Pass</span>
            </div>
            <div className="flex items-center gap-2">
              <kbd className="px-2 py-1 bg-muted text-muted-foreground rounded text-xs font-mono">
                S
              </kbd>
              <span className="text-muted-foreground">Stop Sound</span>
            </div>
          </div>
        </div>

        {/* Main Controls Grid */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Game Setup Section */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              Game Setup
            </h3>
            <div className="space-y-3">
              <Button
                onClick={handleDisplayRules}
                variant="outline"
                size="lg"
                className="w-full justify-start h-12 text-left border-blue-200 hover:bg-blue-50/30 hover:border-blue-300/50 dark:border-blue-800 dark:hover:bg-blue-900/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">📋</span>
                  </div>
                  <span>Display Rules</span>
                </div>
              </Button>
              <Button
                onClick={handleStartGame}
                variant="outline"
                size="lg"
                className="w-full justify-start h-12 text-left border-green-200 hover:bg-green-50/30 hover:border-green-300/50 dark:border-green-800 dark:hover:bg-green-900/10"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-green-500 rounded-md flex items-center justify-center">
                    <span className="text-white text-sm font-bold">▶️</span>
                  </div>
                  <span>Start Game</span>
                </div>
              </Button>
            </div>
          </div>

          {/* Game Actions Section */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-card-foreground mb-4 flex items-center gap-2">
              <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
              Game Actions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Button
                onClick={handleCorrect}
                variant="outline"
                size="lg"
                className="h-16 border-emerald-200 hover:bg-emerald-50/30 hover:border-emerald-300/50 dark:border-emerald-800 dark:hover:bg-emerald-900/10"
              >
                <div className="text-center">
                  <div className="w-6 h-6 bg-emerald-500 rounded-full mx-auto mb-1 flex items-center justify-center">
                    <span className="text-white text-xs">✓</span>
                  </div>
                  <span className="text-sm font-medium">Correct</span>
                </div>
              </Button>
              <Button
                onClick={handleFalse}
                variant="outline"
                size="lg"
                className="h-16 border-red-200 hover:bg-red-50/30 hover:border-red-300/50 dark:border-red-800 dark:hover:bg-red-900/10"
              >
                <div className="text-center">
                  <div className="w-6 h-6 bg-red-500 rounded-full mx-auto mb-1 flex items-center justify-center">
                    <span className="text-white text-xs">✕</span>
                  </div>
                  <span className="text-sm font-medium">Wrong</span>
                </div>
              </Button>
              <Button
                onClick={handlePass}
                variant="outline"
                size="lg"
                className="h-16 border-amber-200 hover:bg-amber-50/30 hover:border-amber-300/50 dark:border-amber-800 dark:hover:bg-amber-900/10"
              >
                <div className="text-center">
                  <div className="w-6 h-6 bg-amber-500 rounded-full mx-auto mb-1 flex items-center justify-center">
                    <span className="text-white text-xs">⏭</span>
                  </div>
                  <span className="text-sm font-medium">Pass</span>
                </div>
              </Button>
              <Button
                onClick={handleToggleSound}
                variant="outline"
                size="lg"
                className="h-16 border-purple-200 hover:bg-purple-50/30 hover:border-purple-300/50 dark:border-purple-800 dark:hover:bg-purple-900/10"
              >
                <div className="text-center">
                  <div className="w-6 h-6 bg-purple-500 rounded-full mx-auto mb-1 flex items-center justify-center">
                    <span className="text-white text-xs">
                      {isAudioPlaying ? "🔇" : "🔊"}
                    </span>
                  </div>
                  <span className="text-sm font-medium">
                    {isAudioPlaying ? "Stop Sound" : "Play Sound"}
                  </span>
                </div>
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Section */}
        <div className="mt-6 flex justify-center">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <Button
              onClick={handlePlayAgain}
              variant="destructive"
              size="lg"
              className="h-12 px-8"
            >
              <div className="flex items-center gap-2">
                <span>🏠</span>
                <span>Mode Sélection</span>
              </div>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
