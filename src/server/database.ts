import { Database } from "sqlite";
import { assert } from "console";
import {
  Answer,
  Judge,
  QuestionType,
  Queue,
  Submission,
  Verdict,
} from "@/types.js";
import { EvaluationData, EvaluationRow } from "./judges.js";

export interface QueueRow {
  queueId: string;
  submissionId: string;
  questionText: string;
  questionType: QuestionType;
  questionId: string;
  answer: Answer;
  judges: Judge[] | null;
}

export interface ResultsRow {
  runId: string;
  queueId: string;
  submissionId: string;
  questionText: string;
  questionType: string;
  answer: string;
  judge: Judge;
  verdict: Verdict;
  reasoning: string | null;
  created: number;
}

export interface PassStatistics {
  totalEvals: number;
  passEvals: number;
  failEvals: number;
  // indeterminate can trivially be figured out
  // by doing totalEvals - passEvals - failEvails
}

export interface DbInterface {
  addJudge(judge: Judge): void;
  editJudge(oldJudge: Judge, newJudge: Judge): void;
  setJudgeActive(judge: Judge, active: boolean): Promise<number | null>;
  getJudges(): Promise<Judge[]>;

  // Visualize submissions
  getQueueData(): Promise<QueueRow[]>;
  assignJudgesToQuestion(questionId: string, judges: Judge[]): void;
  getEvaluationData(queueId: string): Promise<EvaluationData[]>;
  addEvaluation(runId: string, evaluationRow: EvaluationRow): Promise<number>;
  getResults(): Promise<ResultsRow[]>;

  addRun(runId: string, evaluationRows: EvaluationData[]): Promise<number>;
  getRunIds(): Promise<string[]>;

  getJudgeVerdictStatistics(
    runId: string,
    judge: Judge,
  ): Promise<PassStatistics>;

  addSubmission(submission: Submission, queue?: Queue): void;
}

export class SqliteDb implements DbInterface {
  db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  async initTables() {
    /*
            Constraints: 
            - Judges can be assigned individually for each question.
            - Queues MAY have multiple submissions assigned to them.
        */
    await this.db.exec(
      "CREATE TABLE IF NOT EXISTS judges (name TEXT UNIQUE, model TEXT, systemPrompt TEXT, active INTEGER)",
    );

    await this.db.exec(`CREATE TABLE IF NOT EXISTS questions (
            questionId PRIMARY KEY, 
            submissionId TEXT,
            questionText TEXT, 
            questionType TEXT, 
            answer TEXT,
            judgeNames BLOB
        )`);

    await this.db.exec(
      "CREATE TABLE IF NOT EXISTS runs (runId TEXT UNIQUE, started INTEGER, runData TEXT)",
    );

    await this.db.exec(`CREATE TABLE IF NOT EXISTS evaluations (
            runId TEXT,
            queueId TEXT,
            questionId TEXT,
            judge BLOB, 
            verdict TEXT, 
            reasoning TEXT, 
            created INTEGER,
            FOREIGN KEY(queueId) REFERENCES queues(queueId),
            FOREIGN KEY(questionId) REFERENCES questions(questionId),
            FOREIGN KEY(judge) REFERENCES judges(name)
        )`);

    await this.db.exec(`CREATE TABLE IF NOT EXISTS queues (
            queueId TEXT, 
            submissionId TEXT, 
            PRIMARY KEY (queueId, submissionId), 
            FOREIGN KEY (submissionId) REFERENCES questions(submissionId)
        )`);
  }

  async addRun(
    runId: string,
    evaluationData: EvaluationData[],
  ): Promise<number> {
    console.log(`Preparing run ${runId}`);
    const timestamp = Date.now();
    await this.db.run("INSERT INTO runs VALUES ($runId, $started, $runData)", {
      $runId: runId,
      $started: timestamp,
      $runData: JSON.stringify(evaluationData),
    });

    return timestamp;
  }

  async addEvaluation(
    runId: string,
    evaluationRow: EvaluationRow,
  ): Promise<number> {
    const timestamp = Date.now();
    await this.db.run(
      "INSERT INTO evaluations VALUES ($runId, $queueId, $questionId, $judge, $verdict, $reasoning, $created)",
      {
        $runId: runId,
        $queueId: evaluationRow.queueId,
        $questionId: evaluationRow.questionId,
        $judge: JSON.stringify(evaluationRow.judge),
        $verdict: evaluationRow.verdict,
        $reasoning: evaluationRow.reasoning,
        $created: timestamp,
      },
    );

    return timestamp;
  }

  async getResults(): Promise<ResultsRow[]> {
    return (
      await this.db.all<
        {
          runId: string;
          queueId: string;
          submissionId: string;
          questionText: string;
          questionType: string;
          // JSON encoded
          answer: string;
          // JSON encoded
          judge: string;
          verdict: Verdict;
          reasoning: string | null;
          created: number;
        }[]
      >(`SELECT 
                evaluations.runId,
                evaluations.queueId,
                questions.submissionId, 
                questions.questionText, 
                questions.questionType, 
                questions.answer, 
                evaluations.judge,
                evaluations.verdict, 
                evaluations.reasoning, 
                evaluations.created
            FROM questions
            INNER JOIN evaluations ON questions.questionId = evaluations.questionId;`)
    ).map((r) => {
      return {
        runId: r.runId,
        queueId: r.queueId,
        submissionId: r.submissionId,
        questionText: r.questionText,
        questionType: r.questionType,
        answer: JSON.parse(r.answer),
        judge: JSON.parse(r.judge),
        verdict: r.verdict,
        reasoning: r.reasoning,
        created: r.created,
      };
    });
  }

  async assignJudgesToQuestion(questionId: string, judges: Judge[]) {
    await this.db.run(
      `UPDATE questions SET judgeNames = $judgeNames WHERE questionId = $questionId`,
      {
        $questionId: questionId,
        $judgeNames: JSON.stringify(judges.map((j) => j.name)),
      },
    );
  }

  async getQueueData(): Promise<QueueRow[]> {
    const response = await this.db.all<
      {
        queueId: string;
        submissionId: string;
        questionText: string;
        questionType: string;
        questionId: string;
        answer: string;
        judgeNames: string;
      }[]
    >(`SELECT queues.queueId, questions.submissionId, questions.questionText, questions.questionType, questions.questionId, questions.answer, questions.judgeNames
            FROM queues
            INNER JOIN questions ON queues.submissionId = questions.submissionId;`);

    const rows: QueueRow[] = [];
    // Not great, hacky. Better DB schema would likely resolve this
    for (const r of response) {
      if (r.judgeNames == null) {
        rows.push({
          queueId: r.queueId,
          submissionId: r.submissionId,
          questionText: r.questionText,
          questionType: r.questionType,
          questionId: r.questionId,
          answer: JSON.parse(r.answer),
          judges: null,
        });
      } else {
        const judges: Judge[] = [];
        const judgeNames: string[] = JSON.parse(r.judgeNames);
        for (const judgeName of judgeNames) {
          const dbJudge = await this.db.get<Judge>(
            "SELECT name, model, systemPrompt, active FROM judges WHERE name = $name",
            {
              $name: judgeName,
            },
          );
          // Type assertion: Judge that is running for eval exists in db because the client chooses judges that
          // exist in db
          judges.push(dbJudge!);
        }

        rows.push({
          queueId: r.queueId,
          submissionId: r.submissionId,
          questionText: r.questionText,
          questionType: r.questionType,
          questionId: r.questionId,
          answer: JSON.parse(r.answer),
          judges,
        });
      }
    }

    return rows;
  }

  async getJudges(): Promise<Judge[]> {
    return await this.db.all<Judge[]>(
      "SELECT name, model, systemPrompt, active FROM judges",
    );
  }

  async addJudge(judge: Judge) {
    await this.db.run(
      "INSERT INTO judges VALUES ($name, $model, $systemPrompt, $active)",
      {
        $name: judge.name,
        $model: judge.model,
        $systemPrompt: judge.systemPrompt,
        $active: judge.active,
      },
    );
  }

  async editJudge(old_judge: Judge, new_judge: Judge) {
    assert(old_judge.name === new_judge.name);

    await this.db.run(
      "UPDATE judges SET model = $model, systemPrompt = $systemPrompt, active = $active WHERE name = $name",
      {
        $name: old_judge.name,
        $model: new_judge.model,
        $systemPrompt: new_judge.systemPrompt,
        $active: new_judge.active,
      },
    );
  }

  async setJudgeActive(judge: Judge, active: boolean): Promise<number | null> {
    const activatedJudge = structuredClone(judge);
    const timestamp = active ? Date.now() : null;
    activatedJudge.active = timestamp;
    await this.editJudge(judge, activatedJudge);

    return timestamp;
  }

  async removeJudge(judge: Judge) {
    await this.db.run("DELETE FROM judges WHERE name = $name", {
      $name: judge.name,
    });
  }

  async addSubmission(submission: Submission) {
    await this.db.run(
      "INSERT OR IGNORE INTO queues VALUES ($queueId, $submissionId)",
      {
        $queueId: submission.queueId,
        $submissionId: submission.id,
      },
    );

    for (const question of submission.questions) {
      await this.db.run(
        "INSERT OR IGNORE INTO questions VALUES ($questionId, $submissionId, $questionText, $questionType, $answer, $judgeNames)",
        {
          $questionId: question.data.id,
          $submissionId: submission.id,
          $questionText: question.data.questionText,
          $questionType: question.data.questionType,
          $answer: JSON.stringify(submission.answers[question.data.id]),
        },
      );
    }
  }

  async getEvaluationData(queueId: string): Promise<EvaluationData[]> {
    const resp = await this.db.all<
      {
        queueId: string;
        submissionId: string;
        questionId: string;
        questionText: string;
        answer: string;
        judgeNames: string;
      }[]
    >(`SELECT 
                queues.queueId, 
                questions.submissionId, 
                questions.questionId,
                questions.questionText, 
                questions.answer, 
                questions.judgeNames
            FROM queues
            INNER JOIN questions ON queues.submissionId = questions.submissionId;'`);

    const evalDatas: EvaluationData[] = [];
    for (const r of resp) {
      if (r.judgeNames != null) {
        for (const judgeName of JSON.parse(r.judgeNames)) {
          const dbJudge = await this.db.get<Judge>(
            "SELECT name, model, systemPrompt, active FROM judges WHERE name = $name",
            {
              $name: judgeName,
            },
          );

          // Type assertion: Judge that is running for eval exists in db because the client chooses judges that
          // exist in db
          evalDatas.push({
            queueId: queueId,
            submissionId: r.submissionId,
            questionId: r.questionId,
            questionText: r.questionText,
            answer: JSON.parse(r.answer),
            judge: dbJudge!,
          });
        }
      }
    }

    return evalDatas;
  }

  async getRunIds(): Promise<string[]> {
    return (
      await this.db.all<{ runId: string }[]>(
        "SELECT DISTINCT runId FROM runs ORDER BY started DESC",
      )
    ).map((r) => r.runId);
  }

  async getJudgesFromRun(runId: string): Promise<Judge[]> {
    return (
      await this.db.all<{ judge: string }[]>(
        "SELECT DISTINCT judge FROM evaluations WHERE runId = $runId",
        {
          $runId: runId,
        },
      )
    ).map((r) => JSON.parse(r.judge));
  }

  // Very similar to getJudgeVerdictStatistics but for all rows
  async getRowPassStatistics(runId?: string): Promise<PassStatistics> {
    if (runId) {
      const totalEvals = await this.db.get<{ "COUNT(verdict)": number }>(
        "SELECT COUNT(verdict) FROM evaluations WHERE runId = $runId",
        { $runId: runId },
      );
      const passEvals = await this.db.get<{ "COUNT(verdict)": number }>(
        "SELECT COUNT(verdict) FROM evaluations WHERE runId = $runId AND verdict LIKE 'pass'",
        { $runId: runId },
      );
      const failEvals = await this.db.get<{ "COUNT(verdict)": number }>(
        "SELECT COUNT(verdict) FROM evaluations WHERE runId = $runId AND verdict LIKE 'fail'",
        { $runId: runId },
      );

      return {
        totalEvals: totalEvals ? totalEvals["COUNT(verdict)"] : 0,
        passEvals: passEvals ? passEvals["COUNT(verdict)"] : 0,
        failEvals: failEvals ? failEvals["COUNT(verdict)"] : 0,
      };
    } else {
      const totalEvals = await this.db.get<{ "COUNT(verdict)": number }>(
        "SELECT COUNT(verdict) FROM evaluations",
      );
      const passEvals = await this.db.get<{ "COUNT(verdict)": number }>(
        "SELECT COUNT(verdict) FROM evaluations WHERE verdict LIKE 'pass'",
      );
      const failEvals = await this.db.get<{ "COUNT(verdict)": number }>(
        "SELECT COUNT(verdict) FROM evaluations WHERE verdict LIKE 'fail'",
      );

      return {
        totalEvals: totalEvals ? totalEvals["COUNT(verdict)"] : 0,
        passEvals: passEvals ? passEvals["COUNT(verdict)"] : 0,
        failEvals: failEvals ? failEvals["COUNT(verdict)"] : 0,
      };
    }
  }

  async getJudgeVerdictStatistics(
    runId: string,
    judge: Judge,
  ): Promise<PassStatistics> {
    const totalEvals = await this.db.get<{ "COUNT(verdict)": number }>(
      "SELECT COUNT(verdict) FROM evaluations WHERE runId = $runId AND judge = $judge",
      { $runId: runId, $judge: JSON.stringify(judge) },
    );
    const passEvals = await this.db.get<{ "COUNT(verdict)": number }>(
      "SELECT COUNT(verdict) FROM evaluations WHERE runId = $runId AND judge = $judge AND verdict LIKE 'pass'",
      { $runId: runId, $judge: JSON.stringify(judge) },
    );
    const failEvals = await this.db.get<{ "COUNT(verdict)": number }>(
      "SELECT COUNT(verdict) FROM evaluations WHERE runId = $runId AND judge = $judge AND verdict LIKE 'fail'",
      { $runId: runId, $judge: JSON.stringify(judge) },
    );

    return {
      totalEvals: totalEvals ? totalEvals["COUNT(verdict)"] : 0,
      passEvals: passEvals ? passEvals["COUNT(verdict)"] : 0,
      failEvals: failEvals ? failEvals["COUNT(verdict)"] : 0,
    };
  }
}
