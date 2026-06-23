import { internalMutation } from "./_generated/server";

const LEGAL_TASKS = [
  { title: "RBI Regulatory Framework Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Review RBI regulations applicable to payment systems, payment aggregators, payment gateways, cross-border payments, remittances, prepaid instruments, KYC, AML, merchant onboarding, grievance handling, transaction controls, and governance." },
  { title: "IFSCA Regulatory Framework Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Review IFSC applicability, Payment Service Provider requirements, sandbox participation, escrow and nodal bank requirements, reporting obligations, and authorization conditions." },
  { title: "FEMA Compliance Research", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Assess FEMA provisions applicable to NivixPe's business operations and cross-border payment activities." },
  { title: "PMLA & FIU-IND Compliance Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Review AML, reporting, monitoring, and compliance obligations under PMLA and FIU-IND requirements." },
  { title: "DPDPA & IT Act Compliance Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Review data collection, consent, storage, retention, access controls, breach response, privacy obligations, and IT Act compliance requirements." },
  { title: "Companies Act Compliance Assessment", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Review board requirements, statutory registers, resolutions, filings, director obligations, annual compliance, and event-based MCA requirements." },
  { title: "Corporate Governance Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Analyze governance requirements applicable to a startup/private company and identify mandatory compliance obligations." },
  { title: "NivixPe Business Model Legal Analysis", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Study the complete NivixPe business model, platform architecture, operational flow, and regulatory strategy." },
  { title: "Compliance Matrix Preparation", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Map business functions against applicable regulations, current controls, compliance gaps, risks, and recommended actions." },
  { title: "Compliance Gap Identification", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Identify missing requirements, compliance deficiencies, and areas requiring remediation." },
  { title: "Legal Risk Assessment", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Identify material legal, regulatory, contractual, and operational risks requiring escalation." },
  { title: "Technology & Data Compliance Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Review data handling, privacy, retention, consent mechanisms, security controls, breach response processes, and IT obligations." },
  { title: "Solana Usage Compliance Assessment", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Review Solana integration, transaction monitoring obligations, regulatory classification, and related compliance requirements." },
  { title: "Hyperledger Fabric Compliance Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Assess governance structures, onboarding processes, privacy controls, audit trails, and record-keeping requirements." },
  { title: "Wallet Architecture Legal Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Analyze custodial and non-custodial wallet models, key management practices, asset segregation, cybersecurity controls, and recovery mechanisms." },
  { title: "Smart Contract Legal Assessment", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Review enforceability, liability implications, audit requirements, automated execution, and upgradeability considerations." },
  { title: "Blockchain Data Residency Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Assess where blockchain-related data is stored and processed and review applicable data transfer requirements." },
  { title: "India Regulatory Compliance Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Review compliance requirements under RBI, SEBI, MeitY, DPDPA, and Companies Act provisions." },
  { title: "UAE Regulatory Compliance Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Review requirements under UAE Central Bank, DFSA, ADGM, VARA, AML/CFT, and UAE data protection regulations." },
  { title: "UK Regulatory Compliance Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Review FCA requirements, Payment Services Regulations, UK GDPR, Data Protection Act, and financial promotion obligations." },
  { title: "Multi-Jurisdiction Compliance Matrix", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Create a consolidated compliance matrix covering India, UAE, and UK regulatory requirements." },
  { title: "NDA Agreement Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "medium", comments: "Review NDA clauses, identify risks, highlight missing provisions, and recommend revisions." },
  { title: "Employment Agreement Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "medium", comments: "Assess enforceability, compliance requirements, and clause adequacy within employment agreements." },
  { title: "Internship Agreement Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "medium", comments: "Verify legal validity, identify missing clauses, and recommend compliance improvements." },
  { title: "Vendor Agreement Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "medium", comments: "Review contractual obligations, risk allocation, and compliance-related provisions." },
  { title: "Service Agreement Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "medium", comments: "Assess enforceability, liability provisions, and contractual compliance requirements." },
  { title: "Terms & Conditions Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "medium", comments: "Review platform terms for legal sufficiency, enforceability, and regulatory alignment." },
  { title: "Privacy Policy Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "medium", comments: "Verify alignment with data protection obligations, consent requirements, and privacy regulations." },
  { title: "KYC & AML Policy Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "medium", comments: "Review internal KYC and AML policies for completeness and regulatory compliance." },
  { title: "Internal Compliance Documentation Review", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "medium", comments: "Review internal policies, SOPs, and compliance documentation for gaps and improvement opportunities." },
  { title: "Technology Team Compliance Verification", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Coordinate with the technology team to verify whether implementation aligns with legal and regulatory requirements." },
  { title: "Operations Team Compliance Verification", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Verify whether operational processes satisfy applicable compliance obligations." },
  { title: "Management Information Collection", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Collect required information, documents, and inputs necessary for legal assessments and compliance reviews." },
  { title: "Regulatory Research Report", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Prepare a report covering RBI, IFSCA, Companies Act, fintech laws, data protection, and international regulatory obligations." },
  { title: "Compliance Gap Analysis Report", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Summarize identified compliance gaps, associated risks, and remediation requirements." },
  { title: "Legal Risk Assessment Report", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Document critical legal and regulatory concerns requiring management attention." },
  { title: "Document Review Summary", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "medium", comments: "Consolidate findings from all legal document reviews, including risks and recommended revisions." },
  { title: "Compliance Action Tracker", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Track compliance gaps, owners, deadlines, action items, and closure status." },
  { title: "Licensing Readiness Scorecard", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Prepare a readiness dashboard covering RBI, IFSCA, AML, KYC, Privacy, Corporate, UAE, and UK compliance status." },
  { title: "Final Compliance Report", assignee: "Vinisha", assigneeRole: "Legal Intern", priority: "high", comments: "Consolidate all findings, matrices, risks, recommendations, and scorecards into a management-ready report." },
  { title: "PKM Advisory Coordination", assignee: "Kashish", assigneeRole: "Legal", priority: "high", comments: "Coordinate licensing-related clarifications, documentation requests, and compliance follow-ups with PKM Advisory LLP." },
  { title: "Licensing Follow-Up Tracker", assignee: "Kashish", assigneeRole: "Legal", priority: "high", comments: "Maintain records of licensing issues, follow-ups, pending actions, and coordination activities after the sprint." },
  { title: "Post-Sprint Licensing Support", assignee: "Kashish", assigneeRole: "Legal", priority: "high", comments: "Take ownership of licensing-related document coordination and issue tracking after completion of the 15-day review sprint." },
];

// Seed all 43 legal tasks
export const seedLegalTasks = internalMutation({
  args: {},
  handler: async (ctx) => {
    const dueDate = "2026-06-26"; // 2 days from now
    let count = 0;

    for (const task of LEGAL_TASKS) {
      // Check if task already exists to prevent duplicates
      const existing = await ctx.db
        .query("workTasks")
        .filter((q) =>
          q.and(
            q.eq(q.field("title"), task.title),
            q.eq(q.field("assignee"), task.assignee)
          )
        )
        .first();

      if (!existing) {
        await ctx.db.insert("workTasks", {
          title: task.title,
          assignee: task.assignee,
          assigneeRole: task.assigneeRole,
          status: "ongoing",
          dueDate,
          priority: task.priority,
          comments: task.comments,
          owner: "Siddharatha",
          createdBy: "Siddharatha",
        } as any);
        count++;
      }
    }

    console.log(`Seeded ${count} legal tasks (skipped ${LEGAL_TASKS.length - count} existing)`);
  },
});
