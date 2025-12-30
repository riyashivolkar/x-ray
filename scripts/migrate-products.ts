/**
 * Migration script to convert flat product data to normalized schema
 * Converts category/subcategory strings to ObjectId references
 * Removes denormalized rating/reviewCount fields (computed from reviews)
 */

import "dotenv/config";
import { getDatabase } from "../lib/mongodb";

async function migrateProducts() {
  try {
    console.log("🔄 Starting product migration...\n");
    const db = await getDatabase();

    const productsCollection = db.collection("products");
    const categoriesCollection = db.collection("categories");

    // Get all products with string-based categories
    const allProducts = await productsCollection.find({}).toArray();
    console.log(`Found ${allProducts.length} products to check\n`);

    // Build category name -> ObjectId mapping
    const categoryMap = new Map();
    const allCategories = await categoriesCollection.find({}).toArray();

    for (const cat of allCategories) {
      categoryMap.set(cat.name, cat._id);
    }

    console.log(`Category mapping (${categoryMap.size} categories):`);
    for (const [name, id] of categoryMap.entries()) {
      console.log(`  - ${name} -> ${id}`);
    }
    console.log();

    let migratedCount = 0;
    let alreadyMigratedCount = 0;
    let errorCount = 0;

    for (const product of allProducts) {
      // Check if product already has ObjectId references
      if (
        product.categoryId &&
        product.subcategoryId &&
        typeof product.categoryId === "object" &&
        typeof product.subcategoryId === "object" &&
        !product.rating &&
        !product.reviewCount
      ) {
        console.log(`✓ Already migrated: ${product.title}`);
        alreadyMigratedCount++;
        continue;
      }

      // Get category and subcategory names
      const categoryName = product.category || product.categoryName;
      const subcategoryName = product.subcategory || product.subcategoryName;

      if (!categoryName || !subcategoryName) {
        console.log(
          `⚠ Skipping ${product.title}: missing category/subcategory`
        );
        errorCount++;
        continue;
      }

      const categoryId = categoryMap.get(categoryName);
      const subcategoryId = categoryMap.get(subcategoryName);

      if (!categoryId || !subcategoryId) {
        console.log(
          `⚠ Skipping ${product.title}: category/subcategory not found`
        );
        console.log(`  Looking for: ${categoryName} / ${subcategoryName}`);
        errorCount++;
        continue;
      }

      // Update the product with ObjectId references
      const updateDoc: any = {
        categoryId,
        subcategoryId,
      };

      // Convert flat features/dimensions to nested specifications if needed
      if (product.features && !product.specifications) {
        updateDoc.specifications = {
          features: product.features,
          dimensions: product.dimensions || {},
        };
      }

      const unsetDoc: any = {};
      if (product.category) unsetDoc.category = "";
      if (product.subcategory) unsetDoc.subcategory = "";
      if (product.categoryName) unsetDoc.categoryName = "";
      if (product.subcategoryName) unsetDoc.subcategoryName = "";
      if (product.features && updateDoc.specifications) unsetDoc.features = "";
      if (product.reviews) unsetDoc.reviews = "";
      // Remove denormalized rating/reviewCount - these are computed from reviews collection
      if (product.rating) unsetDoc.rating = "";
      if (product.reviewCount) unsetDoc.reviewCount = "";

      const updateOperation: any = { $set: updateDoc };
      if (Object.keys(unsetDoc).length > 0) {
        updateOperation.$unset = unsetDoc;
      }

      await productsCollection.updateOne({ _id: product._id }, updateOperation);

      console.log(`✓ Migrated: ${product.title}`);
      console.log(`  ${categoryName} -> ${categoryId}`);
      console.log(`  ${subcategoryName} -> ${subcategoryId}`);
      if (product.rating || product.reviewCount) {
        console.log(
          `  Removed denormalized: rating=${product.rating}, reviewCount=${product.reviewCount}`
        );
      }
      console.log();
      migratedCount++;
    }

    console.log("\n=== Migration Summary ===");
    console.log(`✓ Migrated: ${migratedCount}`);
    console.log(`✓ Already migrated: ${alreadyMigratedCount}`);
    if (errorCount > 0) {
      console.log(`⚠ Errors/Skipped: ${errorCount}`);
    }
    console.log(`Total: ${allProducts.length}`);

    // Verify the migration
    console.log("\n Verifying migration...");
    const verifyProducts = await productsCollection.find({}).limit(3).toArray();

    for (const product of verifyProducts) {
      console.log(`\nProduct: ${product.title}`);
      console.log(
        `  categoryId: ${product.categoryId} (${typeof product.categoryId})`
      );
      console.log(
        `  subcategoryId: ${
          product.subcategoryId
        } (${typeof product.subcategoryId})`
      );
      console.log(
        `  specifications: ${product.specifications ? "Present" : "Missing"}`
      );
      console.log(
        `  rating: ${
          product.rating ? " Still present (should be removed)" : "✓ Removed"
        }`
      );
      console.log(
        `  reviewCount: ${
          product.reviewCount
            ? " Still present (should be removed)"
            : "✓ Removed"
        }`
      );
    }

    console.log("\n Migration completed successfully!");
    console.log(
      "\n💡 Note: rating and reviewCount are now computed from the reviews collection"
    );
    process.exit(0);
  } catch (error) {
    console.error("\n Migration failed:", error);
    process.exit(1);
  }
}

migrateProducts();
