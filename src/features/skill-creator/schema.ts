import { z } from "zod"

export const SkillEvalExpectationsSchema = z.object({
  skill_invoked: z.boolean().optional(),
  tools_any: z.array(z.string().min(1)).optional(),
  tools_all: z.array(z.string().min(1)).optional(),
  tools_none: z.array(z.string().min(1)).optional(),
  assistant_contains: z.array(z.string().min(1)).optional(),
  assistant_not_contains: z.array(z.string().min(1)).optional(),
  transcript_contains: z.array(z.string().min(1)).optional(),
  transcript_not_contains: z.array(z.string().min(1)).optional(),
}).strict()

export const SkillEvalCaseSchema = z.object({
  id: z.string().trim().min(1),
  prompt: z.string().trim().min(1),
  files: z.array(z.string().trim().min(1)).optional(),
  expectations: SkillEvalExpectationsSchema.optional(),
}).strict()

export const SkillEvalSuiteSchema = z.object({
  skill_name: z.string().trim().min(1).optional(),
  evals: z.array(SkillEvalCaseSchema).min(1),
}).strict()

export const SkillFrontmatterSchema = z.object({
  name: z.string().trim().min(1).max(64).regex(/^[a-z0-9-]+$/),
  description: z.string().trim().min(1).max(1024).refine((value) => !/[<>]/.test(value), {
    message: "Description cannot contain angle brackets",
  }),
  model: z.string().optional(),
  "argument-hint": z.string().optional(),
  agent: z.string().optional(),
  subtask: z.boolean().optional(),
  license: z.string().optional(),
  compatibility: z.string().max(500).optional(),
  metadata: z.record(z.string(), z.unknown()).optional(),
  "allowed-tools": z.union([z.string(), z.array(z.string())]).optional(),
  mcp: z.record(z.string(), z.unknown()).optional(),
}).strict()
