import { useEffect, useState } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Calendar as CalendarIcon, MapPin, Clock, BookOpen, AlertCircle } from "lucide-react"

export default function Exams({
  w,
  examSchedule,
  setExamSchedule,
  examSemesters,
  setExamSemesters,
  selectedExamSem,
  setSelectedExamSem,
  selectedExamEvent,
  setSelectedExamEvent
}) {
  const [examEvents, setExamEvents] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchSemesters = async () => {
      if (examSemesters.length === 0) {
        const examSems = await w.get_semesters_for_exam_events()
        setExamSemesters(examSems)
      }
    }
    fetchSemesters()
  }, [])

  const handleSemesterChange = async (value) => {
    setLoading(true)
    try {
      const semester = examSemesters.find(sem => sem.registration_id === value)
      setSelectedExamSem(semester)
      const events = await w.get_exam_events(semester)
      setExamEvents(events)
      setSelectedExamEvent(null)
      setExamSchedule({})
    } finally {
      setLoading(false)
    }
  }

  const handleEventChange = async (value) => {
    setLoading(true)
    try {
      const event = examEvents.find(evt => (evt.exameventid || evt.exam_event_id) === value)
      setSelectedExamEvent(event)

      if (!examSchedule[value]) {
        const response = await w.get_exam_schedule(event)
        setExamSchedule(prev => ({
          ...prev,
          [value]: response.subjectinfo
        }))
      }
    } finally {
      setLoading(false)
    }
  }

  const currentSchedule = selectedExamEvent && examSchedule[selectedExamEvent.exameventid || selectedExamEvent.exam_event_id]

  const formatDate = (dateStr) => {
    const [day, month, year] = dateStr.split('/')
    return new Date(`${month}/${day}/${year}`).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-fuchsia-50 dark:from-gray-900 dark:via-purple-900/20 dark:to-fuchsia-900/20">
      <div className="sticky top-14 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl z-20 border-b border-violet-200/50 dark:border-violet-800/50 shadow-lg">
        <div className="pt-4 pb-4 px-4">
          <div className="relative mb-3">
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-violet-500 z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
              <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
              <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
              <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
            </svg>
            <Select onValueChange={handleSemesterChange} value={selectedExamSem?.registration_id || ""}>
              <SelectTrigger className="pl-10 bg-white dark:bg-gray-800 border-2 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 focus:border-violet-500 focus:ring-2 focus:ring-violet-200 transition-all duration-200 cursor-pointer font-medium shadow-sm h-12">
                <SelectValue placeholder="Select semester">
                  {selectedExamSem?.registration_code || "Select semester"}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-800 border-2 border-violet-200 dark:border-violet-800">
                {examSemesters.map((sem) => (
                  <SelectItem key={sem.registration_id} value={sem.registration_id} className="cursor-pointer hover:bg-violet-50 dark:hover:bg-violet-900/30">
                    {sem.registration_code}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedExamSem && (
            <div className="relative">
              <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-fuchsia-500 z-10" />
              <Select
                onValueChange={handleEventChange}
                value={selectedExamEvent?.exameventid || selectedExamEvent?.exam_event_id || ""}
              >
                <SelectTrigger className="pl-10 bg-white dark:bg-gray-800 border-2 border-fuchsia-200 dark:border-fuchsia-800 hover:border-fuchsia-400 dark:hover:border-fuchsia-600 focus:border-fuchsia-500 focus:ring-2 focus:ring-fuchsia-200 transition-all duration-200 cursor-pointer font-medium shadow-sm h-12">
                  <SelectValue placeholder="Select exam event">
                    {selectedExamEvent?.exameventdesc || selectedExamEvent?.exam_event_desc || "Select exam event"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-800 border-2 border-fuchsia-200 dark:border-fuchsia-800">
                  {examEvents.map((event) => (
                    <SelectItem
                      key={event.exameventid || event.exam_event_id}
                      value={event.exameventid || event.exam_event_id}
                      className="cursor-pointer hover:bg-fuchsia-50 dark:hover:bg-fuchsia-900/30"
                    >
                      {event.exameventdesc || event.exam_event_desc}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
      </div>

      <div className="px-4 py-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="relative">
              <div className="w-16 h-16 border-4 border-violet-200 dark:border-violet-800 border-t-violet-600 dark:border-t-violet-400 rounded-full animate-spin"></div>
              <div className="absolute inset-0 w-16 h-16 border-4 border-transparent border-t-fuchsia-600 dark:border-t-fuchsia-400 rounded-full animate-spin" style={{ animationDuration: '1.5s', animationDirection: 'reverse' }}></div>
            </div>
            <p className="mt-6 text-gray-600 dark:text-gray-400 font-medium">Loading exam schedule...</p>
          </div>
        ) : currentSchedule?.length > 0 ? (
          <div className="space-y-4 max-w-4xl mx-auto">
            {currentSchedule.map((exam) => {
              return (
                <div 
                  key={`${exam.subjectcode}-${exam.datetime}-${exam.datetimefrom}`} 
                  className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-violet-200 dark:border-violet-800 hover:border-violet-400 dark:hover:border-violet-600 shadow-lg hover:shadow-xl transition-all duration-200 p-6 hover:scale-[1.01]"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600 mb-1">
                        {exam.subjectdesc.split("(")[0].trim()}
                      </h3>
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-violet-500"></div>
                        <p className="text-sm font-medium text-gray-600 dark:text-gray-400">{exam.subjectcode}</p>
                      </div>
                    </div>
                    {(exam.roomcode || exam.seatno) && (
                      <div className="bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-violet-900/30 dark:to-fuchsia-900/30 rounded-xl px-6 py-3 border-2 border-violet-200 dark:border-violet-800">
                        <div className="flex items-center gap-2 mb-1">
                          <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Room & Seat</span>
                        </div>
                        <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-violet-600 to-fuchsia-600">
                          {exam.roomcode && exam.seatno
                            ? `${exam.roomcode}-${exam.seatno}`
                            : exam.roomcode || exam.seatno}
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-4 mt-4">
                    <div className="flex items-center gap-2 bg-gradient-to-r from-fuchsia-50 to-pink-50 dark:from-fuchsia-900/20 dark:to-pink-900/20 rounded-lg px-4 py-2 border border-fuchsia-200 dark:border-fuchsia-800">
                      <svg className="w-4 h-4 text-fuchsia-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2"/>
                        <line x1="16" y1="2" x2="16" y2="6" strokeWidth="2"/>
                        <line x1="8" y1="2" x2="8" y2="6" strokeWidth="2"/>
                        <line x1="3" y1="10" x2="21" y2="10" strokeWidth="2"/>
                      </svg>
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Date</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{formatDate(exam.datetime)}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 bg-gradient-to-r from-purple-50 to-violet-50 dark:from-purple-900/20 dark:to-violet-900/20 rounded-lg px-4 py-2 border border-purple-200 dark:border-purple-800">
                      <Clock className="w-4 h-4 text-purple-600" />
                      <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">Time</p>
                        <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">{exam.datetimeupto}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : selectedExamEvent ? (
          <div className="flex flex-col items-center justify-center py-12 max-w-2xl mx-auto">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-violet-200 dark:border-violet-800 shadow-xl p-12 text-center w-full">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">No exam schedule available</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">The schedule will be published soon</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 max-w-2xl mx-auto">
            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl border-2 border-violet-200 dark:border-violet-800 shadow-xl p-12 text-center w-full">
              <div className="w-16 h-16 bg-gradient-to-br from-violet-100 to-fuchsia-100 dark:from-violet-900/30 dark:to-fuchsia-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="w-8 h-8 text-violet-600 dark:text-violet-400" />
              </div>
              <p className="text-xl font-semibold text-gray-700 dark:text-gray-300">Select semester and exam event</p>
              <p className="text-gray-500 dark:text-gray-400 mt-2">Choose from the dropdowns above to view your exam schedule</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}