"use client";

import type { Execution } from "@/lib/xray";

interface DecisionSummaryProps {
  execution: Execution;
}

export function DecisionSummary({ execution }: DecisionSummaryProps) {
  // Get the final result from the execution
  const finalStep = execution.steps[execution.steps.length - 1];
  const selectedCandidate = execution.result
    ? typeof execution.result === "object" &&
      execution.result !== null &&
      "title" in execution.result
      ? String((execution.result as { title: string }).title)
      : JSON.stringify(execution.result)
    : "No result";

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/5 border border-blue-500/30 rounded-lg p-4 space-y-3">
        <div>
          <p className="text-xs font-semibold text-blue-700 dark:text-blue-400 uppercase tracking-wider">
            Final Decision
          </p>
          <p className="text-sm font-semibold text-foreground mt-1">
            Selected: {selectedCandidate}
          </p>
        </div>

        {finalStep?.reasoning && (
          <p className="text-sm text-foreground break-words">
            {finalStep.reasoning}
          </p>
        )}

        <div className="space-y-2 pt-2 border-t border-blue-500/20">
          <p className="text-xs font-medium text-muted-foreground">
            Execution Summary:
          </p>
          <div className="grid gap-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Total Steps:</span>
              <span className="text-foreground">{execution.steps.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Status:</span>
              <span className="text-foreground capitalize">
                {execution.status}
              </span>
            </div>
            {execution.completedAt && execution.startedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="text-foreground">
                  {(
                    (new Date(execution.completedAt).getTime() -
                      new Date(execution.startedAt).getTime()) /
                    1000
                  ).toFixed(2)}
                  s
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {execution.steps.map((step, idx) => (
        <div
          key={step.id}
          className="bg-muted/50 border border-border rounded-lg p-4 space-y-2"
        >
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Step {idx + 1}: {step.name}
          </p>
          {step.reasoning && (
            <p className="text-sm text-foreground">{step.reasoning}</p>
          )}
          {step.candidateResults && step.candidateResults.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Evaluated {step.candidateResults.length} candidate(s)
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
