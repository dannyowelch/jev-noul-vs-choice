'use client';

import { useState } from 'react';

const PRESETS = {
  fit: {
    ticket: "I'm not happy with the fit. What are my options here?",
    question: "Is the customer asking for a refund?",
  },
  doubleCharge: {
    ticket: "I was charged twice for the same order. Can someone look into this?",
    question: "Is the customer asking for a refund?",
  },
};

interface NoulAnswer {
  type: 'noul';
  noul: number;
}

interface ChoiceAnswer {
  type: 'choice';
  choice: string;
  probabilities: Record<string, number>;
  confidence: number;
}

interface ApiResponse {
  answers: {
    as_noul: NoulAnswer;
    as_choice: ChoiceAnswer;
    negation_noul: NoulAnswer;
  };
  timing_ms?: number;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
  };
}

export default function Home() {
  const [apiKey, setApiKey] = useState('');
  const [ticket, setTicket] = useState(PRESETS.fit.ticket);
  const [question, setQuestion] = useState(PRESETS.fit.question);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ApiResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handlePreset = (preset: 'fit' | 'doubleCharge') => {
    setTicket(PRESETS[preset].ticket);
    setQuestion(PRESETS[preset].question);
    setResult(null);
    setError(null);
  };

  const handleRun = async () => {
    if (!apiKey) {
      setError('Please enter an API key');
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/typesafe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-typesafe-key': apiKey,
        },
        body: JSON.stringify({
          model: 'jev-latest',
          state: ticket,
          questions: {
            as_noul: {
              type: 'noul',
              instructions: question,
            },
            as_choice: {
              type: 'choice',
              instructions: question,
              criteria: {
                yes: 'Yes',
                no: 'No',
              },
            },
            negation_noul: {
              type: 'noul',
              instructions: `Is it false that: ${question}`,
            },
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const noulDecision = result && result.answers.as_noul.noul > 0.5 ? 'yes' : 'no';
  const choiceDecision = result?.answers.as_choice.choice;
  const hasDisagreement = result && noulDecision !== choiceDecision;
  const noulSum = result ? result.answers.as_noul.noul + result.answers.negation_noul.noul : 0;
  const sumOutOfRange = result && (noulSum < 0.98 || noulSum > 1.02);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 p-8">
      <div className="max-w-6xl mx-auto">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-slate-50 mb-2">
            Jev Jaggedness Demo
          </h1>
          <p className="text-slate-600 dark:text-slate-400">
            TypeSafe Jev: Noul vs Choice Disagreement
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                API Key
              </label>
              <input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
                placeholder="Enter TypeSafe API key"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Ticket
              </label>
              <textarea
                value={ticket}
                onChange={(e) => setTicket(e.target.value)}
                rows={4}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
              <div className="flex gap-2 mt-2">
                <button
                  onClick={() => handlePreset('fit')}
                  className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded"
                >
                  Preset: Fit
                </button>
                <button
                  onClick={() => handlePreset('doubleCharge')}
                  className="px-3 py-1 text-sm bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded"
                >
                  Preset: Double Charge
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Question
              </label>
              <input
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 dark:border-slate-600 rounded-md bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100"
              />
            </div>

            <button
              onClick={handleRun}
              disabled={loading}
              className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-md font-medium"
            >
              {loading ? 'Running...' : 'Run'}
            </button>

            {error && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-red-700 dark:text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>

          {result && (
            <div className="space-y-4">
              {hasDisagreement && (
                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-2 border-yellow-400 dark:border-yellow-600 rounded-lg">
                  <p className="font-semibold text-yellow-900 dark:text-yellow-200">
                    ⚠️ Jaggedness Detected!
                  </p>
                  <p className="text-sm text-yellow-800 dark:text-yellow-300 mt-1">
                    Noul decision ({noulDecision}) disagrees with Choice ({choiceDecision})
                  </p>
                </div>
              )}

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Noul (Absolute)</h3>
                <div className="space-y-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Probability: <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                      {result.answers.as_noul.noul.toFixed(3)}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Decision: <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {noulDecision}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Choice (Relative)</h3>
                <div className="space-y-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Winner: <span className="font-semibold text-slate-900 dark:text-slate-100">
                      {result.answers.as_choice.choice}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Yes: <span className="font-mono text-slate-900 dark:text-slate-100">
                      {result.answers.as_choice.probabilities.yes.toFixed(3)}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    No: <span className="font-mono text-slate-900 dark:text-slate-100">
                      {result.answers.as_choice.probabilities.no.toFixed(3)}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Confidence: <span className="font-mono text-slate-900 dark:text-slate-100">
                      {result.answers.as_choice.confidence.toFixed(3)}
                    </span>
                  </p>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-4 border border-slate-200 dark:border-slate-700">
                <h3 className="font-semibold text-slate-900 dark:text-slate-100 mb-2">Complementary Noul</h3>
                <div className="space-y-1">
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Negation Probability: <span className="font-mono text-slate-900 dark:text-slate-100">
                      {result.answers.negation_noul.noul.toFixed(3)}
                    </span>
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Sum: <span className={`font-mono font-semibold ${sumOutOfRange ? 'text-orange-600 dark:text-orange-400' : 'text-slate-900 dark:text-slate-100'}`}>
                      {noulSum.toFixed(3)}
                    </span>
                    {sumOutOfRange && ' ⚠️'}
                  </p>
                  {sumOutOfRange && (
                    <p className="text-xs text-orange-600 dark:text-orange-400 mt-1">
                      Complementary Nouls do not sum to ~1.0
                    </p>
                  )}
                </div>
              </div>

              <div className="bg-slate-100 dark:bg-slate-900 rounded-lg p-3 text-xs text-slate-600 dark:text-slate-400">
                {result.timing_ms && <p>Timing: {result.timing_ms}ms</p>}
                {result.usage && <p>Tokens: {result.usage.input_tokens} in / {result.usage.output_tokens} out</p>}
              </div>
            </div>
          )}
        </div>

        <footer className="mt-8 p-4 bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
          <p className="mb-2">
            <strong>Key insight:</strong> Choice is relative (picks between options); Noul is absolute (independent judgment). 
            Never carry a Noul threshold onto a Choice.
          </p>
          <p>
            Learn more: <a 
              href="https://docs.typesafe.ai/model-jaggedness/jev-1.13.md" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Jev 1.13 Jaggedness
            </a> | <a 
              href="https://learnjev.com/tutorials/three-primitives" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              Three Primitives Tutorial
            </a>
          </p>
        </footer>
      </div>
    </div>
  );
}