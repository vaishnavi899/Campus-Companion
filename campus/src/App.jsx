import { useState, useEffect } from "react";
import { HashRouter as Router, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import Navbar from "./components/Navbar";
import Login from "./components/Login";
import Attendance from "./components/Attendance";
import Grades from "./components/Grades";
import Exams from "./components/Exams";
import Subjects from "./components/Subjects";
import Profile from "./components/Profile";
import Cloudflare from "@/components/Cloudflare";
import { ThemeProvider } from "./components/theme-provider";
import { ThemeScript } from "./components/theme-script";
import { DynamicFontLoader } from "./components/DynamicFontLoader";
import { Toaster } from "./components/ui/sonner";
import "./App.css";

import { WebPortal, LoginError } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.20/dist/jsjiit.esm.js";
import MockWebPortal from "./components/MockWebPortal";
import { TriangleAlert } from "lucide-react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// 🟩 Add this import
import ChatWidget from "./components/ChatWidget";

const queryClient = new QueryClient();

// Create both portal instances
const realPortal = new WebPortal();
const mockPortal = new MockWebPortal();

function AuthenticatedApp({ w, setIsAuthenticated, setIsDemoMode }) {
  const [activeAttendanceTab, setActiveAttendanceTab] = useState("overview");
  const [attendanceData, setAttendanceData] = useState({});
  const [attendanceSemestersData, setAttendanceSemestersData] = useState(null);
  const [subjectData, setSubjectData] = useState({});
  const [subjectSemestersData, setSubjectSemestersData] = useState(null);
  const [gradesData, setGradesData] = useState({});
  const [gradesSemesterData, setGradesSemesterData] = useState(null);
  const [selectedAttendanceSem, setSelectedAttendanceSem] = useState(null);
  const [selectedGradesSem, setSelectedGradesSem] = useState(null);
  const [selectedSubjectsSem, setSelectedSubjectsSem] = useState(null);
  const [attendanceDailyDate, setAttendanceDailyDate] = useState(new Date());
  const [isAttendanceCalendarOpen, setIsAttendanceCalendarOpen] = useState(false);
  const [isAttendanceTrackerOpen, setIsAttendanceTrackerOpen] = useState(false);
  const [attendanceSubjectCacheStatus, setAttendanceSubjectCacheStatus] = useState({});
  const [attendanceGoal, setAttendanceGoal] = useState(() => {
    const savedGoal = localStorage.getItem("attendanceGoal");
    return savedGoal ? parseInt(savedGoal) : 75;
  });

  useEffect(() => {
    localStorage.setItem("attendanceGoal", attendanceGoal.toString());
  }, [attendanceGoal]);

  const [profileData, setProfileData] = useState(null);
  const [activeGradesTab, setActiveGradesTab] = useState("overview");
  const [gradeCardSemesters, setGradeCardSemesters] = useState([]);
  const [selectedGradeCardSem, setSelectedGradeCardSem] = useState(null);
  const [gradeCard, setGradeCard] = useState(null);
  const [gradeCards, setGradeCards] = useState({});
  const [subjectAttendanceData, setSubjectAttendanceData] = useState({});
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [examSchedule, setExamSchedule] = useState({});
  const [examSemesters, setExamSemesters] = useState([]);
  const [selectedExamSem, setSelectedExamSem] = useState(null);
  const [selectedExamEvent, setSelectedExamEvent] = useState(null);
  const [marksSemesters, setMarksSemesters] = useState([]);
  const [selectedMarksSem, setSelectedMarksSem] = useState(null);
  const [marksSemesterData, setMarksSemesterData] = useState(null);
  const [marksData, setMarksData] = useState({});
  const [gradesLoading, setGradesLoading] = useState(true);
  const [gradesError, setGradesError] = useState(null);
  const [gradeCardLoading, setGradeCardLoading] = useState(false);
  const [isDownloadDialogOpen, setIsDownloadDialogOpen] = useState(false);
  const [marksLoading, setMarksLoading] = useState(false);
  const [isAttendanceMetaLoading, setIsAttendanceMetaLoading] = useState(true);
  const [isAttendanceDataLoading, setIsAttendanceDataLoading] = useState(true);

  return (
    <div className="min-h-screen pb-14 select-none relative overflow-hidden">
      {/* Beautiful animated background gradient */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 animate-gradient-shift"></div>
      
      {/* Decorative floating shapes */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-200/20 dark:bg-blue-500/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute top-40 right-20 w-96 h-96 bg-purple-200/20 dark:bg-purple-500/10 rounded-full blur-3xl animate-float-delayed"></div>
        <div className="absolute bottom-20 left-1/3 w-80 h-80 bg-pink-200/20 dark:bg-pink-500/10 rounded-full blur-3xl animate-float-slow"></div>
      </div>

      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-xl -mt-[2px] border-b border-border/40 shadow-lg shadow-black/5">
        <Header setIsAuthenticated={setIsAuthenticated} setIsDemoMode={setIsDemoMode} />
      </div>

      <div className="relative z-10">
        <Routes>
          <Route path="/" element={<Navigate to="/attendance" />} />
          <Route path="/login" element={<Navigate to="/attendance" />} />
          <Route
            path="/attendance"
            element={
              <Attendance
                w={w}
                attendanceData={attendanceData}
                setAttendanceData={setAttendanceData}
                semestersData={attendanceSemestersData}
                setSemestersData={setAttendanceSemestersData}
                selectedSem={selectedAttendanceSem}
                setSelectedSem={setSelectedAttendanceSem}
                attendanceGoal={attendanceGoal}
                setAttendanceGoal={setAttendanceGoal}
                subjectAttendanceData={subjectAttendanceData}
                setSubjectAttendanceData={setSubjectAttendanceData}
                selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject}
                isAttendanceMetaLoading={isAttendanceMetaLoading}
                setIsAttendanceMetaLoading={setIsAttendanceMetaLoading}
                isAttendanceDataLoading={isAttendanceDataLoading}
                setIsAttendanceDataLoading={setIsAttendanceDataLoading}
                activeTab={activeAttendanceTab}
                setActiveTab={setActiveAttendanceTab}
                dailyDate={attendanceDailyDate}
                setDailyDate={setAttendanceDailyDate}
                calendarOpen={isAttendanceCalendarOpen}
                setCalendarOpen={setIsAttendanceCalendarOpen}
                isTrackerOpen={isAttendanceTrackerOpen}
                setIsTrackerOpen={setIsAttendanceTrackerOpen}
                subjectCacheStatus={attendanceSubjectCacheStatus}
                setSubjectCacheStatus={setAttendanceSubjectCacheStatus}
              />
            }
          />

          <Route
            path="/grades"
            element={
              <Grades
                w={w}
                gradesData={gradesData}
                setGradesData={setGradesData}
                semesterData={gradesSemesterData}
                setSemesterData={setGradesSemesterData}
                activeTab={activeGradesTab}
                setActiveTab={setActiveGradesTab}
                gradeCardSemesters={gradeCardSemesters}
                setGradeCardSemesters={setGradeCardSemesters}
                selectedGradeCardSem={selectedGradeCardSem}
                setSelectedGradeCardSem={setSelectedGradeCardSem}
                gradeCard={gradeCard}
                setGradeCard={setGradeCard}
                gradeCards={gradeCards}
                setGradeCards={setGradeCards}
                marksSemesters={marksSemesters}
                setMarksSemesters={setMarksSemesters}
                selectedMarksSem={selectedMarksSem}
                setSelectedMarksSem={setSelectedMarksSem}
                marksSemesterData={marksSemesterData}
                setMarksSemesterData={setMarksSemesterData}
                marksData={marksData}
                setMarksData={setMarksData}
                gradesLoading={gradesLoading}
                setGradesLoading={setGradesLoading}
                gradesError={gradesError}
                setGradesError={setGradesError}
                gradeCardLoading={gradeCardLoading}
                setGradeCardLoading={setGradeCardLoading}
                isDownloadDialogOpen={isDownloadDialogOpen}
                setIsDownloadDialogOpen={setIsDownloadDialogOpen}
                marksLoading={marksLoading}
                setMarksLoading={setMarksLoading}
              />
            }
          />

          <Route
            path="/exams"
            element={
              <Exams
                w={w}
                examSchedule={examSchedule}
                setExamSchedule={setExamSchedule}
                examSemesters={examSemesters}
                setExamSemesters={setExamSemesters}
                selectedExamSem={selectedExamSem}
                setSelectedExamSem={setSelectedExamSem}
                selectedExamEvent={selectedExamEvent}
                setSelectedExamEvent={setSelectedExamEvent}
              />
            }
          />

          <Route
            path="/subjects"
            element={
              <Subjects
                w={w}
                subjectData={subjectData}
                setSubjectData={setSubjectData}
                semestersData={subjectSemestersData}
                setSemestersData={setSubjectSemestersData}
                selectedSem={selectedSubjectsSem}
                setSelectedSem={setSelectedSubjectsSem}
              />
            }
          />

          <Route
            path="/profile"
            element={
              <Profile
                w={w}
                profileData={profileData}
                setProfileData={setProfileData}
              />
            }
          />
        </Routes>
      </div>

      {/* ✅ ChatWidget popup */}
      <ChatWidget />

      {/* ✅ Bottom Navbar with glass effect */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-border/40 shadow-2xl shadow-black/10">
        <Navbar />
      </div>
    </div>
  );
}

function LoginWrapper({ onLoginSuccess, onDemoLogin, w }) {
  const navigate = useNavigate();

  const handleLoginSuccess = () => {
    onLoginSuccess();
    setTimeout(() => navigate("/attendance"), 100);
  };

  const handleDemoLogin = () => {
    onDemoLogin();
    setTimeout(() => navigate("/attendance"), 100);
  };

  return <Login onLoginSuccess={handleLoginSuccess} onDemoLogin={handleDemoLogin} w={w} />;
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const activePortal = isDemoMode ? mockPortal : realPortal;

  useEffect(() => {
    const username = localStorage.getItem("username");
    const password = localStorage.getItem("password");

    const performLogin = async () => {
      try {
        if (username && password) {
          await realPortal.student_login(username, password);
          if (realPortal.session) {
            setIsAuthenticated(true);
            setIsDemoMode(false);
          }
        }
      } catch (error) {
        if (
          error instanceof LoginError &&
          error.message.includes("JIIT Web Portal server is temporarily unavailable")
        ) {
          setError("JIIT Web Portal server is temporarily unavailable. Please try again later.");
        } else if (error instanceof LoginError && error.message.includes("Failed to fetch")) {
          setError("Please check your internet connection. If connected, JIIT Web Portal server is temporarily unavailable.");
        } else {
          console.error("Auto-login failed:", error);
          setError("Auto-login failed. Please login again.");
        }
        localStorage.removeItem("username");
        localStorage.removeItem("password");
        setIsAuthenticated(false);
      } finally {
        setIsLoading(false);
      }
    };

    performLogin();
  }, []);

  const handleRealLogin = () => {
    setIsAuthenticated(true);
    setIsDemoMode(false);
  };

  const handleDemoLogin = () => {
    setIsAuthenticated(true);
    setIsDemoMode(true);
  };

  if (isLoading) {
    return (
      <>
        <ThemeScript />
        <ThemeProvider>
          <DynamicFontLoader />
          <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950 text-foreground relative overflow-hidden">
            {/* Animated background */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-200/30 dark:bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
              <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-200/30 dark:bg-purple-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
            </div>
            
            {/* Loading content */}
            <div className="relative z-10 text-center">
              <div className="mb-6 flex justify-center">
                <div className="w-16 h-16 border-4 border-blue-200 dark:border-blue-800 border-t-blue-600 dark:border-t-blue-400 rounded-full animate-spin"></div>
              </div>
              <p className="text-lg font-semibold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent animate-pulse">
                Signing in...
              </p>
            </div>
          </div>
        </ThemeProvider>
      </>
    );
  }

  return (
    <>
      <ThemeScript />
      <ThemeProvider>
        <DynamicFontLoader />
        <QueryClientProvider client={queryClient}>
          <Toaster
            richColors
            icons={{
              error: <TriangleAlert className="h-4 w-4" />,
            }}
            toastOptions={{
              style: {
                background: "var(--popover)",
                color: "var(--popover-foreground)",
                border: "1px solid var(--border)",
                boxShadow: "var(--shadow-lg)",
              },
            }}
          />
          <Router>
            <div className="min-h-screen bg-background select-none">
              <Routes>
                <Route path="/stats" element={<Cloudflare />} />
                {!isAuthenticated ? (
                  <Route
                    path="*"
                    element={
                      <>
                        {error && (
                          <div className="text-destructive text-center pt-4 px-4 animate-shake">
                            <div className="inline-block bg-destructive/10 border border-destructive/20 rounded-lg px-4 py-2 backdrop-blur-sm">
                              {error}
                            </div>
                          </div>
                        )}
                        <LoginWrapper
                          onLoginSuccess={handleRealLogin}
                          onDemoLogin={handleDemoLogin}
                          w={realPortal}
                        />
                      </>
                    }
                  />
                ) : (
                  <Route
                    path="/*"
                    element={
                      <AuthenticatedApp
                        w={activePortal}
                        setIsAuthenticated={setIsAuthenticated}
                        setIsDemoMode={setIsDemoMode}
                      />
                    }
                  />
                )}
              </Routes>
            </div>
          </Router>
        </QueryClientProvider>
      </ThemeProvider>
      
      {/* Add custom animations CSS */}
      <style>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        
        @keyframes float {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-30px) translateX(20px);
          }
        }
        
        @keyframes float-delayed {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(30px) translateX(-20px);
          }
        }
        
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) translateX(0);
          }
          50% {
            transform: translateY(-20px) translateX(-30px);
          }
        }
        
        @keyframes shake {
          0%, 100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-10px);
          }
          75% {
            transform: translateX(10px);
          }
        }
        
        .animate-gradient-shift {
          background-size: 200% 200%;
          animation: gradient-shift 15s ease infinite;
        }
        
        .animate-float {
          animation: float 20s ease-in-out infinite;
        }
        
        .animate-float-delayed {
          animation: float-delayed 25s ease-in-out infinite;
        }
        
        .animate-float-slow {
          animation: float-slow 30s ease-in-out infinite;
        }
        
        .animate-shake {
          animation: shake 0.5s ease-in-out;
        }
      `}</style>
    </>
  );
}

// ✅ Proper default export added
export default App;