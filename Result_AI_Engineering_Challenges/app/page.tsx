import Link from "next/link";

const challenges = [
  { num: "01", title: "Insurance Plan Comparison",        difficulty: "Beginner",     hours: "2–3h",  ready: true  },
  { num: "02", title: "Claims Data Cleanup & Report",     difficulty: "Beginner",     hours: "2–3h",  ready: true  },
  { num: "03", title: "Claim Notification Email Templates",difficulty: "Beginner",    hours: "2–3h",  ready: true  },
  { num: "04", title: "Insurance Glossary Search",        difficulty: "Beginner",     hours: "2–3h",  ready: true  },
  { num: "05", title: "Policy Summary Generator",         difficulty: "Beginner",     hours: "2–4h",  ready: true  },
  { num: "06", title: "Policy Benefits Calculator",       difficulty: "Intermediate", hours: "2–4h",  ready: true  },
  { num: "07", title: "Claims Intake Wizard",             difficulty: "Intermediate", hours: "3–5h",  ready: true  },
  { num: "08", title: "Medical Document Extractor",       difficulty: "Advanced",     hours: "4–6h",  ready: true  },
  { num: "09", title: "Claims Analytics Dashboard",       difficulty: "Intermediate", hours: "3–5h",  ready: true  },
  { num: "10", title: "Fraud Detection Scoring Engine",   difficulty: "Advanced",     hours: "4–6h",  ready: true  },
  { num: "11", title: "Claim Assessment AI Agent",        difficulty: "Advanced",     hours: "6–8h",  ready: true  },
  { num: "12", title: "Multi-Country Regulatory Rule Engine", difficulty: "Advanced", hours: "4–6h",  ready: true  },
  { num: "13", title: "Partner Integration SDK",          difficulty: "Advanced",     hours: "5–7h",  ready: true  },
  { num: "14", title: "Claims Workflow Orchestrator",     difficulty: "Advanced",     hours: "5–8h",  ready: true  },
  { num: "15", title: "Multi-Tenant Configuration Platform", difficulty: "Advanced",  hours: "5–8h",  ready: true  },
];

const difficultyConfig: Record<string, { badge: string; accent: string; dot: string }> = {
  Beginner:     { badge: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",    accent: "border-emerald-400",  dot: "bg-emerald-400" },
  Intermediate: { badge: "bg-sky-50 text-sky-700 ring-1 ring-sky-200",               accent: "border-sky-400",      dot: "bg-sky-400"     },
  Advanced:     { badge: "bg-violet-50 text-violet-700 ring-1 ring-violet-200",       accent: "border-violet-400",   dot: "bg-violet-400"  },
};

const groups = ["Beginner", "Intermediate", "Advanced"] as const;

export default function Home() {
  const readyCount = challenges.filter((c) => c.ready).length;

  return (
    <div>
      {/* Hero */}
      <div className="mb-10">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-50 text-blue-600 ring-1 ring-blue-200">
            {readyCount} / {challenges.length} live
          </span>
        </div>
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
          AI Engineering Challenges
        </h1>
        <p className="mt-2 text-slate-500 max-w-xl">
          Build an insurance platform using AI tools. We evaluate how you think, not just what you ship.
        </p>
      </div>

      <div className="space-y-10">
        {groups.map((group) => {
          const items = challenges.filter((c) => c.difficulty === group);
          const cfg = difficultyConfig[group];
          return (
            <section key={group}>
              <div className="flex items-center gap-3 mb-4">
                <span className={`w-2.5 h-2.5 rounded-full ${cfg.dot}`} />
                <h2 className="text-sm font-semibold text-slate-600 uppercase tracking-widest">
                  {group}
                </h2>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((c) => (
                  <div
                    key={c.num}
                    className={`relative bg-white rounded-xl border p-5 flex flex-col gap-2 transition-all ${
                      c.ready
                        ? `border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer`
                        : "border-slate-100 opacity-50"
                    }`}
                  >
                    {c.ready && (
                      <div className={`absolute left-0 top-4 bottom-4 w-0.5 rounded-r ${cfg.accent}`} />
                    )}

                    <div className="flex items-start justify-between gap-2">
                      <span className="text-[11px] font-mono text-slate-400">#{c.num}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${cfg.badge}`}>
                        {c.difficulty}
                      </span>
                    </div>

                    <h3 className="text-sm font-semibold text-slate-800 leading-snug">
                      {c.title}
                    </h3>

                    <div className="mt-auto flex items-center justify-between pt-2">
                      <span className="text-[11px] text-slate-400">{c.hours}</span>
                      {c.ready ? (
                        <Link
                          href={`/challenge-${c.num}`}
                          className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                        >
                          Open →
                        </Link>
                      ) : (
                        <span className="text-[11px] text-slate-300">Coming soon</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
