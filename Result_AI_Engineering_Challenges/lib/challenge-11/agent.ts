import type { AgentResult, AssessmentCase, AssessmentReport, ToolCallLog } from "./types";
import { CASE_MAP } from "./cases";
import { executeTool } from "./tools";

const SYSTEM_PROMPT = `You are a professional insurance claim assessment agent. Your job is to thoroughly assess insurance claims using the available tools and produce a structured assessment report.

MANDATORY SEQUENCE — you MUST follow this order:
1. Call verifyDocument for EVERY document ID listed in the claim (do not skip any)
2. Call lookupPolicy to retrieve the policy terms
3. Call checkMedicalNecessity to verify the treatment is clinically appropriate
4. Call calculateBenefit to determine the covered amount

CRITICAL RULES:
- Do NOT fabricate or assume policy terms — always use lookupPolicy
- Do NOT skip any document — every document must be verified
- If a document is incomplete or missing → recommend REQUEST_MORE_INFO (never REJECT for missing docs)
- If the diagnosis or procedure is explicitly in the policy exclusions → REJECT
- If all checks pass and amount is within limits → APPROVE

After completing all tool calls, return ONLY a valid JSON object (no markdown, no explanation outside JSON) with this exact structure:
{
  "document_review": [
    { "doc_id": "DOC-XXX", "type": "string", "status": "complete|incomplete|missing", "issues": [] }
  ],
  "policy_verification": {
    "active": true,
    "member_covered": true,
    "claim_type_covered": true,
    "within_limit": true,
    "notes": "string"
  },
  "medical_necessity": {
    "appropriate": true,
    "reasoning": "string"
  },
  "benefit_calculation": {
    "submitted": 0,
    "covered": 0,
    "copay": 0,
    "member_pays": 0
  },
  "recommendation": "APPROVE|REJECT|REQUEST_MORE_INFO",
  "reasoning": "string",
  "policy_citations": ["Clause X: ...", "Section Y: ..."]
}`;

const TOOL_SCHEMAS = [
  {
    type: "function",
    function: {
      name: "lookupPolicy",
      description: "Returns the policy terms for a given policy ID, including benefits, limits, exclusions, copay rates, and waiting periods.",
      parameters: {
        type: "object",
        properties: {
          policyId: { type: "string", description: "The policy ID (e.g. POL-001)" },
        },
        required: ["policyId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "calculateBenefit",
      description: "Calculates the covered amount, copay, and member responsibility for a claim given the policy, claim type, and submitted amount.",
      parameters: {
        type: "object",
        properties: {
          policyId:  { type: "string", description: "The policy ID" },
          claimType: { type: "string", description: "Claim type: OUTPATIENT, INPATIENT, or DENTAL" },
          amount:    { type: "number", description: "Submitted claim amount in THB" },
        },
        required: ["policyId", "claimType", "amount"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "verifyDocument",
      description: "Verifies whether a submitted document is complete and valid. Returns document type, completeness status, and any issues found.",
      parameters: {
        type: "object",
        properties: {
          documentId: { type: "string", description: "The document ID (e.g. DOC-001)" },
        },
        required: ["documentId"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "checkMedicalNecessity",
      description: "Checks whether the submitted procedures are clinically appropriate for the given diagnosis code.",
      parameters: {
        type: "object",
        properties: {
          diagnosis:  { type: "string", description: "ICD-10 diagnosis code (e.g. J06.9)" },
          procedures: {
            type: "array",
            items: { type: "string" },
            description: "List of procedure names performed",
          },
        },
        required: ["diagnosis", "procedures"],
      },
    },
  },
];

function buildUserMessage(caseData: AssessmentCase): string {
  return `Please assess the following insurance claim:

CLAIM DETAILS:
- Claim ID: ${caseData.claim.claim_id}
- Policy ID: ${caseData.claim.policy_id}
- Member: ${caseData.policy.member_name}
- Claim Type: ${caseData.claim.claim_type}
- Diagnosis: ${caseData.claim.diagnosis_code} — ${caseData.claim.diagnosis_name}
- Procedures: ${caseData.claim.procedures.join(", ")}
- Submitted Amount: ฿${caseData.claim.submitted_amount.toLocaleString()}
- Service Date: ${caseData.claim.service_date}
- Submitted Date: ${caseData.claim.submitted_date}

SUBMITTED DOCUMENTS (${caseData.claim.documents.length} total):
${caseData.claim.documents.map(d => `- ${d}`).join("\n")}

Please verify ALL documents, look up the policy, check medical necessity, and calculate the benefit. Then provide your structured assessment report.`;
}

type OpenRouterResponse = {
  choices: {
    finish_reason: string;
    message: {
      content: string | null;
      tool_calls?: { id: string; function: { name: string; arguments: string } }[];
    };
  }[];
};

async function callOpenRouter(
  messages: unknown[],
  tools: unknown[],
  attempt = 0
): Promise<OpenRouterResponse> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 25000);

  try {
    const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.0-flash-001",
        messages,
        tools,
        tool_choice: "auto",
        max_tokens: 2048,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      // Retry once on 5xx gateway errors
      if ((res.status >= 500) && attempt < 2) {
        await new Promise(r => setTimeout(r, 1500 * (attempt + 1)));
        return callOpenRouter(messages, tools, attempt + 1);
      }
      throw new Error(`OpenRouter error ${res.status}: ${err}`);
    }
    return res.json();
  } finally {
    clearTimeout(timeout);
  }
}

export async function runAgent(caseId: string): Promise<AgentResult> {
  const caseData = CASE_MAP.get(caseId);
  if (!caseData) throw new Error(`Unknown case: ${caseId}`);

  const messages: unknown[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: buildUserMessage(caseData) },
  ];
  const logs: ToolCallLog[] = [];

  for (let turn = 0; turn < 15; turn++) {
    const raw = await callOpenRouter(messages, TOOL_SCHEMAS);
    const choice = raw.choices[0];

    if (choice.finish_reason === "tool_calls" && choice.message.tool_calls?.length) {
      // Append assistant message with all tool_calls
      messages.push({ role: "assistant", content: null, tool_calls: choice.message.tool_calls });

      // Execute each tool call and append results
      for (const tc of choice.message.tool_calls) {
        const args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        const output = executeTool(tc.function.name, args, caseData);
        logs.push({
          tool: tc.function.name,
          input: args,
          output,
          timestamp: new Date().toISOString(),
        });
        messages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: JSON.stringify(output),
        });
      }
      continue;
    }

    // Model finished — extract JSON report
    const content = choice.message.content ?? "";
    // Strip markdown code fences if present
    const jsonStr = content.replace(/^```(?:json)?\s*/m, "").replace(/\s*```\s*$/m, "").trim();
    const report = JSON.parse(jsonStr) as AssessmentReport;

    return { case_id: caseId, tool_logs: logs, report, raw_response: content };
  }

  throw new Error("Agent exceeded maximum turns (15)");
}
