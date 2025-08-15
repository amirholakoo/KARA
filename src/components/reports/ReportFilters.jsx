import React from 'react';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Calendar as CalendarIcon, Filter, Users } from "lucide-react";

// Accurate Gregorian to Jalali conversion utility
const gregorianToJalali = (gDate) => {
    const gy = gDate.getFullYear();
    const gm = gDate.getMonth() + 1;
    const gd = gDate.getDate();

    const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
    const gy2 = (gm > 2) ? (gy + 1) : gy;
    const days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
    let jy = -1595 + (33 * Math.floor(days / 12053));
    let newDays = days % 12053;
    jy += 4 * Math.floor(newDays / 1461);
    newDays %= 1461;
    if (newDays > 365) {
        jy += Math.floor((newDays - 1) / 365);
        newDays = (newDays - 1) % 365;
    }
    const jm = (newDays < 186) ? 1 + Math.floor(newDays / 31) : 7 + Math.floor((newDays - 186) / 30);
    const jd = 1 + ((newDays < 186) ? (newDays % 31) : ((newDays - 186) % 30));
    return { year: jy, month: jm, day: jd };
};

const formatJalaliDate = (date) => {
  if (!date) return '';
  const jalali = gregorianToJalali(date);
  const persianMonths = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند'
  ];
  return `${jalali.day} ${persianMonths[jalali.month - 1]} ${jalali.year}`;
};

export default function ReportFilters({ filters, onFilterChange, teams }) {
  const handleDateChange = (date) => {
    onFilterChange(prev => ({ ...prev, dateRange: date }));
  };

  const handleTeamChange = (teamId) => {
    onFilterChange(prev => ({ ...prev, teamId }));
  };

  return (
    <div className="p-4 bg-white/60 glass-effect rounded-xl border border-blue-100 shadow-md">
      <div className="flex flex-col md:flex-row items-center gap-4">
        <div className="flex items-center gap-2 text-slate-700 font-medium">
          <Filter className="w-5 h-5 text-blue-600" />
          <span>فیلترها:</span>
        </div>

        {/* Date Range Picker */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date"
              variant={"outline"}
              className="w-full md:w-[300px] justify-start text-right font-normal bg-white"
            >
              <CalendarIcon className="ml-2 h-4 w-4" />
              {filters.dateRange?.from ? (
                filters.dateRange.to ? (
                  <>
                    {formatJalaliDate(filters.dateRange.from)} -{" "}
                    {formatJalaliDate(filters.dateRange.to)}
                  </>
                ) : (
                  formatJalaliDate(filters.dateRange.from)
                )
              ) : (
                <span>یک بازه زمانی انتخاب کنید</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={filters.dateRange?.from}
              selected={filters.dateRange}
              onSelect={handleDateChange}
              numberOfMonths={2}
              dir="rtl"
            />
          </PopoverContent>
        </Popover>

        {/* Team Selector */}
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Users className="w-5 h-5 text-slate-500" />
          <Select value={filters.teamId} onValueChange={handleTeamChange}>
            <SelectTrigger className="w-full md:w-[200px] bg-white">
              <SelectValue placeholder="انتخاب تیم" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">همه تیم‌ها</SelectItem>
              {teams.map((team) => (
                <SelectItem key={team.id} value={team.id}>
                  {team.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}