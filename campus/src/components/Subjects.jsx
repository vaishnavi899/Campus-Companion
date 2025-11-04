import React, { useState, useEffect } from "react";
import SubjectInfoCard from "./SubjectInfoCard";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { BookOpen, Award } from "lucide-react";

export default function Subjects({ w, subjectData, setSubjectData, semestersData, setSemestersData, selectedSem, setSelectedSem }) {
  const [loading, setLoading] = useState(!semestersData);
  const [subjectsLoading, setSubjectsLoading] = useState(!subjectData);

  useEffect(() => {
    const fetchSemesters = async () => {
      if (semestersData) {
        if (semestersData.semesters.length > 0 && !selectedSem) {
          setSelectedSem(semestersData.latest_semester);

          if (!subjectData?.[semestersData.latest_semester.registration_id]) {
            const data = await w.get_registered_subjects_and_faculties(semestersData.latest_semester);
            setSubjectData(prev => ({
              ...prev,
              [semestersData.latest_semester.registration_id]: data
            }));
          }
        }
        return;
      }

      setLoading(true);
      setSubjectsLoading(true);
      try {
        const registeredSems = await w.get_registered_semesters();
        const latestSem = registeredSems[0];

        setSemestersData({
          semesters: registeredSems,
          latest_semester: latestSem
        });

        setSelectedSem(latestSem);

        if (!subjectData?.[latestSem.registration_id]) {
          const data = await w.get_registered_subjects_and_faculties(latestSem);
          setSubjectData(prev => ({
            ...prev,
            [latestSem.registration_id]: data
          }));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
        setSubjectsLoading(false);
      }
    };

    fetchSemesters();
  }, [w, setSubjectData, semestersData, setSemestersData]);

  const handleSemesterChange = async (value) => {
    setSubjectsLoading(true);
    try {
      const semester = semestersData?.semesters?.find(sem => sem.registration_id === value);
      setSelectedSem(semester);

      if (subjectData?.[semester.registration_id]) {
        setSubjectsLoading(false);
        return;
      }

      const data = await w.get_registered_subjects_and_faculties(semester);
      setSubjectData(prev => ({
        ...prev,
        [semester.registration_id]: data
      }));
    } catch (err) {
      console.error(err);
    } finally {
      setSubjectsLoading(false);
    }
  };

  const currentSubjects = selectedSem && subjectData?.[selectedSem.registration_id];
  const groupedSubjects = currentSubjects?.subjects?.reduce((acc, subject) => {
    const baseCode = subject.subject_code;
    if (!acc[baseCode]) {
      acc[baseCode] = {
        name: subject.subject_desc,
        code: baseCode,
        credits: subject.credits,
        components: [],
        isAudit: subject.audtsubject === "Y"
      };
    }
    acc[baseCode].components.push({
      type: subject.subject_component_code,
      teacher: subject.employee_name
    });
    return acc;
  }, {}) || {};

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-fuchsia-900/20">
      <div className="sticky top-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-20 border-b border-violet-200/50 dark:border-violet-800/50 shadow-lg">
        <div className="py-4 px-4">
          <div className="relative">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
            </svg>
            <Select onValueChange={handleSemesterChange} value={selectedSem?.registration_id} disabled={loading}>
              <SelectTrigger className="pl-10 bg-white dark:bg-gray-800 border-2 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200 cursor-pointer font-medium shadow-sm h-12">
                <SelectValue placeholder={loading ? "Loading semesters..." : "Select semester"}>
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
        </div>
      </div>

      <div className="px-4 py-6 max-w-6xl mx-auto">
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-2xl border-2 border-violet-200 dark:border-violet-800 shadow-xl p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-xl flex items-center justify-center shadow-lg">
              <Award className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total Credits Enrolled</p>
              <p className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
                {currentSubjects?.total_credits || 0}
              </p>
            </div>
          </div>
        </div>

        {subjectsLoading ? (
          <div className="flex flex-col items-center justify-center py-12 min-h-[50vh]">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-fuchsia-600 dark:border-t-fuchsia-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
            </div>
            <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Loading subjects...</p>
          </div>
        ) : Object.keys(groupedSubjects).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-violet-200 dark:border-violet-800 shadow-xl p-12 text-center max-w-2xl">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">No subjects found</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">There are no registered subjects for this semester</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.values(groupedSubjects).map((subject) => (
              <SubjectInfoCard key={subject.code} subject={subject} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}