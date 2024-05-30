// app/layout.js
import { cn } from "@/lib/utils";
import "@/styles/globals.css";
import { Inter as FontSans } from "next/font/google";
import Home from "./page";
import PlayerPage from "./player/page";
import PlaylistSelection from "./playlist-selection/page";
import ScorePage from "./score/page";

const fontSans = FontSans({
  subsets: ["latin"],
  variable: "--font-sans",
});

export default function RootLayout({ children }) {
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
