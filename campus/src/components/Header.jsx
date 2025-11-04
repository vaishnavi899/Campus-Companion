import { useNavigate } from "react-router-dom";
import { ThemeSelectorDialog } from "./theme-selector-dialog";
import { Button } from "./ui/button";
import LogoutIcon from "@/../public/icons/logout.svg?react";
import { Link } from "react-router-dom";
import { ChartNoAxesCombined } from "lucide-react";

const Header = ({ setIsAuthenticated, setIsDemoMode }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("username");
    localStorage.removeItem("password");
    localStorage.removeItem("attendanceData");
    setIsAuthenticated(false);
    if (setIsDemoMode) {
      setIsDemoMode(false);
    }
    navigate("/login");
  };

  return (
    <header className="relative backdrop-blur-xl bg-white/80 dark:bg-gray-900/80 border-b border-gray-200/50 dark:border-gray-700/50 shadow-lg">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-violet-500/5 via-purple-500/5 to-fuchsia-500/5 pointer-events-none"></div>
      
      <div className="relative mx-auto px-6 py-4">
        <div className="container-fluid flex justify-between items-center">
          {/* Logo/Brand */}
          <div className="flex items-center gap-3">
            <h1 className="text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 text-2xl font-bold lg:text-3xl font-sans tracking-tight">
              CampusCompanion
            </h1>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
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
            
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-violet-600/0 to-fuchsia-600/0 group-hover:from-violet-600/10 group-hover:to-fuchsia-600/10 rounded-full transition-all duration-200"></div>
              <ThemeSelectorDialog />
            </div>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={handleLogout} 
              className="cursor-pointer rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-110 group relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-red-600/0 to-pink-600/0 group-hover:from-red-600/10 group-hover:to-pink-600/10 transition-all duration-200"></div>
              <LogoutIcon className="relative z-10 w-7 h-7 stroke-2 stroke-gray-700 dark:stroke-gray-300 group-hover:stroke-red-600 dark:group-hover:stroke-red-400 transition-colors" />
            </Button>
          </div>
        </div>
      </div>

      {/* Bottom border gradient */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 opacity-50"></div>
    </header>
  );
};

export default Header;