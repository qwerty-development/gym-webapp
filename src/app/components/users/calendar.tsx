"use client"
import React, { useState } from 'react';
import 'tailwindcss/tailwind.css';

interface CalendarProps {
    onSelectDate: (date: Date) => void;
}

// Ultra-safe date creation function that avoids all timezone issues
const createDateFromComponents = (year: number, month: number, day: number): Date => {
    // Method 1: Use string parsing which is more reliable
    const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T12:00:00.000`;
    const date = new Date(dateString);
    
    // Verify the date was created correctly
    if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
        console.warn('Date creation failed, using fallback method');
        // Fallback method
        const fallbackDate = new Date();
        fallbackDate.setFullYear(year, month, day);
        fallbackDate.setHours(12, 0, 0, 0);
        return fallbackDate;
    }
    
    return date;
};

// Utility function to safely compare dates without timezone issues
const isSameDay = (date1: Date, date2: Date): boolean => {
    return date1.getFullYear() === date2.getFullYear() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getDate() === date2.getDate();
};

const Calendar: React.FC<CalendarProps> = ({ onSelectDate }) => {
    const [selectedDate, setSelectedDate] = useState<Date>(() => {
        const today = new Date();
        return createDateFromComponents(today.getFullYear(), today.getMonth(), today.getDate());
    });

    const handleDateClick = (day: number) => {
        // Create date using the most reliable method
        const newDate = createDateFromComponents(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            day
        );
        
        console.log('=== Date Click Debug ===');
        console.log('Day clicked:', day);
        console.log('Current month/year:', selectedDate.getMonth(), selectedDate.getFullYear());
        console.log('Created date:', newDate);
        console.log('Date string representation:', newDate.toISOString());
        console.log('Date components:', {
            year: newDate.getFullYear(),
            month: newDate.getMonth(),
            day: newDate.getDate()
        });
        console.log('Timezone offset:', newDate.getTimezoneOffset());
        console.log('========================');
        
        setSelectedDate(newDate);
        onSelectDate(newDate);
    };

    const handleMonthChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newMonth = parseInt(event.target.value);
        const newDate = createDateFromComponents(selectedDate.getFullYear(), newMonth, 1);
        setSelectedDate(newDate);
    };

    const handleYearChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        const newYear = parseInt(event.target.value);
        const newDate = createDateFromComponents(newYear, selectedDate.getMonth(), 1);
        setSelectedDate(newDate);
    };

    const renderDaysOfWeek = () => {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        return daysOfWeek.map(day => (
            <div key={day} className="text-xs text-gray-500 uppercase font-medium tracking-wide">
                {day}
            </div>
        ));
    };

    const renderCalendar = () => {
        const daysInMonth = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth() + 1,
            0
        ).getDate();

        const firstDayOfMonth = new Date(
            selectedDate.getFullYear(),
            selectedDate.getMonth(),
            1
        ).getDay();

        const calendarDays = [];

        // Add empty cells for days before the first day of the month
        for (let i = 0; i < firstDayOfMonth; i++) {
            calendarDays.push(<div key={`empty-${i}`} className="border-r border-b border-gray-200 w-14 h-14" />);
        }

        // Add cells for each day of the month
        for (let i = 1; i <= daysInMonth; i++) {
            const currentDate = createDateFromComponents(
                selectedDate.getFullYear(),
                selectedDate.getMonth(),
                i
            );

            // Check if this date is selected using safe comparison
            const isSelected = isSameDay(selectedDate, currentDate);

            calendarDays.push(
                <div
                    key={`day-${i}`}
                    className={`border-r border-b border-gray-200 w-14 h-14 flex justify-center items-center cursor-pointer hover:bg-gray-100 transition-colors ${
                        isSelected ? 'bg-blue-500 text-white' : ''
                    }`}
                    onClick={() => handleDateClick(i)}
                >
                    {i}
                </div>
            );
        }

        return calendarDays;
    };

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden mx-auto">
            <div className="bg-white px-4 py-3 flex justify-between items-center">
                <div>
                    <select
                        className="p-2 mr-2"
                        value={selectedDate.getMonth()}
                        onChange={handleMonthChange}
                    >
                        {Array.from({ length: 12 }, (_, i) => (
                            <option key={i} value={i}>
                                {new Date(selectedDate.getFullYear(), i, 1).toLocaleString(
                                    undefined,
                                    { month: 'long' }
                                )}
                            </option>
                        ))}
                    </select>
                    <select
                        className="p-2"
                        value={selectedDate.getFullYear()}
                        onChange={handleYearChange}
                    >
                        {Array.from({ length: 50 }, (_, i) => (
                            <option key={i} value={selectedDate.getFullYear() - 25 + i}>
                                {selectedDate.getFullYear() - 25 + i}
                            </option>
                        ))}
                    </select>
                </div>
            </div>
            <div className="grid grid-cols-7">
                {renderDaysOfWeek()}
                {renderCalendar()}
            </div>
        </div>
    );
};

export default Calendar;
