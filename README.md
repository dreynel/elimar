# EVT

Project structure:

- `frontend/` contains the Next.js client app
- `backend/` contains the Express + MySQL API

Install dependencies:

- `npm install` installs root tooling
- `npm --prefix frontend install` installs frontend dependencies
- `npm --prefix backend install` installs backend dependencies

Root commands:

- `npm run dev` starts both frontend and backend
- `npm run dev:frontend` starts only the frontend
- `npm run dev:backend` starts only the backend
- `npm run build` builds both apps

Render deployment:

- `render.yaml` defines the npm-based monorepo setup for `frontend/` and `backend/`
- backend supports a single `DATABASE_URL` env var in production
- frontend should set `NEXT_PUBLIC_API_URL` to the deployed backend URL
