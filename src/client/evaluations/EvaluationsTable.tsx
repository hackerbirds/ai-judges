import { fetchResults } from "@/api.js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  ColumnDef,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  SortingState,
  useReactTable,
} from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { useEffect, useState } from "react";
import { ResultsRow } from "src/server/database";
import { VerdictPill } from "./VerdictPill.js";
import { Answer, QuestionType, SingleAnswerWithReasoning } from "@/types";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "@/components/ui/select.js";
import { SelectValue } from "@radix-ui/react-select";
import AggregatedPassRate from "./AggregatedPassRate.js";

export default function EvaluationsTable() {
  const [rows, setRows] = useState<ResultsRow[]>([]);
  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);

  const [filterColumnSelection, setFilterColumnSelection] =
    useState<string>("");
  const columns: ColumnDef<ResultsRow>[] = [
    {
      id: "runId",
      accessorKey: "runId",
      header: "Run ID",
      cell: ({ row }) => {
        return (
          <pre
            className="overflow-x-scroll text-ellipsis max-w-20"
            style={{ scrollbarWidth: "none" }}
          >
            {row.original.runId}
          </pre>
        );
      },
    },
    {
      id: "queueId",
      accessorKey: "queueId",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Queue ID
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      id: "questionText",
      accessorKey: "questionText",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Question
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div
            className="overflow-x-scroll text-ellipsis max-w-50"
            style={{ scrollbarWidth: "none" }}
          >
            {row.original.questionText}
          </div>
        );
      },
    },
    {
      accessorKey: "questionType",
      id: "questionType",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Question Type
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        );
      },
    },
    {
      accessorKey: "answer",
      id: "answer",
      header: "Answer",
      cell: ({ row }) => {
        const answer: Answer = row.original.answer;
        const questionType: QuestionType = row.original.questionType;
        return (
          <div
            className="overflow-x-scroll text-ellipsis max-w-80"
            style={{ scrollbarWidth: "none" }}
          >
            {questionType == "single_choice_with_reasoning"
              ? (answer as SingleAnswerWithReasoning).choice
              : JSON.stringify(answer)}
          </div>
        );
      },
    },
    {
      accessorKey: "judge.name",
      id: "judge",
      header: "Judge",
    },
    {
      accessorKey: "verdict",
      id: "verdict",
      header: "Verdict",
      cell: ({ row }) => {
        return <VerdictPill verdict={row.original.verdict} />;
      },
    },
    {
      accessorKey: "reasoning",
      id: "reasoning",
      header: "LLM Reasoning",
      cell: ({ row }) => {
        return (
          <div
            className="overflow-x-scroll text-ellipsis max-w-80"
            style={{ scrollbarWidth: "none" }}
          >
            {row.original.reasoning}
          </div>
        );
      },
    },
    {
      accessorKey: "created",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Created
            <ArrowUpDown className="ml-1 h-4 w-4" />
          </Button>
        );
      },
      cell: ({ row }) => {
        return (
          <div className="overflow-x-hidden w-min max-w-80">
            {new Date(row.original.created).toLocaleString()}
          </div>
        );
      },
    },
  ];

  const fetchData = () => {
    fetchResults().then((s) => {
      setRows(s);
    });
  };

  useEffect(fetchData, []);

  const table = useReactTable({
    data: rows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onColumnFiltersChange: setColumnFilters,
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      sorting,
      columnFilters,
    },
  });

  return (
    <>
      <AggregatedPassRate rows={rows} />
      <div className="flex items-center justify-start space-x-2 py-4">
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
        <Button size="sm" onClick={fetchData}>
          Reload
        </Button>
        <div className="grow"></div>
        <div className="flex items-center py-4 gap-2">
          <Select
            onValueChange={(v) => {
              setFilterColumnSelection(v);
            }}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Select a filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                <SelectLabel>Column filter</SelectLabel>
                <SelectItem value="runId">Run ID</SelectItem>
                <SelectItem value="queueId">Queue ID</SelectItem>
                <SelectItem value="questionText">Question text</SelectItem>
                <SelectItem value="judge">Judge</SelectItem>
                <SelectItem value="verdict">Verdict</SelectItem>
              </SelectGroup>
            </SelectContent>
          </Select>
          <Input
            placeholder="Filter input"
            value={
              (table
                .getColumn(filterColumnSelection)
                ?.getFilterValue() as string) ?? ""
            }
            onChange={(event) =>
              table
                .getColumn(filterColumnSelection)
                ?.setFilterValue(event.target.value)
            }
            className="max-w-sm"
          />
        </div>
      </div>
      <div className="overflow-hidden rounded-md border w-full">
        <Table>
          <TableHeader className="bg-orange-100">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
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
                  {row.getVisibleCells().map((cell) => {
                    return (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    );
                  })}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-14 text-justify"
                >
                  No evaluations found
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
