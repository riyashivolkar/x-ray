// API route to get a specific execution
import { getDatabase } from "@/lib/mongodb";
import { MongoDBAdapter } from "@/lib/xray/adapters/mongodb";
import { type NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const db = await getDatabase();
    const adapter = new MongoDBAdapter(db);

    const execution = await adapter.get(id);

    if (!execution) {
      return NextResponse.json(
        { error: "Execution not found" },
        { status: 404 }
      );
    }

    const normalizedExecution = {
      ...execution,
      steps: execution.steps.map((step: any) => ({
        ...step,
        // Ensure 'name' field exists (XRay library format)
        name: step.name || step.stepName,
        // Keep both for backwards compatibility
        stepName: step.stepName || step.name,
      })),
    };

    return NextResponse.json(normalizedExecution);
  } catch (error) {
    console.error("Error fetching execution:", error);
    return NextResponse.json(
      { error: "Failed to fetch execution" },
      { status: 500 }
    );
  }
}
