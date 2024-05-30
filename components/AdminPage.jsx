// AdminPage.js
"use client";
import { Button } from "@/components/ui/button";
import { useCallback } from "react";
import io from "socket.io-client";

const socket = io("https://geogamer-shorts.onrender.com");

const AdminPage = () => {
  const sendMessage = useCallback((message) => {
    console.log("Sending message:", message);
    socket.emit("adminMessage", message);
  }, []);

  const handleCorrect = useCallback(() => {
    sendMessage("Load next image");
  }, [sendMessage]);

  const handleFalse = useCallback(() => {
    sendMessage("Play sound");
  }, [sendMessage]);

  const handlePass = useCallback(() => {
    sendMessage("Perform another action");
  }, [sendMessage]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen space-y-4">
      <div className="flex space-x-4">
        <Button
          onClick={() => {
            handleCorrect();
            console.log("Correct button clicked");
          }}
          variant="default"
        >
          Correct (Spacebar)
        </Button>
        <Button
          onClick={() => {
            handleFalse();
            console.log("False button clicked");
          }}
          variant="default"
        >
          False (Enter)
        </Button>
        <Button
          onClick={() => {
            handlePass();
            console.log("Pass button clicked");
          }}
          variant="default"
        >
          Pass (Backspace)
        </Button>
      </div>
    </div>
  );
};

export default AdminPage;
