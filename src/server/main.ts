import multer from "multer";
import express from "express";
import ViteExpress from "vite-express";

import fs from "node:fs";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

import "dotenv/config";
import { QueueRow, ResultsRow, SqliteDb } from "./database.js";
import { Judge, Submission } from "@/types.js";
import {
  AVAILABLE_MODELS,
  EvaluationReport,
  EvaluationRow,
  run_queue,
} from "./judges.js";

const db_path = process.env.DB_PATH ? process.env.DB_PATH : "sqlite.db";
const sqlite_db = await open({
  filename: db_path,
  driver: sqlite3.Database,
});

export const database = new SqliteDb(sqlite_db);
await database.initTables();

const app = express();
const upload = multer({ dest: "uploads/" });

// Parse request body as 'application/json'
app.use(express.json());

app.get("/api/judges/getModels", async (_, res) => {
  try {
    res.status(200).send(AVAILABLE_MODELS);
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

app.post("/api/judges/add", async (req, res) => {
  try {
    const judge: Judge = req.body.judge;
    await database.addJudge(judge);
    res.status(200).send("OK!");
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

app.post("/api/judges/edit", async (req, res) => {
  try {
    const judge: Judge = req.body.judge;
    const newJudge: Judge = req.body.newJudge;
    await database.editJudge(judge, newJudge);
    res.status(200).send("OK!");
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

app.post("/api/judges/activate", async (req, res) => {
  try {
    const judge: Judge = req.body.judge;
    const activate: boolean = req.body.activate;
    const response = await database.setJudgeActive(judge, activate);
    res.status(200).send({ timestamp: response });
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

app.post("/api/judges/verdictStatistics", async (req, res) => {
  try {
    const judge: Judge = req.body.judge;
    const runId: string = req.body.runId;
    const response = await database.getJudgeVerdictStatistics(runId, judge);
    res.status(200).send(response);
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

app.post("/api/evaluations/totalPassRate", async (req, res) => {
  try {
    const runId: string = req.body.runId;
    const response = await database.getRowPassStatistics(runId);
    res.status(200).send(response);
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

app.get("/api/judges/getAll", async (_, res) => {
  try {
    const result: Judge[] = await database.getJudges();
    res.status(200).send(result);
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

app.post("/api/questions/assignJudges", async (req, res) => {
  try {
    const questionId: string = req.body.questionId;
    const judges: Judge[] = req.body.judges;
    const response = await database.assignJudgesToQuestion(questionId, judges);
    res.status(200).send(response);
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

app.post(
  "/api/submissions/upload",
  upload.single("submission"),
  async (req, res) => {
    try {
      // req.file exists but TS insists it doesn't.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      fs.readFile((req as any).file.path, "utf8", (err, data) => {
        if (err) throw err;

        (JSON.parse(data) as Submission[]).forEach(async (s) => {
          try {
            // Would be better if all the submissions
            // were added in a single transaction, but:
            // 1) non-issue in SQlite: https://sqlite.org/np1queryprob.html
            // 2) we don't really care about atomicity here
            await database.addSubmission(s);
          } catch (e) {
            console.error("Submission couldn't be added to database: " + e);
          }
        });

        res.status(200).send("OK!");
      });
    } catch (e) {
      res.status(500).send("Internal error: " + e);
    }
  },
);

app.get("/api/queues/getAll", async (_, res) => {
  try {
    const result: QueueRow[] = await database.getQueueData();
    res.status(200).send(result);
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

app.get("/api/evaluations/getAll", async (_, res) => {
  try {
    const result: ResultsRow[] = await database.getResults();
    res.status(200).send(result);
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

app.post("/api/evaluations/run", async (req, res) => {
  try {
    const queueId: string = req.body.queueId;
    const runId: string = crypto.randomUUID();
    const evaluationData = await database.getEvaluationData(queueId);
    const runTimestamp = await database.addRun(runId, evaluationData);
    const [evaluation_rows, evaluationReport]: [
      EvaluationRow[],
      EvaluationReport,
    ] = await run_queue(evaluationData);
    for (const evaluation_row of evaluation_rows) {
      await database.addEvaluation(runId, evaluation_row);
    }

    res.status(200).send({
      runId: runId,
      runTimestamp,
      report: evaluationReport,
    });
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

app.get("/api/evaluations/getAllRunIds", async (_, res) => {
  try {
    const runIds: string[] = await database.getRunIds();
    res.status(200).send(runIds);
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

app.post("/api/evaluations/getJudgesFromRun", async (req, res) => {
  try {
    const runId: string = req.body.runId;
    const judges = await database.getJudgesFromRun(runId);
    res.status(200).send(judges);
  } catch (e) {
    res.status(500).send("Internal error: " + e);
  }
});

ViteExpress.listen(app, 5173, () =>
  console.log("Server is listening on port 5173..."),
);
