"use client";

const HistoryBar = ({ totalRounds, roundHistory, currentRoundId }) => {
  return (
    <div className="fixed z-50 flex items-center justify-center py-2 text-white scale-150 -translate-x-1/2 bottom-10 left-1/2 bg-black/50">
      {Array.from({ length: totalRounds }, (_, index) => (
        <div
          key={index}
          className={`flex items-center justify-center w-8 h-8 mx-2 font-bold relative ${
            index === currentRoundId ? "animate-glow" : ""
          } ${roundHistory[index] === 1 ? "bg-white text-black" : ""}`}
        >
          {index + 1}
          {index !== totalRounds - 1 && (
            <span className="absolute right-[-12px] text-white">|</span>
          )}
        </div>
      ))}
    </div>
  );
};

export default HistoryBar;
