import { expect, test } from "vitest";
import { open } from "sqlite";
import { Database } from "sqlite3";
import { QueueRow, SqliteDb } from "./database.js";
import { Judge, JudgeQuestion } from "@/types.js";
import { ask_judge } from "./judges.js";

import "dotenv/config";
import { groq } from "@ai-sdk/groq";

test("Judges CRUD in Sqlite database", async () => {
  const sqlite = await open({
    filename: ":memory:",
    driver: Database,
  });

  const db = new SqliteDb(sqlite);

  await db.initTables();

  expect(await db.getJudges()).toStrictEqual([]);

  const testJudge1: Judge = {
    name: "test1 name",
    model: "test1 model",
    systemPrompt: "test1 prompt",
    active: null,
  };

  const testJudge2: Judge = {
    name: "test2 name",
    model: "test2 model",
    systemPrompt: "test2 prompt",
    active: 123,
  };

  const testJudge2Edited: Judge = {
    name: "test2 name",
    model: "test2 new model",
    systemPrompt: "test2 new prompt",
    active: null,
  };

  await db.addJudge(testJudge1);
  expect(await db.getJudges()).toEqual([testJudge1]);
  await db.addJudge(testJudge2);
  expect(await db.getJudges()).toEqual([testJudge1, testJudge2]);

  await db.editJudge(testJudge2, testJudge2Edited);
  expect(await db.getJudges()).toEqual([testJudge1, testJudge2Edited]);

  await db.editJudge(testJudge2Edited, testJudge2);
  expect(await db.getJudges()).toEqual([testJudge1, testJudge2]);

  await db.removeJudge(testJudge1);
  expect(await db.getJudges()).toEqual([testJudge2]);

  // Same name, so testJudge2 gets deleted
  await db.removeJudge(testJudge2Edited);
  expect(await db.getJudges()).toEqual([]);
});

test("Submissions in Sqlite Database", async () => {
  const sqlite = await open({
    filename: ":memory:",
    driver: Database,
  });

  const db = new SqliteDb(sqlite);
  await db.initTables();

  const testSubmission1 = {
    id: "sub_1",
    queueId: "queue_1",
    labelingTaskId: "task_1",
    createdAt: 1690000000000,
    questions: [
      {
        rev: 1,
        data: {
          id: "q_template_1",
          questionType: "single_choice_with_reasoning",
          questionText: "Is the sky blue?",
        },
      },
    ],
    answers: {
      q_template_1: {
        choice: "yes",
        reasoning: "Observed on a clear day.",
      },
    },
  };

  expect(await db.getQueueData()).toStrictEqual([]);

  await db.addSubmission(testSubmission1);

  const judge: Judge = {
    name: "test1 name",
    model: "test1 model",
    systemPrompt: "test1 prompt",
    active: null,
  };

  await db.addJudge(judge);

  const expectedQueueRow: QueueRow = {
    queueId: "queue_1",
    submissionId: "sub_1",
    questionText: "Is the sky blue?",
    questionType: "single_choice_with_reasoning",
    questionId: "q_template_1",
    answer: testSubmission1.answers["q_template_1"],
    judges: [judge],
  };

  await db.assignJudgesToQuestion(expectedQueueRow.questionId, [judge]);
  expect(await db.getQueueData()).toEqual([expectedQueueRow]);
});

test("Evaluations in Sqlite Database", async () => {
  const sqlite = await open({
    filename: ":memory:",
    driver: Database,
  });

  const db = new SqliteDb(sqlite);
  await db.initTables();

  const testSubmission1 = {
    id: "sub_1",
    queueId: "queue_1",
    labelingTaskId: "task_1",
    createdAt: 1690000000000,
    questions: [
      {
        rev: 1,
        data: {
          id: "q_template_1",
          questionType: "single_choice_with_reasoning",
          questionText: "Is the sky blue?",
        },
      },
      {
        rev: 1,
        data: {
          id: "q_template_2",
          questionType: "single_choice_without_reasoning",
          questionText: "Does 1 + 1 equal 2?",
        },
      },
    ],
    answers: {
      q_template_1: {
        choice: "yes",
        reasoning: "Observed on a clear day.",
      },
      q_template_2: {
        choice: "yes",
      },
    },
  };

  await db.addSubmission(testSubmission1);

  const judge: Judge = {
    name: "test1 name",
    model: "test1 model",
    systemPrompt: "test1 prompt",
    active: 13519,
  };

  const judge2: Judge = {
    name: "test2 name",
    model: "test2 model",
    systemPrompt: "test1 prompt",
    active: 955138,
  };

  const questionId = "q_template_1";
  const questionId2 = "q_template_2";

  await db.addJudge(judge);
  await db.addJudge(judge2);
  await db.assignJudgesToQuestion(questionId, [judge, judge2]);
  await db.assignJudgesToQuestion(questionId2, [judge2]);

  const runId = "run id test";
  const timestamp1 = await db.addEvaluation(runId, {
    queueId: testSubmission1.queueId,
    questionId: questionId,
    judge: judge,
    verdict: "pass",
    reasoning: "reasoning",
  });

  const timestamp2 = await db.addEvaluation(runId, {
    queueId: testSubmission1.queueId,
    questionId: questionId,
    judge: judge2,
    verdict: "fail",
    reasoning: null,
  });

  const timestamp3 = await db.addEvaluation(runId, {
    queueId: testSubmission1.queueId,
    questionId: questionId2,
    judge: judge2,
    verdict: "pass",
    reasoning: "1 + 1 = 2, so the answer is yes.",
  });

  expect(await db.getJudgeVerdictStatistics(runId, judge)).toEqual({
    totalEvals: 1,
    passEvals: 1,
    failEvals: 0,
  });

  expect(await db.getJudgeVerdictStatistics(runId, judge2)).toEqual({
    totalEvals: 2,
    passEvals: 1,
    failEvals: 1,
  });

  expect(await db.getResults()).toEqual([
    {
      runId,
      queueId: testSubmission1.queueId,
      submissionId: testSubmission1.id,
      questionText: testSubmission1.questions[0].data.questionText,
      questionType: testSubmission1.questions[0].data.questionType,
      judge: judge,
      verdict: "pass",
      reasoning: "reasoning",
      created: timestamp1,
      answer: testSubmission1.answers[questionId],
    },
    {
      runId,
      queueId: testSubmission1.queueId,
      submissionId: testSubmission1.id,
      questionText: testSubmission1.questions[0].data.questionText,
      questionType: testSubmission1.questions[0].data.questionType,
      judge: judge2,
      verdict: "fail",
      reasoning: null,
      created: timestamp2,
      answer: testSubmission1.answers[questionId],
    },
    {
      runId,
      queueId: testSubmission1.queueId,
      submissionId: testSubmission1.id,
      questionText: testSubmission1.questions[1].data.questionText,
      questionType: testSubmission1.questions[1].data.questionType,
      judge: judge2,
      verdict: "pass",
      reasoning: "1 + 1 = 2, so the answer is yes.",
      created: timestamp3,
      answer: testSubmission1.answers[questionId2],
    },
  ]);

  expect(await db.getEvaluationData(testSubmission1.queueId)).toEqual([
    {
      answer: testSubmission1.answers[questionId],
      judge: judge,
      questionText: "Is the sky blue?",
      questionId: questionId,
      queueId: "queue_1",
      submissionId: "sub_1",
    },
    {
      answer: testSubmission1.answers[questionId],
      judge: judge2,
      questionText: "Is the sky blue?",
      questionId: questionId,
      queueId: "queue_1",
      submissionId: "sub_1",
    },
    {
      answer: testSubmission1.answers[questionId2],
      judge: judge2,
      questionText: testSubmission1.questions[1].data.questionText,
      questionId: questionId2,
      queueId: "queue_1",
      submissionId: "sub_1",
    },
  ]);
});

test("Ask judge with groq backend", async () => {
  const llmModel = "llama-3.1-8b-instant";
  const judgePass: Judge = {
    name: "Pass Judge",
    model: llmModel,
    systemPrompt: 'You are only able to respond "pass".',
    active: Date.now(),
  };

  const judgeFail: Judge = {
    name: "Fail Judge",
    model: llmModel,
    systemPrompt: 'You are only able to respond "fail".',
    active: Date.now(),
  };

  const judgeTest: Judge = {
    name: "Test Judge",
    model: llmModel,
    systemPrompt: 'You are only able to respond "test".',
    active: Date.now(),
  };

  const judgeQuestion: JudgeQuestion = {
    questionText: "Is 1+1 = 2?",
    answer: {
      choice: "yes",
    },
  };

  const llm = groq.languageModel("llama-3.1-8b-instant");
  const [verdict, reasoning] = await ask_judge(judgeTest, judgeQuestion, llm);

  expect(reasoning).toBeUndefined();
  // verdict is of the `Verdict` type, which takes anything
  // that isn't `pass` or `fail` as `inconclusive`.
  expect(verdict).toEqual("inconclusive");

  const [verdictFail, reasoningFail] = await ask_judge(
    judgeFail,
    judgeQuestion,
    llm,
  );

  expect(reasoningFail).toBeUndefined();
  // verdict is of the `Verdict` type, which takes anything
  // that isn't `pass` or `fail` as `inconclusive`.
  expect(verdictFail).toEqual("fail");

  const [verdictPass, reasoningPass] = await ask_judge(
    judgePass,
    judgeQuestion,
    llm,
  );

  expect(reasoningPass).toBeUndefined();
  // verdict is of the `Verdict` type, which takes anything
  // that isn't `pass` or `fail` as `inconclusive`.
  expect(verdictPass).toEqual("pass");
});
