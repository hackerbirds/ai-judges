import { Answer, Judge, JudgeQuestion, Verdict } from "@/types.js";
import { groq } from "@ai-sdk/groq";
import { openai } from "@ai-sdk/openai";
import { generateText, LanguageModel } from "ai";

const DEFAULT_LLM = groq.languageModel;

export async function ask_judge(
  judge: Judge,
  question: JudgeQuestion,
  llm: LanguageModel,
): Promise<[Verdict, string | undefined]> {
  const { text, reasoningText } = await generateText({
    model: llm,
    system: judge.systemPrompt,
    prompt: JSON.stringify(question),
    maxRetries: 5,
  });

  // Validate judge response into a type that's safe to use. Anything that isn't "pass" or "fail"
  // will default to "inconclusive"
  if (text.startsWith("pass")) return ["pass", reasoningText];
  else if (text.startsWith("fail")) return ["fail", reasoningText];
  else if (!text.startsWith("inconclusive"))
    console.warn(`Unexpected LLM response outside verdict: "${text}"`);
  return ["inconclusive", reasoningText];
}

export type EvaluationData = {
  queueId: string;
  submissionId: string;
  questionId: string;
  questionText: string;
  answer: Answer;
  judge: Judge;
};

export type EvaluationRow = {
  queueId: string;
  questionId: string;
  judge: Judge;
  verdict: Verdict;
  reasoning: string | null;
};

export type EvaluationReport = {
  totalReqCount: number;
  failedReqCount: number;
  passCount: number;
  failCount: number;
};

export const AVAILABLE_MODELS: string[] =
  process.env.LLM_BACKEND && process.env.LLM_BACKEND == "groq"
    ? // GROQ
      [
        "llama-3.1-8b-instant",
        "llama-3.3-70b-versatile",
        "openai/gpt-oss-120b",
        "openai/gpt-oss-20b",
      ]
    : // OpenAI
      ["gpt-4.1", "gpt-5", "gpt-5-mini", "gpt-5-nano", "gpt-4o"];

export async function run_queue(
  evaluationData: EvaluationData[],
): Promise<[EvaluationRow[], EvaluationReport]> {
  let totalReqCount = 0;
  let failedReqCount = 0;
  let passCount = 0;
  let failCount = 0;

  const evaluationRows: EvaluationRow[] = [];
  const promises = [];

  for (const e of evaluationData) {
    // Choose LLM backend from `.env`, defaulting to `groq`
    const llm: LanguageModel = process.env.LLM_BACKEND
      ? process.env.LLM_BACKEND == "openai"
        ? openai.languageModel(e.judge.model)
        : groq.languageModel(e.judge.model)
      : DEFAULT_LLM(e.judge.model);

    try {
      const resp = ask_judge(
        e.judge,
        {
          questionText: e.questionText,
          answer: e.answer,
        },
        llm,
      );

      promises.push(resp);
    } catch (e) {
      console.error("Error asking LLM:", e);
      failedReqCount += 1;
    }
    totalReqCount += 1;
  }

  const resps = await Promise.all(promises);
  evaluationData.forEach((e, i) => {
    const [verdict, reasoning] = resps[i];

    switch (verdict) {
      case "pass":
        passCount += 1;
        break;
      case "fail":
        failCount += 1;
        break;
      case "inconclusive":
      default:
        break;
    }

    evaluationRows.push({
      queueId: e.queueId,
      questionId: e.questionId,
      judge: e.judge,
      verdict,
      reasoning: reasoning ? reasoning : null,
    });
  });

  return [
    evaluationRows,
    { totalReqCount, failedReqCount, passCount, failCount },
  ];
}
