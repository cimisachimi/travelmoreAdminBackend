import { useState, useEffect, useMemo, useRef } from "react";
import { Button } from "@/Components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { format, getDaysInMonth, isToday, isPast, startOfToday } from "date-fns";
import { router } from "@inertiajs/react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/Components/ui/select";

function cn(...classes) {
  return classes.filter(Boolean).join(' ');
}

export default function AvailabilityCalendar({ carRental, month, onMonthChange }) {
  const [dayStatuses, setDayStatuses] = useState({});
  const todayRef = useRef(null);
  const today = startOfToday();
  const daysInMonth = useMemo(() => getDaysInMonth(month), [month]);

  useEffect(() => {
    const initialStatuses = {};
    const availabilityMap = new Map(
      carRental.availabilities.map(a => {
        const dayNumber = new Date(a.date).getUTCDate();
        return [dayNumber, a.status];
      })
    );
    for (let day = 1; day <= daysInMonth; day++) {
      initialStatuses[day] = availabilityMap.get(day) || 'maintenance';
    }
    setDayStatuses(initialStatuses);
  }, [carRental, month, daysInMonth]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (todayRef.current) {
        todayRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 100);
    return () => clearTimeout(timer);
  }, [month]);

  const handleStatusChange = (day, newStatus) => {
    setDayStatuses(prevStatuses => ({
      ...prevStatuses,
      [day]: newStatus,
    }));
  };

  const handleSaveChanges = () => {
    router.post(route('admin.rentals.update_availability', { id: carRental.id }), {
      year: month.getFullYear(),
      month: month.getMonth() + 1,
      statuses: dayStatuses,
    }, {
      preserveScroll: true,
    });
  };

  return (
    <div className="p-4">
      <div className="flex justify-between items-center mb-4">
        <Button variant="outline" size="icon" onClick={() => onMonthChange(new Date(month.setMonth(month.getMonth() - 1)))}>
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <h2 className="text-lg font-semibold">{format(month, "MMMM yyyy")}</h2>
        <Button variant="outline" size="icon" onClick={() => onMonthChange(new Date(month.setMonth(month.getMonth() + 1)))}>
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      <div className="max-h-96 overflow-y-auto space-y-2 pr-2">
        {Object.entries(dayStatuses).map(([day, status]) => {
          const currentDate = new Date(month.getFullYear(), month.getMonth(), day);
          const isDayInPast = isPast(currentDate) && !isToday(currentDate);
          const isDayToday = isToday(currentDate);

          return (
            <div
              key={day}
              ref={isDayToday ? todayRef : null}
              className={cn(
                "flex items-center justify-between p-2 border rounded-lg transition-all",
                {
                  "opacity-50 bg-gray-50 dark:bg-gray-800/50": isDayInPast,
                  "border-2 border-blue-500 bg-blue-50 dark:bg-blue-900/20": isDayToday,
                }
              )}
            >
              <span className="font-medium flex items-center gap-2">
                {format(currentDate, "EEEE, MMMM do")}
                {isDayToday && (
                  <span className="text-xs font-semibold text-white bg-blue-500 px-2 py-0.5 rounded-full">
                    Today
                  </span>
                )}
              </span>
              <Select
                value={status}
                onValueChange={(newStatus) => handleStatusChange(day, newStatus)}
                disabled={isDayInPast}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Set status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                </SelectContent>
              </Select>
            </div>
          );
        })}
      </div>

      <div className="mt-6 flex justify-end border-t pt-4">
        <Button onClick={handleSaveChanges}>Save Changes</Button>
      </div>
    </div>
  );
}