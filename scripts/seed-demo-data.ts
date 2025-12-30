// Script to seed MongoDB with demo execution traces
import { MongoClient } from "mongodb"

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017"

async function seedDatabase() {
  const client = new MongoClient(MONGODB_URI)

  try {
    await client.connect()
    const db = client.db("xray_system")
    const collection = db.collection("executions")

    // Create indexes
    await collection.createIndex({ workflowName: 1 })
    await collection.createIndex({ createdAt: -1 })
    await collection.createIndex({ status: 1 })

    console.log("✓ Created database indexes")

    // Sample execution traces for demo
    const sampleExecutions = [
      {
        executionId: "exec_demo_001",
        workflowName: "competitor_selection",
        status: "success",
        startedAt: new Date(Date.now() - 3600000),
        completedAt: new Date(Date.now() - 3595000),
        totalDuration: 5000,
        steps: [
          {
            id: "step_1",
            stepName: "candidate_search",
            input: { query: "stainless steel water bottle", limit: 50 },
            output: { total_results: 2847, candidates_fetched: 50 },
            reasoning: "Searched for products matching reference product criteria",
            timestamp: new Date(Date.now() - 3600000),
          },
          {
            id: "step_2",
            stepName: "apply_filters",
            input: { candidates: 50, min_price: 15, max_price: 60 },
            output: { qualified: 12, failed: 38 },
            reasoning: "Applied price, rating, and review count filters",
            evaluations: [
              {
                name: "Price Range Filter",
                passed: true,
                detail: "Product within $15-$60 range",
              },
              {
                name: "Rating Filter",
                passed: true,
                detail: "Rating >= 3.8 stars",
              },
            ],
            timestamp: new Date(Date.now() - 3599900),
          },
          {
            id: "step_3",
            stepName: "rank_and_select",
            input: { candidates: 12 },
            output: {
              selected: {
                title: "HydroFlask 32oz Wide Mouth",
                price: 44.99,
                rating: 4.5,
                reviews: 8932,
              },
            },
            reasoning: "Selected product with highest review count among qualified candidates",
            timestamp: new Date(Date.now() - 3599800),
          },
        ],
        createdAt: new Date(Date.now() - 3600000),
      },
      {
        executionId: "exec_demo_002",
        workflowName: "competitor_selection",
        status: "success",
        startedAt: new Date(Date.now() - 7200000),
        completedAt: new Date(Date.now() - 7195000),
        totalDuration: 5000,
        steps: [
          {
            id: "step_1",
            stepName: "candidate_search",
            input: { query: "athletic running shoes", limit: 50 },
            output: { total_results: 5234, candidates_fetched: 50 },
            reasoning: "Searched for running shoe competitors",
            timestamp: new Date(Date.now() - 7200000),
          },
          {
            id: "step_2",
            stepName: "apply_filters",
            input: { candidates: 50, min_price: 80, max_price: 160 },
            output: { qualified: 8, failed: 42 },
            reasoning: "Filtered by price and customer ratings",
            timestamp: new Date(Date.now() - 7199900),
          },
          {
            id: "step_3",
            stepName: "rank_and_select",
            input: { candidates: 8 },
            output: {
              selected: {
                title: "Nike Air Zoom Pegasus",
                price: 129.99,
                rating: 4.4,
                reviews: 12543,
              },
            },
            reasoning: "Selected Nike due to highest review count and brand recognition",
            timestamp: new Date(Date.now() - 7199800),
          },
        ],
        createdAt: new Date(Date.now() - 7200000),
      },
      {
        executionId: "exec_demo_003",
        workflowName: "lead_scoring",
        status: "failure",
        startedAt: new Date(Date.now() - 10800000),
        completedAt: new Date(Date.now() - 10795000),
        totalDuration: 5000,
        steps: [
          {
            id: "step_1",
            stepName: "extract_features",
            input: { lead: { email: "user@example.com", company: "Acme Inc" } },
            output: { features: { company_size: "unknown" } },
            reasoning: "Extracted lead scoring features",
            timestamp: new Date(Date.now() - 10800000),
          },
          {
            id: "step_2",
            stepName: "validate_company",
            input: { company: "Acme Inc" },
            output: { valid: false },
            reasoning: "Company not found in database",
            evaluations: [
              {
                name: "Company Existence Check",
                passed: false,
                detail: 'Company "Acme Inc" not in verified list',
              },
            ],
            timestamp: new Date(Date.now() - 10799900),
          },
        ],
        createdAt: new Date(Date.now() - 10800000),
      },
    ]

    // Clear existing demo data
    await collection.deleteMany({ executionId: { $regex: "^exec_demo" } })

    // Insert sample executions
    const result = await collection.insertMany(sampleExecutions)

    console.log(`✓ Inserted ${result.insertedIds.length} sample executions`)
    console.log("\nSample data ready! Visit http://localhost:3000 to explore.")
  } catch (error) {
    console.error("Failed to seed database:", error)
    process.exit(1)
  } finally {
    await client.close()
  }
}

seedDatabase()
