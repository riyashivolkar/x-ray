import "dotenv/config";
import { ObjectId } from "mongodb";
import categoriesData from "../data/categories-seed.json";
import productsData from "../data/products-seed.json";
import reviewsData from "../data/reviews-seed.json";
import { getDatabase } from "../lib/mongodb";

// Helper to convert MongoDB extended JSON to native types
function convertExtendedJSON(obj: any): any {
  if (obj === null || obj === undefined) return obj;

  if (obj.$oid) return new ObjectId(obj.$oid);
  if (obj.$date) return new Date(obj.$date);

  if (Array.isArray(obj)) {
    return obj.map(convertExtendedJSON);
  }

  if (typeof obj === "object") {
    const converted: any = {};
    for (const [key, value] of Object.entries(obj)) {
      converted[key] = convertExtendedJSON(value);
    }
    return converted;
  }

  return obj;
}

async function seedAll() {
  try {
    console.log(" Seeding all collections...");
    const db = await getDatabase();

    // 1. Seed Categories
    console.log("\nSeeding categories...");
    const categoriesCollection = db.collection(categoriesData.collection);
    await categoriesCollection.deleteMany({});
    const convertedCategories = categoriesData.data.map(convertExtendedJSON);
    await categoriesCollection.insertMany(convertedCategories);
    await categoriesCollection.createIndex({ name: 1 });
    await categoriesCollection.createIndex({ type: 1 });
    await categoriesCollection.createIndex({ parentId: 1 });
    console.log(`✓ Inserted ${convertedCategories.length} categories`);

    const categoryMap = new Map();
    for (const cat of convertedCategories) {
      categoryMap.set(cat.name, cat._id);
    }

    // 2. Seed Products with ObjectId references to categories
    console.log("\n Seeding products...");
    const productsCollection = db.collection(productsData.collection);
    await productsCollection.deleteMany({});

    const products = productsData.data.map((product: any) => {
      const converted = convertExtendedJSON(product);
      return {
        ...converted,
        categoryId: categoryMap.get(product.categoryName),
        subcategoryId: categoryMap.get(product.subcategoryName),
        // Remove the name fields after conversion
        categoryName: undefined,
        subcategoryName: undefined,
      };
    });

    const insertedProducts = await productsCollection.insertMany(products);
    await productsCollection.createIndex({ asin: 1 }, { unique: true });
    await productsCollection.createIndex({ categoryId: 1 });
    await productsCollection.createIndex({ subcategoryId: 1 });
    await productsCollection.createIndex({ price: 1 });
    await productsCollection.createIndex({ rating: -1 });
    await productsCollection.createIndex({ reviewCount: -1 });
    console.log(`✓ Inserted ${products.length} products`);

    const asinToIdMap = new Map();
    products.forEach((product: any, index: number) => {
      asinToIdMap.set(product.asin, insertedProducts.insertedIds[index]);
    });

    // 3. Seed Reviews with ObjectId references to products
    console.log("\n Seeding reviews...");
    const reviewsCollection = db.collection(reviewsData.collection);
    await reviewsCollection.deleteMany({});

    const reviews = reviewsData.data.map((review: any) => {
      const converted = convertExtendedJSON(review);
      // Map the productAsin to actual product ObjectId
      return {
        ...converted,
        productId: asinToIdMap.get(review.productAsin) || converted.productId,
        productAsin: undefined, // Remove after conversion
      };
    });

    await reviewsCollection.insertMany(reviews);
    await reviewsCollection.createIndex({ productId: 1 });
    await reviewsCollection.createIndex({ rating: 1 });
    await reviewsCollection.createIndex({ createdAt: -1 });
    console.log(`✓ Inserted ${reviews.length} reviews`);

    console.log("\n All collections seeded successfully!");
    console.log("\nCollection Summary:");
    console.log(`  Categories: ${await categoriesCollection.countDocuments()}`);
    console.log(`  Products: ${await productsCollection.countDocuments()}`);
    console.log(`  Reviews: ${await reviewsCollection.countDocuments()}`);

    process.exit(0);
  } catch (error) {
    console.error(" Error seeding database:", error);
    process.exit(1);
  }
}

seedAll();
