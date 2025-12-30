/**
 * Example: Using X-Ray for Competitor Detection Pipeline
 */

import XRay from "../index"
import type { CandidateResult } from "../index"

// Example competitor detection using the X-Ray library
export async function runCompetitorDetection(
  referenceProduct: { asin: string; price: number; rating: number },
  storage: any,
) {
  // Create X-Ray instance
  const xray = XRay.create("competitor-detection", storage, {
    metadata: {
      referenceProduct: referenceProduct.asin,
      version: "1.0.0",
    },
  })

  // Step 1: Keyword Generation
  const keywords = ["stainless steel", "water bottle", "insulated"]
  xray
    .step("keyword-generation")
    .input({ product: referenceProduct })
    .output({ keywords, count: keywords.length })
    .reason("Generated keywords from product title and category")
    .record()

  // Step 2: Candidate Search
  const candidates = await searchProducts(keywords.join(" "))
  xray
    .step("candidate-search")
    .input({ keywords, limit: 50 })
    .output({
      total_results: 2847,
      candidates_fetched: candidates.length,
    })
    .reason(`Fetched top ${candidates.length} results by relevance`)
    .record()

  // Step 3: Apply Filters
  const priceMin = referenceProduct.price * 0.5
  const priceMax = referenceProduct.price * 2.0
  const minRating = 3.8
  const minReviews = 100

  const filterResults: CandidateResult[] = candidates.map((candidate) => {
    const evaluations = {
      price: {
        passed: candidate.price >= priceMin && candidate.price <= priceMax,
        value: candidate.price,
        threshold: `${priceMin}-${priceMax}`,
        detail:
          candidate.price < priceMin
            ? `$${candidate.price} < $${priceMin} minimum`
            : candidate.price > priceMax
              ? `$${candidate.price} > $${priceMax} maximum`
              : `$${candidate.price} within range`,
      },
      rating: {
        passed: candidate.rating >= minRating,
        value: candidate.rating,
        threshold: minRating,
        detail:
          candidate.rating < minRating
            ? `${candidate.rating}★ < ${minRating}★ minimum`
            : `${candidate.rating}★ meets threshold`,
      },
      reviews: {
        passed: candidate.reviews >= minReviews,
        value: candidate.reviews,
        threshold: minReviews,
        detail:
          candidate.reviews < minReviews
            ? `${candidate.reviews} reviews < ${minReviews} minimum`
            : `${candidate.reviews} reviews meets threshold`,
      },
    }

    const passed = Object.values(evaluations).every((e) => e.passed)
    const failureReasons = Object.entries(evaluations)
      .filter(([_, e]) => !e.passed)
      .map(([name, e]) => e.detail)

    return {
      candidate,
      passed,
      evaluations,
      failureReasons: passed ? undefined : failureReasons,
    }
  })

  const passedFilters = filterResults.filter((r) => r.passed)

  xray
    .step("apply-filters")
    .input({
      candidates: candidates.length,
      filters: { priceMin, priceMax, minRating, minReviews },
    })
    .output({
      passed: passedFilters.length,
      failed: filterResults.length - passedFilters.length,
    })
    .reason(`Applied 3 filters: price range, minimum rating, minimum reviews`)
    .candidates(filterResults)
    .record()

  // Step 4: Rank and Select
  const ranked = passedFilters
    .map((result, index) => ({
      ...result,
      score: calculateScore(result.candidate),
      rank: index + 1,
    }))
    .sort((a, b) => b.score! - a.score!)

  const winner = ranked[0]

  xray
    .step("rank-and-select")
    .input({ candidates: passedFilters.length })
    .output({
      selected: winner?.candidate.asin,
      rank: 1,
      score: winner?.score,
    })
    .reason(`Selected highest scoring candidate: ${winner?.candidate.title}`)
    .candidates(ranked)
    .record()

  // Set final result
  xray.setResult({
    selected: winner?.candidate,
    reason: "Top-ranked product by review count and rating",
    confidence: 0.92,
  })

  // Complete execution
  await xray.complete("success")

  return xray
}

// Helper functions
async function searchProducts(query: string) {
  // Mock implementation
  return [
    { asin: "B001", title: "HydroFlask 32oz", price: 44.99, rating: 4.5, reviews: 8932 },
    { asin: "B002", title: "Yeti Rambler", price: 34.99, rating: 4.4, reviews: 5621 },
    { asin: "B003", title: "Generic Bottle", price: 8.99, rating: 3.2, reviews: 45 },
  ]
}

function calculateScore(candidate: any): number {
  return candidate.rating * 0.3 + Math.log(candidate.reviews) * 0.7
}
