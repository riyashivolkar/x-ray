// Component to display list of executions
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface Execution {
  _id: string;
  id: string;
  executionId?: string;
  pipelineName: string;
  workflowName?: string;
  status: "success" | "failure" | "pending";
  totalDuration?: number;
  startedAt: string;
  completedAt?: string;
  createdAt?: string;
  steps: Array<{ name: string; stepName?: string }>;
}

export function ExecutionList() {
  const [executions, setExecutions] = useState<Execution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchExecutions = async () => {
      try {
        console.log(" Fetching executions from API...");
        const response = await fetch("/api/xray/executions?limit=50");

        if (!response.ok) {
          throw new Error(`API returned ${response.status}`);
        }

        const data = await response.json();
        console.log(" Received data:", data);

        if (Array.isArray(data)) {
          setExecutions(data);
        } else {
          console.error(" API did not return an array:", data);
          setExecutions([]);
          setError("Invalid response from server");
        }
      } catch (error) {
        console.error(" Error fetching executions:", error);
        setError(
          error instanceof Error ? error.message : "Failed to fetch executions"
        );
        setExecutions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchExecutions();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <Card className="p-8 text-center">
        <p className="text-destructive mb-2">Error loading executions</p>
        <p className="text-sm text-muted-foreground">{error}</p>
      </Card>
    );
  }

  if (executions.length === 0) {
    return (
      <Card className="p-8 text-center space-y-4">
        <p className="text-muted-foreground">
          No executions yet. Run a workflow to get started.
        </p>

        <Link href="/product-match">
          <Button>Run Product Match</Button>
        </Link>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {executions.map((execution) => {
        const executionId =
          execution.id || execution.executionId || execution._id;
        const displayName =
          execution.pipelineName ||
          execution.workflowName ||
          "Unknown Workflow";
        const timestamp =
          execution.startedAt ||
          execution.createdAt ||
          new Date().toISOString();

        return (
          <Link key={execution._id} href={`/execution/${executionId}`}>
            <Card className="p-4 hover:bg-muted cursor-pointer transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground">
                    {displayName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {execution.steps?.length || 0} steps
                    {execution.totalDuration
                      ? ` • ${execution.totalDuration}ms`
                      : ""}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge
                    variant={
                      execution.status === "success" ? "default" : "destructive"
                    }
                  >
                    {execution.status}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {new Date(timestamp).toLocaleString()}
                  </span>
                </div>
              </div>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
