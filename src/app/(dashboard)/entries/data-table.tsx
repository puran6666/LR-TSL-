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
import { X, Search, Calendar, CalendarDays } from "lucide-react";

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
  const [dateFilter, setDateFilter] = useState("");
  const [monthFilter, setMonthFilter] = useState("");

  const filteredData = useMemo(() => {
    return data.filter((item: any) => {
      // Date filter (exact day)
      if (dateFilter) {
        if (!item.entryDate) return false;
        const itemDate = new Date(item.entryDate).toISOString().split('T')[0];
        if (itemDate !== dateFilter) return false;
      }
      
      // Month filter (YYYY-MM)
      if (monthFilter) {
        if (!item.entryDate) return false;
        const itemMonth = new Date(item.entryDate).toISOString().slice(0, 7);
        if (itemMonth !== monthFilter) return false;
      }

      return true;
    });
  }, [data, dateFilter, monthFilter]);

  const table = useReactTable({
    data: filteredData,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
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
          <div className="relative group">
            <Input
              type="month"
              value={monthFilter}
              onChange={(e) => {
                setMonthFilter(e.target.value);
                if (e.target.value) setDateFilter(""); // Clear date if month selected
              }}
              className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm h-9 text-xs w-[140px]"
              title="Filter by Month"
            />
          </div>
          <div className="relative group">
            <Input
              type="date"
              value={dateFilter}
              onChange={(e) => {
                setDateFilter(e.target.value);
                if (e.target.value) setMonthFilter(""); // Clear month if date selected
              }}
              className="bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 shadow-sm h-9 text-xs w-[140px]"
              title="Filter by Date"
            />
          </div>
          {(globalFilter || dateFilter || monthFilter) && (
            <Button
              variant="ghost"
              onClick={() => {
                setGlobalFilter("");
                setDateFilter("");
                setMonthFilter("");
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
