"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DecisionTree } from "./decision-tree";
import { DecisionSummary } from "./decision-summary";
import { StepTreeView } from "./step-tree-view";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Execution } from "@/lib/xray";

interface ExecutionDetailProps {
  executionId: string;
}

export function ExecutionDetail({ executionId }: ExecutionDetailProps) {
  const [viewMode, setViewMode] = useState<"tree" | "detail">("tree");
  const [execution, setExecution] = useState<Execution | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchExecution() {
      try {
        setLoading(true);
        const response = await fetch(`/api/xray/executions/${executionId}`);

        if (!response.ok) {
          throw new Error("Failed to fetch execution");
        }

        const data = await response.json();
        setExecution(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
        console.error("Error fetching execution:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchExecution();
  }, [executionId]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          <p className="text-muted-foreground">Loading execution details...</p>
        </div>
      </div>
    );
  }

  if (error || !execution) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle className="text-destructive">
              Error Loading Execution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              {error || "Execution not found"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <CardTitle>Execution Details</CardTitle>
              <CardDescription>ID: {execution.id}</CardDescription>
            </div>
            <Badge
              variant={execution.status === "success" ? "default" : "secondary"}
            >
              {execution.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Started
              </p>
              <p className="text-sm">
                {new Date(execution.startedAt).toLocaleString()}
              </p>
            </div>
            {execution.completedAt && (
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Completed
                </p>
                <p className="text-sm">
                  {new Date(execution.completedAt).toLocaleString()}
                </p>
              </div>
            )}
          </div>

          {execution.result && (
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-2">
                Result
              </p>
              <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                {JSON.stringify(execution.result, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Decision Path Analysis</CardTitle>
            <div className="flex gap-2">
              <button
                onClick={() => setViewMode("tree")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === "tree"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Tree View
              </button>
              <button
                onClick={() => setViewMode("detail")}
                className={`px-3 py-1 text-sm rounded-md transition-colors ${
                  viewMode === "detail"
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                Detail View
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {viewMode === "tree" ? (
            <div className="space-y-4">
              {execution.steps.map((step) => (
                <StepTreeView key={step.id} step={step} />
              ))}
            </div>
          ) : (
            <Tabs defaultValue="summary" className="w-full">
              <TabsList>
                <TabsTrigger value="summary">Summary</TabsTrigger>
                <TabsTrigger value="tree">Decision Tree</TabsTrigger>
                {execution.steps.map((step, idx) => (
                  <TabsTrigger key={step.id} value={`step-${idx}`}>
                    Step {idx + 1}
                  </TabsTrigger>
                ))}
              </TabsList>

              <TabsContent value="summary" className="space-y-4">
                <DecisionSummary execution={execution} />
              </TabsContent>

              <TabsContent value="tree" className="space-y-4">
                <DecisionTree steps={execution.steps} />
              </TabsContent>

              {execution.steps.map((step, idx) => (
                <TabsContent
                  key={step.id}
                  value={`step-${idx}`}
                  className="space-y-4"
                >
                  <Card>
                    <CardHeader>
                      <CardTitle>
                        Step {idx + 1}: {step.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Input
                        </p>
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                          {JSON.stringify(step.input, null, 2)}
                        </pre>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-muted-foreground mb-2">
                          Output
                        </p>
                        <pre className="text-xs bg-muted p-3 rounded-md overflow-x-auto">
                          {JSON.stringify(step.output, null, 2)}
                        </pre>
                      </div>

                      {step.reasoning && (
                        <div>
                          <p className="text-sm font-medium text-muted-foreground mb-2">
                            Reasoning
                          </p>
                          <p className="text-sm">{step.reasoning}</p>
                        </div>
                      )}

                      {step.candidateResults &&
                        step.candidateResults.length > 0 && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground mb-2">
                              Candidate Evaluations
                            </p>
                            <div className="space-y-2">
                              {step.candidateResults.map((result) => (
                                <Card key={result.candidate.id}>
                                  <CardContent className="pt-4">
                                    <div className="flex items-start justify-between mb-2">
                                      <p className="font-medium">
                                        {(
                                          result.candidate as { title?: string }
                                        ).title || result.candidate.id}
                                      </p>
                                      <Badge
                                        variant={
                                          result.passed
                                            ? "default"
                                            : "destructive"
                                        }
                                      >
                                        {result.passed ? "Passed" : "Failed"}
                                      </Badge>
                                    </div>

                                    {result.score !== undefined && (
                                      <p className="text-sm  text-muted-foreground mb-2">
                                        Score: {result.score}
                                      </p>
                                    )}

                                    {result.evaluations && (
                                      <div className="space-y-1">
                                        {Object.entries(result.evaluations).map(
                                          ([key, evaluation]) => (
                                            <div
                                              key={key}
                                              className="flex items-center gap-2 text-xs"
                                            >
                                              <Badge
                                                variant={
                                                  evaluation.passed
                                                    ? "outline"
                                                    : "destructive"
                                                }
                                                className="text-xs"
                                              >
                                                {key}
                                              </Badge>
                                              <span className="text-muted-foreground">
                                                {evaluation.detail}
                                              </span>
                                            </div>
                                          )
                                        )}
                                      </div>
                                    )}

                                    {result.failureReasons &&
                                      result.failureReasons.length > 0 && (
                                        <div className="mt-2">
                                          <p className="text-xs text-destructive font-medium mb-1">
                                            Failure Reasons:
                                          </p>
                                          <ul className="text-xs text-muted-foreground list-disc list-inside">
                                            {result.failureReasons.map(
                                              (reason, idx) => (
                                                <li key={idx}>{reason}</li>
                                              )
                                            )}
                                          </ul>
                                        </div>
                                      )}
                                  </CardContent>
                                </Card>
                              ))}
                            </div>
                          </div>
                        )}
                    </CardContent>
                  </Card>
                </TabsContent>
              ))}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
