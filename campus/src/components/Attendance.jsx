import React, { useState, useEffect } from "react";
import AttendanceCard from "./AttendanceCard";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Calendar } from "@/components/ui/calendar";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Sheet, SheetTrigger, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Progress } from "@/components/ui/progress";
import CircleProgress from "./CircleProgress";
import { Check, Loader2, AlertCircle, ChevronDown, ChevronUp, Target } from "lucide-react";

const Attendance = ({
  w,
  attendanceData,
  setAttendanceData,
  semestersData,
  setSemestersData,
  selectedSem,
  setSelectedSem,
  attendanceGoal,
  setAttendanceGoal,
  subjectAttendanceData,
  setSubjectAttendanceData,
  selectedSubject,
  setSelectedSubject,
  isAttendanceMetaLoading,
  setIsAttendanceMetaLoading,
  isAttendanceDataLoading,
  setIsAttendanceDataLoading,
  activeTab,
  setActiveTab,
  dailyDate,
  setDailyDate,
  calendarOpen,
  setCalendarOpen,
  isTrackerOpen,
  setIsTrackerOpen,
  subjectCacheStatus,
  setSubjectCacheStatus,
}) => {
  useEffect(() => {
    const fetchSemesters = async () => {
      if (semestersData) {
        if (semestersData.semesters.length > 0 && !selectedSem) {
          setSelectedSem(semestersData.latest_semester);
        }
        return;
      }

      setIsAttendanceMetaLoading(true);
      setIsAttendanceDataLoading(true);
      try {
        const meta = await w.get_attendance_meta();
        const header = meta.latest_header();
        const latestSem = meta.latest_semester();

        setSemestersData({
          semesters: meta.semesters,
          latest_header: header,
          latest_semester: latestSem,
        });

        try {
          const data = await w.get_attendance(header, latestSem);
          setAttendanceData((prev) => ({
            ...prev,
            [latestSem.registration_id]: data,
          }));
          setSelectedSem(latestSem);
        } catch (error) {
          console.log(error.message);
          console.log(error.status);
          if (error.message.includes("NO Attendance Found")) {
            const previousSem = meta.semesters[1];
            if (previousSem) {
              const data = await w.get_attendance(header, previousSem);
              setAttendanceData((prev) => ({
                ...prev,
                [previousSem.registration_id]: data,
              }));
              setSelectedSem(previousSem);
              console.log(previousSem);
            }
          } else {
            throw error;
          }
        }
      } catch (error) {
        console.error("Failed to fetch attendance:", error);
      } finally {
        setIsAttendanceMetaLoading(false);
        setIsAttendanceDataLoading(false);
      }
    };

    fetchSemesters();
  }, [w, setAttendanceData, semestersData, setSemestersData]);

  const handleSemesterChange = async (value) => {
    const semester = semestersData.semesters.find((sem) => sem.registration_id === value);
    setSelectedSem(semester);

    setIsAttendanceDataLoading(true);
    try {
      if (attendanceData[value]) {
        setIsAttendanceDataLoading(false);
        return;
      }

      const meta = await w.get_attendance_meta();
      const header = meta.latest_header();
      const data = await w.get_attendance(header, semester);
      setAttendanceData((prev) => ({
        ...prev,
        [value]: data,
      }));
    } catch (error) {
      if (error.message.includes("NO Attendance Found")) {
        setAttendanceData((prev) => ({
          ...prev,
          [value]: { error: "Attendance not available for this semester" },
        }));
      } else {
        console.error("Failed to fetch attendance:", error);
      }
    } finally {
      setIsAttendanceDataLoading(false);
    }
  };

  const handleGoalChange = (e) => {
    const value = e.target.value === "" ? "" : parseInt(e.target.value);
    if (value === "" || (!isNaN(value) && value > 0 && value <= 100)) {
      setAttendanceGoal(value);
    }
  };

  const subjects =
    (selectedSem &&
      attendanceData[selectedSem.registration_id]?.studentattendancelist?.map((item) => {
        const {
          subjectcode,
          Ltotalclass,
          Ltotalpres,
          Lpercentage,
          Ttotalclass,
          Ttotalpres,
          Tpercentage,
          Ptotalclass,
          Ptotalpres,
          Ppercentage,
          LTpercantage,
        } = item;

        const { attended, total } = {
          attended: (Ltotalpres || 0) + (Ttotalpres || 0) + (Ptotalpres || 0),
          total: (Ltotalclass || 0) + (Ttotalclass || 0) + (Ptotalclass || 0),
        };

        const currentPercentage = (attended / total) * 100;
        const classesNeeded = attendanceGoal
          ? Math.ceil((attendanceGoal * total - 100 * attended) / (100 - attendanceGoal))
          : null;
        const classesCanMiss = attendanceGoal
          ? Math.floor((100 * attended - attendanceGoal * total) / attendanceGoal)
          : null;

        return {
          name: subjectcode,
          attendance: {
            attended,
            total,
          },
          combined: LTpercantage,
          lecture: Lpercentage,
          tutorial: Tpercentage,
          practical: Ppercentage,
          classesNeeded: classesNeeded > 0 ? classesNeeded : 0,
          classesCanMiss: classesCanMiss > 0 ? classesCanMiss : 0,
        };
      })) ||
    [];

  const fetchSubjectAttendance = async (subject) => {
    try {
      const attendance = attendanceData[selectedSem.registration_id];
      const subjectData = attendance.studentattendancelist.find((s) => s.subjectcode === subject.name);

      if (!subjectData) return;

      const subjectcomponentids = ["Lsubjectcomponentid", "Psubjectcomponentid", "Tsubjectcomponentid"]
        .filter((id) => subjectData[id])
        .map((id) => subjectData[id]);

      const data = await w.get_subject_daily_attendance(
        selectedSem,
        subjectData.subjectid,
        subjectData.individualsubjectcode,
        subjectcomponentids
      );

      setSubjectAttendanceData((prev) => ({
        ...prev,
        [subject.name]: data.studentAttdsummarylist,
      }));
    } catch (error) {
      console.error("Failed to fetch subject attendance:", error);
    }
  };

  useEffect(() => {
    if (activeTab !== "daily") return;

    const loadAllSubjects = async () => {
      await Promise.all(
        subjects.map(async (subj) => {
          if (subjectAttendanceData[subj.name]) {
            setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "cached" }));
            return;
          }
          setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "fetching" }));
          await fetchSubjectAttendance(subj);
          setSubjectCacheStatus((p) => ({ ...p, [subj.name]: "cached" }));
        })
      );
    };
    loadAllSubjects();
  }, [activeTab]);

  const getClassesFor = (subjectName, date) => {
    const all = subjectAttendanceData[subjectName];
    if (!all) return [];
    const key = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
    return all.filter((c) => c.datetime.startsWith(key));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-fuchsia-900/20">
      {/* Sticky header with controls */}
      <div className="sticky top-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-20 border-b border-violet-200/50 dark:border-violet-800/50 shadow-lg">
        <div className="flex gap-3 py-4 px-4">
          <div className="relative flex-1 group">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2" strokeLinecap="round"/>
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2" strokeLinecap="round"/>
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2" strokeLinecap="round"/>
            </svg>
            <Select onValueChange={handleSemesterChange} value={selectedSem?.registration_id}>
              <SelectTrigger className="pl-10 bg-white dark:bg-gray-800 border-2 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200 cursor-pointer font-medium shadow-sm">
                <SelectValue placeholder={isAttendanceMetaLoading ? "Loading semesters..." : "Select semester"}>
                  {selectedSem?.registration_code}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-2 border-violet-200 dark:border-violet-800">
                {semestersData?.semesters?.map((sem) => (
                  <SelectItem key={sem.registration_id} value={sem.registration_id} className="cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/30">
                    {sem.registration_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="relative w-32 group">
            <Target className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fuchsia-500 z-10" />
            <Input
              type="number"
              value={attendanceGoal}
              onChange={handleGoalChange}
              min="-1"
              max="100"
              className="pl-10 bg-white dark:bg-gray-800 border-2 border-fuchsia-200 dark:border-fuchsia-800 hover:border-fuchsia-400 dark:hover:border-fuchsia-600 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 transition-all duration-200 font-medium shadow-sm"
              placeholder="Goal %"
            />
          </div>
        </div>
      </div>

      {isAttendanceMetaLoading || isAttendanceDataLoading ? (
        <div className="flex flex-col items-center justify-center py-12 min-h-[60vh]">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin"></div>
            <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-fuchsia-600 dark:border-t-fuchsia-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
          </div>
          <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Loading attendance...</p>
        </div>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="px-4 pb-6">
          <TabsList className="grid grid-cols-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm gap-2 p-1.5 rounded-xl border border-violet-200 dark:border-violet-800 shadow-lg mt-4">
            <TabsTrigger
              value="overview"
              className="cursor-pointer rounded-lg font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-violet-50 dark:hover:bg-violet-900/30"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger
              value="daily"
              className="cursor-pointer rounded-lg font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/30"
            >
              Day-to-Day
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-4">
            {selectedSem && attendanceData[selectedSem.registration_id]?.error ? (
              <div className="flex flex-col items-center justify-center py-12 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-violet-200 dark:border-violet-800 shadow-lg">
                <AlertCircle className="w-12 h-12 text-violet-500 mb-3" />
                <p className="text-gray-600 dark:text-gray-400">{attendanceData[selectedSem.registration_id].error}</p>
              </div>
            ) : (
              subjects.map((subject) => (
                <AttendanceCard
                  key={subject.name}
                  subject={subject}
                  selectedSubject={selectedSubject}
                  setSelectedSubject={setSelectedSubject}
                  subjectAttendanceData={subjectAttendanceData}
                  fetchSubjectAttendance={fetchSubjectAttendance}
                />
              ))
            )}
          </TabsContent>

          <TabsContent value="daily" className="mt-6">
            <div className="flex flex-col items-center">
              <div className="w-full max-w-[340px] flex flex-col bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-fuchsia-200 dark:border-fuchsia-800 shadow-lg p-4 mb-6">
                <button
                  onClick={() => setCalendarOpen((o) => !o)}
                  className="flex items-center justify-between bg-gradient-to-r from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/20 rounded-xl px-4 py-3 mb-3 text-sm cursor-pointer font-semibold text-gray-700 dark:text-gray-300 hover:from-fuchsia-100 hover:to-pink-100 dark:hover:from-fuchsia-900/30 dark:hover:to-pink-900/30 transition-all duration-200 border border-fuchsia-200/50 dark:border-fuchsia-800/50"
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                      <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                      <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                      <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                    </svg>
                    {dailyDate.toDateString()}
                  </span>
                  {calendarOpen ? <ChevronUp className="w-4 h-4 text-fuchsia-600" /> : <ChevronDown className="w-4 h-4 text-fuchsia-600" />}
                </button>
                {calendarOpen && (
                  <Calendar
                    mode="single"
                    selected={dailyDate}
                    onSelect={(d) => {
                      if (d) {
                        setDailyDate(d);
                      }
                    }}
                    modifiers={{
                      hasActivity: (date) => subjects.some((s) => getClassesFor(s.name, date).length > 0),
                    }}
                    modifiersStyles={{
                      hasActivity: {
                        boxShadow: "inset 0 -3px 0 0 #d946ef",
                        borderRadius: "6px",
                      },
                    }}
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4 w-full",
                      caption: "flex justify-center pt-1 relative items-center text-sm font-semibold text-gray-700 dark:text-gray-300",
                      caption_label: "text-sm font-semibold",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-8 w-8 bg-fuchsia-50 dark:bg-fuchsia-900/30 rounded-lg p-0 hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/50 transition-colors",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-gray-600 dark:text-gray-400 rounded-md flex-1 font-semibold text-xs",
                      row: "flex w-full mt-2",
                      cell: "flex-1 text-center text-sm p-0 relative",
                      day: "h-9 w-9 p-0 font-medium rounded-lg hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/30 transition-colors mx-auto",
                      day_selected: "bg-gradient-to-br from-fuchsia-600 to-pink-600 text-white hover:from-fuchsia-700 hover:to-pink-700 shadow-lg",
                      day_today: "bg-fuchsia-100 dark:bg-fuchsia-900/50 text-fuchsia-700 dark:text-fuchsia-300 font-bold ring-2 ring-fuchsia-400",
                      day_outside: "text-gray-400 dark:text-gray-600 opacity-50",
                      day_disabled: "text-gray-300 dark:text-gray-700 opacity-50",
                      day_hidden: "invisible",
                    }}
                  />
                )}
              </div>

              {subjects.length === 0 ? (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-fuchsia-200 dark:border-fuchsia-800 shadow-lg p-8 text-center">
                  <p className="text-gray-500 dark:text-gray-400">No subjects found.</p>
                </div>
              ) : (
                <div className="w-full max-w-2xl space-y-3">
                  {subjects.flatMap((subj) => {
                    const lectures = getClassesFor(subj.name, dailyDate);
                    if (lectures.length === 0) return [];
                    return (
                      <div key={subj.name} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-violet-200 dark:border-violet-800 shadow-lg p-5 hover:shadow-xl transition-shadow duration-200">
                        <h3 className="font-bold text-lg mb-3 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">{subj.name}</h3>
                        <div className="space-y-2">
                          {lectures.map((cls, i) => (
                            <div
                              key={i}
                              className={`flex justify-between items-center text-sm font-medium py-2 px-3 rounded-lg ${
                                cls.present === "Present" 
                                  ? "bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400" 
                                  : "bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400"
                              }`}
                            >
                              <span className="flex items-center gap-2">
                                <span className={`w-2 h-2 rounded-full ${cls.present === "Present" ? "bg-green-500" : "bg-red-500"}`}></span>
                                {cls.classtype} • {cls.present}
                              </span>
                              <span className="text-xs opacity-75">{cls.datetime.split(" ").slice(1).join(" ").slice(1, -1)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {subjects.every((s) => getClassesFor(s.name, dailyDate).length === 0) && subjects.length > 0 && (
                <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border border-violet-200 dark:border-violet-800 shadow-lg p-8 text-center mt-4">
                  <svg className="w-12 h-12 text-gray-400 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                    <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                    <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                    <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                  </svg>
                  <p className="text-gray-500 dark:text-gray-400">
                    No classes were scheduled on {dailyDate.toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            {subjects.length > 0 && Object.values(subjectCacheStatus).some((s) => s !== "cached") && (
              <Sheet open={isTrackerOpen} onOpenChange={setIsTrackerOpen}>
                <SheetTrigger asChild>
                  <button className="fixed bottom-20 right-4 z-50 shadow-2xl rounded-full hover:scale-110 transition-transform cursor-pointer">
                    <CircleProgress
                      percentage={(100 * subjects.filter((s) => subjectCacheStatus[s.name] === "cached").length) / subjects.length}
                      label={`${subjects.filter((s) => subjectCacheStatus[s.name] === "cached").length}/${subjects.length}`}
                    />
                  </button>
                </SheetTrigger>

                <SheetContent side="bottom" className="h-[50vh] bg-gradient-to-br from-violet-900 to-fuchsia-900 text-white border-0 overflow-hidden">
                  <SheetHeader>
                    <SheetTitle className="text-sm text-white font-semibold">
                      Fetching daily attendance ({subjects.filter((s) => subjectCacheStatus[s.name] === "cached").length}/{subjects.length})
                    </SheetTitle>
                  </SheetHeader>

                  <div className="mt-6 space-y-6 px-1 overflow-y-auto h-[calc(100%-3rem)]">
                    <Progress value={(100 * subjects.filter((s) => subjectCacheStatus[s.name] === "cached").length) / subjects.length} className="h-3 bg-white/20" />

                    <div className="space-y-3 overflow-y-auto pr-2">
                      {subjects.map((s) => {
                        const st = subjectCacheStatus[s.name] || "idle";
                        return (
                          <div key={s.name} className="py-4 px-4 flex items-center justify-between bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/20 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold truncate">{s.name}</p>
                            </div>
                            {st === "cached" && <Check className="text-green-400 w-6 h-6" />}
                            {st === "fetching" && <Loader2 className="animate-spin text-yellow-400 w-6 h-6" />}
                            {st === "idle" && <AlertCircle className="text-blue-400 w-6 h-6" />}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </SheetContent>
              </Sheet>
            )}
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
};

export default Attendance;