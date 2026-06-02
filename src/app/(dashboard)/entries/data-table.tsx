"use client";

import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  getFilteredRowModel,
  ColumnFiltersState,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { X, Search, Calendar, CalendarDays, Filter, CalendarIcon, ChevronRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  meta?: any;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  meta,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [globalFilter, setGlobalFilter] = useState("");
  const [timeframe, setTimeframe] = useState("all");
  const [dateFilter, setDateFilter] = useState<Date | undefined>(undefined);
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const filteredData = useMemo(() => {
    return data.filter((item: any) => {
      if (timeframe === "all") return true;

      const itemDateObj = new Date(item.loadingDate || item.entryDate);
      if (isNaN(itemDateObj.getTime())) return true;
      
      const now = new Date();
      
      if (timeframe === "custom_date" && dateFilter) {
        return itemDateObj.toDateString() === dateFilter.toDateString();
      }
      
      if (timeframe === "today") {
        return itemDateObj.toDateString() === now.toDateString();
      }
      if (timeframe === "yesterday") {
        const yesterday = new Date(now);
        yesterday.setDate(yesterday.getDate() - 1);
        return itemDateObj.toDateString() === yesterday.toDateString();
      }
      if (timeframe === "this_month") {
        return itemDateObj.getMonth() === now.getMonth() && itemDateObj.getFullYear() === now.getFullYear();
      }
      if (timeframe === "last_month") {
        const lastMonth = new Date(now);
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        return itemDateObj.getMonth() === lastMonth.getMonth() && itemDateObj.getFullYear() === lastMonth.getFullYear();
      }
      if (timeframe === "this_year") {
        return itemDateObj.getFullYear() === now.getFullYear();
      }

      return true;
    });
  }, [data, timeframe, dateFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      sorting: [
        {
          id: "vehicle_date",
          desc: true,
        }
      ],
      pagination: {
        pageSize: 10,
      },
    },
    globalFilterFn: (row, columnId, value) => {
      const val = row.getValue(columnId);
      if (val === null || val === undefined) return false;
      return String(val).toLowerCase().includes(String(value).toLowerCase());
    },
    meta,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    onGlobalFilterChange: setGlobalFilter,
  });


  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-zinc-500" />
          <Input
            placeholder="Search vehicles, companies, brokers..."
            value={globalFilter ?? ""}
            onChange={(event) => setGlobalFilter(event.target.value)}
            className="pl-9 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm"
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger
              className={cn(
                "inline-flex items-center w-[220px] justify-start text-left font-semibold text-xs h-9 px-3 rounded-md bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 shadow-sm hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-50 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-zinc-950 dark:focus-visible:ring-zinc-300",
                timeframe !== "all" && "text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-900/50"
              )}
            >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {timeframe === "all" ? "All Time" : 
                 timeframe === "today" ? "Today" :
                 timeframe === "yesterday" ? "Yesterday" :
                 timeframe === "this_month" ? "This Month" :
                 timeframe === "last_month" ? "Last Month" :
                 timeframe === "this_year" ? "This Year" :
                 timeframe === "custom_date" && dateFilter ? format(dateFilter, "PPP") : 
                 "Filter by Date"}
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0 flex flex-col md:flex-row bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-xl rounded-xl overflow-hidden" align="end">
              <div className="flex flex-col gap-1 p-3 border-b md:border-b-0 md:border-r border-zinc-100 dark:border-zinc-900 w-full md:w-[150px] bg-zinc-50/50 dark:bg-zinc-900/20">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-1 px-2">Presets</span>
                {[
                  { id: "all", label: "All Time" },
                  { id: "today", label: "Today" },
                  { id: "yesterday", label: "Yesterday" },
                  { id: "this_month", label: "This Month" },
                  { id: "last_month", label: "Last Month" },
                  { id: "this_year", label: "This Year" }
                ].map((preset) => (
                  <Button
                    key={preset.id}
                    variant={timeframe === preset.id ? "secondary" : "ghost"}
                    className={cn(
                      "justify-start h-8 text-xs font-semibold px-2 w-full",
                      timeframe === preset.id ? "bg-purple-100/50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400" : "text-zinc-600 dark:text-zinc-400"
                    )}
                    onClick={() => {
                      setTimeframe(preset.id);
                      setDateFilter(undefined);
                      setIsPopoverOpen(false);
                    }}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>
              <div className="p-3">
                <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2 block px-1">Specific Date</span>
                <CalendarComponent
                  mode="single"
                  selected={dateFilter}
                  onSelect={(date) => {
                    if (date) {
                      setDateFilter(date);
                      setTimeframe("custom_date");
                      setIsPopoverOpen(false);
                    }
                  }}
                  className="p-0"
                />
              </div>
            </PopoverContent>
          </Popover>

          {(globalFilter || timeframe !== "all") && (
            <Button
              variant="ghost"
              onClick={() => {
                setGlobalFilter("");
                setTimeframe("all");
              }}
              className="h-9 px-2.5 text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
              title="Clear all filters"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext()
                          )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2 py-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.previousPage()}
          disabled={!table.getCanPreviousPage()}
        >
          Previous
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => table.nextPage()}
          disabled={!table.getCanNextPage()}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
