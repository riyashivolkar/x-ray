"use client";
import { CheckCircle2, XCircle, ChevronDown } from "lucide-react";
import { useState } from "react";
import type { Step } from "@/lib/xray";

interface DecisionTreeProps {
  steps: Step[];
}

export function DecisionTree({ steps }: DecisionTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedSteps, setExpandedSteps] = useState<Set<string>>(
    new Set([steps[0]?.id])
  );

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expanded);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpanded(newExpanded);
  };

  const toggleStepExpanded = (stepId: string) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(stepId)) {
      newExpanded.delete(stepId);
    } else {
      newExpanded.add(stepId);
    }
    setExpandedSteps(newExpanded);
  };

  return (
    <div className="space-y-6">
      {steps.map((step, stepIndex) => {
        const candidates = step.candidateResults || [];

        // For candidate_search step, show output candidates count
        let displayCandidatesCount = candidates.length;
        let displayPassedCount = candidates.filter((c) => c.passed).length;

        if (step.name === "candidate_search" && step.output.candidates) {
          const outputCandidates = step.output.candidates as Array<unknown>;
          displayCandidatesCount = outputCandidates.length;
          displayPassedCount = outputCandidates.length; // All found candidates "passed" the search
        }

        const failedCount = displayCandidatesCount - displayPassedCount;
        const isStepExpanded = expandedSteps.has(step.id);

        return (
          <div
            key={step.id}
            className="border border-border rounded-lg overflow-hidden"
          >
            {/* Step Header */}
            <button
              onClick={() => toggleStepExpanded(step.id)}
              className="w-full p-4 flex items-center justify-between bg-muted/50 hover:bg-muted transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-semibold text-sm">
                  {stepIndex + 1}
                </div>
                <div className="text-left">
                  <p className="font-semibold text-foreground">{step.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {displayCandidatesCount} candidates • {displayPassedCount}{" "}
                    passed
                    {failedCount > 0 && ` • ${failedCount} filtered`}
                  </p>
                </div>
              </div>
              <ChevronDown
                className={`w-5 h-5 text-muted-foreground transition-transform ${
                  isStepExpanded ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Step Content */}
            {isStepExpanded && (
              <div className="p-4 space-y-4">
                {/* Step Input/Output Summary */}
                {step.reasoning && (
                  <div className="p-3 bg-blue-500/10 border border-blue-500/30 rounded-lg">
                    <p className="text-sm font-medium text-foreground mb-1">
                      Reasoning
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {step.reasoning}
                    </p>
                  </div>
                )}

                {/* Candidates */}
                {candidates.length > 0 && (
                  <div className="space-y-2">
                    {candidates.map((candidateResult) => {
                      const candidate = candidateResult.candidate as {
                        id: string;
                        title?: string;
                        price?: number;
                        rating?: number;
                        reviewCount?: number;
                        [key: string]: unknown;
                      };

                      return (
                        <div
                          key={candidate.id}
                          className={`border rounded-lg overflow-hidden transition-colors ${
                            candidateResult.passed
                              ? "border-green-500/30 bg-green-500/5"
                              : "border-red-500/30 bg-red-500/5"
                          }`}
                        >
                          <button
                            onClick={() => toggleExpanded(candidate.id)}
                            className="w-full p-3 flex items-center gap-3 hover:bg-muted/50 transition-colors text-left"
                          >
                            {candidateResult.passed ? (
                              <CheckCircle2 className="w-4 h-4 text-green-600 flex-shrink-0" />
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-foreground truncate">
                                {candidate.title || candidate.id}
                              </p>
                              <p className="text-xs text-muted-foreground mt-0.5">
                                {candidate.price && `$${candidate.price}`}
                                {candidate.rating && ` • ${candidate.rating}★`}
                                {candidate.reviewCount &&
                                  ` • ${candidate.reviewCount} reviews`}
                              </p>
                            </div>
                            {candidateResult.score !== undefined && (
                              <div className="text-right mr-2">
                                <p className="text-xs font-semibold text-foreground">
                                  {candidateResult.score.toFixed(3)}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  score
                                </p>
                              </div>
                            )}
                            <ChevronDown
                              className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${
                                expanded.has(candidate.id) ? "rotate-180" : ""
                              }`}
                            />
                          </button>

                          {expanded.has(candidate.id) && (
                            <div className="px-3 py-3 border-t border-border bg-muted/30 space-y-3 text-xs">
                              {/* Filter Evaluations */}
                              {candidateResult.evaluations &&
                                Object.keys(candidateResult.evaluations)
                                  .length > 0 && (
                                  <div className="space-y-2">
                                    <p className="font-semibold text-foreground uppercase tracking-wider">
                                      Evaluations
                                    </p>
                                    {Object.entries(
                                      candidateResult.evaluations
                                    ).map(([evalName, evalResult]) => (
                                      <div
                                        key={evalName}
                                        className={`flex gap-2 p-2 rounded ${
                                          evalResult.passed
                                            ? "bg-green-500/10"
                                            : "bg-red-500/10"
                                        }`}
                                      >
                                        {evalResult.passed ? (
                                          <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                                        ) : (
                                          <XCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                                        )}
                                        <div className="flex-1 min-w-0">
                                          <p className="font-medium text-foreground capitalize">
                                            {evalName.replace(/_/g, " ")}
                                          </p>
                                          <p className="text-muted-foreground break-words">
                                            {evalResult.detail}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}

                              {/* Failure Reasons */}
                              {candidateResult.failureReasons &&
                                candidateResult.failureReasons.length > 0 && (
                                  <div className="p-2 bg-red-500/10 border border-red-500/30 rounded space-y-1">
                                    <p className="font-medium text-red-700 dark:text-red-400">
                                      Disqualified:
                                    </p>
                                    {candidateResult.failureReasons.map(
                                      (reason, idx) => (
                                        <p
                                          key={idx}
                                          className="text-red-600 dark:text-red-400 flex gap-1"
                                        >
                                          <span>•</span>
                                          <span>{reason}</span>
                                        </p>
                                      )
                                    )}
                                  </div>
                                )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
