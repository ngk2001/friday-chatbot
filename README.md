# F.R.I.D.A.Y — Multi-User Gemini AI Chatbot

A fast, multi-user AI chatbot built with **Next.js (App Router)**, **NextAuth v5**, **Prisma (PostgreSQL)**, **Google Gemini** (`@ai-sdk/google`), and optional **Groq** fallback (`@ai-sdk/groq`).

## Features
- **Gemini 3 Flash & Multimodal Vision:** Fast streaming responses + compressed image upload/paste analysis (with a 0 KB DB storage toggle).
- **Zero-Storage Voice Assistant:** Browser speech-to-text mic input and text-to-speech auto-reply.
- **Character & HMS SaaS Trainer:** Customize character persona, rules, and inject HMS SaaS documentation per account.
- **Dynamic Sessions & Cypher Terminal UI:** Create, filter, rename, and delete chat sessions with toggleable Cypher terminal styling.
- **Multi-User Authentication:** Email/password auth out of the box plus optional Google & GitHub OAuth.

## Deployment (Vercel + Neon PostgreSQL)
See [DEPLOY.md](./DEPLOY.md) and [`.env.example`](./.env.example) for required environment variables (`DATABASE_URL`, `AUTH_SECRET`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL`, `GOOGLE_GENERATIVE_AI_API_KEY`).
