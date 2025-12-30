import { getDatabase } from "@/lib/mongodb";
import productsData from "../data/products-seed.json";

async function seedProducts() {
  try {
    console.log(" Seeding products database...");

    const db = await getDatabase();
    const collection = db.collection(productsData.collection);

    // Clear existing data
    await collection.deleteMany({});
    console.log("✓ Cleared existing products");

    // Insert new data
    const result = await collection.insertMany(productsData.data);
    console.log(`✓ Inserted ${result.insertedCount} products`);

    // Create indexes for performance
    await collection.createIndex({ asin: 1 }, { unique: true });
    await collection.createIndex({ category: 1 });
    await collection.createIndex({ subcategory: 1 }); // Added subcategory index
    await collection.createIndex({ rating: -1 });
    await collection.createIndex({ reviews: -1 });
    await collection.createIndex({ price: 1 });
    console.log("✓ Created indexes");

    console.log(" Product seeding complete!");
    console.log(
      "ℹ️  Note: For production, use 'npm run seed:all' to seed normalized collections"
    );
    process.exit(0);
  } catch (error) {
    console.error(" Error seeding products:", error);
    process.exit(1);
  }
}

seedProducts();
