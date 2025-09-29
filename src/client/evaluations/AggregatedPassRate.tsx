import { getRowPassStatistics } from "@/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useMemo, useState } from "react";
import { ResultsRow } from "src/server/database";

export default function AggregatedPassRate({ rows }: { rows: ResultsRow[] }) {
  const [selectedRun, setSelectedRun] = useState<string>();
  const [passNumber, setPassNumber] = useState<number>();
  const [evalNumber, setEvalNumber] = useState<number>();

  const runIds = useMemo<string[]>(() => {
    return [...new Set(rows.map((r) => r.runId))];
  }, [rows]);

  useEffect(() => {
    if (selectedRun == "all") {
      getRowPassStatistics().then((stats) => {
        setPassNumber(stats.passEvals);
        setEvalNumber(stats.totalEvals);
      });
    } else {
      getRowPassStatistics(selectedRun).then((stats) => {
        setPassNumber(stats.passEvals);
        setEvalNumber(stats.totalEvals);
      });
    }
  }, [selectedRun]);

  return (
    <div className="flex items-center gap-2">
      Aggreggated pass rate:{" "}
      <b>
        {evalNumber && passNumber
          ? evalNumber == 0
            ? 0
            : ((100 * passNumber) / evalNumber).toFixed(1)
          : "..."}
        %
      </b>{" "}
      across <b>{evalNumber ? evalNumber : "..."}</b> evaluations, for{" "}
      <Select onValueChange={setSelectedRun}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="All runs" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Runs</SelectItem>
          {runIds.map((runId) => {
            return (
              <SelectItem key={runId} value={runId}>
                Run #{runId}
              </SelectItem>
            );
          })}
        </SelectContent>
      </Select>
    </div>
  );
}
