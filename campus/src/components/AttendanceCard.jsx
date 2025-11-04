import React, { useState } from "react";
import CircleProgress from "./CircleProgress";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Calendar } from "@/components/ui/calendar";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

const AttendanceCard = ({
  subject,
  selectedSubject,
  setSelectedSubject,
  subjectAttendanceData,
  fetchSubjectAttendance,
}) => {
  const { name, attendance, combined, lecture, tutorial, practical, classesNeeded, classesCanMiss } = subject;
  console.log(name, attendance, combined, lecture, tutorial, practical);
  const attendancePercentage = attendance.total > 0 ? combined.toFixed(0) : "100";
  const displayName = name.replace(/\s*\([^)]*\)\s*$/, "");

  const [isLoading, setIsLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [activeView, setActiveView] = useState("calendar");

  const handleClick = async () => {
    setSelectedSubject(subject);
    if (!subjectAttendanceData[subject.name]) {
      setIsLoading(true);
      await fetchSubjectAttendance(subject);
      setIsLoading(false);
    }
  };

  const getDayStatus = (date) => {
    if (!subjectAttendanceData[subject.name]) return null;

    const dateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const attendances = subjectAttendanceData[subject.name].filter((a) => a.datetime.startsWith(dateStr));

    if (attendances.length === 0) return null;
    return attendances.map((a) => a.present === "Present");
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString();
  };

  const getClassesForDate = (dateStr) => {
    if (!subjectAttendanceData[subject.name] || !dateStr) return [];

    const date = new Date(dateStr);
    const formattedDateStr = date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    return subjectAttendanceData[subject.name].filter((a) => a.datetime.startsWith(formattedDateStr));
  };

  const processAttendanceData = () => {
    if (!subjectAttendanceData[subject.name]) return [];

    const data = subjectAttendanceData[subject.name];

    const sortedData = [...data].sort((a, b) => {
      const [aDay, aMonth, aYear] = a.datetime.split(" ")[0].split("/");
      const [bDay, bMonth, bYear] = b.datetime.split(" ")[0].split("/");
      return new Date(aYear, aMonth - 1, aDay) - new Date(bYear, bMonth - 1, bDay);
    });

    let cumulativePresent = 0;
    let cumulativeTotal = 0;
    const attendanceByDate = {};

    sortedData.forEach((entry) => {
      const [date] = entry.datetime.split(" ");
      cumulativeTotal++;
      if (entry.present === "Present") {
        cumulativePresent++;
      }

      attendanceByDate[date] = {
        date,
        percentage: (cumulativePresent / cumulativeTotal) * 100,
      };
    });

    return Object.values(attendanceByDate);
  };

  return (
    <>
      <div
        className="group bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 shadow-lg hover:shadow-xl transition-all duration-200 p-5 cursor-pointer hover:scale-[1.02] mb-4"
        onClick={handleClick}
      >
        <div className="flex justify-between items-start">
          <div className="flex-1 mr-4">
            <h2 className="text-lg font-bold mb-3 text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
              {displayName}
            </h2>
            <div className="space-y-1.5">
              {lecture !== "" && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">Lecture:</span>
                  <span className="font-semibold text-violet-600 dark:text-violet-400">{lecture}%</span>
                </div>
              )}
              {tutorial !== "" && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">Tutorial:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">{tutorial}%</span>
                </div>
              )}
              {practical !== "" && (
                <div className="flex items-center gap-2 text-sm">
                  <div className="w-2 h-2 rounded-full bg-fuchsia-500"></div>
                  <span className="text-gray-700 dark:text-gray-300">Practical:</span>
                  <span className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">{practical}%</span>
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-center bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl px-4 py-2 border border-violet-200 dark:border-violet-800">
              <div className="text-lg font-bold text-violet-600 dark:text-violet-400">{attendance.attended}</div>
              <div className="h-0.5 w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 my-1"></div>
              <div className="text-lg font-bold text-gray-700 dark:text-gray-300">{attendance.total}</div>
            </div>
            <div className="flex flex-col items-center">
              <CircleProgress key={Date.now()} percentage={attendancePercentage} />
              {classesNeeded > 0 ? (
                <div className="text-xs mt-2 px-2 py-1 bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full font-medium">
                  Attend {classesNeeded}
                </div>
              ) : (
                classesCanMiss > 0 && (
                  <div className="text-xs mt-2 px-2 py-1 bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-full font-medium">
                    Can miss {classesCanMiss}
                  </div>
                )
              )}
            </div>
          </div>
        </div>
      </div>

      <Sheet
        open={selectedSubject?.name === subject.name}
        onOpenChange={() => {
          setSelectedSubject(null);
          setSelectedDate(null);
          setActiveView("calendar");
        }}
      >
        <SheetContent side="bottom" className="h-[75vh] bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-gray-900 dark:to-purple-900/30 border-0 overflow-hidden">
          <SheetHeader className="mb-4">
            <SheetTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
              {displayName}
            </SheetTitle>
          </SheetHeader>

          {/* View Toggle */}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setActiveView("calendar")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                activeView === "calendar"
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg"
                  : "bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
              }`}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
              </svg>
              Calendar
            </button>
            <button
              onClick={() => setActiveView("chart")}
              className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-semibold transition-all duration-200 ${
                activeView === "chart"
                  ? "bg-gradient-to-r from-fuchsia-600 to-pink-600 text-white shadow-lg"
                  : "bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800"
              }`}
            >
              <BarChart3 className="w-4 h-4" />
              Trend
            </button>
          </div>

          <div className="h-[calc(100%-120px)] overflow-y-auto">
            {activeView === "calendar" ? (
              <div className="flex flex-col items-center py-4">
                <div className="w-full max-w-[340px] flex flex-col bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-violet-200 dark:border-violet-800 shadow-xl p-4">
                  <Calendar
                    mode="single"
                    modifiers={{
                      presentSingle: (date) => {
                        const statuses = getDayStatus(date);
                        return statuses?.length === 1 && statuses[0] === true;
                      },
                      absentSingle: (date) => {
                        const statuses = getDayStatus(date);
                        return statuses?.length === 1 && statuses[0] === false;
                      },
                      presentDouble: (date) => {
                        const statuses = getDayStatus(date);
                        return statuses?.length === 2 && statuses.every((s) => s === true);
                      },
                      absentDouble: (date) => {
                        const statuses = getDayStatus(date);
                        return statuses?.length === 2 && statuses.every((s) => s === false);
                      },
                      mixedDouble: (date) => {
                        const statuses = getDayStatus(date);
                        return statuses?.length === 2 && statuses[0] !== statuses[1];
                      },
                      presentTriple: (date) => {
                        const statuses = getDayStatus(date);
                        return statuses?.length === 3 && statuses.every((s) => s === true);
                      },
                      absentTriple: (date) => {
                        const statuses = getDayStatus(date);
                        return statuses?.length === 3 && statuses.every((s) => s === false);
                      },
                      mixedTripleAllPresent: (date) => {
                        const statuses = getDayStatus(date);
                        return statuses?.length === 3 && statuses.filter((s) => s === true).length === 2;
                      },
                      mixedTripleAllAbsent: (date) => {
                        const statuses = getDayStatus(date);
                        return statuses?.length === 3 && statuses.filter((s) => s === false).length === 2;
                      },
                      selected: (date) => date === selectedDate,
                    }}
                    modifiersStyles={{
                      presentSingle: {
                        backgroundColor: "#10b981",
                        color: "white",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontWeight: "600",
                      },
                      absentSingle: {
                        backgroundColor: "#ef4444",
                        color: "white",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontWeight: "600",
                      },
                      presentDouble: {
                        backgroundColor: "#10b981",
                        color: "white",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontWeight: "600",
                      },
                      absentDouble: {
                        backgroundColor: "#ef4444",
                        color: "white",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontWeight: "600",
                      },
                      mixedDouble: {
                        background: "linear-gradient(90deg, #10b981 50%, #ef4444 50%)",
                        color: "white",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontWeight: "600",
                      },
                      presentTriple: {
                        backgroundColor: "#10b981",
                        color: "white",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontWeight: "600",
                      },
                      absentTriple: {
                        backgroundColor: "#ef4444",
                        color: "white",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontWeight: "600",
                      },
                      mixedTripleAllPresent: {
                        background: "conic-gradient(#10b981 0deg 240deg, #ef4444 240deg 360deg)",
                        color: "white",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontWeight: "600",
                      },
                      mixedTripleAllAbsent: {
                        background: "conic-gradient(#ef4444 0deg 240deg, #10b981 240deg 360deg)",
                        color: "white",
                        borderRadius: "50%",
                        cursor: "pointer",
                        fontWeight: "600",
                      },
                    }}
                    selected={selectedDate}
                    onSelect={(date) => setSelectedDate(date)}
                    className={`pb-2 ${isLoading ? "animate-pulse" : ""} w-full shrink-0 max-w-full`}
                    classNames={{
                      months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
                      month: "space-y-4 w-full",
                      caption: "flex justify-center pt-1 relative items-center text-sm font-bold text-gray-700 dark:text-gray-300",
                      caption_label: "text-sm font-bold",
                      nav: "space-x-1 flex items-center",
                      nav_button: "h-8 w-8 bg-violet-100 dark:bg-violet-900/50 rounded-lg p-0 hover:bg-violet-200 dark:hover:bg-violet-900/70 transition-colors",
                      nav_button_previous: "absolute left-1",
                      nav_button_next: "absolute right-1",
                      table: "w-full border-collapse space-y-1",
                      head_row: "flex",
                      head_cell: "text-gray-600 dark:text-gray-400 rounded-md flex-1 font-semibold text-xs",
                      row: "flex w-full mt-2",
                      cell: "flex-1 text-center text-sm p-0 relative",
                      day: "h-9 w-9 p-0 font-medium rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors mx-auto",
                      day_selected: "bg-gradient-to-br from-violet-600 to-fuchsia-600 text-white hover:from-violet-700 hover:to-fuchsia-700 shadow-lg ring-2 ring-violet-400",
                      day_today: "bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 font-bold ring-2 ring-violet-400",
                      day_outside: "text-gray-400 dark:text-gray-600 opacity-50",
                      day_disabled: "text-gray-300 dark:text-gray-700 opacity-50",
                      day_hidden: "invisible",
                    }}
                  />

                  {selectedDate && (
                    <div className="mt-4 space-y-3 w-full">
                      {getClassesForDate(selectedDate).map((classData, index) => (
                        <div
                          key={index}
                          className={`p-4 rounded-xl border-2 ${
                            classData.present === "Present"
                              ? "bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-800"
                              : "bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-800"
                          }`}
                        >
                          <div className="flex items-start justify-between mb-2">
                            <p className="font-semibold text-gray-900 dark:text-gray-100">{classData.attendanceby}</p>
                            <span
                              className={`px-2 py-1 rounded-full text-xs font-bold ${
                                classData.present === "Present"
                                  ? "bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200"
                                  : "bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200"
                              }`}
                            >
                              {classData.present}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-1">{classData.classtype}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{classData.datetime}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-4">
                <div className="w-full bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-fuchsia-200 dark:border-fuchsia-800 shadow-xl p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-fuchsia-600" />
                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-600 to-pink-600">
                      Attendance Trend
                    </h3>
                  </div>
                  <div className="w-full h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart
                        data={processAttendanceData()}
                        margin={{
                          top: 10,
                          right: 10,
                          left: -20,
                          bottom: 0,
                        }}
                      >
                        <defs>
                          <linearGradient id="colorGradient" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#8b5cf6" />
                            <stop offset="100%" stopColor="#ec4899" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                        <XAxis
                          dataKey="date"
                          stroke="#9ca3af"
                          tick={{ fill: "#6b7280", fontSize: "0.75rem", dy: 10 }}
                          tickFormatter={(value) => {
                            const [day, month] = value.split("/");
                            return `${day}/${month}`;
                          }}
                        />
                        <YAxis
                          stroke="#9ca3af"
                          tick={{ fill: "#6b7280", fontSize: "0.75rem" }}
                          domain={[0, 100]}
                          tickFormatter={(value) => `${value}%`}
                          width={65}
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "2px solid #a855f7",
                            borderRadius: "12px",
                            color: "#1f2937",
                            padding: "12px",
                            boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                          }}
                          formatter={(value) => [`${value.toFixed(1)}%`, "Attendance"]}
                          labelStyle={{ fontWeight: "bold", color: "#8b5cf6" }}
                        />
                        <Line
                          type="monotone"
                          dataKey="percentage"
                          stroke="url(#colorGradient)"
                          strokeWidth={3}
                          dot={{ fill: "#8b5cf6", r: 5, strokeWidth: 2, stroke: "#fff" }}
                          activeDot={{ r: 7, strokeWidth: 3 }}
                          name="Attendance"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default AttendanceCard;