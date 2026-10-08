import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import Markdown from "../components/Markdown";
import { fetchSampleInfo, getToken, streamSampleMessage } from "../services/api";
import type { Source } from "../types";

const REPO_URL = "https://github.com/ayuubhagi/docmaid-ai";

// A Render free instance can take over a minute to boot, and may answer 502 while it does.
const SAMPLE_RETRY_MS = 5_000;
const SAMPLE_GIVE_UP_MS = 180_000;

type SampleState =
  | { status: "loading" }
  | { status: "failed" }
  | { status: "ready"; filename: string; questions: string[] };

function TrySample() {
  const [sample, setSample] = useState<SampleState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);
  const [waited, setWaited] = useState(0);
  const [asked, setAsked] = useState<string | null>(null);
  const [answer, setAnswer] = useState("");
  const [sources, setSources] = useState<Source[]>([]);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const started = Date.now();
    setSample({ status: "loading" });
    setWaited(0);
    const clock = setInterval(() => setWaited(Math.round((Date.now() - started) / 1000)), 1000);

    const load = async () => {
      while (!cancelled && Date.now() - started < SAMPLE_GIVE_UP_MS) {
        try {
          const info = await fetchSampleInfo();
          if (!cancelled) {
            setSample({
              status: "ready",
              filename: info.filename,
              questions: info.suggested_questions,
            });
          }
          return;
        } catch {
          await new Promise((resolve) => setTimeout(resolve, SAMPLE_RETRY_MS));
        }
      }
      if (!cancelled) setSample({ status: "failed" });
    };
    void load().finally(() => clearInterval(clock));

    return () => {
      cancelled = true;
      clearInterval(clock);
    };
  }, [attempt]);

  const ask = async (question: string) => {
    if (busy) return;
    setAsked(question);
    setAnswer("");
    setSources([]);
    setDone(false);
    setError(null);
    setBusy(true);
    try {
      await streamSampleMessage(question, (event) => {
        if (event.type === "token") setAnswer((prev) => prev + event.content);
        else if (event.type === "sources") setSources(event.sources);
        else if (event.type === "done") setDone(true);
        else if (event.type === "error") setError(event.detail);
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Try again.");
    } finally {
      setBusy(false);
      setDone(true);
    }
  };

  if (sample.status === "loading") {
    return (
      <p className="text-sm text-slate-500">
        {waited < 3
          ? "Loading the sample..."
          : `Waking up the server (${waited}s). It sleeps when idle on the free tier, so this can take a minute or two.`}
      </p>
    );
  }

  if (sample.status === "failed") {
    return (
      <p className="text-sm text-slate-400">
        The server didn't wake up.{" "}
        <button className="text-brand-400 hover:underline" onClick={() => setAttempt((n) => n + 1)}>
          Try again
        </button>{" "}
        or{" "}
        <Link to="/register" className="text-brand-400 hover:underline">
          create an account
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900 p-5 sm:p-6">
      <p className="text-xs text-slate-500">
        Sample document: <span className="text-slate-300">{sample.filename}</span>
      </p>
      <div className="mt-4 flex flex-wrap gap-2">
        {sample.questions.map((q) => (
          <button
            key={q}
            className={`rounded-full border px-3.5 py-1.5 text-sm transition-colors ${
              asked === q
                ? "border-brand-500/60 bg-brand-500/10 text-brand-400"
                : "border-slate-700 text-slate-300 hover:border-brand-500/40 hover:text-brand-400"
            }`}
            disabled={busy}
            onClick={() => void ask(q)}
          >
            {q}
          </button>
        ))}
      </div>

      {asked && (
        <div className="mt-5 rounded-lg border border-slate-800 bg-slate-950/60 p-4 text-sm leading-relaxed text-slate-200">
          <Markdown>{answer}</Markdown>
          {busy && (
            <span className="ml-0.5 inline-block h-4 w-[2px] translate-y-0.5 animate-blink bg-brand-400 align-middle" />
          )}
          {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
        </div>
      )}

      {done && sources.length > 0 && (
        <ol className="mt-4 space-y-2 text-xs text-slate-400">
          {sources.map((s) => (
            <li key={s.ref} className="flex gap-2">
              <span className="font-medium text-brand-400">[{s.ref}]</span>
              <span>{s.snippet.replace(/\s+/g, " ").slice(0, 200)}...</span>
            </li>
          ))}
        </ol>
      )}

      {done && !error && (
        <div className="mt-5 flex flex-wrap items-center gap-4">
          <Link to="/register" className="btn-primary">
            Upload your own document
          </Link>
          <span className="text-xs text-slate-500">Free: 1 document, 10 questions a day</span>
        </div>
      )}
    </div>
  );
}

export default function Landing() {
  const isAuthed = Boolean(getToken());

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-slate-800/60">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-6 py-5">
          <span className="font-display text-2xl font-bold text-brand-400">DocMaid</span>
          <nav className="flex items-center gap-2 whitespace-nowrap sm:gap-3">
            <Link
              to="/pricing"
              className="hidden px-2 text-sm text-slate-400 hover:text-slate-200 sm:inline"
            >
              Pricing
            </Link>
            {isAuthed ? (
              <Link to="/dashboard" className="btn-primary">
                Open app
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-secondary">
                  Sign in
                </Link>
                <Link to="/register" className="btn-primary">
                  Get started
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl flex-1 px-6 pb-20 pt-14">
        <h1 className="font-display text-4xl font-bold leading-tight sm:text-5xl">
          Ask questions about your documents
        </h1>
        <p className="mt-4 max-w-2xl text-lg leading-relaxed text-slate-400">
          Upload a PDF, Word or text file and DocMaid answers questions about it, citing the
          passages it used. Try it on a sample lease below. No account needed.
        </p>
        <div className="mt-10">
          <TrySample />
        </div>
      </main>

      <footer className="border-t border-slate-800/60 py-6 text-center text-sm text-slate-500">
        <a href={REPO_URL} className="hover:text-slate-300">
          Source on GitHub
        </a>
      </footer>
    </div>
  );
}
