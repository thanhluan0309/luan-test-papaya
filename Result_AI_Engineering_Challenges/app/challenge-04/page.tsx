"use client";

import { useState, useMemo, useCallback } from "react";
import { terms, categories, type Term } from "@/lib/challenge-04/data";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const categoryLabel = Object.fromEntries(categories.map((c) => [c.id, c.label]));

const categoryBadgeColors: Record<string, string> = {
  general:     "bg-slate-100 text-slate-600",
  claims:      "bg-blue-50 text-blue-600",
  coverage:    "bg-violet-50 text-violet-600",
  life_health: "bg-emerald-50 text-emerald-700",
  reinsurance: "bg-amber-50 text-amber-700",
  regulatory:  "bg-rose-50 text-rose-600",
};

const sortedTerms = [...terms].sort((a, b) => a.name.localeCompare(b.name));

function highlight(text: string, query: string): React.ReactNode {
  if (!query) return text;
  const idx = text.toLowerCase().indexOf(query.toLowerCase());
  if (idx === -1) return text;
  return (
    <>
      {text.slice(0, idx)}
      <mark className="bg-yellow-100 text-yellow-900 rounded px-0.5">
        {text.slice(idx, idx + query.length)}
      </mark>
      {highlight(text.slice(idx + query.length), query)}
    </>
  );
}

function TermCard({
  term,
  query,
  isExpanded,
  onToggle,
  onRelatedClick,
}: {
  term: Term;
  query: string;
  isExpanded: boolean;
  onToggle: () => void;
  onRelatedClick: (id: string) => void;
}) {
  const relatedTerms = (term.related ?? [])
    .map((id) => terms.find((t) => t.id === id))
    .filter(Boolean) as Term[];

  return (
    <div
      id={`term-${term.id}`}
      className={`rounded-lg border transition-all ${
        isExpanded
          ? "border-blue-200 bg-blue-50/40 shadow-sm"
          : "border-slate-200 bg-white hover:border-slate-300"
      }`}
    >
      <button
        onClick={onToggle}
        className="w-full text-left px-4 py-3 flex items-center gap-3"
      >
        <span className="flex-1 text-sm font-semibold text-slate-800">
          {highlight(term.name, query)}
        </span>
        <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full shrink-0 ${categoryBadgeColors[term.category]}`}>
          {categoryLabel[term.category]}
        </span>
        <span className={`text-slate-400 text-xs transition-transform shrink-0 ${isExpanded ? "rotate-180" : ""}`}>
          ▾
        </span>
      </button>

      {isExpanded && (
        <div className="px-4 pb-4 border-t border-blue-100">
          <p className="mt-3 text-sm text-slate-600 leading-relaxed">
            {highlight(term.definition, query)}
          </p>
          {relatedTerms.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className="text-xs text-slate-400 mr-1 self-center">Related:</span>
              {relatedTerms.map((rt) => (
                <button
                  key={rt.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    onRelatedClick(rt.id);
                  }}
                  className="text-xs px-2.5 py-1 rounded-full bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors font-medium"
                >
                  {rt.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Challenge04() {
  const [query, setQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Always sorted A-Z, filtered when searching
  const filtered = useMemo(() => {
    if (!query.trim()) return sortedTerms;
    const q = query.toLowerCase();
    return sortedTerms.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.definition.toLowerCase().includes(q)
    );
  }, [query]);

  // Group into A-Z sections (terms already sorted, so order is preserved)
  const letterSections = useMemo(() => {
    const map = new Map<string, Term[]>();
    filtered.forEach((t) => {
      const l = t.name[0].toUpperCase();
      if (!map.has(l)) map.set(l, []);
      map.get(l)!.push(t);
    });
    return Array.from(map.entries()).sort(([a], [b]) => a.localeCompare(b));
  }, [filtered]);

  const lettersWithTerms = useMemo(
    () => new Set(letterSections.map(([l]) => l)),
    [letterSections]
  );

  const scrollToLetter = useCallback((letter: string) => {
    document.getElementById(`letter-${letter}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  const handleRelatedClick = useCallback((id: string) => {
    setExpandedId(id);
    setTimeout(() => {
      document.getElementById(`term-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 50);
  }, []);

  const toggleTerm = useCallback((id: string) => {
    setExpandedId((prev) => (prev === id ? null : id));
  }, []);

  return (
    <div>
      {/* Header */}
      <div className="mb-6">
        <span className="text-xs font-mono text-slate-400">#04 · Beginner</span>
        <h1 className="text-2xl font-bold text-slate-900 mt-1">Insurance Glossary Search</h1>
        <p className="mt-1 text-sm text-slate-500">
          44 insurance terms — sorted A–Z with definitions, categories, and related concepts.
        </p>
      </div>

      {/* Search bar */}
      <div className="relative mb-6">
        <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
          <svg className="w-4 h-4 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setExpandedId(null);
          }}
          placeholder="Search terms or definitions..."
          className="w-full pl-9 pr-9 py-2.5 text-sm border border-slate-200 rounded-xl bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder:text-slate-400"
        />
        {query && (
          <button
            onClick={() => { setQuery(""); setExpandedId(null); }}
            className="absolute inset-y-0 right-3 flex items-center text-slate-400 hover:text-slate-600"
          >
            ✕
          </button>
        )}
      </div>

      <div className="flex gap-6">
        {/* A–Z Sidebar — always meaningful since view is always alphabetical */}
        <div className="hidden md:flex flex-col gap-0.5 shrink-0 sticky top-20 self-start">
          {ALPHABET.map((letter) => {
            const active = lettersWithTerms.has(letter);
            return (
              <button
                key={letter}
                onClick={() => active && scrollToLetter(letter)}
                disabled={!active}
                className={`w-7 h-6 text-xs font-medium rounded transition-colors ${
                  active
                    ? "text-blue-600 hover:bg-blue-100 cursor-pointer"
                    : "text-slate-300 cursor-default"
                }`}
              >
                {letter}
              </button>
            );
          })}
        </div>

        {/* Term list — always A-Z sections */}
        <div className="flex-1 min-w-0">
          {query.trim() && (
            <div className="text-xs text-slate-500 mb-4">
              {filtered.length === 0
                ? `No results for "${query}"`
                : `${filtered.length} result${filtered.length !== 1 ? "s" : ""} for "${query}"`}
            </div>
          )}

          {filtered.length === 0 ? (
            <div className="text-center py-16 text-slate-400">
              <div className="text-3xl mb-2">🔍</div>
              <div className="text-sm">No terms match &ldquo;{query}&rdquo;</div>
            </div>
          ) : (
            <div className="space-y-6">
              {letterSections.map(([letter, letterTerms]) => (
                <div key={letter}>
                  <div
                    id={`letter-${letter}`}
                    className="flex items-center gap-3 mb-2 scroll-mt-20"
                  >
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest w-5">
                      {letter}
                    </span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>
                  <div className="space-y-2">
                    {letterTerms.map((term) => (
                      <TermCard
                        key={term.id}
                        term={term}
                        query={query}
                        isExpanded={expandedId === term.id}
                        onToggle={() => toggleTerm(term.id)}
                        onRelatedClick={handleRelatedClick}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
