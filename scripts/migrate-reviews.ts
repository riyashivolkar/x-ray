/**
 * Migration script to convert reviews to use ObjectId references to products
 * Converts productAsin strings to productId ObjectId references
 */

import "dotenv/config";
import { getDatabase } from "../lib/mongodb";

async function migrateReviews() {
  try {
    console.log("🔄 Starting reviews migration...\n");
    const db = await getDatabase();

    const reviewsCollection = db.collection("reviews");
    const productsCollection = db.collection("products");

    // Get all reviews
    const allReviews = await reviewsCollection.find({}).toArray();
    console.log(`Found ${allReviews.length} reviews to check\n`);

    // Build ASIN -> ObjectId mapping
    const asinToIdMap = new Map();
    const allProducts = await productsCollection.find({}).toArray();

    for (const product of allProducts) {
      asinToIdMap.set(product.asin, product._id);
    }

    console.log(`Product mapping (${asinToIdMap.size} products):`);
    for (const [asin, id] of Array.from(asinToIdMap.entries()).slice(0, 5)) {
      console.log(`  - ${asin} -> ${id}`);
    }
    if (asinToIdMap.size > 5) {
      console.log(`  ... and ${asinToIdMap.size - 5} more`);
    }
    console.log();

    let migratedCount = 0;
    let alreadyMigratedCount = 0;
    let errorCount = 0;

    for (const review of allReviews) {
      // Check if review already has ObjectId reference
      if (
        review.productId &&
        typeof review.productId === "object" &&
        !review.productAsin
      ) {
        console.log(
          `✓ Already migrated: Review for product ${review.productId}`
        );
        alreadyMigratedCount++;
        continue;
      }

      // Get product ASIN
      const productAsin = review.productAsin || review.asin;

      if (!productAsin) {
        console.log(`⚠ Skipping review ${review._id}: missing productAsin`);
        errorCount++;
        continue;
      }

      const productId = asinToIdMap.get(productAsin);

      if (!productId) {
        console.log(
          `⚠ Skipping review ${review._id}: product not found for ASIN ${productAsin}`
        );
        errorCount++;
        continue;
      }

      // Update the review with ObjectId reference
      const updateDoc: any = {
        productId,
      };

      // Remove old string fields
      const unsetDoc: any = {};
      if (review.productAsin) unsetDoc.productAsin = "";
      if (review.asin) unsetDoc.asin = "";

      const updateOperation: any = { $set: updateDoc };
      if (Object.keys(unsetDoc).length > 0) {
        updateOperation.$unset = unsetDoc;
      }

      await reviewsCollection.updateOne({ _id: review._id }, updateOperation);

      console.log(`✓ Migrated: Review ${review._id}`);
      console.log(`  ${productAsin} -> ${productId}\n`);
      migratedCount++;
    }

    console.log("\n=== Migration Summary ===");
    console.log(`✓ Migrated: ${migratedCount}`);
    console.log(`✓ Already migrated: ${alreadyMigratedCount}`);
    if (errorCount > 0) {
      console.log(`⚠ Errors/Skipped: ${errorCount}`);
    }
    console.log(`Total: ${allReviews.length}`);

    // Verify the migration
    console.log("\n Verifying migration...");
    const verifyReviews = await reviewsCollection.find({}).limit(3).toArray();

    for (const review of verifyReviews) {
      console.log(`\nReview ${review._id}:`);
      console.log(
        `  productId: ${review.productId} (${typeof review.productId})`
      );
      console.log(`  rating: ${review.rating}`);
      console.log(`  source: ${review.source}`);
    }

    console.log("\n Reviews migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n Migration failed:", error);
    process.exit(1);
  }
}

migrateReviews();
