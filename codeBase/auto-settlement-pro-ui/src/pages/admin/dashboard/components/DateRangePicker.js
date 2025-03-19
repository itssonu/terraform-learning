import React, { useState, useRef } from "react";
import { DateRange } from "react-date-range";
import { format, addYears } from "date-fns";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";

const DateRangePicker = ({ onRangeChange }) => {
    const [showCalendar, setShowCalendar] = useState(false);
    const [dateRange, setDateRange] = useState([
        {
            startDate: new Date(),
            endDate: new Date(),
            key: "selection"
        }
    ]);

    const [hasSelectedStart, setHasSelectedStart] = useState(false);
    const prevEndDate = useRef(null);

    const handleSelect = (ranges) => {
        const { startDate, endDate } = ranges.selection;
        const isRangeSelection = ranges?.isRangeSelection ?? true;
        setDateRange([{ startDate, endDate, key: "selection" }]);
        if (!isRangeSelection) {
            onRangeChange(ranges.selection);
            setHasSelectedStart(false);
            setShowCalendar(false);
        } else {
            if (!hasSelectedStart) {
                setHasSelectedStart(true);
            }
            if (hasSelectedStart && endDate && prevEndDate.current !== endDate) {
                onRangeChange(ranges.selection);
                setHasSelectedStart(false);
                setShowCalendar(false);
            }
            prevEndDate.current = endDate;
        }
    };

    return (
        <div style={{ position: "relative" }}>
            <div
                onClick={() => setShowCalendar(!showCalendar)}
                style={{
                    border: "1px solid #ccc",
                    borderRadius: "6px",
                    padding: "8px 12px",
                    cursor: "pointer",
                    width: "250px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between"
                }}
            >
                {format(dateRange[0].startDate, "MM/dd/yyyy")} → {format(dateRange[0].endDate, "MM/dd/yyyy")}
                📅
            </div>

            {showCalendar && (
                <div style={{
                    position: "absolute",
                    zIndex: 1000,
                    background: "white",
                    boxShadow: "0px 4px 8px rgba(0, 0, 0, 0.2)",
                    borderRadius: "8px",
                }}>
                    <DateRange
                        ranges={dateRange}
                        onChange={handleSelect}
                        moveRangeOnFirstSelection={false}
                        showMonthAndYearPickers={false}
                    />
                    <div class="calendar-action-btns d-flex justify-content-around">
                        <button onClick={() => handleSelect({ selection: { startDate: new Date(), endDate: new Date(), key: "selection" }, isRangeSelection: false })}>
                            This Month
                        </button>
                        <button onClick={() => handleSelect({ selection: { startDate: new Date(new Date().setMonth(new Date().getMonth() - 1)), endDate: new Date(), key: "selection" }, isRangeSelection: false })}>
                            Last Month
                        </button>
                        <button onClick={() => handleSelect({ selection: { startDate: new Date(new Date().getFullYear(), 0, 1), endDate: new Date(), key: "selection" }, isRangeSelection: false })}>
                            This Year
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default DateRangePicker;