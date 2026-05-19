import { plans, RECOMMENDED, getBestIndex, fmt } from "@/lib/challenge-01/data";
import { Fragment } from "react";

const planColors = {
  Bronze: {
    header: "bg-amber-50",
    border: "border-amber-200",
    nameBadge: "bg-amber-100 text-amber-800",
    accent: "text-amber-600",
  },
  Silver: {
    header: "bg-blue-50",
    border: "border-blue-400",
    nameBadge: "bg-blue-600 text-white",
    accent: "text-blue-600",
  },
  Gold: {
    header: "bg-yellow-50",
    border: "border-yellow-300",
    nameBadge: "bg-yellow-100 text-yellow-800",
    accent: "text-yellow-600",
  },
};

interface RowDef {
  label: string;
  values: string[];
  numerics: number[]; // Infinity for unlimited, use for best detection
  direction: "min" | "max";
}

function buildRows(): { section: string; items: RowDef[] }[] {
  return [
    {
      section: "Pricing",
      items: [
        {
          label: "Monthly Premium",
          values: plans.map((p) => `฿${fmt(p.monthly_premium)}`),
          numerics: plans.map((p) => p.monthly_premium),
          direction: "min",
        },
        {
          label: "Annual Limit",
          values: plans.map((p) => `฿${fmt(p.annual_limit)}`),
          numerics: plans.map((p) => p.annual_limit),
          direction: "max",
        },
      ],
    },
    {
      section: "Outpatient",
      items: [
        {
          label: "Per Visit",
          values: plans.map(
            (p) => `฿${fmt(p.benefits.outpatient.limit_per_visit)}`,
          ),
          numerics: plans.map((p) => p.benefits.outpatient.limit_per_visit),
          direction: "max",
        },
        {
          label: "Visits / Year",
          values: plans.map((p) =>
            p.benefits.outpatient.visits_per_year === -1
              ? "Unlimited"
              : String(p.benefits.outpatient.visits_per_year),
          ),
          numerics: plans.map((p) =>
            p.benefits.outpatient.visits_per_year === -1
              ? Infinity
              : p.benefits.outpatient.visits_per_year,
          ),
          direction: "max",
        },
      ],
    },
    {
      section: "Inpatient",
      items: [
        {
          label: "Per Day",
          values: plans.map(
            (p) => `฿${fmt(p.benefits.inpatient.limit_per_day)}`,
          ),
          numerics: plans.map((p) => p.benefits.inpatient.limit_per_day),
          direction: "max",
        },
        {
          label: "Days / Year",
          values: plans.map((p) =>
            p.benefits.inpatient.days_per_year === -1
              ? "Unlimited"
              : String(p.benefits.inpatient.days_per_year),
          ),
          numerics: plans.map((p) =>
            p.benefits.inpatient.days_per_year === -1
              ? Infinity
              : p.benefits.inpatient.days_per_year,
          ),
          direction: "max",
        },
      ],
    },
    {
      section: "Additional Benefits",
      items: [
        {
          label: "Dental",
          values: plans.map((p) =>
            p.benefits.dental
              ? `฿${fmt(p.benefits.dental.limit_per_year)} / yr`
              : "—",
          ),
          numerics: plans.map((p) =>
            p.benefits.dental ? p.benefits.dental.limit_per_year : 0,
          ),
          direction: "max",
        },
        {
          label: "Maternity",
          values: plans.map((p) =>
            p.benefits.maternity
              ? `฿${fmt(p.benefits.maternity.limit_per_pregnancy)} / pregnancy`
              : "—",
          ),
          numerics: plans.map((p) =>
            p.benefits.maternity ? p.benefits.maternity.limit_per_pregnancy : 0,
          ),
          direction: "max",
        },
      ],
    },
    {
      section: "Terms",
      items: [
        {
          label: "Copay",
          values: plans.map((p) => `${p.copay_percentage}%`),
          numerics: plans.map((p) => p.copay_percentage),
          direction: "min",
        },
        {
          label: "Waiting Period",
          values: plans.map((p) =>
            p.waiting_period_days === 0
              ? "None"
              : `${p.waiting_period_days} days`,
          ),
          numerics: plans.map((p) => p.waiting_period_days),
          direction: "min",
        },
      ],
    },
  ];
}

const CheckIcon = () => (
  <svg
    className="inline w-4 h-4 text-emerald-500 mr-1"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    strokeWidth={2.5}
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
);

export default function Challenge01() {
  const sections = buildRows();

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-mono text-gray-400">
            #01 · Beginner
          </span>
        </div>
        <h1 className="text-2xl font-bold text-gray-900">
          Insurance Plan Comparison
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Compare Bronze, Silver, and Gold plans side by side to find the right
          coverage.
        </p>
      </div>

      {/* ── Desktop Table ── */}
      <div className="hidden md:block bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              {/* empty corner */}
              <th className="w-44 border-b border-gray-200 bg-gray-50" />
              {plans.map((plan) => {
                const colors = planColors[plan.name as keyof typeof planColors];
                const isRec = plan.name === RECOMMENDED;
                return (
                  <th
                    key={plan.name}
                    className={`border-b border-gray-200 ${colors.header} ${isRec ? `border-t-4 ${colors.border}` : ""}`}
                  >
                    <div className="px-4 pt-5 pb-4 text-center">
                      {isRec && (
                        <div className="mb-2">
                          <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                            ★ Recommended
                          </span>
                        </div>
                      )}
                      <div
                        className={`text-xs font-bold uppercase tracking-wider mb-1 ${colors.accent}`}
                      >
                        {plan.name}
                      </div>
                      <div className="text-3xl font-extrabold text-gray-900">
                        ฿{fmt(plan.monthly_premium)}
                      </div>
                      <div className="text-xs text-gray-400 mt-0.5">
                        / month
                      </div>
                      <div className="mt-3 flex flex-wrap justify-center gap-1">
                        {plan.highlights.map((h) => (
                          <span
                            key={h}
                            className="text-xs text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full"
                          >
                            {h}
                          </span>
                        ))}
                      </div>
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {sections.map((section) => (
              <Fragment key={`section-${section.section}`}>
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-2 bg-gray-50 text-xs font-semibold uppercase tracking-wide text-gray-500 border-y border-gray-100"
                  >
                    {section.section}
                  </td>
                </tr>
                {section.items.map((row) => {
                  const bestIdx = getBestIndex(row.numerics, row.direction);
                  return (
                    <tr
                      key={row.label}
                      className="hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-sm text-gray-600 border-b border-gray-100 font-medium">
                        {row.label}
                      </td>
                      {row.values.map((val, i) => {
                        const isBest = i === bestIdx;
                        const isNone = val === "—";
                        return (
                          <td
                            key={i}
                            className={`px-4 py-3 text-sm text-center border-b border-gray-100 ${
                              isBest
                                ? "bg-emerald-50 font-semibold text-emerald-800"
                                : isNone
                                  ? "text-gray-300"
                                  : "text-gray-700"
                            }`}
                          >
                            {isBest && !isNone && <CheckIcon />}
                            <span className={isNone ? "text-xl" : ""}>
                              {val}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* ── Mobile Cards ── */}
      <div className="md:hidden space-y-4">
        {plans.map((plan) => {
          const colors = planColors[plan.name as keyof typeof planColors];
          const isRec = plan.name === RECOMMENDED;
          return (
            <div
              key={plan.name}
              className={`bg-white rounded-xl border-2 overflow-hidden shadow-sm ${
                isRec ? colors.border : "border-gray-200"
              }`}
            >
              {/* Card Header */}
              <div className={`px-5 py-4 ${colors.header}`}>
                {isRec && (
                  <div className="mb-2">
                    <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
                      ★ Recommended
                    </span>
                  </div>
                )}
                <div
                  className={`text-xs font-bold uppercase tracking-wider ${colors.accent}`}
                >
                  {plan.name}
                </div>
                <div className="text-4xl font-extrabold text-gray-900 mt-1">
                  ฿{fmt(plan.monthly_premium)}
                  <span className="text-sm font-normal text-gray-400">
                    {" "}
                    / month
                  </span>
                </div>
              </div>

              {/* Card Body */}
              <div className="divide-y divide-gray-100">
                {sections.flatMap((s) =>
                  s.items.map((row) => {
                    const planIdx = plans.findIndex(
                      (p) => p.name === plan.name,
                    );
                    const bestIdx = getBestIndex(row.numerics, row.direction);
                    const isBest = planIdx === bestIdx;
                    const val = row.values[planIdx];
                    const isNone = val === "—";
                    return (
                      <div
                        key={row.label}
                        className={`flex justify-between items-center px-5 py-2.5 text-sm ${
                          isBest ? "bg-emerald-50" : ""
                        }`}
                      >
                        <span className="text-gray-500">{row.label}</span>
                        <span
                          className={`font-medium ${
                            isBest
                              ? "text-emerald-800"
                              : isNone
                                ? "text-gray-300"
                                : "text-gray-800"
                          }`}
                        >
                          {isBest && !isNone && "★ "}
                          {val}
                        </span>
                      </div>
                    );
                  }),
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
