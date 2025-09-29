import { cn } from "@/lib/utils";

export default function PassRateBar({
  pass,
  fail,
  total,
}: {
  pass: number;
  fail: number;
  total: number;
}) {
  // Return gray bar if no statisics available
  // (like new judges for example)
  if (total < 1) {
    return (
      <div className="w-full bg-gray-300 h-3 overflow-hidden rounded-xl flex"></div>
    );
  }

  const passRate = Math.max(0, Math.min(pass, total));
  const failRate = Math.max(0, Math.min(fail, total - passRate));
  const passPercent = (passRate / total) * 100;
  const failPercent = (failRate / total) * 100;

  return (
    <div className="w-full h-4 pl-2 pr-2 mb-2 flex">
      <div
        className={cn("bg-green-400")}
        style={{ width: `${passPercent}%` }}
      />
      <div
        className="bg-red-400"
        style={{
          width: `${failPercent}%`,
        }}
      />
      <div
        className="bg-gray-500"
        style={{
          width: `${100 - passPercent - failPercent}%`,
        }}
      />
    </div>
  );
}
