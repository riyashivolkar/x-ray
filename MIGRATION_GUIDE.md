# MongoDB Migration Guide

This guide explains how to migrate your MongoDB data to the normalized schema with proper relationships between products, categories, and reviews.

## Overview

The normalized schema uses ObjectId references to link collections:
- **Products** reference **Categories** via `categoryId` and `subcategoryId`
- **Reviews** reference **Products** via `productId`
- **Specifications** are nested within products (not separate collection)

## Schema Structure

```
categories
  ├─ _id (ObjectId)
  ├─ name (string)
  ├─ type ("category" | "subcategory")
  └─ parentId (ObjectId | null)

products
  ├─ _id (ObjectId)
  ├─ asin (string, unique)
  ├─ title, brand, price, rating
  ├─ categoryId (ObjectId) → references categories._id
  ├─ subcategoryId (ObjectId) → references categories._id
  ├─ reviewCount (number, cached aggregate)
  ├─ specifications (object)
  │   ├─ features (array)
  │   └─ dimensions (object)
  └─ colors, inStock, timestamps

reviews
  ├─ _id (ObjectId)
  ├─ productId (ObjectId) → references products._id
  ├─ rating (number)
  ├─ reviewText (string)
  ├─ source (string)
  └─ createdAt (date)
```

## Migration Steps

### Step 1: Fresh Install (Recommended)

If you're starting fresh or can drop existing data:

```bash
# Drop existing collections (WARNING: This deletes all data)
mongosh mongodb://localhost:27017/xray_system --eval "db.dropDatabase()"

# Seed all collections with proper relationships
npm run seed:all

# Verify relationships are correct
npm run verify:relationships
```

### Step 2: Migrate Existing Data

If you have existing product data with string-based categories:

```bash
# 1. Make sure categories are seeded first
npm run seed:all  # This will seed categories if they don't exist

# 2. Run the migration script
npm run migrate:products

# 3. Verify the migration
npm run verify:relationships
```

### Step 3: Verify Everything Works

```bash
# Run verification script
npm run verify:relationships
```

Expected output:
```
 All products have valid category/subcategory references
 All reviews have valid product references
 Product -> Category lookup working
 Review -> Product lookup working
 All relationships are properly configured!
```

## What the Migration Does

The `migrate:products` script:

1. **Converts category references** from strings to ObjectId
   - `category: "Sports & Outdoors"` → `categoryId: ObjectId("...")`
   - `subcategory: "Water Bottles"` → `subcategoryId: ObjectId("...")`

2. **Normalizes nested data**
   - Moves flat `features` array into `specifications.features`
   - Moves flat `dimensions` object into `specifications.dimensions`

3. **Renames cached fields**
   - `reviews` → `reviewCount` (to match the schema convention)

4. **Removes old fields**
   - Deletes string-based `category`, `subcategory`, `categoryName`, `subcategoryName`
   - Deletes flat `features`, `dimensions`, `reviews` after moving to new structure

## Manual Migration (MongoDB Shell)

If you need to migrate manually:

```javascript
// Connect to database
use xray_system

// Get category IDs
const sportsOutdoors = db.categories.findOne({ name: "Sports & Outdoors", type: "category" })._id
const waterBottles = db.categories.findOne({ name: "Water Bottles", type: "subcategory" })._id

// Update a product
db.products.updateOne(
  { asin: "B0COMP01" },
  {
    $set: {
      categoryId: sportsOutdoors,
      subcategoryId: waterBottles,
      specifications: {
        features: ["stainless steel", "insulated", "32oz"],
        dimensions: { height: 10.5, diameter: 3.5, weight: 0.95 }
      },
      reviewCount: 8932
    },
    $unset: {
      category: "",
      subcategory: "",
      features: "",
      dimensions: "",
      reviews: ""
    }
  }
)
```

## Troubleshooting

### Issue: "Category/subcategory not found"

**Cause:** Categories collection is empty or missing the required category names.

**Solution:**
```bash
npm run seed:all  # This seeds categories first
```

### Issue: "Invalid categoryId reference"

**Cause:** Product references a category that doesn't exist.

**Solution:**
```bash
# Check which categories exist
mongosh mongodb://localhost:27017/xray_system --eval "db.categories.find({}).pretty()"

# Update the product with correct category name
```

### Issue: "Reviews lost after migration"

**Cause:** Reviews use old product IDs that don't match migrated products.

**Solution:**
```bash
# Reviews should be seeded AFTER products
npm run seed:all  # This seeds in correct order: categories → products → reviews
```

## Verifying Relationships in Code

The API routes use MongoDB `$lookup` to join data:

```typescript
// Example: Get products with category names
const products = await db.collection("products")
  .aggregate([
    {
      $lookup: {
        from: "categories",
        localField: "categoryId",
        foreignField: "_id",
        as: "categoryInfo"
      }
    },
    {
      $lookup: {
        from: "categories",
        localField: "subcategoryId",
        foreignField: "_id",
        as: "subcategoryInfo"
      }
    },
    { $unwind: "$categoryInfo" },
    { $unwind: "$subcategoryInfo" }
  ])
  .toArray()
```

## Best Practices

1. **Always seed categories first** before products
2. **Use the verification script** after any schema changes
3. **Keep cached aggregates updated** (reviewCount should match actual review count)
4. **Use ObjectId references** instead of string-based foreign keys
5. **Don't store category names in products** - always use references and join when needed

## Rolling Back

If you need to roll back the migration:

```bash
# Drop the database
mongosh mongodb://localhost:27017/xray_system --eval "db.dropDatabase()"

# Restore from backup or re-seed
npm run seed:all
```

## Next Steps

After successful migration:
1.  All products have proper `categoryId` and `subcategoryId` ObjectId references
2.  All reviews have proper `productId` ObjectId references
3.  The API routes can join data using `$lookup`
4.  Data is normalized and scalable

You can now safely:
- Run the competitor detection pipeline
- Add more products without duplication
- Query products by category efficiently
- Scale to millions of reviews without document bloat
