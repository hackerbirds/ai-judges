import { fetchRunIds } from "@/api";
import { useEffect, useState } from "react";
import RunStatistics from "./RunStatistics";

export default function StatisticsPage() {
  const [runIds, setRunIds] = useState<string[]>([]);

  useEffect(() => {
    fetchRunIds().then(setRunIds);
  }, []);

  return (
    <div className="container h-full mx-auto py-10">
      <h1 className="font-bold text-2xl mb-4">Runs</h1>
      {runIds.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 p-4">
          {runIds.map((runId) => {
            return <RunStatistics key={runId} runId={runId} />;
          })}
        </div>
      ) : (
        <span>
          There are no runs available. Create a run in the <b>Queues</b> page.
        </span>
      )}
    </div>
  );
}
