# X-Ray Decision Intelligence Platform

A powerful workflow execution monitoring and debugging platform that provides complete transparency into multi-step decision pipelines. Built for product managers, data scientists, and engineers who need to understand, debug, and optimize complex business logic.

## 🌐 Live Demo

**[https://x-ray-gamma.vercel.app/](https://x-ray-gamma.vercel.app/)**

## 📋 Overview

X-Ray solves a critical problem in modern applications: **understanding why automated decisions were made**. When a competitor matching algorithm selects Product A over Product B, or a pricing engine chooses a specific discount, X-Ray captures every step, input, output, and reasoning behind that decision.

### Key Capabilities

- **Execution Monitoring**: Track every step of multi-stage workflows in real-time
- **Decision Transparency**: View inputs, outputs, and reasoning for each decision point
- **Interactive Debugging**: Drill down into failed steps to identify root causes
- **Persistent History**: Query past executions with MongoDB-backed storage
- **Visual Decision Trees**: Navigate complex logic flows with hierarchical tree views

## ✨ Features

### 1. **Dashboard Overview**
- Recent executions list with status indicators (success/failed/running)
- Quick metrics: execution count, average duration, success rate
- Filter by workflow type, date range, and status

### 2. **Competitor Detection Workflow**
Automatically finds the best competitor match for your products using a 5-step pipeline:
- **Keyword Generation**: Extract search terms from product attributes
- **Candidate Search**: Find potential matches across your catalog
- **Filter Application**: Apply price, rating, and review eligibility rules
- **LLM Evaluation**: Assess product relevance and category alignment
- **Ranking & Selection**: Choose the best match using configurable criteria

### 3. **Execution Detail Views**

#### **Tree View**
```
├── keyword_generation (0.2s) ✓
│   ├── Input: "32oz Stainless Steel Water Bottle"
│   ├── Output: ["stainless steel water bottle", "32oz water bottle"]
│   └── Reasoning: Extracted 5 key terms, generated 2 search variations
│
├── candidate_search (0.8s) ✓
│   ├── Input: Keywords from step 1
│   ├── Output: 47 products found
│   └── Reasoning: Matched against titles, features, specifications
│
├── apply_filters (0.1s) ✓
│   ├── Input: 47 candidates
│   ├── Output: 4 passed filters
│   └── Reasoning: Price $12.50-$50, Rating ≥3.8, Reviews ≥100
```

#### **Detail View**
- Expandable JSON inspector for inputs/outputs
- Timing breakdown for performance analysis
- Status badges (success, failed, skipped)
- Candidate evaluation tables with pass/fail reasons

### 4. **Product Matching Interface**
- Select any product from your catalog as the reference
- One-click execution with real-time progress
- Immediate results with full decision trail
- Link to detailed execution view

## 🛠 Tech Stack

### Frontend
- **Next.js 16.0** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS v4** - Utility-first styling
- **shadcn/ui** - Component library
- **Recharts** - Data visualization

### Backend
- **Next.js API Routes** - Serverless API endpoints
- **MongoDB** - Document database for products, reviews, executions
- **X-Ray SDK** - Custom workflow execution tracking library

### Deployment
- **Vercel** - Hosting and deployment platform
- **MongoDB Atlas** - Cloud database

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and pnpm
- MongoDB Atlas account (or local MongoDB)
- Git

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/x-ray.git
cd x-ray
```

2. **Install dependencies**
```bash
pnpm install
```

3. **Set up environment variables**
Create a `.env.local` file in the root directory:
```env
MONGODB_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/xray?retryWrites=true&w=majority
```

4. **Seed the database**
```bash
# Run the seed script to populate demo data
pnpm run seed
```

5. **Start development server**
```bash
pnpm dev
```

6. **Open in browser**
Navigate to [http://localhost:3000](http://localhost:3000)

## 📁 Project Structure

```
x-ray/
├── app/                          # Next.js app directory
│   ├── page.tsx                  # Dashboard homepage
│   ├── competitor-detection/     # Competitor workflow UI
│   ├── product-match/            # Product matching interface
│   ├── execution/[id]/           # Execution detail page
│   └── api/                      # API routes
│       ├── products/             # Product catalog endpoints
│       ├── competitor-detection/ # Competitor matching logic
│       └── xray/executions/      # Execution CRUD operations
│
├── components/                   # React components
│   ├── execution-list.tsx        # Recent executions table
│   ├── execution-detail.tsx      # Execution detail wrapper
│   ├── step-tree-view.tsx        # Hierarchical step display
│   ├── decision-tree.tsx         # Decision tree navigation
│   └── ui/                       # shadcn components
│
├── lib/                          # Core libraries
│   ├── mongodb.ts                # Database connection
│   ├── xray/                     # X-Ray execution library
│   │   ├── index.ts              # Core XRay class
│   │   └── adapters/             # Storage adapters
│   └── xray-sdk.ts               # Simplified SDK wrapper
│
├── scripts/                      # Database scripts
│   └── seed-demo-data.ts         # Populate sample data

```

##  Database Schema

### Collections

#### **products**
```javascript
{
  _id: ObjectId("6952359f218e9771dabe189b"),
  asin: "B0COMP01",
  title: "HydroFlask 32oz Wide Mouth",
  brand: "HydroFlask",
  price: 44.99,
  categoryId: ObjectId("60d21b4667d0d8992e610c85"),
  subcategoryId: ObjectId("60d21b4667d0d8992e610c86"),
  categoryName: null,
  subcategoryName: null,
  specifications: {
    features: [
      "stainless steel",
      "insulated",
      "32oz",
      "wide mouth",
      "BPA-free"
    ],
    dimensions: {
      height: 10.5,
      diameter: 3.5,
      weight: 0.95
    }
  },
  colors: ["blue", "black", "white", "pink"],
  inStock: true,
  createdAt: ISODate("2025-01-10T09:00:00Z"),
  lastUpdated: ISODate("2025-01-15T10:30:00Z")
}

```

#### **reviews**
```javascript
{
  _id: ObjectId,
  product_id: ObjectId,          // Reference to products
  rating: 4.5,
  review_text: "Great bottle!",
  reviewer_name: "John D.",
  review_date: ISODate("2024-01-15")
}
```

#### **xray_executions**
```javascript
{
  _id: ObjectId,
  executionId: "exec_1234_abc",  // Unique execution ID
  workflowName: "competitor_detection",
  status: "completed",           // completed | failed | running
  steps: [
    {
      stepName: "keyword_generation",
      status: "success",
      input: { product_title: "..." },
      output: { keywords: [...] },
      reasoning: "Extracted 5 key terms...",
      startTime: ISODate(),
      endTime: ISODate(),
      duration: 0.2
    }
  ],
  metadata: {
    referenceProduct: {...},
    filters: {...}
  },
  createdAt: ISODate()
}
```

## 🔧 Configuration

### Business Rules

The competitor detection workflow uses configurable business rules:

```typescript
// Price Eligibility: 0.5x - 2x reference price
const minPrice = referencePrice * 0.5;
const maxPrice = referencePrice * 2.0;

// Quality Thresholds
const minRating = 3.0;           // Minimum star rating
const minReviews = 1;             // Minimum review count

// Ranking Criteria
// Winner = highest review count among qualified candidates
```

### Keyword Generation
- Removes stop words: "a", "an", "the", "and", "or", "for"
- Splits into key terms
- Generates 2 keyword variations

##  API Reference

### Get All Executions
```http
GET /api/xray/executions?limit=10&workflowName=competitor_detection
```

### Get Execution by ID
```http
GET /api/xray/executions/[id]
```

### Run Competitor Detection
```http
POST /api/competitor-detection
Content-Type: application/json

{
  "productTitle": "32oz Stainless Steel Water Bottle",
  "productCategory": "Sports & Outdoors",
  "referenceProduct": {
    "asin": "B0XYZ123",
    "price": 29.99,
    "rating": 4.2,
    "reviews": 1247
  }
}
```

### Get Products
```http
GET /api/products?limit=10&skip=0
```

##  Usage Examples

### 1. Run Competitor Match from UI
1. Navigate to "Product Matching" page
2. Product list loads from database (shows count in button)
3. Click "Find Best Competitor Match"
4. View results with execution ID
5. Click execution ID to see full decision trail

### 2. View Recent Executions
1. Go to homepage dashboard
2. Scroll to "Recent Executions" section
3. Click any execution to view details
4. Toggle between Tree View and Detail View

### 3. Debug Failed Executions
1. Filter executions by status: "Failed"
2. Open failed execution
3. Find red ✗ step in tree view
4. Expand to see error message and stack trace
5. Check input data and business rule violations

##  System Architecture

### X-Ray Library Design

**Core Principles:**
- **General-purpose**: Works with any multi-step workflow
- **Extensible**: Plugin architecture for storage adapters
- **Non-invasive**: Minimal changes to existing code

**Key Components:**
```typescript
// 1. Initialize with storage adapter
const xray = XRay.create({
  adapter: new MongoDBAdapter(db)
});

// 2. Start execution
const execution = await xray.startExecution("workflow_name");

// 3. Add steps
await execution.addStep({
  name: "step_name",
  input: {...},
  output: {...},
  reasoning: "Why this decision was made"
});

// 4. Complete
await execution.complete();
```

### Storage Adapters
- **MongoDBAdapter**: Production-ready persistence
- **InMemoryAdapter**: Testing and development
- **Custom adapters**: Implement `IXRayAdapter` interface

## 🎨 Design Philosophy

### Information Hierarchy
1. **Status First**: Success/failure immediately visible
2. **Summary Level**: Step names, counts, duration
3. **Detail on Demand**: Expand for inputs/outputs
4. **Context Preservation**: Always show reference product

### Color System
- **Success**: Green badges and checkmarks
- **Failure**: Red badges and X marks
- **Neutral**: Gray for metadata
- **Accent**: Blue for interactive elements

### UX Decisions
- **No pagination**: Load recent executions immediately
- **Collapsible sections**: Reduce cognitive load
- **Persistent navigation**: Breadcrumbs and back buttons
- **Copy functionality**: Easy sharing of execution IDs

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

##  Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- UI components from [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Deployed on [Vercel](https://vercel.com/)

## 📞 Support

For questions or issues, please:
- Open an issue on GitHub
- Contact: your-email@example.com
- Visit the live demo: [https://x-ray-gamma.vercel.app/](https://x-ray-gamma.vercel.app/)

---

**Built with ❤️ for transparent, debuggable decision systems**
