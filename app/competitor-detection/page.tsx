"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import Link from "next/link";

export default function CompetitorDetectionPage() {
  const [isRunning, setIsRunning] = useState(false);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function runDetection() {
    setIsRunning(true);
    setError(null);
    setExecutionId(null);

    try {
      const response = await fetch("/api/competitor-detection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          productTitle: "32oz Stainless Steel Water Bottle",
          category: "Sports & Outdoors",
          subcategory: "Water Bottles",
          referenceProduct: {
            asin: "B0XYZ123",
            price: 29.99,
            rating: 4.2,
            reviews: 1247,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      setExecutionId(data.executionId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setIsRunning(false);
    }
  }

  return (
    <div className="container mx-auto p-8">
      <h1 className="text-3xl font-bold mb-6">Competitor Detection</h1>

      <Card className="p-6">
        <p className="mb-4">
          Find the best competitor match for your reference product
        </p>

        <Button onClick={runDetection} disabled={isRunning}>
          {isRunning ? "Running..." : "Run Competitor Detection"}
        </Button>

        {error && (
          <div className="mt-4 p-4 bg-red-50 text-red-600 rounded">{error}</div>
        )}

        {executionId && (
          <div className="mt-4">
            <p className="text-green-600 mb-2">Detection complete!</p>
            <Link href={`/execution/${executionId}`}>
              <Button variant="outline">View Results</Button>
            </Link>
          </div>
        )}
      </Card>
    </div>
  );
}
