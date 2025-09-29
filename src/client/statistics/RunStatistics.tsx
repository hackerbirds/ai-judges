import { fetchJudgesFromRun } from "@/api";
import { Judge } from "@/types";
import { useEffect, useState } from "react";
import PassRateStatistics from "./PassRateStatistics";

export default function RunStatistics({ runId }: { runId: string }) {
  const [judges, setJudges] = useState<Judge[]>([]);

  useEffect(() => {
    // Load judges that were used in the specific run we're in
    fetchJudgesFromRun(runId).then(setJudges);
  }, []);
  return (
    <div className="overflow-y-scroll p-4 border border-xl flex flex-col gap-2">
      <code className="font-bold">{runId}</code>
      <br />

      {judges.length > 0 ? (
        <>
          <h3 className="text-lg font-bold">Judge statistics</h3>
          <PassRateStatistics judges={judges} runId={runId} />
        </>
      ) : (
        // Assumption: all completed runs have at least one judge.
        // Runs that don't report judges are runs that are added to the database
        // with no evaluations. Therefore they're still in progress.
        <p>This run is still in progress.</p>
      )}
    </div>
  );
}
