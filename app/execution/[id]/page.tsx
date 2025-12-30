// Execution detail page
import { ExecutionDetail } from "@/components/execution-detail"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"

export const metadata = {
  title: "Execution Detail - X-Ray Dashboard",
  description: "View detailed execution trace",
}

export default async function ExecutionPage(props: { params: Promise<{ id: string }> }) {
  const params = await props.params

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        {/* Back Button */}
        <Link href="/">
          <Button variant="ghost" className="mb-6">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>

        {/* Detail */}
        <ExecutionDetail executionId={params.id} />
      </div>
    </main>
  )
}
