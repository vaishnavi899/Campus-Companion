import { ThemeSelectorDialog } from "./theme-selector-dialog";
import { Button } from "./ui/button";
import { ChartNoAxesCombined, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

const PublicHeader = ({ showStatsButton = false, showBackButton = false }) => {
  return (
    <header className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 pointer-events-none"></div>
      
      <div className="relative mx-auto px-6 py-4">
        <div className="container-fluid flex justify-between items-center">
          {/* Logo/Brand with optional back button */}
          <div className="flex items-center gap-3">
            {showBackButton && (
              <Link to="/">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="cursor-pointer rounded-full hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all duration-200 hover:scale-110 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 to-fuchsia-600/0 group-hover:from-violet-600/10 group-hover:to-fuchsia-600/10 transition-all duration-200"></div>
                  <ArrowLeft className="relative z-10 text-gray-700 dark:text-gray-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                </Button>
              </Link>
            )}
            <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 text-2xl font-bold lg:text-3xl font-sans tracking-tight">
              CampusCompanion
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            {showStatsButton && (
              <Link to="/stats">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="cursor-pointer rounded-full hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all duration-200 hover:scale-110 group relative overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 to-fuchsia-600/0 group-hover:from-violet-600/10 group-hover:to-fuchsia-600/10 transition-all duration-200"></div>
                  <ChartNoAxesCombined className="relative z-10 text-gray-700 dark:text-gray-300 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors" />
                </Button>
              </Link>
            )}
            
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 to-fuchsia-600/0 group-hover:from-violet-600/10 group-hover:to-fuchsia-600/10 rounded-full transition-all duration-200"></div>
              <ThemeSelectorDialog />
            </div>
            
            {/* Empty div to maintain spacing - matches logout button size */}
            <div className="w-10 h-10"></div>
          </div>
        </div>
      </div>

      {/* Bottom border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 opacity-50"></div>
    </header>
  );
};

export default PublicHeader;