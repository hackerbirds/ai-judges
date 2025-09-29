// Copied from server for now

import { Judge, Queue } from "@/types";
import { PassStatistics, QueueRow, ResultsRow } from "src/server/database";
import { EvaluationReport } from "src/server/judges";

export async function runEvaluationOnQueue(
  queueId: string,
): Promise<{ runId: string; report: EvaluationReport }> {
  const response = await fetch("/api/evaluations/run", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      queueId,
    }),
  });

  return await response.json();
}

export async function fetchQueues(): Promise<Queue[]> {
  const response = await fetch("/api/queues/getAll", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}

export async function fetchResults(): Promise<ResultsRow[]> {
  const response = await fetch("/api/evaluations/getAll", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}

export async function addJudge(judge: Judge): Promise<Judge[]> {
  await fetch("/api/judges/add", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      judge: judge,
    }),
  });

  return fetchJudges();
}

export async function editJudge(
  judge: Judge,
  newJudge: Judge,
): Promise<Judge[]> {
  await fetch("/api/judges/edit", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      judge: judge,
      newJudge: newJudge,
    }),
  });

  return fetchJudges();
}

export async function setJudgeActive(
  judge: Judge,
  activate: boolean,
): Promise<number | null> {
  const response = await fetch("/api/judges/activate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      judge: judge,
      activate: activate,
    }),
  });

  const responseJson = await response.json();
  return responseJson.timestamp;
}

export async function fetchAvailableModels(): Promise<string[]> {
  const response = await fetch("/api/judges/getModels", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}

export async function fetchJudges(): Promise<Judge[]> {
  const response = await fetch("/api/judges/getAll", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}

export async function uploadSubmissionsJson(file: File): Promise<QueueRow[]> {
  const formData = new FormData();

  formData.append("submission", file);

  await fetch("/api/submissions/upload", {
    method: "POST",
    body: formData,
  });

  return fetchQueueRows();
}

export async function assignJudges(
  questionId: string,
  judges: Judge[],
): Promise<QueueRow[]> {
  await fetch("/api/questions/assignJudges", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      questionId,
      judges,
    }),
  });

  return fetchQueueRows();
}

export async function fetchQueueRows(): Promise<QueueRow[]> {
  const response = await fetch("/api/queues/getAll", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}

export async function getRowPassStatistics(
  runId?: string,
): Promise<PassStatistics> {
  const response = await fetch("/api/evaluations/totalPassRate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      runId,
    }),
  });

  return await response.json();
}

export async function getJudgeVerdictStatistics(
  runId: string,
  judge: Judge,
): Promise<PassStatistics> {
  const response = await fetch("/api/judges/verdictStatistics", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      runId,
      judge,
    }),
  });

  return await response.json();
}

export async function fetchRunIds(): Promise<string[]> {
  const response = await fetch("/api/evaluations/getAllRunIds", {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  return await response.json();
}

export async function fetchJudgesFromRun(runId: string): Promise<Judge[]> {
  const response = await fetch("/api/evaluations/getJudgesFromRun", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      runId,
    }),
  });

  return await response.json();
}
