// app/layout.js
"use client";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import { useEffect } from "react";
import Home from "./page";
import PlayerPage from "./player/page";
import PlaylistSelection from "./playlist-selection/page";
import ScorePage from "./score/page";

const disableRightClick = (event) => {
  event.preventDefault();
};

export default function RootLayout({ children }) {
  useEffect(() => {
    document.addEventListener("contextmenu", disableRightClick);
    return () => {
      document.removeEventListener("contextmenu", disableRightClick);
    };
  }, []);
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body className={cn("min-h-screen bg-black font-custom antialiased")}>
        {children}
      </body>
    </html>
  );
}

export const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/playlist-selection",
    element: <PlaylistSelection />,
  },
  {
    path: "/player",
    element: <PlayerPage />,
  },
  {
    path: "/score",
    element: <ScorePage />,
  },
];
