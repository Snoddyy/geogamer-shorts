// app/layout.js
"use client";
import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import { Inter as FontSans } from "next/font/google";
import { useEffect } from "react";
import Home from "./page";
import PlayerPage from "./player/page";
import PlaylistSelection from "./playlist-selection/page";
import ScorePage from "./score/page";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

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
      <body
        className={cn(
          "min-h-screen bg-black font-sans antialiased",
          fontSans.variable
        )}
      >
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
