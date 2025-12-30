import { getDatabase } from "@/lib/mongodb";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Number.parseInt(searchParams.get("limit") || "10");
    const category = searchParams.get("category");
    const subcategory = searchParams.get("subcategory");

    const db = await getDatabase();
    const productsCollection = db.collection("products");

    // Build query
    const query: Record<string, unknown> = {};
    if (category) {
      const categoriesCollection = db.collection("categories");
      const categoryDoc = await categoriesCollection.findOne({
        name: category,
        type: "category",
      });
      if (categoryDoc) query.categoryId = categoryDoc._id;
    }
    if (subcategory) {
      const categoriesCollection = db.collection("categories");
      const subcategoryDoc = await categoriesCollection.findOne({
        name: subcategory,
        type: "subcategory",
      });
      if (subcategoryDoc) query.subcategoryId = subcategoryDoc._id;
    }

    // Fetch products with rating and review count computed from reviews
    const products = await productsCollection
      .aggregate([
        { $match: query },
        {
          $lookup: {
            from: "reviews",
            localField: "_id",
            foreignField: "productId",
            as: "reviewsData",
          },
        },
        {
          $addFields: {
            rating: {
              $ifNull: [{ $round: [{ $avg: "$reviewsData.rating" }, 1] }, 0],
            },
            reviews: { $size: "$reviewsData" },
          },
        },
        {
          $project: {
            asin: 1,
            title: 1,
            price: 1,
            rating: 1,
            reviews: 1,
          },
        },
        { $limit: limit },
      ])
      .toArray();

    return Response.json({ products });
  } catch (error) {
    console.error("Error fetching products:", error);
    return Response.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
