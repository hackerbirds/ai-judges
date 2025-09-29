import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  useReactTable,
} from "@tanstack/react-table";
import React from "react";
import { assignJudges, fetchQueueRows, uploadSubmissionsJson } from "@/api.js";
import { Button } from "@/components/ui/button";
import { useEffect, useMemo, useState } from "react";
import { Input } from "@/components/ui/input.js";
import { Label } from "@/components/ui/label.js";
import { QueueRow } from "src/server/database.js";
import { SelectJudgesDialog } from "./SelectJudgesDialog.js";
import {
  Answer,
  Judge,
  QuestionType,
  SingleAnswerWithReasoning,
} from "@/types.js";
import { fetchJudges } from "@/api.js";
import { cn } from "@/lib/utils.js";
import { QueueRunSelector } from "./QueueRunSelector.js";
import { Checkbox } from "@/components/ui/checkbox.js";
import { VirtualizedTableBody } from "./VirtualizedTable.js";

export default function QueuesTab() {
  const [queueRows, setQueueRows] = useState<QueueRow[]>([]);
  const [rowSelection, setRowSelection] = useState({});

  const queueIds = useMemo<Set<string>>(() => {
    return new Set(queueRows.map((row) => row.queueId));
  }, [queueRows]);

  // Asynchronously load activated judges from backend
  const [availableJudges, setAvailableJudges] = useState<Judge[]>([]);
  useEffect(() => {
    fetchJudges().then((judges) => setAvailableJudges(judges));
  }, []);

  // For virtualizer
  const tableContainerRef = React.useRef<HTMLDivElement>(null);

  const columns: ColumnDef<QueueRow>[] = [
    {
      id: "select",
      size: 30,
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "queueId",
      header: "Queue ID",
    },
    {
      accessorKey: "submissionId",
      header: "Submission ID",
    },
    {
      accessorKey: "questionText",
      header: "Question",
      size: 500,
      cell: ({ row }) => {
        return (
          <div
            className="overflow-x-scroll w-min max-w-100"
            style={{ scrollbarWidth: "none" }}
          >
            {row.original.questionText}
          </div>
        );
      },
    },
    {
      accessorKey: "answer",
      header: "Answer",
      size: 300,
      cell: ({ row }) => {
        const answer: Answer = row.original.answer;
        const questionType: QuestionType = row.original.questionType;
        return (
          <div className="overflow-x-hidden w-min max-w-80">
            {questionType == "single_choice_with_reasoning"
              ? (answer as SingleAnswerWithReasoning).choice
              : JSON.stringify(answer)}
          </div>
        );
      },
    },
    {
      accessorKey: "judges",
      header: "Judges",
      cell: ({ row }) => {
        const assignedJudges =
          row.original.judges === null ? [] : row.original.judges;
        return (
          <div className="flex justify-start items-center overflow-y-scroll w-full">
            <SelectJudgesDialog
              type="individual"
              availableJudges={availableJudges}
              selectedModels={assignedJudges.map((j) => j.name)}
              onSelectModels={(judgeNames) => {
                const judges: Judge[] = judgeNames.flatMap((name) =>
                  availableJudges.filter((j) => j.name == name),
                );
                assignJudges(row.original.questionId, judges).then((qRows) =>
                  setQueueRows(qRows),
                );
              }}
            />
            <div className="flex flex-wrap p-1 text-white">
              {assignedJudges.map((j) => (
                <b
                  key={j.name}
                  className={cn(
                    "bg-primary w-fit text-xs rounded-sm p-0.5 pl-1 pr-1 m-0.5",
                    j.active == null && "opacity-30",
                  )}
                >
                  {j.name}
                </b>
              ))}
            </div>
          </div>
        );
      },
    },
  ];

  const [selectedFile, setSelectedFile] = useState<File>();

  const fetchData = () => {
    fetchQueueRows().then((s) => {
      setQueueRows(s);
    });
  };

  useEffect(fetchData, []);
  useEffect(() => {
    if (selectedFile) {
      uploadSubmissionsJson(selectedFile).then((s) => {
        setQueueRows(s);
      });
    }
  }, [selectedFile, setSelectedFile]);

  const table = useReactTable({
    data: queueRows,
    columns,
    getCoreRowModel: getCoreRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      rowSelection,
    },
  });

  const [assignedJudgesForAll, setAssignedJudgesForAll] = useState<string[]>(
    [],
  );

  return (
    <div className="container h-full mx-auto py-10">
      <h1 className="font-bold text-2xl mb-4">Queues</h1>
      <div className="flex items-center justify-start space-x-2 py-4">
        <Button size="sm" onClick={fetchData}>
          Reload
        </Button>
        {table.getFilteredSelectedRowModel().rows.length > 0 && (
          <SelectJudgesDialog
            type="global"
            availableJudges={availableJudges}
            selectedModels={assignedJudgesForAll}
            onSelectModels={(judgeNames) => {
              const judges: Judge[] = judgeNames.flatMap((name) =>
                availableJudges.filter((j) => j.name == name),
              );
              for (const row of table.getFilteredSelectedRowModel().rows) {
                assignJudges(row.original.questionId, judges).then((qRows) =>
                  setQueueRows(qRows),
                );
              }
              setAssignedJudgesForAll(judgeNames);
            }}
          />
        )}
        <div className="grow"></div>
        {queueRows.length > 0 ? (
          <QueueRunSelector queueIds={queueIds} />
        ) : (
          <div className="w-ml-4 flex gap-2">
            <Label htmlFor="file">Import from JSON</Label>
            <Input
              className="pt-1.5"
              id="file"
              type="file"
              onChange={(e) => {
                if (e.target.files && e.target.files.length > 0)
                  setSelectedFile(e.target.files[0]);
              }}
            />
          </div>
        )}
      </div>
      <div
        className="overflow-hidden rounded-md border"
        ref={tableContainerRef}
        style={{
          overflow: "auto", //our scrollable table container
          position: "relative", //needed for sticky header
          height: "500px", //should be a fixed height
        }}
      >
        <table style={{ display: "grid" }}>
          <thead
            className="bg-orange-100 p-2"
            style={{
              display: "grid",
              position: "sticky",
              top: 0,
              zIndex: 1,
            }}
          >
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id} className="flex w-fit">
                {headerGroup.headers.map((header) => {
                  return (
                    <th
                      key={header.id}
                      className="mr-2"
                      style={{
                        display: "flex",
                        width: header.getSize(),
                      }}
                    >
                      <div
                        {...{
                          className: header.column.getCanSort()
                            ? "cursor-pointer select-none"
                            : "",
                          onClick: header.column.getToggleSortingHandler(),
                        }}
                      >
                        {flexRender(
                          header.column.columnDef.header,
                          header.getContext(),
                        )}
                        {{
                          asc: " 🔼",
                          desc: " 🔽",
                        }[header.column.getIsSorted() as string] ?? null}
                      </div>
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <VirtualizedTableBody
            table={table}
            tableContainerRef={tableContainerRef}
          />
        </table>
      </div>
    </div>
  );
}
