/**
 * Example: Using X-Ray for Lead Scoring Pipeline
 *
 * Shows how the same library can be used for a completely different use case
 */

import XRay from "../index"

export async function runLeadScoring(
  lead: {
    id: string
    email: string
    company?: string
    title?: string
    source: string
  },
  storage: any,
) {
  const xray = XRay.create("lead-scoring-pipeline", storage, {
    metadata: {
      leadId: lead.id,
      source: lead.source,
    },
  })

  // Step 1: Data Enrichment
  xray
    .step("enrich-data")
    .input({ leadId: lead.id, email: lead.email })
    .output({
      enrichedFields: ["company", "industry", "revenue", "employeeCount"],
      dataSource: "clearbit",
    })
    .reason("Enriched 4 fields from Clearbit API")
    .metadata({ apiLatency: 245, creditsUsed: 1 })
    .record()

  // Step 2: Qualification Check
  const qualificationChecks = [
    { name: "has_company_email", passed: !lead.email.includes("gmail.com"), detail: "Business email domain" },
    { name: "has_title", passed: !!lead.title, detail: "Job title provided" },
    { name: "target_industry", passed: true, detail: "Software/Tech industry match" },
  ]

  xray
    .step("qualification-check")
    .input({ checks: qualificationChecks.map((c) => c.name) })
    .output({ qualified: true, checksPassed: 3, checksFailed: 0 })
    .reason("Lead meets all qualification criteria")
    .filters(qualificationChecks)
    .record()

  // Step 3: Score Calculation
  const scores = {
    firmographic: 35, // company size, industry, revenue
    behavioral: 28, // website visits, email opens
    demographic: 22, // job title, seniority
  }
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)

  xray
    .step("calculate-score")
    .input({ signals: Object.keys(scores) })
    .output({ totalScore, breakdown: scores, grade: "A" })
    .reason(`Total score: ${totalScore}/100 - Grade A lead`)
    .record()

  // Step 4: Route to Sales
  const assignedRep = totalScore >= 70 ? "senior-rep" : "junior-rep"

  xray
    .step("route-to-sales")
    .input({ score: totalScore, grade: "A" })
    .output({ assignedTo: assignedRep, priority: "high" })
    .reason(`High score (${totalScore}) assigned to senior sales rep`)
    .record()

  xray.setResult({
    selected: { id: lead.id, score: totalScore, grade: "A" },
    reason: "Qualified A-grade lead assigned to sales",
    confidence: 0.87,
  })

  await xray.complete("success")
  return xray
}
