import React, { useState, useEffect } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import GradeCard from "./GradeCard";
import { Button } from "@/components/ui/button";
import { Download, TrendingUp, Award, FileText } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import MarksCard from "./MarksCard";
import { generate_local_name, API } from "https://cdn.jsdelivr.net/npm/jsjiit@0.0.16/dist/jsjiit.esm.js";
import MockWebPortal from "./MockWebPortal";

export default function Grades({
  w,
  gradesData,
  setGradesData,
  semesterData,
  setSemesterData,
  activeTab,
  setActiveTab,
  gradeCardSemesters,
  setGradeCardSemesters,
  selectedGradeCardSem,
  setSelectedGradeCardSem,
  gradeCard,
  setGradeCard,
  gradeCards,
  setGradeCards,
  marksSemesters,
  setMarksSemesters,
  selectedMarksSem,
  setSelectedMarksSem,
  marksData,
  setMarksData,
  marksSemesterData,
  setMarksSemesterData,
  gradesLoading,
  setGradesLoading,
  gradesError,
  setGradesError,
  gradeCardLoading,
  setGradeCardLoading,
  isDownloadDialogOpen,
  setIsDownloadDialogOpen,
  marksLoading,
  setMarksLoading,
}) {
  useEffect(() => {
    const fetchData = async () => {
      try {
        if (semesterData) {
          setGradesLoading(false);
          return;
        }

        const data = await w.get_sgpa_cgpa();

        if (!data || Object.keys(data).length === 0) {
          setGradesError("Grade sheet is not available");
          return;
        }

        setGradesData(data);
        setSemesterData(data.semesterList);
      } catch (err) {
        if (err.message.includes("Unexpected end of JSON input")) {
          setGradesError("Grade sheet is not available");
        } else {
          setGradesError("Failed to fetch grade data");
        }
        console.error(err);
      } finally {
        setGradesLoading(false);
      }
    };
    fetchData();
  }, [w, semesterData, setGradesData, setSemesterData]);

  useEffect(() => {
    const fetchGradeCardSemesters = async () => {
      if (gradeCardSemesters.length === 0) {
        try {
          const semesters = await w.get_semesters_for_grade_card();
          setGradeCardSemesters(semesters);

          if (semesters.length > 0 && !selectedGradeCardSem) {
            const latestSemester = semesters[0];
            setSelectedGradeCardSem(latestSemester);
            const data = await w.get_grade_card(latestSemester);
            data.semesterId = latestSemester.registration_id;
            setGradeCard(data);
            setGradeCards((prev) => ({
              ...prev,
              [latestSemester.registration_id]: data,
            }));
          }
        } catch (err) {
          console.error("Failed to fetch grade card semesters:", err);
        }
      }
    };
    fetchGradeCardSemesters();
  }, [w, gradeCardSemesters.length, setGradeCardSemesters, selectedGradeCardSem]);

  useEffect(() => {
    const fetchMarksSemesters = async () => {
      if (marksSemesters.length === 0) {
        try {
          const sems = await w.get_semesters_for_marks();
          setMarksSemesters(sems);
        } catch (err) {
          console.error("Failed to fetch marks semesters:", err);
        }
      }
    };
    fetchMarksSemesters();
  }, [w, marksSemesters.length]);

  useEffect(() => {
    let mounted = true;

    const processPdfMarks = async () => {
      if (!selectedMarksSem || marksData[selectedMarksSem.registration_id]) {
        return;
      }

      setMarksLoading(true);
      try {
        if (w instanceof MockWebPortal) {
          const result = await w.download_marks(selectedMarksSem);

          if (mounted) {
            setMarksSemesterData(result);
            setMarksData((prev) => ({
              ...prev,
              [selectedMarksSem.registration_id]: result,
            }));
          }
        } else {
          const ENDPOINT = `/studentsexamview/printstudent-exammarks/${w.session.instituteid}/${selectedMarksSem.registration_id}/${selectedMarksSem.registration_code}`;
          const localname = await generate_local_name();
          const headers = await w.session.get_headers(localname);

          const pyodide = await loadPyodide();

          pyodide.globals.set("ENDPOINT", ENDPOINT);
          pyodide.globals.set("fetchOptions", { method: "GET", headers });
          pyodide.globals.set("API", API);

          const res = await pyodide.runPythonAsync(`
            import pyodide_js
            import asyncio
            import pyodide.http

            marks = {}

            async def process_pdf():
                global marks
                await pyodide_js.loadPackage("/jportal/artifact/PyMuPDF-1.24.12-cp311-abi3-emscripten_3_1_32_wasm32.whl")
                await pyodide_js.loadPackage("/jportal/artifact/jiit_marks-0.2.0-py3-none-any.whl")

                import pymupdf
                from jiit_marks import parse_report

                r = await pyodide.http.pyfetch(API+ENDPOINT, **(fetchOptions.to_py()))
                data = await r.bytes()

                doc = pymupdf.Document(stream=data)
                marks = parse_report(doc)
                return marks

            await process_pdf()
          `);

          if (mounted) {
            const result = res.toJs({
              dict_converter: Object.fromEntries,
              create_pyproxies: false,
            });

            setMarksSemesterData(result);
            setMarksData((prev) => ({
              ...prev,
              [selectedMarksSem.registration_id]: result,
            }));
          }
        }
      } catch (error) {
        console.error("Failed to load marks:", error);
      } finally {
        if (mounted) {
          setMarksLoading(false);
        }
      }
    };

    if (selectedMarksSem) {
      processPdfMarks();
    }

    return () => {
      mounted = false;
    };
  }, [selectedMarksSem, w.session, marksData]);

  const handleSemesterChange = async (value) => {
    setGradeCardLoading(true);
    try {
      const semester = gradeCardSemesters.find((sem) => sem.registration_id === value);
      setSelectedGradeCardSem(semester);

      if (gradeCards[value]) {
        setGradeCard(gradeCards[value]);
      } else {
        const data = await w.get_grade_card(semester);
        data.semesterId = value;
        setGradeCard(data);
        setGradeCards((prev) => ({
          ...prev,
          [value]: data,
        }));
      }
    } catch (error) {
      console.error("Failed to fetch grade card:", error);
    } finally {
      setGradeCardLoading(false);
    }
  };

  const getGradeColor = (grade) => {
    const gradeColors = {
      "A+": "text-grade-aa",
      A: "text-grade-a",
      "B+": "text-grade-bb",
      B: "text-grade-b",
      "C+": "text-grade-cc",
      C: "text-grade-c",
      D: "text-grade-d",
      F: "text-grade-f",
    };
    return gradeColors[grade] || "text-foreground";
  };

  const handleDownloadMarks = async (semester) => {
    try {
      await w.download_marks(semester);
      setIsDownloadDialogOpen(false);
    } catch (err) {
      console.error("Failed to download marks:", err);
    }
  };

  const handleMarksSemesterChange = async (value) => {
    try {
      const semester = marksSemesters.find((sem) => sem.registration_id === value);
      setSelectedMarksSem(semester);

      if (marksData[value]) {
        setMarksSemesterData(marksData[value]);
      }
    } catch (error) {
      console.error("Failed to change marks semester:", error);
    }
  };

  if (gradesLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-fuchsia-900/20 flex flex-col items-center justify-center py-12">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-fuchsia-600 dark:border-t-fuchsia-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
        </div>
        <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Loading grades...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-fuchsia-900/20 pt-4 pb-8 px-4">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-6xl mx-auto">
        <TabsList className="grid w-full grid-cols-3 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm gap-2 p-1.5 rounded-xl border border-violet-200 dark:border-violet-800 shadow-lg mb-6">
          <TabsTrigger
            value="overview"
            className="cursor-pointer rounded-lg font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-violet-600 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-violet-50 dark:hover:bg-violet-900/30"
          >
            <TrendingUp className="w-4 h-4 mr-2" />
            Overview
          </TabsTrigger>
          <TabsTrigger
            value="semester"
            className="cursor-pointer rounded-lg font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-fuchsia-600 data-[state=active]:to-pink-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/30"
          >
            <Award className="w-4 h-4 mr-2" />
            Semester
          </TabsTrigger>
          <TabsTrigger
            value="marks"
            className="cursor-pointer rounded-lg font-semibold transition-all duration-200 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-violet-600 data-[state=active]:text-white data-[state=active]:shadow-lg hover:bg-purple-50 dark:hover:bg-purple-900/30"
          >
            <FileText className="w-4 h-4 mr-2" />
            Marks
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-0">
          <div className="flex flex-col items-center">
            {gradesError ? (
              <div className="w-full max-w-4xl bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-violet-200 dark:border-violet-800 shadow-xl p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-violet-600 dark:text-violet-400" />
                </div>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">{gradesError}</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Please check back later</p>
              </div>
            ) : (
              <>
                <div className="mb-6 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-violet-200 dark:border-violet-800 shadow-xl p-6 w-full max-w-4xl">
                  <div className="flex items-center gap-2 mb-4">
                    <TrendingUp className="w-5 h-5 text-violet-600" />
                    <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
                      Academic Performance Trend
                    </h3>
                  </div>
                  <ResponsiveContainer width="100%" height={280}>
                    <LineChart
                      data={semesterData}
                      margin={{
                        top: 10,
                        right: 10,
                        left: -10,
                        bottom: 25,
                      }}
                    >
                      <defs>
                        <linearGradient id="sgpaGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#8b5cf6" />
                          <stop offset="100%" stopColor="#d946ef" />
                        </linearGradient>
                        <linearGradient id="cgpaGradient" x1="0" y1="0" x2="1" y2="0">
                          <stop offset="0%" stopColor="#06b6d4" />
                          <stop offset="100%" stopColor="#3b82f6" />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" opacity={0.3} />
                      <XAxis
                        dataKey="stynumber"
                        stroke="#9ca3af"
                        label={{ value: "Semester", position: "insideBottom", offset: -15, fill: "#6b7280", fontWeight: "600" }}
                        tick={{ fill: "#6b7280" }}
                        tickFormatter={(value) => `${value}`}
                      />
                      <YAxis
                        stroke="#9ca3af"
                        domain={["dataMin", "dataMax"]}
                        tickCount={5}
                        padding={{ top: 20, bottom: 20 }}
                        tick={{ fill: "#6b7280" }}
                        tickFormatter={(value) => value.toFixed(1)}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "2px solid #a855f7",
                          borderRadius: "12px",
                          padding: "12px",
                          boxShadow: "0 10px 25px rgba(0, 0, 0, 0.1)",
                        }}
                        labelStyle={{ fontWeight: "bold", color: "#8b5cf6" }}
                      />
                      <Legend
                        verticalAlign="top"
                        height={40}
                        wrapperStyle={{ paddingBottom: "10px" }}
                        iconType="circle"
                      />
                      <Line
                        type="monotone"
                        dataKey="sgpa"
                        stroke="url(#sgpaGradient)"
                        name="SGPA"
                        strokeWidth={3}
                        dot={{ fill: "#8b5cf6", r: 5, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 7, strokeWidth: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="cgpa"
                        stroke="url(#cgpaGradient)"
                        name="CGPA"
                        strokeWidth={3}
                        dot={{ fill: "#06b6d4", r: 5, strokeWidth: 2, stroke: "#fff" }}
                        activeDot={{ r: 7, strokeWidth: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>

                <div className="space-y-3 w-full max-w-4xl">
                  {semesterData.map((sem) => (
                    <div key={sem.stynumber} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 shadow-lg hover:shadow-xl transition-all duration-200 p-5">
                      <div className="flex justify-between items-center">
                        <div className="flex-1">
                          <h2 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
                            Semester {sem.stynumber}
                          </h2>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            Grade Points: <span className="font-semibold text-gray-700 dark:text-gray-300">{sem.earnedgradepoints.toFixed(1)}</span> / {sem.totalcoursecredit * 10}
                          </p>
                        </div>
                        <div className="flex items-center gap-6">
                          <div className="text-center bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/30 dark:to-purple-900/30 rounded-xl px-5 py-3 border border-violet-200 dark:border-violet-800">
                            <div className="text-2xl font-bold text-violet-600 dark:text-violet-400">{sem.sgpa}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">SGPA</div>
                          </div>
                          <div className="text-center bg-gradient-to-br from-cyan-50 to-blue-50 dark:from-cyan-900/30 dark:to-blue-900/30 rounded-xl px-5 py-3 border border-cyan-200 dark:border-cyan-800">
                            <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{sem.cgpa}</div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 font-medium">CGPA</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            <div className="w-full flex justify-end mt-6 max-w-4xl">
              <Button
                className="flex items-center gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 cursor-pointer"
                onClick={() => setIsDownloadDialogOpen(true)}
              >
                <Download className="h-4 w-4" />
                Download Marks
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="semester" className="mt-0">
          <div className="w-full max-w-4xl mx-auto">
            {gradeCardSemesters.length === 0 ? (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-fuchsia-200 dark:border-fuchsia-800 shadow-xl p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-fuchsia-100 to-pink-100 dark:from-fuchsia-900/30 dark:to-pink-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Award className="w-8 h-8 text-fuchsia-600 dark:text-fuchsia-400" />
                </div>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Grade card is not available yet</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Please check back later</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <Select onValueChange={handleSemesterChange} value={selectedGradeCardSem?.registration_id}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-2 border-fuchsia-200 dark:border-fuchsia-800 hover:border-fuchsia-400 dark:hover:border-fuchsia-600 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 transition-all duration-200 cursor-pointer font-medium shadow-sm h-12">
                      <SelectValue placeholder={gradeCardLoading ? "Loading semesters..." : "Select semester"}>
                        {selectedGradeCardSem?.registration_code}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-2 border-fuchsia-200 dark:border-fuchsia-800">
                      {gradeCardSemesters.map((sem) => (
                        <SelectItem key={sem.registration_id} value={sem.registration_id} className="cursor-pointer hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/30">
                          {sem.registration_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {gradeCardLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-fuchsia-200 dark:border-fuchsia-800 border-t-fuchsia-600 dark:border-t-fuchsia-400 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading subjects...</p>
                  </div>
                ) : gradeCard ? (
                  <div className="space-y-3">
                    {gradeCard.gradecard.map((subject) => (
                      <GradeCard key={subject.subjectcode} subject={subject} getGradeColor={getGradeColor} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-fuchsia-200 dark:border-fuchsia-800 shadow-xl p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">No grade card data available for this semester</p>
                  </div>
                )}
              </>
            )}
            <div className="w-full flex justify-end mt-6">
              <Button
                className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-600 to-pink-600 hover:from-fuchsia-700 hover:to-pink-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 cursor-pointer"
                onClick={() => setIsDownloadDialogOpen(true)}
              >
                <Download className="h-4 w-4" />
                Download Marks
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="marks" className="mt-0">
          <div className="w-full max-w-4xl mx-auto">
            {marksSemesters.length === 0 ? (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-xl p-12 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-100 to-violet-100 dark:from-purple-900/30 dark:to-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-8 h-8 text-purple-600 dark:text-purple-400" />
                </div>
                <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Marks data is not available yet</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2">Please check back later</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <Select onValueChange={handleMarksSemesterChange} value={selectedMarksSem?.registration_id}>
                    <SelectTrigger className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-800 hover:border-purple-400 dark:hover:border-purple-600 focus:border-purple-500 focus:ring-2 focus:ring-purple-200 transition-all duration-200 cursor-pointer font-medium shadow-sm h-12">
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent className="bg-white dark:bg-gray-800 border-2 border-purple-200 dark:border-purple-800">
                      {marksSemesters.map((sem) => (
                        <SelectItem key={sem.registration_id} value={sem.registration_id} className="cursor-pointer hover:bg-purple-50 dark:hover:bg-purple-900/30">
                          {sem.registration_code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {marksLoading ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="relative">
                      <div className="w-12 h-12 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin"></div>
                    </div>
                    <p className="mt-4 text-gray-600 dark:text-gray-400">Loading marks data...</p>
                  </div>
                ) : marksSemesterData && marksSemesterData.courses ? (
                  <div className="space-y-4">
                    {marksSemesterData.courses.map((course) => (
                      <MarksCard key={course.code} course={course} />
                    ))}
                  </div>
                ) : (
                  <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-purple-200 dark:border-purple-800 shadow-xl p-8 text-center">
                    <p className="text-gray-600 dark:text-gray-400">Select a semester to view marks</p>
                  </div>
                )}
              </>
            )}
            <div className="w-full flex justify-end mt-6">
              <Button
                className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 px-6 py-2 cursor-pointer"
                onClick={() => setIsDownloadDialogOpen(true)}
              >
                <Download className="h-4 w-4" />
                Download Marks
              </Button>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={isDownloadDialogOpen} onOpenChange={setIsDownloadDialogOpen}>
        <DialogContent className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-sm border-2 border-violet-200 dark:border-violet-800 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
              Download Marks
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
            {marksSemesters.map((sem) => (
              <Button
                key={sem.registration_id}
                variant="outline"
                className="w-full bg-white dark:bg-gray-800 border-2 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 text-gray-700 dark:text-gray-300 font-semibold transition-all duration-200 h-12 cursor-pointer"
                onClick={() => handleDownloadMarks(sem)}
              >
                <Download className="w-4 h-4 mr-2" />
                {sem.registration_code}
              </Button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}