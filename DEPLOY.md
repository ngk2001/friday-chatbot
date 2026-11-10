# Deploying F.R.I.D.A.Y Live for $0/month (Vercel + Neon/Supabase)

Your laptop does **not** need to stay on — everything runs in the cloud.

## 1. Create a Free PostgreSQL Database (500 MB free)
Choose either **Neon** (recommended, fastest setup) or **Supabase**:
- **Neon:** https://neon.tech → Create Project → Copy the `DATABASE_URL` connection string.
- **Supabase:** https://supabase.com → New Project → Project Settings → Database → Connection String (URI).

## 2. Get Your Free Gemini API Key
- Go to https://aistudio.google.com/apikey → Create API key → Copy `GOOGLE_GENERATIVE_AI_API_KEY`.
- *(Optional)* Get a free fallback key at https://console.groq.com (`GROQ_API_KEY`).

## 3. Push Tables to Your Cloud Database
Run once from your terminal with your cloud `DATABASE_URL`:
```powershell
$env:DATABASE_URL="postgresql://..."
npx prisma db push
```

## 4. Deploy to Vercel (Free Hobby Plan)
1. Push this repository to GitHub (`.env` and `.env.local` are ignored by `.gitignore`).
2. Go to https://vercel.com/new and import your GitHub repository.
3. Add these **Environment Variables** in Vercel:
   - `DATABASE_URL` = your Neon/Supabase PostgreSQL URL
   - `AUTH_SECRET` = any 32+ character random string
   - `NEXTAUTH_SECRET` = same random string
   - `NEXTAUTH_URL` = `https://your-project.vercel.app`
   - `GOOGLE_GENERATIVE_AI_API_KEY` = your Gemini API key
   - `GROQ_API_KEY` = *(optional)* your Groq API key
4. Click **Deploy**. Vercel will run `npx prisma generate && npm run build` automatically.

