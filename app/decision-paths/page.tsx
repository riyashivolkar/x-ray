"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Filter, Zap } from "lucide-react";

interface ExecutionAnalysis {
  _id: string;
  executionId: string;
  workflowName: string;
  totalDuration: number;
  createdAt: string;
  filterPassRate: number;
  accessoryFilterRate: number;
  selectedCompetitor: string;
  selectedScore: number;
  totalCandidates: number;
}

export default function DecisionPathsPage() {
  const [executions, setExecutions] = useState<ExecutionAnalysis[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExecutions = async () => {
      try {
        const response = await fetch("/api/xray/executions?limit=100");
        const data = await response.json();

        // Analyze each execution for decision path metrics
        const analyzed = data.map((exec: any) => {
          const filterStep = exec.steps.find(
            (s: any) => s.stepName === "apply_filters"
          );
          const llmStep = exec.steps.find(
            (s: any) => s.stepName === "llm_relevance_evaluation"
          );
          const rankStep = exec.steps.find(
            (s: any) => s.stepName === "rank_and_select"
          );

          const totalCandidates = filterStep?.input.candidates_count || 0;
          const passedFilters =
            filterStep?.candidateEvaluations?.filter((c: any) => c.passed)
              .length || 0;
          const accessoryRemoved =
            llmStep?.candidateEvaluations?.filter((c: any) => !c.passed)
              .length || 0;
          const selected = rankStep?.candidateEvaluations?.[0];

          return {
            _id: exec._id,
            executionId: exec.executionId,
            workflowName: exec.workflowName,
            totalDuration: exec.totalDuration,
            createdAt: exec.createdAt,
            filterPassRate:
              totalCandidates > 0 ? (passedFilters / totalCandidates) * 100 : 0,
            accessoryFilterRate:
              passedFilters > 0 ? (accessoryRemoved / passedFilters) * 100 : 0,
            selectedCompetitor: selected?.title || "N/A",
            selectedScore: selected?.ranking_score || 0,
            totalCandidates,
          };
        });

        setExecutions(analyzed);
      } catch (error) {
        console.error(" Error analyzing executions:", error);
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

  if (executions.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-muted-foreground">
          No decision paths yet. Run a workflow to get started.
        </p>
      </Card>
    );
  }

  const avgFilterPassRate =
    executions.reduce((sum, e) => sum + e.filterPassRate, 0) /
    executions.length;
  const avgAccessoryFilter =
    executions.reduce((sum, e) => sum + e.accessoryFilterRate, 0) /
    executions.length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-1">
          Decision Path Analysis
        </h1>
        <p className="text-muted-foreground">
          Analyze how the competitor detection pipeline makes decisions across
          multiple executions
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4 border border-border">
          <div className="flex items-start gap-3">
            <Filter className="w-4 h-4 text-blue-600 mt-1" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Avg Filter Pass Rate
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {avgFilterPassRate.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Candidates passing price/rating/reviews filters
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-border">
          <div className="flex items-start gap-3">
            <Zap className="w-4 h-4 text-yellow-600 mt-1" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Avg Accessory Filter
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {avgAccessoryFilter.toFixed(1)}%
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Accessories/replacement parts removed
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-4 border border-border">
          <div className="flex items-start gap-3">
            <TrendingUp className="w-4 h-4 text-green-600 mt-1" />
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Executions Analyzed
              </p>
              <p className="text-2xl font-bold text-foreground mt-1">
                {executions.length}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Total decision paths traced
              </p>
            </div>
          </div>
        </Card>
      </div>

      {/* Execution List */}
      <div>
        <h2 className="text-lg font-semibold text-foreground mb-3">
          Decision Paths by Execution
        </h2>
        <div className="space-y-2">
          {executions.map((exec) => (
            <Link key={exec._id} href={`/execution/${exec._id}`}>
              <Card className="p-4 hover:bg-muted cursor-pointer transition-colors border border-border">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">
                        {exec.workflowName}
                      </h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Execution ID: {exec.executionId}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                      {new Date(exec.createdAt).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground">
                        Filter Pass Rate
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full bg-blue-600"
                            style={{ width: `${exec.filterPassRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold text-foreground min-w-fit">
                          {exec.filterPassRate.toFixed(0)}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {exec.totalCandidates} total candidates
                      </p>
                    </div>

                    <div>
                      <p className="text-xs text-muted-foreground">
                        Selected Competitor
                      </p>
                      <p className="text-sm font-semibold text-foreground mt-1 truncate">
                        {exec.selectedCompetitor}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Score: {exec.selectedScore.toFixed(3)}
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {exec.totalDuration}ms
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {exec.accessoryFilterRate.toFixed(0)}% accessories
                      filtered
                    </Badge>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
