/**
 * X-Ray Library - General Purpose Decision Trail Capture System
 *
 * A reusable library for capturing, storing, and analyzing decision trails
 * across any multi-step pipeline (competitor analysis, recommendation systems,
 * lead scoring, content moderation, etc.)
 *
 * @example
 * \`\`\`typescript
 * const xray = XRay.create('lead-scoring-pipeline');
 *
 * xray.step('enrich-data')
 *   .input({ leadId: 'L123', source: 'website-form' })
 *   .output({ enrichedFields: ['company', 'industry', 'revenue'] })
 *   .reason('Enriched 3 fields from Clearbit API')
 *   .record();
 *
 * await xray.complete('success');
 * \`\`\`
 */

// ============================================================================
// CORE TYPES - Flexible and extensible
// ============================================================================

/**
 * Generic key-value store for any data structure
 * Allows pipelines to store whatever data they need
 */
export type DataRecord = Record<string, unknown>

/**
 * Represents a single item being evaluated in a pipeline
 * Could be a product, a lead, a content piece, etc.
 */
export interface Candidate {
  id: string
  [key: string]: unknown
}

/**
 * Evaluation result for a single candidate
 */
export interface CandidateResult {
  candidate: Candidate
  passed: boolean
  score?: number
  rank?: number
  evaluations?: Record<
    string,
    {
      passed: boolean
      value?: unknown
      threshold?: unknown
      detail: string
    }
  >
  failureReasons?: string[]
  metadata?: DataRecord
}

/**
 * A filter or rule evaluation
 */
export interface FilterResult {
  name: string
  passed: boolean
  detail: string
  applied?: boolean
  metadata?: DataRecord
}

/**
 * A single step in the decision pipeline
 */
export interface Step {
  id: string
  name: string
  input: DataRecord
  output: DataRecord
  reasoning: string
  timestamp: Date
  duration?: number

  // Optional: For pipelines that evaluate multiple candidates
  candidateResults?: CandidateResult[]

  // Optional: For pipelines with explicit filters/rules
  filterResults?: FilterResult[]

  // Optional: Any additional context
  metadata?: DataRecord
}

/**
 * Complete execution trace of a pipeline run
 */
export interface Execution {
  id: string
  pipelineName: string
  steps: Step[]
  status: "pending" | "success" | "failure" | "cancelled"
  startedAt: Date
  completedAt?: Date
  totalDuration?: number

  // Final result of the pipeline
  result?: {
    selected?: Candidate | Candidate[]
    reason?: string
    confidence?: number
  }

  // Optional: Any pipeline-level metadata
  metadata?: DataRecord
}

// ============================================================================
// STORAGE ADAPTER INTERFACE
// ============================================================================

/**
 * Storage adapter interface - implement this for your storage backend
 * (MongoDB, PostgreSQL, Redis, S3, in-memory, etc.)
 */
export interface StorageAdapter {
  save(execution: Execution): Promise<void>
  get(executionId: string): Promise<Execution | null>
  query(filter: DataRecord): Promise<Execution[]>
  delete(executionId: string): Promise<void>
}

/**
 * In-memory storage adapter (for testing/development)
 */
export class InMemoryStorage implements StorageAdapter {
  private store = new Map<string, Execution>()

  async save(execution: Execution): Promise<void> {
    this.store.set(execution.id, execution)
  }

  async get(executionId: string): Promise<Execution | null> {
    return this.store.get(executionId) || null
  }

  async query(filter: DataRecord): Promise<Execution[]> {
    const results: Execution[] = []
    for (const execution of this.store.values()) {
      if (this.matches(execution, filter)) {
        results.push(execution)
      }
    }
    return results
  }

  async delete(executionId: string): Promise<void> {
    this.store.delete(executionId)
  }

  clear(): void {
    this.store.clear()
  }

  private matches(execution: Execution, filter: DataRecord): boolean {
    for (const [key, value] of Object.entries(filter)) {
      if (execution[key as keyof Execution] !== value) {
        return false
      }
    }
    return true
  }
}

// ============================================================================
// STEP BUILDER - Fluent API for recording steps
// ============================================================================

/**
 * Fluent builder for recording pipeline steps
 */
export class StepBuilder {
  private stepData: Partial<Step>
  private xray: XRay

  constructor(stepName: string, xray: XRay) {
    this.xray = xray
    this.stepData = {
      id: this.generateId(),
      name: stepName,
      timestamp: new Date(),
      input: {},
      output: {},
      reasoning: "",
    }
  }

  private generateId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Set the input data for this step
   */
  input(data: DataRecord): this {
    this.stepData.input = data
    return this
  }

  /**
   * Set the output data for this step
   */
  output(data: DataRecord): this {
    this.stepData.output = data
    return this
  }

  /**
   * Set the reasoning/explanation for this step
   */
  reason(explanation: string): this {
    this.stepData.reasoning = explanation
    return this
  }

  /**
   * Add candidate evaluation results
   */
  candidates(results: CandidateResult[]): this {
    this.stepData.candidateResults = results
    return this
  }

  /**
   * Add filter evaluation results
   */
  filters(results: FilterResult[]): this {
    this.stepData.filterResults = results
    return this
  }

  /**
   * Add arbitrary metadata
   */
  metadata(data: DataRecord): this {
    this.stepData.metadata = data
    return this
  }

  /**
   * Set step duration manually (otherwise calculated on record)
   */
  duration(ms: number): this {
    this.stepData.duration = ms
    return this
  }

  /**
   * Record the step and add it to the execution
   */
  record(): XRay {
    const step = this.stepData as Step
    this.xray.addStep(step)
    return this.xray
  }
}

// ============================================================================
// MAIN X-RAY CLASS
// ============================================================================

/**
 * Main X-Ray class for capturing decision trails
 */
export class XRay {
  private execution: Execution
  private storage: StorageAdapter
  private autoSave: boolean
  private startTime: number

  private constructor(
    pipelineName: string,
    storage: StorageAdapter,
    options: {
      executionId?: string
      autoSave?: boolean
      metadata?: DataRecord
    } = {},
  ) {
    this.startTime = Date.now()
    this.storage = storage
    this.autoSave = options.autoSave ?? false

    this.execution = {
      id: options.executionId || this.generateId(),
      pipelineName,
      steps: [],
      status: "pending",
      startedAt: new Date(),
      metadata: options.metadata || {},
    }
  }

  /**
   * Create a new X-Ray instance
   */
  static create(
    pipelineName: string,
    storage?: StorageAdapter,
    options?: {
      executionId?: string
      autoSave?: boolean
      metadata?: DataRecord
    },
  ): XRay {
    return new XRay(pipelineName, storage || new InMemoryStorage(), options)
  }

  private generateId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Start building a new step
   */
  step(stepName: string): StepBuilder {
    return new StepBuilder(stepName, this)
  }

  /**
   * Add a step directly (used by StepBuilder)
   */
  addStep(step: Step): void {
    this.execution.steps.push(step)

    if (this.autoSave) {
      this.save().catch((err) => {
        console.error("[X-Ray] Auto-save failed:", err)
      })
    }
  }

  /**
   * Set pipeline result
   */
  setResult(result: {
    selected?: Candidate | Candidate[]
    reason?: string
    confidence?: number
  }): this {
    this.execution.result = result
    return this
  }

  /**
   * Mark execution as complete
   */
  async complete(status: "success" | "failure" | "cancelled"): Promise<void> {
    this.execution.status = status
    this.execution.completedAt = new Date()
    this.execution.totalDuration = Date.now() - this.startTime

    await this.save()
  }

  /**
   * Save the execution to storage
   */
  async save(): Promise<void> {
    await this.storage.save(this.execution)
  }

  /**
   * Get the current execution
   */
  getExecution(): Execution {
    return this.execution
  }

  /**
   * Get execution ID
   */
  getId(): string {
    return this.execution.id
  }

  /**
   * Add metadata to the execution
   */
  setMetadata(data: DataRecord): this {
    this.execution.metadata = { ...this.execution.metadata, ...data }
    return this
  }

  // ============================================================================
  // QUERY HELPERS - for analyzing executions
  // ============================================================================

  /**
   * Load an execution from storage
   */
  static async load(executionId: string, storage: StorageAdapter): Promise<XRay | null> {
    const execution = await storage.get(executionId)
    if (!execution) return null

    const xray = new XRay(execution.pipelineName, storage, {
      executionId: execution.id,
    })
    xray.execution = execution
    return xray
  }

  /**
   * Find all candidates that failed a specific filter
   */
  findFailuresByFilter(filterName: string): CandidateResult[] {
    const failures: CandidateResult[] = []

    for (const step of this.execution.steps) {
      if (step.candidateResults) {
        for (const result of step.candidateResults) {
          if (!result.passed && result.evaluations?.[filterName]?.passed === false) {
            failures.push(result)
          }
        }
      }
    }

    return failures
  }

  /**
   * Get summary statistics for this execution
   */
  getSummary(): {
    totalSteps: number
    totalCandidates: number
    candidatesPassed: number
    candidatesFailed: number
    duration: number
    filterFailures: Record<string, number>
  } {
    let totalCandidates = 0
    let candidatesPassed = 0
    let candidatesFailed = 0
    const filterFailures: Record<string, number> = {}

    for (const step of this.execution.steps) {
      if (step.candidateResults) {
        totalCandidates += step.candidateResults.length

        for (const result of step.candidateResults) {
          if (result.passed) {
            candidatesPassed++
          } else {
            candidatesFailed++

            // Count filter failures
            if (result.evaluations) {
              for (const [filterName, evaluation] of Object.entries(result.evaluations)) {
                if (!evaluation.passed) {
                  filterFailures[filterName] = (filterFailures[filterName] || 0) + 1
                }
              }
            }
          }
        }
      }
    }

    return {
      totalSteps: this.execution.steps.length,
      totalCandidates,
      candidatesPassed,
      candidatesFailed,
      duration: this.execution.totalDuration || 0,
      filterFailures,
    }
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export default XRay

export { XRay as XRayPipeline }
