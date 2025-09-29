import { Verdict } from "@/types.js";

export function VerdictPill({ verdict: response }: { verdict?: Verdict }) {
  let backgroundColor: string;
  switch (response) {
    case "pass":
      backgroundColor = "#53873cff";
      break;
    case "fail":
      backgroundColor = "#a32d2dff";
      break;
    case "inconclusive":
    default:
      backgroundColor = "#575757ff";
  }
  const responseText = response ? response : "Unanswered";

  return (
    <div
      className="w-fit p-2 h-6 rounded-sm flex text-white text-bold justify-center items-center"
      style={{ backgroundColor }}
    >
      {responseText}
    </div>
  );
}
