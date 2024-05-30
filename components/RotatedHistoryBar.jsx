// components/RotatedHistoryBar.jsx
"use client";
import HistoryBar from "@/components/HistoryBar";

const RotatedHistoryBar = ({ totalRounds, roundHistory, currentRoundId }) => {
  return (
    <div className="absolute transform -rotate-90 left-96 top-1/2">
      <HistoryBar
        totalRounds={totalRounds}
        roundHistory={roundHistory}
        currentRoundId={currentRoundId}
      />
    </div>
  );
};

export default RotatedHistoryBar;
