// Main dashboard page
import { ExecutionList } from "@/components/execution-list"

export const metadata = {
  title: "X-Ray Dashboard",
  description: "Debug multi-step algorithmic systems",
}

export default function DashboardPage() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Header */}
        <div className="mb-8 md:mb-12">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">X-Ray Dashboard</h1>
          <p className="text-muted-foreground">
            Debug multi-step decision processes with complete visibility into each step
          </p>
        </div>

        {/* Executions List */}
        <div>
          <h2 className="text-xl font-semibold text-foreground mb-4">Recent Executions</h2>
          <ExecutionList />
        </div>
      </div>
    </main>
  )
}
