import { useState } from "react";
import { Calendar } from "@/components/ui/calendar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { TimePicker } from "@/components/ui/time-picker";

const PRESET_RANGES = {
  "15min": { label: "Last 15 minutes", minutes: 15 },
  "1hour": { label: "Last hour", minutes: 60 },
  "6hours": { label: "Last 6 hours", minutes: 360 },
  "24hours": { label: "Last 24 hours", minutes: 1440 },
  "7days": { label: "Last 7 days", minutes: 10080 },
  custom: { label: "Custom range", minutes: null },
};

export default function DateRangeSelector({ onDateRangeChange, className }) {
  const [selectedPreset, setSelectedPreset] = useState("7days");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [customRange, setCustomRange] = useState(undefined);

  // Initialize start time to 00:00 and end time to 23:59
  const [startTimeDate, setStartTimeDate] = useState(() => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
  });

  const [endTimeDate, setEndTimeDate] = useState(() => {
    const date = new Date();
    date.setHours(23, 59, 0, 0);
    return date;
  });

  const handlePresetChange = (value) => {
    setSelectedPreset(value);

    if (value === "custom") {
      // Use setTimeout to allow the Popover to fully mount before opening
      setTimeout(() => {
        setIsCalendarOpen(true);
      }, 100);
      return;
    }

    // Close calendar when switching away from custom
    setIsCalendarOpen(false);

    const preset = PRESET_RANGES[value];
    if (preset && preset.minutes) {
      const to = new Date();
      const from = new Date(to.getTime() - preset.minutes * 60 * 1000);
      onDateRangeChange({ from, to });
    }
  };

  const handleCalendarSelect = (range) => {
    setCustomRange(range);

    // Only update if we have both from and to dates
    if (range?.from && range?.to) {
      // Set 'to' time from endTimeDate state
      const to = new Date(range.to);
      to.setHours(endTimeDate.getHours(), endTimeDate.getMinutes(), 59, 999);

      // Set 'from' time from startTimeDate state
      const from = new Date(range.from);
      from.setHours(startTimeDate.getHours(), startTimeDate.getMinutes(), 0, 0);

      onDateRangeChange({ from, to });
      // Let the user close the calendar themselves by clicking away
    }
  };

  const handleStartTimeChange = (date) => {
    setStartTimeDate(date);
    // Re-trigger date range change if dates are already selected
    if (customRange?.from && customRange?.to && date) {
      const from = new Date(customRange.from);
      from.setHours(date.getHours(), date.getMinutes(), 0, 0);

      const to = new Date(customRange.to);
      to.setHours(endTimeDate.getHours(), endTimeDate.getMinutes(), 59, 999);

      onDateRangeChange({ from, to });
    }
  };

  const handleEndTimeChange = (date) => {
    setEndTimeDate(date);
    // Re-trigger date range change if dates are already selected
    if (customRange?.from && customRange?.to && date) {
      const from = new Date(customRange.from);
      from.setHours(startTimeDate.getHours(), startTimeDate.getMinutes(), 0, 0);

      const to = new Date(customRange.to);
      to.setHours(date.getHours(), date.getMinutes(), 59, 999);

      onDateRangeChange({ from, to });
    }
  };

  const getDisplayValue = () => {
    if (selectedPreset === "custom" && customRange?.from && customRange?.to) {
      return `${format(customRange.from, "MMM d")} - ${format(customRange.to, "MMM d")}`;
    }
    return PRESET_RANGES[selectedPreset]?.label || "Select range";
  };

  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
      {selectedPreset === "custom" && (
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-full sm:w-[280px] justify-start text-left font-normal cursor-pointer"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {customRange?.from ? (
                customRange.to ? (
                  <>
                    {format(customRange.from, "MMM dd")} - {format(customRange.to, "MMM dd")}
                  </>
                ) : (
                  format(customRange.from, "MMM dd, y")
                )
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={customRange?.from}
              selected={customRange}
              onSelect={handleCalendarSelect}
              numberOfMonths={2}
              disabled={(date) => date > new Date() || date < new Date("2020-01-01")}
              className="p-3"
              classNames={{
                cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-start)]:rounded-l-md [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
                day_today: "bg-card",
                day_range_start: "day-range-start rounded-l-md",
                day_outside:
                  "day-outside text-muted-foreground opacity-50 aria-selected:bg-transparent aria-selected:text-accent-foreground aria-selected:opacity-70",
              }}
            />
            <div className="border-t flex items-center justify-between gap-8 px-10 py-2">
              <TimePicker date={startTimeDate} setDate={handleStartTimeChange} label="" />
              <span className="">→</span>
              <TimePicker date={endTimeDate} setDate={handleEndTimeChange} label="" />
            </div>
          </PopoverContent>
        </Popover>
      )}

      <Select value={selectedPreset} onValueChange={handlePresetChange}>
        <SelectTrigger className="bg-background text-foreground border-border w-full sm:w-[200px] cursor-pointer">
          <SelectValue>{getDisplayValue()}</SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="15min">{PRESET_RANGES["15min"].label}</SelectItem>
          <SelectItem value="1hour">{PRESET_RANGES["1hour"].label}</SelectItem>
          <SelectItem value="6hours">{PRESET_RANGES["6hours"].label}</SelectItem>
          <SelectItem value="24hours">{PRESET_RANGES["24hours"].label}</SelectItem>
          <SelectItem value="7days">{PRESET_RANGES["7days"].label}</SelectItem>
          <SelectItem value="custom">{PRESET_RANGES["custom"].label}</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
