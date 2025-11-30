"use client";

import React, { Suspense } from "react";
import {
  Table as ShadcnTable,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowUpDown, ArrowUp, ArrowDown, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useRouter, useSearchParams } from "next/navigation";

type ColumnFilter = {
  type: "select";
  options: { value: string; label: string }[];
  defaultValue?: string;
  paramKey?: string;
};

export type TableColumn = {
  header: string;
  accessor: string;
  className?: string;
  filter?: ColumnFilter;
  sortable?: boolean;
};

function TableContent<T extends Record<string, unknown>>({
  columns,
  renderRow,
  data,
}: {
  columns: TableColumn[];
  renderRow: (row: T) => React.ReactNode;
  data: T[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleFilterChange = (paramKey: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== "ALL") {
      params.set(paramKey, value);
    } else {
      params.delete(paramKey);
    }
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const handleSort = (accessor: string, order: "asc" | "desc") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", accessor);
    params.set("order", order);
    params.set("page", "1");
    router.push(`?${params.toString()}`);
  };

  const getCurrentSort = (accessor: string) => {
    const sort = searchParams.get("sort");
    const order = searchParams.get("order");
    if (sort === accessor) {
      return order === "desc" ? "desc" : "asc";
    }
    return null;
  };

  return (
    <div className="rounded-md border">
      <ShadcnTable>
        <TableHeader>
          <TableRow>
            {columns.map((column, index) => {
              const currentSort = column.sortable ? getCurrentSort(column.accessor) : null;
              const hasFilter = !!column.filter;
              const hasSort = !!column.sortable;
              const isFirstColumn = index === 0;
              const isClickable = hasFilter || hasSort;

              return (
                <TableHead 
                  key={column.accessor} 
                  className={`${column.className || ""} ${isFirstColumn && isClickable ? "pl-4" : ""}`}
                >
                  {(hasFilter || hasSort) ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 data-[state=open]:bg-accent -ml-3"
                        >
                          <span>{column.header}</span>
                          {currentSort === "asc" ? (
                            <ArrowUp className="ml-2 h-4 w-4" />
                          ) : currentSort === "desc" ? (
                            <ArrowDown className="ml-2 h-4 w-4" />
                          ) : (
                            <ArrowUpDown className="ml-2 h-4 w-4" />
                          )}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start">
                        {hasSort && (
                          <>
                            {/* <DropdownMenuLabel>Sort</DropdownMenuLabel> */}
                            <DropdownMenuItem
                              onClick={() => handleSort(column.accessor, "asc")}
                            >
                              <ArrowUp className="h-4 w-4" />
                              Asc
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleSort(column.accessor, "desc")}
                            >
                              <ArrowDown className="h-4 w-4" />
                              Desc
                            </DropdownMenuItem>
                            {currentSort && (
                              <DropdownMenuItem
                                onClick={() => {
                                  const params = new URLSearchParams(searchParams.toString());
                                  params.delete("sort");
                                  params.delete("order");
                                  router.push(`?${params.toString()}`);
                                }}
                              >
                                <X className="h-4 w-4" />
                                Clear
                              </DropdownMenuItem>
                            )}
                          </>
                        )}
                        {hasFilter && hasSort && <DropdownMenuSeparator />}
                        {hasFilter && (
                          <>
                            {/* <DropdownMenuLabel>Filter</DropdownMenuLabel> */}
                            {column.filter!.options.map((option) => {
                              const currentValue = searchParams.get(column.filter!.paramKey || column.accessor) || column.filter!.defaultValue || "ALL";
                              const isSelected = currentValue === option.value;
                              return (
                                <DropdownMenuItem
                                  key={option.value}
                                  onClick={() =>
                                    handleFilterChange(column.filter!.paramKey || column.accessor, option.value)
                                  }
                                  className={isSelected ? "bg-accent" : ""}
                                >
                                  {isSelected && <Check className="mr-2 h-4 w-4" />}
                                  {!isSelected && <span className="mr-2 h-4 w-4" />}
                                  {option.label}
                                </DropdownMenuItem>
                              );
                            })}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <span>{column.header}</span>
                  )}
                </TableHead>
              );
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.length > 0 ? (
            data.map((row) => renderRow(row))
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
      </ShadcnTable>
    </div>
  );
}

export default function Table<T extends Record<string, unknown>>(
  props: {
    columns: TableColumn[];
    renderRow: (row: T) => React.ReactNode;
    data: T[];
  }
) {
  return (
    <Suspense fallback={<div className="rounded-md border p-4">Loading table...</div>}>
      <TableContent {...props} />
    </Suspense>
  );
}
