'use client'
import React, { useState, useEffect } from 'react';
import Select from 'react-select';
import "react-datepicker/dist/react-datepicker.css";
import { fetchCoaches, fetchActivities, addTimeSlot } from '../../../../utils/admin-requests';
import MultiDatePicker, { Calendar } from 'react-multi-date-picker';
import { DateObject } from 'react-multi-date-picker';
import DatePanel from 'react-multi-date-picker/plugins/date_panel';
import Icon from 'react-multi-date-picker/components/icon';
import Toolbar from 'react-multi-date-picker/plugins/toolbar';

type OptionType = {
    label: string;
    value: string;
};

export default function AddTimeSlotComponent() {
    const [coaches, setCoaches] = useState<OptionType[]>([]);
    const [activities, setActivities] = useState<OptionType[]>([]);
    const [selectedCoach, setSelectedCoach] = useState<OptionType | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<OptionType | null>(null);
    const [selectedDates, setSelectedDates] = useState<Date[]>([new Date()]);
    const [startTime, setStartTime] = useState<string>('');
    const [endTime, setEndTime] = useState<string>('');

    useEffect(() => {
        async function loadCoachesAndActivities() {
            const fetchedCoaches = await fetchCoaches();
            setCoaches(fetchedCoaches.map(coach => ({ label: coach.name, value: coach.id })));
            const fetchedActivities = await fetchActivities();
            setActivities(fetchedActivities.map(activity => ({ label: activity.name, value: activity.id })));
        }

        loadCoachesAndActivities();
    }, []);

    const handleDateChange = (dates: DateObject | DateObject[] | null) => {
        if (Array.isArray(dates)) {
            setSelectedDates(dates.map(date => date.toDate()));
        }
    };

    const handleAddTimeSlot = async () => {
        if (!selectedCoach || !selectedActivity || selectedDates.length === 0 || !startTime || !endTime) {
            alert('Please fill in all fields');
            return;
        }

        for (const date of selectedDates) {
            const newTimeSlot = {
                coach_id: selectedCoach.value,
                activity_id: selectedActivity.value,
                date: date.toISOString().substring(0, 10),
                start_time: startTime,
                end_time: endTime,
                booked: false,
            };

            const result = await addTimeSlot(newTimeSlot);
            if (!result.success) {
                alert(`Error adding new time slot: ${result.error}`);
                return;
            }
        }

        alert('New time slots added successfully');
    };

    return (
        <div className="container mx-auto px-4">
            <h1 className="text-2xl font-bold mb-4">Add Time Slots</h1>
            <div className="flex flex-wrap mb-4">
                <div className="w-full md:w-1/2 px-2 mb-4 md:mb-0">
                    <Select
                        placeholder="Select Coach"
                        options={coaches}
                        onChange={setSelectedCoach}
                        value={selectedCoach}
                    />
                </div>
                <div className="w-full md:w-1/2 px-2">
                    <Select
                        placeholder="Select Activity"
                        options={activities}
                        onChange={setSelectedActivity}
                        value={selectedActivity}
                    />
                </div>
            </div>
            <div className="mb-4 text-center">
                <MultiDatePicker
                    value={selectedDates}
                    render={<Icon />}
                    onChange={handleDateChange}
                    format="YYYY-MM-DD"
                    plugins={[
                        // Add key prop to DatePanel component
                        <DatePanel key="date-panel" sort="date" />,
                        // Add key prop to Toolbar component
                        <Toolbar
                            key="toolbar"
                            position="bottom"
                            sort={["deselect", "close", "today"]}
                        />,
                    ]}
                />

            </div>
            <div className="flex flex-wrap mb-4">
                <div className="w-full md:w-1/2 px-2 mb-4 md:mb-0">
                    <input
                        type="time"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        className="border px-2 py-1 rounded w-full"
                    />
                </div>
                <div className="w-full md:w-1/2 px-2">
                    <input
                        type="time"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        className="border px-2 py-1 rounded w-full"
                    />
                </div>
            </div>
            <div className="text-center">
                <button onClick={handleAddTimeSlot} className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded">
                    Add Time Slots
                </button>
            </div>
        </div>
    );
}