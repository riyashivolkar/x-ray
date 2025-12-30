// Demo application - Competitor Product Selection
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Loader2, Play } from "lucide-react";

interface CompetitorResult {
  title: string;
  price: number;
  rating: number;
  reviews: number;
}

const REFERENCE_PRODUCT = {
  asin: "B0XYZ123",
  title: "32oz Stainless Steel Water Bottle",
  category: "Sports & Outdoors",
  subcategory: "Water Bottles",
  price: 29.99,
  rating: 4.2,
  reviews: 1247,
};

export default function ProductMatchingPage() {
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<CompetitorResult | null>(null);
  const [executionId, setExecutionId] = useState<string | null>(null);
  const [productCount, setProductCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProductCount = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/products");
        const data = await response.json();
        setProductCount(data.products?.length || 0);
      } catch (error) {
        console.error("Error fetching product count:", error);
        setProductCount(0);
      } finally {
        setLoading(false);
      }
    };

    fetchProductCount();
  }, []);

  const runProductMatching = async () => {
    setRunning(true);
    setResult(null);

    try {
      const response = await fetch("/api/competitor-detection", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productTitle: REFERENCE_PRODUCT.title,
          category: REFERENCE_PRODUCT.category,
          subcategory: REFERENCE_PRODUCT.subcategory,
          referenceProduct: {
            asin: REFERENCE_PRODUCT.asin,
            price: REFERENCE_PRODUCT.price,
            rating: REFERENCE_PRODUCT.rating,
            reviews: REFERENCE_PRODUCT.reviews,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();

      if (data.status === "success" && data.selection) {
        const competitor = data.selection;
        setResult({
          title: competitor.title,
          price: competitor.price, // Updated to use full product details from selection
          rating: competitor.rating,
          reviews: competitor.reviews,
        });
        setExecutionId(data.executionId);
      } else {
        throw new Error("No competitor found");
      }
    } catch (error) {
      console.error("Error running product matching:", error);
      alert("Failed to find competitor. Please check the console for details.");
    } finally {
      setRunning(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 md:py-12">
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-2">
            Competitor Product Matching
          </h1>
          <p className="text-muted-foreground">
            Find the best competitor product to benchmark against using
            AI-powered selection
          </p>
        </div>

        {/* Reference Product */}
        <Card className="p-6 mb-8 border border-border">
          <h2 className="text-lg font-semibold text-foreground mb-4">
            Reference Product
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                Title
              </p>
              <p className="text-foreground font-medium">
                {REFERENCE_PRODUCT.title}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                Category
              </p>
              <p className="text-foreground font-medium">
                {REFERENCE_PRODUCT.category}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                Price
              </p>
              <p className="text-foreground font-medium">
                ${REFERENCE_PRODUCT.price.toFixed(2)}
              </p>
            </div>
            <div>
              <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                Rating
              </p>
              <p className="text-foreground font-medium">
                {REFERENCE_PRODUCT.rating}★
              </p>
            </div>
          </div>
        </Card>

        {/* Action Button */}
        <div className="mb-8">
          <Button
            onClick={runProductMatching}
            disabled={running || loading || productCount === 0}
            size="lg"
            className="w-full md:w-auto"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Loading Products...
              </>
            ) : running ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analyzing Products...
              </>
            ) : productCount === 0 ? (
              "No Products Available"
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Find Best Competitor Match
              </>
            )}
          </Button>
        </div>

        {/* Result */}
        {result && (
          <div className="space-y-4">
            <Card className="p-6 border border-green-200 bg-green-50 dark:bg-green-950/20 dark:border-green-900">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                ✓ Best Competitor Match Found
              </h3>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase mb-1">
                    Title
                  </p>
                  <p className="text-foreground font-medium">{result.title}</p>
                </div>
              </div>
            </Card>

            {executionId && (
              <Card className="p-4 border border-border bg-muted/50">
                <p className="text-sm text-muted-foreground mb-2">
                  Execution ID:{" "}
                  <span className="font-mono text-foreground">
                    {executionId}
                  </span>
                </p>
                <Button variant="outline" size="sm" asChild>
                  <a href={`/execution/${executionId}`}>
                    View Complete Decision Trail
                  </a>
                </Button>
              </Card>
            )}
          </div>
        )}
      </div>
    </main>
  );
}
