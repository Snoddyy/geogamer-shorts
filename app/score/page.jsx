"use client";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

const ScorePage = () => {
  const searchParams = useSearchParams();
  const score = parseInt(searchParams.get("score") || "0", 10);
  const router = useRouter();

  const handlePlayAgain = () => {
    router.push("/");
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="mb-6 text-3xl font-bold">You scored {score} out of 5!</h1>
      <Button onClick={handlePlayAgain} variant="default" className="mt-5">
        Play Again
      </Button>
    </div>
  );
};

export default ScorePage;
