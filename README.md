# "AI Judge" Coding Assignment

## How to set up

1) (Optional) to install the right version of Node/npm, [download nvm](https://github.com/nvm-sh/nvm) then use `nvm install`. This will install `npm v10.9.2` and `node v22.14.0`.
2) Run `npm i`
3) (Optional) to ensure the database and other backend services are working correctly, run `npm test`
4) Set up an `.env` file on the root folder (the one containing `package.json` etc.). The `.env` file contains the following:

*If you are using groq as the LLM provider*:
```
DB_PATH=sqlite.db
LLM_BACKEND=groq
GROQ_API_KEY=<groq api key>
```

*If you are using OpenAI as the LLM provider*:
```
DB_PATH=sqlite.db
LLM_BACKEND=openai
OPENAI_API_KEY=<openai api key>
```

You can also use `DB_PATH=:memory:` if you wish to have a in-memory database for easier testing.

5) `npm run dev` will open a dev instance of the app at `https://localhost:5173`. Details on how to use the web app is on the home page.

## Screenshots

## Project design decisions and trade-offs

For the back-end, I chose Express.js, allowing me to prototype an HTTP API easily and quickly. As a trade-off, using this doesn't scale really well when the API grows and becomes complex, and Express.js has limited functionality which a larger service might need. Use of middlewares is required, for instance, with file upload, where I used `multer`. The back-end is connected with the front-end, so that `npm run dev` can run both the Vite app and the database at the same time.

The database used is SQLite. The upside is that it is really easy to use for prototyping, and because it is an embedded database, it allows for efficient querying which would be slower on client/server architecture SQL databases such as MySQL or PostgreSQL. It easily
scales to millions of entries. However, the downside is that SQLite needs to be managed manually, stores all the data in a file, which could become accidentally corrupted or destroyed. Serverless/BaaS alternatives like Firebase, Supabase, or DynamoDB can be used if hosting is undesirable or an easy interface to the database is preferred. 

For the front-end, `shadcn-ui` was used for quick, easy, beautiful, reusable React components. They can also be customized as needed. There are little tradeoffs to using a component library like shadcn's, if not that the components might be a little bloated in functionality, because the library is trying to cover everyone's use case.

LLMs are called using Vercel's `ai` library. This allows for a unified simple interface between different providers. The downside is that individual providers might offer extra features that aren't supported by `ai`'s API. However this is a non-issue for our use-case.

## Time spent

The approximate time spent on individual components is as follows:

Total: ~20 hours, over the weekend

- Choice of libraries/frameworks, setting up environment: 1 hour
- Front-end (10 hours):
  - Judges page: 4 hours
  - Queues page: 4 hours
  - Evaluations page: 2 hours
- Back-end (8 hours):
  - Setting up DB: 1 hour
  - Writing unit tests: 1 hour
  - Designing schema: 1 hour
  - Database API: 2 hours
  - HTTP API: 3 hours

## Future improvements

- Improved run system (ability to pause, cancel, see progress...)
- Support for attachments
- Batch processing for LLM evaluations