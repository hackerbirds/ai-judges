import { getJudgeVerdictStatistics } from "@/api";
import { Judge } from "@/types";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { PassStatistics } from "src/server/database";
import PassRateBar from "./PassRateBar.js";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card.js";
import { cn } from "@/lib/utils.js";

export default function PassRateStatistics({
  runId,
  judges,
}: {
  runId: string;
  judges: Judge[];
}) {
  const [judgeStatistics, setJudgeStatistics] = useState<
    Map<string, PassStatistics>
  >(new Map());

  useEffect(() => {
    for (const judge of judges) {
      getJudgeVerdictStatistics(runId, judge).then((stats) => {
        setJudgeStatistics((m) => new Map(m.set(judge.name, stats)));
      });
    }
  }, [judges]);

  // Sort judges by best pass rate
  const sortedJudges = useMemo<[string, PassStatistics][]>(() => {
    return structuredClone([...judgeStatistics]).sort(([, sA], [, sB]) => {
      return (
        (100 * sB.passEvals) / sB.totalEvals -
        (100 * sA.passEvals) / sA.totalEvals
      );
    });
  }, [judgeStatistics]);

  const percentPill = (className: string, children: ReactNode) => {
    return (
      <b
        className={cn(
          className,
          "pr-2 pl-2 rounded-xl min-w-6 min-h-6 w-fit h-fit flex justify-center items-center",
        )}
      >
        {children}
      </b>
    );
  };

  return (
    <div className="flex flex-col mb-4 w-full">
      {sortedJudges.map(([judgeName, stats]) => {
        return (
          <HoverCard key={judgeName}>
            <HoverCardTrigger asChild>
              <div className="flex flex-col items-start justify-center">
                <code className="pl-4 text-bold">{judgeName}</code>
                <PassRateBar
                  pass={stats.passEvals}
                  fail={stats.failEvals}
                  total={stats.totalEvals}
                />
              </div>
            </HoverCardTrigger>
            <HoverCardContent className="w-100">
              <div className="flex justify-center text-sm gap-1">
                {percentPill(
                  "bg-green-400",
                  <>
                    {stats.passEvals} (
                    {((100 * stats.passEvals) / stats.totalEvals).toFixed(1)} %)
                  </>,
                )}
                {percentPill(
                  "bg-red-400",
                  <>
                    {stats.failEvals} (
                    {((100 * stats.failEvals) / stats.totalEvals).toFixed(1)} %)
                  </>,
                )}
                {percentPill(
                  "bg-gray-400",
                  <>
                    {stats.totalEvals - stats.failEvals - stats.passEvals} (
                    {(
                      (100 *
                        (stats.totalEvals -
                          stats.failEvals -
                          stats.passEvals)) /
                      stats.totalEvals
                    ).toFixed(1)}{" "}
                    %)
                  </>,
                )}
                {percentPill("bg-gray-200", <>{stats.totalEvals}</>)}
              </div>
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
}
