/**
 * Verification script to check MongoDB relationships
 * Verifies that all foreign key references are valid
 */

import "dotenv/config";
import { getDatabase } from "../lib/mongodb";

async function verifyRelationships() {
  try {
    console.log(" Verifying MongoDB relationships...\n");
    const db = await getDatabase();

    const productsCollection = db.collection("products");
    const categoriesCollection = db.collection("categories");
    const reviewsCollection = db.collection("reviews");

    let totalIssues = 0;

    // 1. Verify Products -> Categories relationship
    console.log("=== Products -> Categories ===");
    const products = await productsCollection.find({}).toArray();
    console.log(`Found ${products.length} products\n`);

    const categoryIds = new Set();
    const allCategories = await categoriesCollection.find({}).toArray();
    for (const cat of allCategories) {
      categoryIds.add(cat._id.toString());
    }

    let invalidCategoryRefs = 0;
    let invalidSubcategoryRefs = 0;

    for (const product of products) {
      if (!product.categoryId) {
        console.log(`⚠ ${product.title}: Missing categoryId`);
        invalidCategoryRefs++;
        continue;
      }

      if (!product.subcategoryId) {
        console.log(`⚠ ${product.title}: Missing subcategoryId`);
        invalidSubcategoryRefs++;
        continue;
      }

      const categoryExists = categoryIds.has(product.categoryId.toString());
      const subcategoryExists = categoryIds.has(
        product.subcategoryId.toString()
      );

      if (!categoryExists) {
        console.log(
          ` ${product.title}: Invalid categoryId ${product.categoryId}`
        );
        invalidCategoryRefs++;
      }

      if (!subcategoryExists) {
        console.log(
          ` ${product.title}: Invalid subcategoryId ${product.subcategoryId}`
        );
        invalidSubcategoryRefs++;
      }
    }

    if (invalidCategoryRefs === 0 && invalidSubcategoryRefs === 0) {
      console.log(" All products have valid category/subcategory references\n");
    } else {
      console.log(
        ` Found ${invalidCategoryRefs} invalid category refs, ${invalidSubcategoryRefs} invalid subcategory refs\n`
      );
      totalIssues += invalidCategoryRefs + invalidSubcategoryRefs;
    }

    // 2. Verify Reviews -> Products relationship
    console.log("=== Reviews -> Products ===");
    const reviews = await reviewsCollection.find({}).toArray();
    console.log(`Found ${reviews.length} reviews\n`);

    const productIds = new Set();
    for (const product of products) {
      productIds.add(product._id.toString());
    }

    let invalidProductRefs = 0;

    for (const review of reviews) {
      if (!review.productId) {
        console.log(`⚠ Review ${review._id}: Missing productId`);
        invalidProductRefs++;
        continue;
      }

      const productExists = productIds.has(review.productId.toString());

      if (!productExists) {
        console.log(
          ` Review ${review._id}: Invalid productId ${review.productId}`
        );
        invalidProductRefs++;
      }
    }

    if (invalidProductRefs === 0) {
      console.log(" All reviews have valid product references\n");
    } else {
      console.log(` Found ${invalidProductRefs} invalid product refs\n`);
      totalIssues += invalidProductRefs;
    }

    // 3. Test relationship queries
    console.log("=== Testing Relationship Queries ===\n");

    // Test product with category join
    console.log("Testing: Products with category/subcategory lookup");
    const productWithCategories = await productsCollection
      .aggregate([
        { $limit: 1 },
        {
          $lookup: {
            from: "categories",
            localField: "categoryId",
            foreignField: "_id",
            as: "categoryInfo",
          },
        },
        {
          $lookup: {
            from: "categories",
            localField: "subcategoryId",
            foreignField: "_id",
            as: "subcategoryInfo",
          },
        },
      ])
      .toArray();

    if (
      productWithCategories.length > 0 &&
      productWithCategories[0].categoryInfo?.length > 0 &&
      productWithCategories[0].subcategoryInfo?.length > 0
    ) {
      console.log(" Product -> Category lookup working");
      console.log(`  Sample: ${productWithCategories[0].title}`);
      console.log(
        `  Category: ${productWithCategories[0].categoryInfo[0].name}`
      );
      console.log(
        `  Subcategory: ${productWithCategories[0].subcategoryInfo[0].name}\n`
      );
    } else {
      console.log(" Product -> Category lookup failed\n");
      totalIssues++;
    }

    // Test reviews with product join
    console.log("Testing: Reviews with product lookup");
    const reviewWithProduct = await reviewsCollection
      .aggregate([
        { $limit: 1 },
        {
          $lookup: {
            from: "products",
            localField: "productId",
            foreignField: "_id",
            as: "productInfo",
          },
        },
      ])
      .toArray();

    if (
      reviewWithProduct.length > 0 &&
      reviewWithProduct[0].productInfo?.length > 0
    ) {
      console.log(" Review -> Product lookup working");
      console.log(`  Sample: Rating ${reviewWithProduct[0].rating}★`);
      console.log(`  Product: ${reviewWithProduct[0].productInfo[0].title}\n`);
    } else {
      console.log(" Review -> Product lookup failed\n");
      totalIssues++;
    }

    // 4. Summary
    console.log("=== Verification Summary ===");
    console.log(`Categories: ${allCategories.length}`);
    console.log(`Products: ${products.length}`);
    console.log(`Reviews: ${reviews.length}`);
    console.log(`Total Issues: ${totalIssues}`);

    if (totalIssues === 0) {
      console.log("\n All relationships are properly configured!");
    } else {
      console.log(`\n⚠ Found ${totalIssues} issues that need attention`);
    }

    process.exit(totalIssues > 0 ? 1 : 0);
  } catch (error) {
    console.error("\n Verification failed:", error);
    process.exit(1);
  }
}

verifyRelationships();
