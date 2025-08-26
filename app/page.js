import { Button } from "@/components/ui/button";
import Link from "next/link";

const Home = () => {
  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header Section */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-foreground mb-4">GeoGamer</h1>
          <p className="text-muted-foreground text-xl">
            Choose your game mode to begin
          </p>
        </div>

        {/* Mode Selection Cards */}
        <div className="grid gap-8 md:grid-cols-2 max-w-2xl mx-auto">
          {/* Player Mode Card */}
          <div className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">🎮</span>
              </div>
              <h3 className="text-2xl font-semibold text-card-foreground mb-3">
                Player Mode
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Join the game and test your gaming knowledge with interactive
                content
              </p>
              <Link href="/playlist-selection">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 border-blue-200 hover:bg-blue-50/30 hover:border-blue-300/50 dark:border-blue-800 dark:hover:bg-blue-900/10"
                >
                  <div className="flex items-center gap-2">
                    <span>🚀</span>
                    <span>Start Playing</span>
                  </div>
                </Button>
              </Link>
            </div>
          </div>

          {/* Admin Mode Card */}
          <div className="bg-card border border-border rounded-lg p-8 shadow-sm hover:shadow-md transition-shadow">
            <div className="text-center">
              <div className="w-16 h-16 bg-emerald-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white text-2xl">⚙️</span>
              </div>
              <h3 className="text-2xl font-semibold text-card-foreground mb-3">
                Admin Mode
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Control the game flow, manage players, and monitor game progress
              </p>
              <Link href="/admin">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full h-12 border-emerald-200 hover:bg-emerald-50/30 hover:border-emerald-300/50 dark:border-emerald-800 dark:hover:bg-emerald-900/10"
                >
                  <div className="flex items-center gap-2">
                    <span>🔧</span>
                    <span>Admin Panel</span>
                  </div>
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center mt-12">
          <p className="text-muted-foreground text-sm">
            Select your preferred mode to continue
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
