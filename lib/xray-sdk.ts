// X-Ray SDK - Core library for capturing decision trails
export type StepInput = Record<string, unknown>
export type StepOutput = Record<string, unknown>
export type FilterEvaluation = {
  name: string
  passed: boolean
  detail: string
}

export type CandidateEvaluation = {
  id: string
  title: string
  metrics?: Record<string, unknown>
  evaluations?: Record<string, { passed: boolean; detail: string }>
  passed: boolean
  failureReasons?: string[]
}

export interface XRayStep {
  id: string
  stepName: string
  input: StepInput
  output: StepOutput
  reasoning: string
  evaluations?: FilterEvaluation[]
  candidateEvaluations?: CandidateEvaluation[]
  duration?: number
  timestamp: Date
  metadata?: Record<string, unknown>
}

export interface XRayExecution {
  _id?: string
  executionId: string
  workflowName: string
  steps: XRayStep[]
  status: "success" | "failure" | "pending"
  startedAt: Date
  completedAt?: Date
  totalDuration?: number
  metadata?: Record<string, unknown>
}

export class XRayCollector {
  private execution: XRayExecution
  private startTime: number

  constructor(workflowName: string, executionId?: string) {
    this.startTime = Date.now()
    this.execution = {
      executionId: executionId || this.generateId(),
      workflowName,
      steps: [],
      status: "pending",
      startedAt: new Date(),
      metadata: {},
    }
  }

  private generateId(): string {
    return `exec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  recordStep(
    stepName: string,
    input: StepInput,
    output: StepOutput,
    reasoning: string,
    options?: {
      evaluations?: FilterEvaluation[]
      candidateEvaluations?: CandidateEvaluation[]
      metadata?: Record<string, unknown>
    },
  ): void {
    const step: XRayStep = {
      id: `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      stepName,
      input,
      output,
      reasoning,
      evaluations: options?.evaluations || [],
      candidateEvaluations: options?.candidateEvaluations || [],
      timestamp: new Date(),
      metadata: options?.metadata || {},
    }

    this.execution.steps.push(step)
  }

  setStatus(status: "success" | "failure"): void {
    this.execution.status = status
    this.execution.completedAt = new Date()
    this.execution.totalDuration = Date.now() - this.startTime
  }

  getExecution(): XRayExecution {
    return this.execution
  }

  async sendToServer(): Promise<void> {
    this.execution.completedAt = this.execution.completedAt || new Date()
    this.execution.totalDuration = this.execution.totalDuration || Date.now() - this.startTime

    const response = await fetch("/api/xray/executions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(this.execution),
    })

    if (!response.ok) {
      throw new Error(`Failed to send X-Ray execution: ${response.statusText}`)
    }
  }
}
