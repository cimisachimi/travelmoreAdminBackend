import { DayPicker } from 'react-day-picker';
import 'react-day-picker/dist/style.css';
import { format } from 'date-fns';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/Components/ui/select';
import { router } from '@inertiajs/react';

export default function AvailabilityCalendar({ carRental, month, onMonthChange }) {

  const handleStatusChange = (availabilityId, newStatus) => {
    router.put(route('admin.availabilities.update', { availability: availabilityId }), {
      status: newStatus
    }, {
      preserveScroll: true, // Don't jump to the top of the page
      preserveState: true,  // Don't lose component state (like the dialog being open)
    });
  };

  const availabilities = carRental.availabilities || [];

  const statusModifiers = {
    booked: availabilities.filter(a => a.status === 'booked').map(a => new Date(a.date)),
    maintenance: availabilities.filter(a => a.status === 'maintenance').map(a => new Date(a.date)),
  };

  const modifierStyles = {
    booked: { backgroundColor: '#fecaca', color: '#b91c1c' },
    maintenance: { backgroundColor: '#fed7aa', color: '#9a3412' },
  };

  const Footer = () => (
    <div className="p-4 border-t mt-4">
      <h4 className="font-semibold mb-2">Legend</h4>
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded-full bg-white border"></div><span>Available</span></div>
        <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded-full" style={modifierStyles.booked}></div><span>Booked</span></div>
        <div className="flex items-center space-x-2"><div className="w-4 h-4 rounded-full" style={modifierStyles.maintenance}></div><span>Maintenance</span></div>
      </div>
    </div>
  );

  return (
    <div>
      <DayPicker
        month={month}
        onMonthChange={onMonthChange}
        modifiers={statusModifiers}
        modifiersStyles={modifierStyles}
        footer={<Footer />}
        showOutsideDays
        fixedWeeks
      />
      <div className="mt-4 max-h-60 overflow-y-auto pr-2">
        <h3 className="font-bold text-lg mb-2">Manage Dates for {format(month, 'MMMM yyyy')}</h3>
        <ul className="space-y-2">
          {availabilities.sort((a, b) => new Date(a.date) - new Date(b.date)).map(availability => (
            <li key={availability.id} className="flex justify-between items-center p-2 border rounded-md">
              <span className="font-medium">{format(new Date(availability.date), 'EEEE, do')}</span>
              <Select value={availability.status} onValueChange={(newStatus) => handleStatusChange(availability.id, newStatus)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="available">Available</SelectItem>
                  <SelectItem value="booked">Booked</SelectItem>
                  <SelectItem value="maintenance">Maintenance</SelectItem>
                </SelectContent>
              </Select>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}