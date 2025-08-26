"use client";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ScoreContent = () => {
  const searchParams = useSearchParams();
  console.log("ScorePage - URL params:", {
    score: searchParams.get("score"),
    total: searchParams.get("total"),
  });
  console.log("ScorePage - Full URL search params:", searchParams.toString());

  const score = parseInt(searchParams.get("score") || "0", 10);
  const total = parseInt(searchParams.get("total") || "0", 10);
  console.log("ScorePage - Parsed values - score:", score, "total:", total);
  const router = useRouter();

  const handlePlayAgain = () => {
    router.push("/");
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-2xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">
            Game Complete!
          </h1>
          <p className="text-muted-foreground text-lg">
            Here are your final results
          </p>
        </div>

        {/* Score Card */}
        <div className="bg-card border border-border rounded-lg p-8 shadow-sm mb-6">
          <div className="text-center">
            {/* Score Icon */}
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-full mx-auto mb-6 flex items-center justify-center">
              <span className="text-white text-3xl">🏆</span>
            </div>

            {/* Score Display */}
            <div className="mb-6">
              <h2 className="text-3xl font-bold text-card-foreground mb-2">
                Your Score
              </h2>
              <div className="flex items-center justify-center gap-2 text-5xl font-bold">
                <span className="text-emerald-500">{score}</span>
                <span className="text-muted-foreground">/</span>
                <span className="text-muted-foreground">{total}</span>
              </div>
              <p className="text-muted-foreground mt-2">
                {((score / total) * 100).toFixed(0)}% accuracy
              </p>
            </div>

            {/* Performance Message */}
            <div className="mb-6 p-4 bg-muted/20 rounded-lg">
              <p className="text-card-foreground text-lg">
                {score === total
                  ? "🎉 Perfect score! Outstanding performance!"
                  : score >= total * 0.8
                  ? "🌟 Excellent work! Great gaming knowledge!"
                  : score >= total * 0.6
                  ? "👍 Good job! Keep gaming!"
                  : score >= total * 0.4
                  ? "📚 Not bad! There's room for improvement!"
                  : "🌍 Keep Gaming!"}
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-4">
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <Button
              onClick={handlePlayAgain}
              variant="outline"
              size="lg"
              className="w-full h-12 border-emerald-200 hover:bg-emerald-50/30 hover:border-emerald-300/50 dark:border-emerald-800 dark:hover:bg-emerald-900/10"
            >
              <div className="flex items-center gap-2">
                <span>🔄</span>
                <span>Play Again</span>
              </div>
            </Button>
          </div>

          {/* Additional Stats */}
          <div className="bg-card border border-border rounded-lg p-4 shadow-sm">
            <h3 className="text-sm font-semibold text-card-foreground mb-3 uppercase tracking-wide text-center">
              Game Statistics
            </h3>
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-emerald-500">
                  {score}
                </div>
                <div className="text-xs text-muted-foreground">Correct</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-red-500">
                  {total - score}
                </div>
                <div className="text-xs text-muted-foreground">Incorrect</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-blue-500">{total}</div>
                <div className="text-xs text-muted-foreground">Total</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ScorePage = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ScoreContent />
    </Suspense>
  );
};

export default ScorePage;
