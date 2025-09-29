// Exact types to server. Hacky, because the client and server module are isolated from each other,
// copying the types is the easiest/simple fix, but they need to be synced with each other otherwise
// [de]serialization in the API calls will fail in weird ways

export interface Judge {
  name: string;
  model: string;
  systemPrompt: string;
  active: number | null;
}

export interface Queue {
  queueId: string;
  submissionIds: string[];
  judges: Judge[];
}

export type JudgeQuestion = {
  questionText: string;
  answer: Answer;
};

export type Verdict = "pass" | "fail" | "inconclusive";

// The assumption here is that:
// - All question have an `id` field
// - In our context, all questions also contain
// `questionType` and `questionText` fields.
//
// This may not necessarily be true because since
// `questionType` can be changed, perhaps there can
// be questions with more than one `questionText` (e.g. multiple-choice),
// or other fields we don't know about, however the design document
// implies that the final sample json will follow the sames shape.
//
// Similar issue with `Answer`.
type QuestionData = {
  id: string;
} & {
  questionType: QuestionType;
  questionText: string;
};

/* may be single choice, multiple choice, or free form
    because no specs are given, assume generic string rather
    than union type of string literals */
export type QuestionType = "single_choice_with_reasoning" | string;

export interface Question {
  rev: number;
  // We may end up with different types of question data
  // If we have different types of questions (free form,
  // multiple choice etc.)
  data: QuestionData;
}

// Why the union type with `unknown`? It's because
// the documentation on the sample input shape isn't
// clear about whether there are different types of
// answers or not.
//
// There can be different types of questions
// (`single_choice_with_reasoning` for instance)
// implying the answers can have different shapes too.
//
// Even though it is said the sample JSON will follow
// the same shape, we can't make any hard assumptions here,
// we must acknowledge that `Answer` can have unknown data.
export type Answer = SingleAnswerWithReasoning | unknown;

export type SingleAnswerWithReasoning = {
  /*  
        union type of string literals would be preferred if the choices 
        are known (e.g. "no" | "yes"), however the spec about this is unclear.
    */
  choice: string;
  reasoning: string;
};

export interface Submission {
  id: string;
  queueId: string;
  labelingTaskId: string;
  createdAt: number /* unix epoch */;
  questions: Question[];
  answers: { [key: string]: Answer };
}
