import { useState, useMemo } from "react";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";
import { Solar, Lunar, HolidayUtil } from "lunar-javascript";
import { SEO } from "@/components/SEO";

export default function PerpetualCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const days = useMemo(() => {
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    const startDayOfWeek = firstDayOfMonth.getDay(); // 0 (Sun) - 6 (Sat)
    
    const daysArr = [];

    // Previous month padding
    for (let i = startDayOfWeek; i > 0; i--) {
      const d = new Date(year, month, 1 - i);
      daysArr.push({ date: d, isCurrentMonth: false });
    }

    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const d = new Date(year, month, i);
      daysArr.push({ date: d, isCurrentMonth: true });
    }

    // Next month padding to fill 42 cells (6 rows) or just enough to complete the week
    const remainingCells = 42 - daysArr.length;
    for (let i = 1; i <= remainingCells; i++) {
      const d = new Date(year, month + 1, i);
      daysArr.push({ date: d, isCurrentMonth: false });
    }

    return daysArr;
  }, [year, month]);

  const selectedSolar = Solar.fromDate(selectedDate);
  const selectedLunar = selectedSolar.getLunar();

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handlePrevYear = () => setCurrentDate(new Date(year - 1, month, 1));
  const handleNextYear = () => setCurrentDate(new Date(year + 1, month, 1));
  const handleToday = () => {
    const now = new Date();
    setCurrentDate(now);
    setSelectedDate(now);
  };

  const weekDays = ["日", "一", "二", "三", "四", "五", "六"];

  return (
    <div className="space-y-6">
      <SEO 
        title="Perpetual Calendar & Lunar Date" 
        description="A comprehensive calendar with Chinese Lunar date, Solar terms, and festivals." 
        keywords={["calendar", "lunar calendar", "chinese calendar", "perpetual calendar", "solar terms", "festivals"]}
      />
      
      <div className="flex items-center gap-2">
        <div className="inline-flex p-2 rounded-lg bg-red-100 text-red-600">
          <CalendarIcon className="h-5 w-5" />
        </div>
        <h1 className="text-2xl font-semibold">万年历 (Perpetual Calendar)</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Calendar Area */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <button onClick={handlePrevYear} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Previous Year">
                <ChevronsLeft className="h-5 w-5" />
              </button>
              <button onClick={handlePrevMonth} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Previous Month">
                <ChevronLeft className="h-5 w-5" />
              </button>
            </div>
            
            <div className="text-lg font-semibold flex items-center gap-2">
              <span>{year}年 {month + 1}月</span>
              <button onClick={handleToday} className="text-sm font-normal px-2 py-0.5 bg-red-50 text-red-600 rounded hover:bg-red-100 transition-colors">
                今
              </button>
            </div>

            <div className="flex items-center gap-2">
              <button onClick={handleNextMonth} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Next Month">
                <ChevronRight className="h-5 w-5" />
              </button>
              <button onClick={handleNextYear} className="p-1 hover:bg-gray-100 rounded text-gray-500" title="Next Year">
                <ChevronsRight className="h-5 w-5" />
              </button>
            </div>
          </div>

          {/* Week Headers */}
          <div className="grid grid-cols-7 mb-2">
            {weekDays.map((d, i) => (
              <div key={i} className={`text-center text-sm font-medium py-2 ${i === 0 || i === 6 ? "text-red-500" : "text-gray-500"}`}>
                {d}
              </div>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="grid grid-cols-7 grid-rows-6 gap-1 h-[400px]">
            {days.map((item, index) => {
              const solar = Solar.fromDate(item.date);
              const lunar = solar.getLunar();
              const isToday = item.date.toDateString() === new Date().toDateString();
              const isSelected = item.date.toDateString() === selectedDate.toDateString();
              
              // Determine display text for lunar date (Term > Festival > Day)
              let lunarText = lunar.getDayInChinese();
              const solarTerm = lunar.getJieQi();
              const festivals = lunar.getFestivals();
              const solarFestivals = solar.getFestivals();
              
              let specialColor = "";

              if (lunar.getDay() === 1) {
                lunarText = lunar.getMonthInChinese() + "月";
                specialColor = "text-red-500 font-medium";
              }
              
              if (solarTerm) {
                lunarText = solarTerm;
                specialColor = "text-blue-600 font-medium";
              }
              
              // Priority: Solar Festival > Lunar Festival > Solar Term > Lunar Day
              if (festivals.length > 0) {
                lunarText = festivals[0];
                specialColor = "text-red-500 font-medium";
              }
              if (solarFestivals.length > 0) {
                lunarText = solarFestivals[0];
                if (lunarText.length > 4) lunarText = lunarText.substring(0, 4); // Truncate long names
                specialColor = "text-red-500 font-medium";
              }

              // Check for official holiday (simplified)
              const holiday = HolidayUtil.getHoliday(item.date.getFullYear(), item.date.getMonth() + 1, item.date.getDate());
              const isHoliday = !!holiday;
              const isWork = holiday ? holiday.isWork() : false;

              return (
                <button
                  key={index}
                  onClick={() => setSelectedDate(item.date)}
                  className={`
                    relative flex flex-col items-center justify-center rounded-lg transition-all
                    ${!item.isCurrentMonth ? "text-gray-300 bg-gray-50/50" : "text-gray-700 bg-white hover:bg-gray-50"}
                    ${isSelected ? "ring-2 ring-red-500 z-10" : ""}
                    ${isToday ? "bg-red-50" : ""}
                  `}
                >
                  {/* Holiday/Work badge */}
                  {isHoliday && (
                    <div className={`absolute top-0.5 left-0.5 text-[10px] px-1 rounded ${isWork ? "bg-gray-200 text-gray-600" : "bg-red-100 text-red-600"}`}>
                      {isWork ? "班" : "休"}
                    </div>
                  )}

                  <span className={`text-lg font-medium ${isToday ? "text-red-600" : ""}`}>
                    {item.date.getDate()}
                  </span>
                  <span className={`text-xs truncate max-w-full px-1 ${specialColor || "text-gray-500"}`}>
                    {lunarText}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Sidebar / Details */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="text-6xl font-bold text-red-600 font-mono">
                {selectedDate.getDate()}
              </div>
              <div className="text-xl text-gray-700 font-medium">
                {selectedDate.getFullYear()}年 {selectedDate.getMonth() + 1}月
              </div>
              <div className="text-lg text-gray-500">
                星期{weekDays[selectedDate.getDay()]}
              </div>
              
              <div className="w-full h-px bg-gray-200 my-4" />
              
              <div className="space-y-2 w-full">
                <div className="flex justify-between">
                  <span className="text-gray-500">农历</span>
                  <span className="font-medium text-gray-900">{selectedLunar.getMonthInChinese()}月{selectedLunar.getDayInChinese()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">干支</span>
                  <span className="font-medium text-gray-900">
                    {selectedLunar.getYearInGanZhi()}年 {selectedLunar.getMonthInGanZhi()}月 {selectedLunar.getDayInGanZhi()}日
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">生肖</span>
                  <span className="font-medium text-gray-900">{selectedLunar.getYearShengXiao()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">星座</span>
                  <span className="font-medium text-gray-900">{selectedSolar.getXingZuo()}座</span>
                </div>
                {selectedLunar.getJieQi() && (
                   <div className="flex justify-between">
                   <span className="text-gray-500">节气</span>
                   <span className="font-medium text-blue-600">{selectedLunar.getJieQi()}</span>
                 </div>
                )}
              </div>

              <div className="w-full h-px bg-gray-200 my-4" />

              <div className="w-full text-left space-y-3">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-100 text-green-700 flex items-center justify-center font-bold shrink-0">宜</div>
                  <div className="text-sm text-gray-600 leading-6">
                    {selectedLunar.getDayYi().join("、") || "诸事不宜"}
                  </div>
                </div>
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-full bg-red-100 text-red-700 flex items-center justify-center font-bold shrink-0">忌</div>
                  <div className="text-sm text-gray-600 leading-6">
                    {selectedLunar.getDayJi().join("、") || "诸事无忌"}
                  </div>
                </div>
              </div>

               <div className="w-full h-px bg-gray-200 my-4" />

               <div className="w-full text-left">
                  <div className="text-sm font-medium text-gray-500 mb-1">彭祖百忌</div>
                  <div className="text-sm text-gray-700">
                    {selectedLunar.getPengZuGan()} <br/>
                    {selectedLunar.getPengZuZhi()}
                  </div>
               </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
