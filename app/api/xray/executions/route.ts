import { getDatabase } from "@/lib/mongodb";
import { MongoDBAdapter } from "@/lib/xray/adapters/mongodb";
import { type NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const execution = await request.json();
    console.log(
      "[] Received execution to save:",
      execution.executionId || execution.id
    );

    const db = await getDatabase();
    const adapter = new MongoDBAdapter(db);

    const normalizedExecution = {
      ...execution,
      id: execution.executionId || execution.id,
      executionId: execution.executionId || execution.id,
      steps:
        execution.steps?.map((step: any) => ({
          ...step,
          // Ensure 'name' field exists (XRay library format)
          name: step.name || step.stepName,
          // Keep both for backwards compatibility
          stepName: step.stepName || step.name,
        })) || [],
    };

    await adapter.save(normalizedExecution);
    console.log(
      "[] Successfully saved execution with ID:",
      normalizedExecution.id
    );

    return NextResponse.json(
      { executionId: normalizedExecution.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("[] Error saving execution:", error);
    return NextResponse.json(
      { error: "Failed to save execution" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    console.log(" Fetching executions list");

    const { searchParams } = new URL(request.url);
    const workflowName = searchParams.get("workflow");
    const limit = Number.parseInt(searchParams.get("limit") || "50", 10);

    const db = await getDatabase();
    const adapter = new MongoDBAdapter(db);

    const filter = workflowName ? { pipelineName: workflowName } : {};
    console.log(" Query filter:", filter);

    const executions = await adapter.query(filter);
    console.log(" Found executions count:", executions?.length || 0);

    // Sort by startedAt descending and limit results
    const sortedExecutions = (executions || [])
      .sort(
        (a, b) =>
          new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
      )
      .slice(0, limit);

    return NextResponse.json(sortedExecutions);
  } catch (error) {
    console.error(" Error in GET /api/xray/executions:", error);
    // Return empty array on error to prevent client-side crashes
    return NextResponse.json([]);
  }
}
