import { Button } from "@/components/ui/button";
import Link from "next/link";

const Home = () => {
  return (
    <>
      <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="mb-6 text-3xl font-bold">Choose Mode</h1>
        <div className="flex space-x-4">
          <Link href="/playlist-selection">
            <Button variant="default">Player Mode</Button>
          </Link>
          <Link href="/admin">
            <Button variant="default">Admin Mode</Button>
          </Link>
        </div>
      </div>
    </>
  );
};

export default Home;
