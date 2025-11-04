import React from "react";
import { Progress } from "@/components/ui/progress";

export default function MarksCard({ course }) {
  const getProgressColor = (percentage) => {
    if (percentage >= 80) return "bg-marks-outstanding";
    if (percentage >= 60) return "bg-marks-good";
    if (percentage >= 40) return "bg-marks-average";
    return "bg-marks-poor";
  };

  return (
    <div className="bg-background rounded-lg p-3 sm:p-4 border border-border">
      <div className="space-y-1 mb-3 sm:mb-4">
        <h3 className="font-bold text-sm sm:text-base">{course.name}</h3>
        <p className="text-xs sm:text-sm text-muted-foreground">{course.code}</p>
      </div>

      <div className="space-y-2 sm:space-y-3">
        {Object.entries(course.exams).map(([examName, marks]) => {
          const percentage = (marks.OM / marks.FM) * 100;
          return (
            <div key={examName}>
              <div className="flex items-center gap-2 sm:gap-4">
                <div className="flex-1">
                  <Progress
                    value={percentage}
                    className="h-1.5 sm:h-2 bg-muted"
                    indicatorClassName={getProgressColor(percentage)}
                  />
                </div>
                <span className="text-xs sm:text-sm text-muted-foreground min-w-[50px] sm:min-w-[60px] text-right">
                  {marks.OM}/{marks.FM}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}