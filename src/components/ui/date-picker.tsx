import * as React from "react";
import { format } from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface DatePickerProps {
  value?: string;
  onChange: (date: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

export function DatePicker({
  value,
  onChange,
  placeholder = "Pick a date",
  className,
  disabled = false,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false);
  const [month, setMonth] = React.useState<Date | undefined>(
    value ? new Date(value) : new Date()
  );

  // Convert string date (YYYY-MM-DD) to Date object
  const date = value ? new Date(value) : undefined;

  const handleSelect = (selectedDate: Date | undefined) => {
    if (selectedDate) {
      // Format date as YYYY-MM-DD for form submission
      const formattedDate = format(selectedDate, "yyyy-MM-dd");
      onChange(formattedDate);
      setOpen(false);
    }
  };

  // Custom caption component with shadcn Select dropdowns
  const CustomCaption = (props: { displayMonth: Date }) => {
    const { displayMonth } = props;
    const currentYear = displayMonth.getFullYear();
    const currentMonth = displayMonth.getMonth();

    // Generate years array (1900 to current year)
    const years = Array.from(
      { length: new Date().getFullYear() - 1899 },
      (_, i) => 1900 + i
    ).reverse();

    // Generate months array
    const months = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    const handleMonthChange = (monthIndex: string) => {
      const newDate = new Date(currentYear, parseInt(monthIndex), 1);
      setMonth(newDate);
    };

    const handleYearChange = (year: string) => {
      const newDate = new Date(parseInt(year), currentMonth, 1);
      setMonth(newDate);
    };

    const handlePreviousMonth = () => {
      const newDate = new Date(currentYear, currentMonth - 1, 1);
      setMonth(newDate);
    };

    const handleNextMonth = () => {
      const newDate = new Date(currentYear, currentMonth + 1, 1);
      setMonth(newDate);
    };

    return (
      <div className="flex justify-between items-center pt-1 relative gap-2 w-full">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-transparent border-border text-popover-foreground opacity-50 hover:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md p-0"
          onClick={handlePreviousMonth}
          type="button"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex items-center gap-2 flex-1 justify-center">
          <Select
            value={currentMonth.toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="h-8 w-[120px] bg-background border-border text-popover-foreground hover:bg-background hover:text-popover-foreground focus:ring-0 focus:ring-offset-0 focus:outline-none [&[data-state=open]]:bg-background [&[data-state=open]]:text-popover-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border">
              {months.map((monthName, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {monthName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={currentYear.toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="h-8 w-[100px] bg-background border-border text-popover-foreground hover:bg-background hover:text-popover-foreground focus:ring-0 focus:ring-offset-0 focus:outline-none [&[data-state=open]]:bg-background [&[data-state=open]]:text-popover-foreground">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-popover border-border max-h-[200px]">
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7 bg-transparent border-border text-popover-foreground opacity-50 hover:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md p-0"
          onClick={handleNextMonth}
          type="button"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    );
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal bg-background border-border",
            !date && "text-muted-foreground",
            className
          )}
          disabled={disabled}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {date ? format(date, "PPP") : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-auto p-0 bg-popover border-border"
        align="start"
      >
        <Calendar
          mode="single"
          selected={date}
          onSelect={handleSelect}
          month={month}
          onMonthChange={setMonth}
          initialFocus
          fromYear={1900}
          toYear={new Date().getFullYear()}
          className="bg-popover"
          components={{
            Caption: CustomCaption,
          }}
          classNames={{
            months:
              "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
            month: "space-y-4",
            caption: "flex justify-center pt-1 relative items-center gap-2",
            caption_label: "text-sm font-medium text-popover-foreground hidden",
            nav: "space-x-1 flex items-center",
            nav_button: cn(
              "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100 text-popover-foreground hover:bg-accent hover:text-accent-foreground rounded-md border border-border"
            ),
            nav_button_previous: "absolute left-1",
            nav_button_next: "absolute right-1",
            table: "w-full border-collapse space-y-1",
            head_row: "flex",
            head_cell:
              "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
            row: "flex w-full mt-2",
            cell: "h-9 w-9 text-center text-sm p-0 relative [&:has([aria-selected].day-range-end)]:rounded-r-md [&:has([aria-selected].day-outside)]:bg-accent/50 [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
            day: cn(
              "h-9 w-9 p-0 font-normal aria-selected:opacity-100 hover:bg-accent hover:text-accent-foreground rounded-md text-popover-foreground"
            ),
            day_range_end: "day-range-end",
            day_selected:
              "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
            day_today: "bg-accent text-accent-foreground font-semibold",
            day_outside:
              "day-outside text-muted-foreground opacity-50 aria-selected:bg-accent/50 aria-selected:text-muted-foreground aria-selected:opacity-30",
            day_disabled: "text-muted-foreground opacity-50",
            day_range_middle:
              "aria-selected:bg-accent aria-selected:text-accent-foreground",
            day_hidden: "invisible",
          }}
        />
      </PopoverContent>
    </Popover>
  );
}
