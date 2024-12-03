"use client";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

const ScoreContent = () => {
  const searchParams = useSearchParams();
  console.log("URL params:", {
    score: searchParams.get("score"),
    total: searchParams.get("total"),
  });

  const score = parseInt(searchParams.get("score") || "0", 10);
  const total = parseInt(searchParams.get("total") || "0", 10);
  const router = useRouter();

  const handlePlayAgain = () => {
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="mb-6 text-3xl font-bold">
        Vous avez obtenu {score} sur {total} !
      </h1>
      <Button onClick={handlePlayAgain} variant="default" className="mt-5">
        Jouer à nouveau
      </Button>
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
