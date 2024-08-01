// components/CalendarView.tsx
import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { FaUser, FaUsers } from 'react-icons/fa';

const localizer = momentLocalizer(moment);

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  coach: string;
  activity: string;
  isGroup: boolean;
}

interface CalendarViewProps {
  sessions: any[];
}

const CalendarView: React.FC<CalendarViewProps> = ({ sessions }) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [view, setView] = useState<'day' | 'week' | 'month'>('week');

  useEffect(() => {
    const calendarEvents = sessions.map(session => ({
      id: session.id,
      title: session.activities.name,
      start: new Date(`${session.date}T${session.start_time}`),
      end: new Date(`${session.date}T${session.end_time}`),
      coach: session.coaches.name,
      activity: session.activities.name,
      isGroup: 'count' in session,
    }));
    setEvents(calendarEvents);
  }, [sessions]);

  const handleViewChange = (newView: 'day' | 'week' | 'month') => {
    setView(newView);
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    return {
      style: {
        backgroundColor: event.isGroup ? '#3B82F6' : '#10B981',
        color: 'white',
        borderRadius: '4px',
        border: 'none',
        fontSize: '0.8rem',
      },
    };
  };

  const CustomEvent = ({ event }: { event: CalendarEvent }) => (
    <div className="flex flex-col h-full p-1">
      <div className="font-semibold">{event.title}</div>
      <div className="text-xs">{event.coach}</div>
      <div className="mt-auto text-xs flex items-center">
        {event.isGroup ? <FaUsers className="mr-1" /> : <FaUser className="mr-1" />}
        {event.isGroup ? 'Group' : 'Individual'}
      </div>
    </div>
  );

  return (
    <div className="bg-gray-800 rounded-xl p-4 shadow-lg">
      <div className="mb-4 flex justify-between items-center flex-wrap">
        <h3 className="text-2xl font-bold text-green-400 mb-2 sm:mb-0">Calendar View</h3>
      </div>
      <div className="h-[400px] sm:h-[500px] md:h-[600px] lg:h-[700px] overflow-auto">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView as any}
          eventPropGetter={eventStyleGetter}
          components={{
            event: CustomEvent,
          }}
          className="bg-gray-700 text-white rounded-lg overflow-hidden min-w-[800px]"
        />
      </div>
    </div>
  );
};

export default CalendarView;
