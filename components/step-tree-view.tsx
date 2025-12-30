"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import type { Step } from "@/lib/xray";

interface StepTreeViewProps {
  step: Step;
}

export function StepTreeView({ step }: StepTreeViewProps) {
  const stepName = step.name || (step as any).stepName || "unknown_step";

  // Extract reference product from input
  const referenceProduct = step.input.reference_product as
    | Record<string, unknown>
    | undefined;
  const candidatesCount = step.input.candidates_count as number | undefined;

  // Calculate filter thresholds for apply_filters step
  const getFilterThresholds = () => {
    if (stepName !== "apply_filters" || !referenceProduct) return null;

    const price = referenceProduct.price as number;
    const priceMin = price * 0.5;
    const priceMax = price * 2;

    return {
      priceRange: `$${priceMin.toFixed(2)} - $${priceMax.toFixed(2)}`,
      rating: "minimum 3.8★",
      reviews: "minimum 100",
    };
  };

  const filterThresholds = getFilterThresholds();

  const passedCandidates = step.candidateResults?.filter((c) => c.passed) || [];
  const failedCandidates =
    step.candidateResults?.filter((c) => !c.passed) || [];

  // Get the selected candidate (for display purposes)
  const selectedCandidate = passedCandidates[0];

  // Format metrics for display
  const formatMetrics = (metrics?: Record<string, unknown>) => {
    if (!metrics) return "";
    const parts: string[] = [];
    if (metrics.price !== undefined) parts.push(`$${metrics.price}`);
    if (metrics.rating !== undefined) parts.push(`${metrics.rating}★`);
    if (metrics.reviews !== undefined) parts.push(`${metrics.reviews} reviews`);
    return parts.join(", ");
  };

  // Determine step title
  const stepTitle =
    stepName === "apply_filters"
      ? "Competitor Filter"
      : stepName === "llm_relevance_evaluation"
      ? "Relevance Evaluation"
      : stepName === "rank_and_select"
      ? "Ranking & Selection"
      : stepName === "candidate_search"
      ? "Candidate Search"
      : stepName
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" ");

  // Show only first 3 passed and 3 failed as preview
  const previewPassedCount = Math.min(3, passedCandidates.length);
  const previewFailedCount = Math.min(3, failedCandidates.length);
  const hasMorePassed = passedCandidates.length > previewPassedCount;
  const hasMoreFailed = failedCandidates.length > previewFailedCount;

  const getOutputMessage = () => {
    // For apply_filters step
    if (stepName === "apply_filters") {
      const passed = step.output.passed as number | undefined;
      const failed = step.output.failed as number | undefined;
      if (passed !== undefined) {
        return passed > 0
          ? `${passed} candidate${passed !== 1 ? "s" : ""} passed filters${
              failed ? ` (${failed} failed)` : ""
            }`
          : "No candidates passed filters";
      }
    }

    // For llm_relevance_evaluation step
    if (stepName === "llm_relevance_evaluation") {
      const confirmed = step.output.confirmed_competitors as number | undefined;
      const removed = step.output.false_positives_removed as number | undefined;
      if (confirmed !== undefined) {
        return confirmed > 0
          ? `${confirmed} true competitor${
              confirmed !== 1 ? "s" : ""
            } confirmed${
              removed ? ` (${removed} false positives removed)` : ""
            }`
          : "No true competitors identified";
      }
    }

    // For rank_and_select step
    if (stepName === "rank_and_select") {
      const selected = step.output.selected_competitor as
        | Record<string, unknown>
        | undefined;
      if (selected) {
        return `Selected: ${selected.title} (score: ${step.output.total_score})`;
      }
    }

    // For candidate_search step
    if (stepName === "candidate_search") {
      const totalResults = step.output.total_results as number | undefined;
      const candidatesFetched = step.output.candidates_fetched as
        | number
        | undefined;
      if (candidatesFetched !== undefined) {
        return `${candidatesFetched} candidates fetched${
          totalResults ? ` from ${totalResults} total results` : ""
        }`;
      }
    }

    // Default: check candidateEvaluations
    if (passedCandidates.length > 0) {
      return `${passedCandidates.length} candidate${
        passedCandidates.length !== 1 ? "s" : ""
      } selected`;
    }

    return "No candidates passed";
  };

  // Get candidates list from output for candidate_search step
  const getCandidatesList = () => {
    if (stepName === "candidate_search" && step.output.candidates) {
      return step.output.candidates as Array<{
        asin: string;
        title: string;
        price: number;
        rating: number;
        reviews: number;
      }>;
    }
    return null;
  };

  const candidatesList = getCandidatesList();

  return (
    <div className="font-mono text-xs leading-relaxed bg-muted/30 p-4 rounded-lg border border-border overflow-x-auto">
      {/* Step Header */}
      <div className="text-foreground">
        <span className="font-semibold">Step: {stepTitle}</span>
      </div>

      {/* Input */}
      {candidatesCount !== undefined && (
        <div className="text-muted-foreground">
          <span className="text-border">├──</span>{" "}
          <span className="text-foreground font-medium">Input:</span>{" "}
          {candidatesCount} candidate products
        </div>
      )}

      {/* Reference Product */}
      {referenceProduct && (
        <div className="text-muted-foreground">
          <span className="text-border">├──</span>{" "}
          <span className="text-foreground font-medium">
            Reference Product:
          </span>{" "}
          &quot;{String(referenceProduct.title)}
          &quot; ({formatMetrics(referenceProduct as Record<string, unknown>)})
        </div>
      )}

      {/* Filters Applied (for apply_filters step) */}
      {filterThresholds && (
        <div className="text-muted-foreground">
          <span className="text-border">├──</span>{" "}
          <span className="text-foreground font-medium">Filters Applied:</span>
          <div className="ml-4">
            <div>
              <span className="text-border">│ ├──</span>{" "}
              <span className="text-foreground">Price Range:</span> 0.5x - 2x of
              reference ({filterThresholds.priceRange})
            </div>
            <div>
              <span className="text-border">│ ├──</span>{" "}
              <span className="text-foreground">Rating:</span>{" "}
              {filterThresholds.rating}
            </div>
            <div>
              <span className="text-border">│ └──</span>{" "}
              <span className="text-foreground">Reviews:</span>{" "}
              {filterThresholds.reviews}
            </div>
          </div>
        </div>
      )}

      {/* Candidates List (for candidate_search step) */}
      {candidatesList && candidatesList.length > 0 && (
        <div className="text-muted-foreground">
          <span className="text-border">├──</span>{" "}
          <span className="text-foreground font-medium">
            Candidates Retrieved:
          </span>
          <div className="ml-4">
            {candidatesList.slice(0, 5).map((candidate, idx) => {
              const isLast = idx === Math.min(5, candidatesList.length) - 1;
              return (
                <div key={candidate.asin} className="text-muted-foreground">
                  <span className="text-border">
                    {isLast && candidatesList.length <= 5
                      ? "│   └──"
                      : "│   ├──"}
                  </span>{" "}
                  <span className="text-foreground">{candidate.title}</span> ($
                  {candidate.price.toFixed(2)}, {candidate.rating}★,{" "}
                  {candidate.reviews.toLocaleString()} reviews)
                </div>
              );
            })}
            {candidatesList.length > 5 && (
              <div className="text-muted-foreground italic">
                <span className="text-border">│ └──</span> ... and{" "}
                {candidatesList.length - 5} more
              </div>
            )}
          </div>
        </div>
      )}

      {/* Candidates Evaluated */}
      {step.candidateResults && step.candidateResults.length > 0 && (
        <div className="text-muted-foreground">
          <span className="text-border">├──</span>{" "}
          <span className="text-foreground font-medium">
            Candidates Evaluated:
          </span>
          <div className="ml-4">
            {/* Show first few passed candidates */}
            {passedCandidates
              .slice(0, previewPassedCount)
              .map((candidate, idx) => {
                const isLast =
                  idx === previewPassedCount - 1 &&
                  !hasMorePassed &&
                  failedCandidates.length === 0;
                const showScore =
                  stepName === "rank_and_select" &&
                  candidate.score !== undefined;
                return (
                  <div key={candidate.candidate.id} className="flex gap-1">
                    <span className="text-border">
                      {isLast ? "│   └──" : "│   ├──"}
                    </span>
                    <CheckCircle2 className="w-3 h-3 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">
                      {candidate.rank ? `#${candidate.rank} ` : ""}
                      {(candidate.candidate as { title?: string }).title ||
                        candidate.candidate.id}
                    </span>
                    <span className="text-muted-foreground">
                      (
                      {formatMetrics(
                        (
                          candidate.candidate as {
                            metrics?: Record<string, unknown>;
                          }
                        ).metrics
                      )}
                      )
                      {showScore &&
                        ` - score: ${(candidate.score as number).toFixed(3)}`}
                      {!showScore && " - PASSED all filters"}
                    </span>
                  </div>
                );
              })}

            {/* Show first few failed candidates with inline reasons */}
            {failedCandidates
              .slice(0, previewFailedCount)
              .map((candidate, idx) => {
                const isLast = idx === previewFailedCount - 1 && !hasMoreFailed;
                const failureText =
                  candidate.failureReasons?.join(", ") || "evaluation failed";

                return (
                  <div key={candidate.candidate.id} className="flex gap-1">
                    <span className="text-border">
                      {isLast ? "│   └──" : "│   ├──"}
                    </span>
                    <XCircle className="w-3 h-3 text-red-600 mt-0.5 flex-shrink-0" />
                    <span className="text-foreground">
                      {(candidate.candidate as { title?: string }).title ||
                        candidate.candidate.id}
                    </span>
                    <span className="text-muted-foreground">
                      (
                      {formatMetrics(
                        (
                          candidate.candidate as {
                            metrics?: Record<string, unknown>;
                          }
                        ).metrics
                      )}
                      ) -{" "}
                      <span className="text-red-600 dark:text-red-400">
                        FAILED: {failureText}
                      </span>
                    </span>
                  </div>
                );
              })}

            {/* Summary if more candidates exist */}
            {(hasMorePassed || hasMoreFailed) && (
              <div className="text-muted-foreground italic">
                <span className="text-border">│ └──</span> ... (
                {passedCandidates.length} passed, {failedCandidates.length}{" "}
                failed)
              </div>
            )}
          </div>
        </div>
      )}

      {/* Selection */}
      {selectedCandidate && (
        <div className="text-muted-foreground">
          <span className="text-border">├──</span>{" "}
          <span className="text-foreground font-medium">Selection:</span>{" "}
          {(selectedCandidate.candidate as { title?: string }).title ||
            selectedCandidate.candidate.id}
          {stepName === "rank_and_select" &&
            selectedCandidate.score !== undefined && (
              <span className="text-muted-foreground bg-red-900">
                {" "}
                (score: {(selectedCandidate.score as number).toFixed(3)})
              </span>
            )}
          {stepName === "apply_filters" && (
            <span className="text-muted-foreground">
              {" "}
              (highest review count among qualified)
            </span>
          )}
          {step.reasoning && (
            <span className="text-muted-foreground"> ({step.reasoning})</span>
          )}
        </div>
      )}

      {/* Reasoning */}
      {step.reasoning && !selectedCandidate && (
        <div className="text-muted-foreground">
          <span className="text-border">├──</span>{" "}
          <span className="text-foreground font-medium">Reasoning:</span>{" "}
          {step.reasoning}
        </div>
      )}

      {/* Output */}
      {step.output && (
        <div className="text-muted-foreground">
          <span className="text-border">└──</span>{" "}
          <span className="text-foreground font-medium">Output:</span>{" "}
          {getOutputMessage()}
          {Array.isArray(step.output.passed) &&
            step.output.passed.length > 0 && (
              <div className="ml-4 mt-1">
                {(step.output.passed as Array<{ title: string; asin: string }>)
                  .slice(0, 3)
                  .map((product, idx, arr) => {
                    const isLast = idx === Math.min(3, arr.length) - 1;
                    return (
                      <div key={product.asin} className="text-muted-foreground">
                        <span className="text-border">
                          {isLast && arr.length <= 3 ? "    └──" : "    ├──"}
                        </span>{" "}
                        <span className="text-foreground">{product.title}</span>
                      </div>
                    );
                  })}
                {step.output.passed.length > 3 && (
                  <div className="text-muted-foreground italic">
                    <span className="text-border"> └──</span> ... and{" "}
                    {step.output.passed.length - 3} more
                  </div>
                )}
              </div>
            )}
        </div>
      )}
    </div>
  );
}
