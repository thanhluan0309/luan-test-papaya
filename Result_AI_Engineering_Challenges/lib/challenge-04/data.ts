export type CategoryId =
  | "general"
  | "claims"
  | "coverage"
  | "life_health"
  | "reinsurance"
  | "regulatory";

export interface Category {
  id: CategoryId;
  label: string;
}

export interface Term {
  id: string;
  name: string;
  definition: string;
  category: CategoryId;
  related?: string[];
}

export const categories: Category[] = [
  { id: "general",     label: "General Insurance" },
  { id: "claims",      label: "Claims" },
  { id: "coverage",    label: "Coverage" },
  { id: "life_health", label: "Life & Health" },
  { id: "reinsurance", label: "Reinsurance" },
  { id: "regulatory",  label: "Regulatory" },
];

export const terms: Term[] = [
  // ── General Insurance ──────────────────────────────────────────
  {
    id: "premium",
    name: "Premium",
    category: "general",
    definition:
      "The amount paid by a policyholder to an insurer in exchange for insurance coverage, typically on a monthly or annual basis. Premiums are calculated based on the level of risk the insurer assumes, the coverage selected, and characteristics of the insured. Failure to pay premiums on time may result in policy lapse.",
    related: ["policyholder", "underwriting", "insurer"],
  },
  {
    id: "policyholder",
    name: "Policyholder",
    category: "general",
    definition:
      "The person or entity that owns an insurance policy and is responsible for paying premiums to maintain coverage. The policyholder may or may not be the same as the insured — for example, a company may hold a group health policy that covers its employees. Also referred to as the policy owner.",
    related: ["premium", "insured", "insurer"],
  },
  {
    id: "underwriting",
    name: "Underwriting",
    category: "general",
    definition:
      "The process by which an insurer evaluates the risk of insuring a person or entity and determines whether to provide coverage and at what premium. Underwriters assess factors such as age, health history, occupation, and prior claims. The outcome of underwriting may include acceptance, modified terms, or declination.",
    related: ["premium", "insurer", "rider"],
  },
  {
    id: "endorsement",
    name: "Endorsement",
    category: "general",
    definition:
      "A written amendment or addition to an insurance policy that modifies its original terms, conditions, or coverage. Endorsements can add coverage, restrict it, or clarify provisions, and they take effect as part of the policy contract. Also called a policy rider or addendum in some jurisdictions.",
    related: ["rider", "policyholder"],
  },
  {
    id: "rider",
    name: "Rider",
    category: "general",
    definition:
      "An optional add-on provision attached to a base insurance policy that extends or modifies its coverage, usually for an additional premium. Common riders include critical illness riders, waiver of premium, and accidental death benefit. Riders allow policyholders to tailor coverage to their specific needs.",
    related: ["endorsement", "premium", "underwriting"],
  },
  {
    id: "insurer",
    name: "Insurer",
    category: "general",
    definition:
      "The insurance company or entity that underwrites a policy and agrees to compensate the insured for covered losses in exchange for premium payments. Insurers must hold sufficient reserves and capital to meet their obligations to policyholders. Also referred to as the carrier or underwriter.",
    related: ["policyholder", "underwriting", "premium"],
  },
  {
    id: "insured",
    name: "Insured",
    category: "general",
    definition:
      "The person or entity covered under the terms of an insurance policy whose losses or claims are eligible for indemnification. The insured may be the same as the policyholder or a different person, such as an employee covered under a corporate group policy. The insured's risk profile directly influences underwriting decisions.",
    related: ["policyholder", "insurer", "indemnity"],
  },
  {
    id: "indemnity",
    name: "Indemnity",
    category: "general",
    definition:
      "The principle that insurance should restore the insured to the same financial position they were in before a loss, without allowing profit from the claim. Under indemnity, the payout is limited to the actual financial loss suffered. This principle prevents moral hazard and over-insurance.",
    related: ["insured", "claim", "sum_insured"],
  },

  // ── Claims ─────────────────────────────────────────────────────
  {
    id: "claim",
    name: "Claim",
    category: "claims",
    definition:
      "A formal request made by the insured or a beneficiary to the insurer for payment of benefits under the policy following a covered loss or event. Claims are subject to verification, documentation requirements, and policy terms before payment is approved. The claims process includes submission, adjudication, and settlement.",
    related: ["adjudication", "deductible", "loss_adjuster"],
  },
  {
    id: "deductible",
    name: "Deductible",
    category: "claims",
    definition:
      "The fixed amount the insured must pay out-of-pocket before the insurer begins to cover the remaining costs of a claim. Higher deductibles typically result in lower premiums, as the insured assumes more of the initial risk. Deductibles encourage policyholders to avoid small, unnecessary claims.",
    related: ["copay", "coinsurance", "claim"],
  },
  {
    id: "copay",
    name: "Copay",
    category: "claims",
    definition:
      "A fixed dollar amount or percentage of costs that the insured pays at the time of receiving a covered service, with the insurer covering the remainder. For example, a 20% copay on an outpatient visit means the insured pays 20% and the insurer pays 80%, subject to policy limits. Copays help share costs between insurer and insured.",
    related: ["deductible", "coinsurance", "claim"],
  },
  {
    id: "coinsurance",
    name: "Coinsurance",
    category: "claims",
    definition:
      "A cost-sharing arrangement in which both the insurer and the insured pay a specified percentage of covered expenses after the deductible is met. For example, an 80/20 plan means the insurer covers 80% and the insured pays 20%. Coinsurance promotes shared responsibility and discourages over-utilization.",
    related: ["copay", "deductible", "claim"],
  },
  {
    id: "adjudication",
    name: "Adjudication",
    category: "claims",
    definition:
      "The process by which an insurer reviews, evaluates, and determines the outcome of a submitted claim, including whether it is covered, the eligible amount, and any deductions. Adjudication involves verifying documentation, applying policy terms, and checking for exclusions or prior authorizations. The result may be approval, partial payment, or denial.",
    related: ["claim", "loss_adjuster", "subrogation"],
  },
  {
    id: "subrogation",
    name: "Subrogation",
    category: "claims",
    definition:
      "The legal right of an insurer to pursue a third party responsible for causing a loss after the insurer has compensated the insured. Subrogation allows the insurer to recover some or all of the claim amount paid from the at-fault party. It prevents the insured from receiving double compensation for the same loss.",
    related: ["claim", "adjudication", "indemnity"],
  },
  {
    id: "loss_adjuster",
    name: "Loss Adjuster",
    category: "claims",
    definition:
      "An independent professional appointed by an insurer to investigate, assess, and report on the circumstances and extent of a loss before settlement. Loss adjusters verify the validity of claims, estimate damages, and recommend settlement amounts. They differ from loss assessors, who represent the policyholder's interests.",
    related: ["claim", "adjudication", "notice_of_loss"],
  },
  {
    id: "notice_of_loss",
    name: "Notice of Loss",
    category: "claims",
    definition:
      "A formal notification that the insured submits to the insurer as soon as practicable after a covered loss occurs, triggering the claims process. Policies typically specify a time limit within which notice must be given to preserve coverage. Failure to give timely notice may reduce or void the insurer's liability.",
    related: ["claim", "loss_adjuster", "adjudication"],
  },

  // ── Coverage ───────────────────────────────────────────────────
  {
    id: "sum_insured",
    name: "Sum Insured",
    category: "coverage",
    definition:
      "The maximum amount the insurer is obligated to pay under a policy for a covered loss, representing the face value of the insurance contract. For health insurance, the sum insured is often the annual limit of benefits available to the insured. Setting the correct sum insured is critical to avoid under-insurance.",
    related: ["annual_limit", "sub_limit", "indemnity"],
  },
  {
    id: "annual_limit",
    name: "Annual Limit",
    category: "coverage",
    definition:
      "The maximum total amount an insurer will pay for covered claims within a single policy year, after which the insured bears all remaining costs. Annual limits reset at the start of each policy renewal period. Policies may have separate annual limits for different benefit categories such as inpatient and outpatient.",
    related: ["sum_insured", "sub_limit", "benefit_schedule"],
  },
  {
    id: "sub_limit",
    name: "Sub-limit",
    category: "coverage",
    definition:
      "A specific cap within an overall policy limit that restricts the maximum payable for a particular type of loss, procedure, or benefit category. For example, a policy may have a ฿2,000,000 annual limit but a ฿500,000 sub-limit for surgical procedures. Sub-limits help insurers manage exposure to high-cost events.",
    related: ["annual_limit", "sum_insured", "benefit_schedule"],
  },
  {
    id: "exclusion",
    name: "Exclusion",
    category: "coverage",
    definition:
      "A specific condition, circumstance, or type of loss explicitly not covered under an insurance policy. Common exclusions include pre-existing conditions within a waiting period, cosmetic procedures, and self-inflicted injuries. Policyholders should review exclusions carefully to understand the boundaries of their coverage.",
    related: ["waiting_period", "pre_existing_condition", "rider"],
  },
  {
    id: "waiting_period",
    name: "Waiting Period",
    category: "coverage",
    definition:
      "A specified period at the start of a policy during which certain benefits are not payable, even if the insured condition arises. Waiting periods are common for maternity and dental benefits, typically ranging from 90 to 270 days. They protect insurers from adverse selection by individuals who purchase insurance only after knowing they need care.",
    related: ["exclusion", "pre_existing_condition", "benefit_schedule"],
  },
  {
    id: "pre_existing_condition",
    name: "Pre-existing Condition",
    category: "coverage",
    definition:
      "A medical condition or illness that existed before the policy's effective date or was diagnosed, treated, or manifested prior to the start of coverage. Many policies exclude pre-existing conditions for an initial period, after which they may become covered. Declaration of pre-existing conditions at application is required to avoid claim disputes.",
    related: ["exclusion", "waiting_period", "underwriting"],
  },
  {
    id: "benefit_schedule",
    name: "Benefit Schedule",
    category: "coverage",
    definition:
      "A comprehensive list within a policy document that details the specific benefits, their limits, and the conditions under which they are payable. Benefit schedules enable policyholders to quickly understand what is covered and to what extent. They typically include inpatient, outpatient, dental, and other benefit categories with their respective sub-limits.",
    related: ["annual_limit", "sub_limit", "sum_insured"],
  },
  {
    id: "network_provider",
    name: "Network Provider",
    category: "coverage",
    definition:
      "A hospital, clinic, or healthcare professional that has a contractual agreement with an insurer to provide services to policyholders at pre-negotiated rates. Using network providers typically results in higher benefit payments and direct billing, whereas out-of-network treatment may require upfront payment and reimbursement. Network size and quality is a key factor in policy selection.",
    related: ["benefit_schedule", "exclusion", "copay"],
  },

  // ── Life & Health ──────────────────────────────────────────────
  {
    id: "beneficiary",
    name: "Beneficiary",
    category: "life_health",
    definition:
      "The person or entity designated to receive the insurance proceeds upon the death of the insured or the occurrence of a covered event. A policyholder may name multiple beneficiaries and specify the percentage each receives. Beneficiary designations should be reviewed and updated regularly to reflect life changes.",
    related: ["policyholder", "insured", "maturity"],
  },
  {
    id: "maturity",
    name: "Maturity",
    category: "life_health",
    definition:
      "The date on which a life insurance or endowment policy reaches the end of its term and the sum assured or accumulated fund value becomes payable to the policyholder or beneficiary. At maturity, the policy terminates and the insured receives the maturity benefit if they are still alive. Maturity benefits are a key feature distinguishing endowment from pure term policies.",
    related: ["beneficiary", "surrender_value", "actuarial"],
  },
  {
    id: "surrender_value",
    name: "Surrender Value",
    category: "life_health",
    definition:
      "The amount an insurer pays to a policyholder who terminates a whole life or endowment policy before its maturity date. Surrender value accumulates over time as premiums are paid and may be significantly less than premiums paid in early policy years. Policyholders should compare the surrender value against other options such as policy loans before surrendering.",
    related: ["maturity", "beneficiary", "premium"],
  },
  {
    id: "mortality_table",
    name: "Mortality Table",
    category: "life_health",
    definition:
      "A statistical table used by actuaries to project the probability of death at each age within a given population, forming the basis for life insurance premium calculations. Mortality tables are regularly updated to reflect improvements in life expectancy. Separate tables may exist for different populations, genders, and risk classifications.",
    related: ["actuarial", "underwriting", "premium"],
  },
  {
    id: "actuarial",
    name: "Actuarial",
    category: "life_health",
    definition:
      "Relating to the mathematical and statistical methods used by actuaries to assess risk, calculate premiums, and determine reserves for insurance companies. Actuarial science combines probability theory, financial mathematics, and statistical analysis to ensure insurers can meet long-term obligations. Actuaries play a central role in pricing, reserving, and solvency management.",
    related: ["mortality_table", "reserve", "premium"],
  },
  {
    id: "insurable_interest",
    name: "Insurable Interest",
    category: "life_health",
    definition:
      "A financial or other recognized interest in the preservation of the life, health, or property being insured, which must exist at policy inception to make the contract legally valid. Without insurable interest, an insurance policy may be deemed a wagering contract and void. Common examples include a person insuring their own life, a spouse, or a key business partner.",
    related: ["policyholder", "insured", "beneficiary"],
  },
  {
    id: "grace_period",
    name: "Grace Period",
    category: "life_health",
    definition:
      "A specified number of days after a premium due date during which the policyholder may pay the overdue premium without penalty and without the policy lapsing. Grace periods typically range from 15 to 31 days depending on the policy type and jurisdiction. Coverage remains in force during the grace period, and any claims arising are still paid.",
    related: ["premium", "policyholder", "waiting_period"],
  },

  // ── Reinsurance ────────────────────────────────────────────────
  {
    id: "ceding_company",
    name: "Ceding Company",
    category: "reinsurance",
    definition:
      "An insurance company that transfers a portion of its underwritten risk to a reinsurer in exchange for a premium, thereby reducing its own potential loss exposure. By ceding risk, the primary insurer can underwrite more policies or larger risks than its capital alone would permit. The ceding company retains responsibility for managing the original policyholder relationship.",
    related: ["reinsurer", "treaty", "facultative"],
  },
  {
    id: "retrocession",
    name: "Retrocession",
    category: "reinsurance",
    definition:
      "The practice by which a reinsurer transfers part of the risk it has assumed from a ceding company to another reinsurer, known as a retrocessionaire. Retrocession allows reinsurers to further spread concentrated risk and manage their own exposure. It represents a second layer of risk transfer beyond primary reinsurance.",
    related: ["reinsurer", "ceding_company", "treaty"],
  },
  {
    id: "treaty",
    name: "Treaty",
    category: "reinsurance",
    definition:
      "A standing reinsurance agreement under which a reinsurer automatically accepts a defined portion of all risks that fall within the treaty's terms, without requiring case-by-case negotiation. Treaties may be proportional (quota share, surplus share) or non-proportional (excess of loss). They provide the ceding company with predictable, ongoing reinsurance capacity.",
    related: ["ceding_company", "facultative", "reinsurer"],
  },
  {
    id: "facultative",
    name: "Facultative",
    category: "reinsurance",
    definition:
      "A type of reinsurance arrangement where the ceding company offers a specific individual risk to a reinsurer, and the reinsurer has the option to accept or decline it. Facultative reinsurance is used for large, unique, or hazardous risks that fall outside treaty limits or require specialized assessment. Each facultative transaction is negotiated separately.",
    related: ["treaty", "ceding_company", "underwriting"],
  },
  {
    id: "loss_ratio",
    name: "Loss Ratio",
    category: "reinsurance",
    definition:
      "A key performance metric for insurers and reinsurers calculated as claims paid (and reserved) divided by premiums earned, expressed as a percentage. A loss ratio above 100% indicates that an insurer is paying out more in claims than it collects in premiums from that line of business. It is a primary measure of underwriting profitability.",
    related: ["premium", "claim", "reserve"],
  },
  {
    id: "reinsurer",
    name: "Reinsurer",
    category: "reinsurance",
    definition:
      "An insurance company that assumes risk from a primary insurer (ceding company) in exchange for a portion of the premium. Reinsurers help primary insurers manage large or catastrophic exposures that would otherwise strain their capital. Global reinsurers like Munich Re and Swiss Re operate across many markets and lines of business.",
    related: ["ceding_company", "treaty", "retrocession"],
  },

  // ── Regulatory ─────────────────────────────────────────────────
  {
    id: "solvency",
    name: "Solvency",
    category: "regulatory",
    definition:
      "The ability of an insurance company to meet its financial obligations to policyholders, especially the payment of claims, both in the short and long term. Regulators require insurers to maintain minimum solvency margins — a buffer of assets above liabilities — to reduce the risk of insurer insolvency. Solvency II is the EU regulatory framework governing insurer capital requirements.",
    related: ["reserve", "capital_adequacy", "compliance"],
  },
  {
    id: "reserve",
    name: "Reserve",
    category: "regulatory",
    definition:
      "Funds set aside by an insurer to meet future claim obligations and other liabilities that are known, estimated, or anticipated but not yet paid. Reserves include unearned premium reserves, loss reserves, and IBNR reserves. Adequate reserving is essential for solvency and is subject to actuarial certification and regulatory oversight.",
    related: ["ibnr", "solvency", "actuarial"],
  },
  {
    id: "ibnr",
    name: "IBNR",
    category: "regulatory",
    definition:
      "Incurred But Not Reported — a reserve set aside for claims that have occurred but have not yet been submitted to the insurer as of the reporting date. IBNR reserves account for the lag between when a loss event happens and when the claim is formally reported. Accurate IBNR estimation is critical for financial reporting and solvency assessment.",
    related: ["reserve", "actuarial", "claim"],
  },
  {
    id: "statutory_reporting",
    name: "Statutory Reporting",
    category: "regulatory",
    definition:
      "The mandatory financial and operational reporting that insurance companies must submit to their regulatory authorities under applicable insurance laws. Statutory reports typically include balance sheets, income statements, solvency calculations, and investment disclosures. Non-compliance with statutory reporting requirements may result in fines, license suspension, or other regulatory action.",
    related: ["compliance", "solvency", "reserve"],
  },
  {
    id: "compliance",
    name: "Compliance",
    category: "regulatory",
    definition:
      "The adherence of an insurance company to all applicable laws, regulations, guidelines, and internal policies governing its operations. Compliance functions include monitoring regulatory changes, conducting internal audits, and training staff on regulatory requirements. Strong compliance culture reduces legal, financial, and reputational risks.",
    related: ["statutory_reporting", "solvency", "capital_adequacy"],
  },
  {
    id: "capital_adequacy",
    name: "Capital Adequacy",
    category: "regulatory",
    definition:
      "A regulatory requirement specifying the minimum amount of capital an insurance company must hold relative to its risk exposure to ensure financial stability. Capital adequacy ratios are calculated using risk-based models that account for underwriting, investment, and operational risks. Insufficient capital may trigger regulatory intervention or restrict business activity.",
    related: ["solvency", "reserve", "compliance"],
  },
  {
    id: "run_off",
    name: "Run-off",
    category: "regulatory",
    definition:
      "The management and settlement of remaining liabilities from insurance policies that are no longer being renewed or written, typically after a company exits a line of business or ceases operations. Run-off management involves continuing to pay claims, managing reserves, and potentially transferring liabilities to a specialist run-off company. It can last for many years, particularly for long-tail liability lines.",
    related: ["reserve", "ibnr", "solvency"],
  },
];
