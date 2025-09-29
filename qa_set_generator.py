import pandas as pd
import requests
import json

# Enough data for our use case
DATA_SAMPLE_URL: str = "https://nlp.cs.washington.edu/triviaqa/sample.html"

html = requests.get(DATA_SAMPLE_URL).text
df = pd.read_html(html)[0]
df = df[['QuestionId', 'Question', 'Answer']]

output_json = [{
    "id": "sub_1",
    "queueId": "queue_1",
    "labelingTaskId": "task_1",
    "createdAt": 1690000000000,
    "questions": [],
    "answers": {}
  }]

#rowCount = 0
for i, row in df.iterrows():
    # Limit number of rows
    #rowCount += 1
    #if rowCount > 5:
    #    break

    question_id, question, answer = row
    output_json[0]["questions"].append({
        "rev": 1,
        "data": {
            "id": question_id,
            "questionType": "single_choice_with_reasoning",
            "questionText": question
        }
    })
    output_json[0]["answers"][question_id] = {
        "choice": answer,
        "reasoning": answer
    }

with open("sample_input_large.json", "w") as f:
    f.write(json.dumps(output_json))


