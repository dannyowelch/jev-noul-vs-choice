# Jev Jaggedness Demo: Noul vs Choice

Interactive Next.js demo showing TypeSafe Jev **jaggedness** — how the same judgment asked as a Noul vs a yes/no Choice can disagree, and how complementary Nouls need not sum to 1.

## What This Demonstrates

Using TypeSafe's [jev-1.13](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md) model, this app shows:

1. **Noul vs Choice Disagreement**: The same question asked as a Noul (absolute probability) can reach a different decision than a yes/no Choice (relative comparison)
2. **Non-Complementary Nouls**: Complementary Noul questions don't necessarily sum to 1.0
3. **Why This Matters**: Choice is relative; Noul is absolute. Never carry a Noul threshold onto a Choice.

## Sources

- [TypeSafe Jev 1.13 Model Jaggedness](https://docs.typesafe.ai/model-jaggedness/jev-1.13.md)
- [Learn Jev: Three Primitives Tutorial](https://learnjev.com/tutorials/three-primitives)

## Run Locally

```bash
# Install dependencies
npm install

# (Optional) Set API key in environment
echo "TYPESAFE_API_KEY=your_key_here" > .env.local

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deploy to Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fdannyowelch%2Fjev-noul-vs-choice)

Set `TYPESAFE_API_KEY` in Vercel environment variables (optional — users can also enter it in the UI).

## How It Works

Each run sends one `systemone` call with three questions:

```typescript
{
  model: "jev-latest",
  state: "<ticket text>",
  questions: {
    as_noul: {
      type: "noul",
      instructions: "<question>"
    },
    as_choice: {
      type: "choice",
      instructions: "<question>",
      criteria: { yes: "Yes", no: "No" }
    },
    negation_noul: {
      type: "noul",
      instructions: "Is it false that: <question>"
    }
  }
}
```

The UI highlights when:
- Noul decision (>0.5) disagrees with Choice winner
- Complementary Nouls sum outside ~0.98–1.02

## Tech Stack

- Next.js 15 (App Router)
- TypeScript
- Tailwind CSS
- TypeSafe API (jev-latest model)