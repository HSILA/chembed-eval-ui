#!/usr/bin/env node

/**
 * Dry-run ingestion: reads local JSONL files and reports inferred subtasks + counts.
 * No Supabase access required.
 *
 * Usage:
 *   npm run ingest:dry
 */

import fs from 'node:fs'
import readline from 'node:readline'

type TaskType = 'training' | 'evaluation'

async function scan(task: TaskType, file: string) {
  const stream = fs.createReadStream(file, { encoding: 'utf8' })
  const rl = readline.createInterface({ input: stream, crlfDelay: Infinity })

  let total = 0
  const subtasks = new Map<string, number>()

  for await (const lineRaw of rl) {
    const line = lineRaw.trim()
    if (!line) continue
    const obj = JSON.parse(line)
    if (Object.keys(obj).length === 1 && obj.__meta__) continue

    let subtask: string
    if (task === 'training') {
      subtask = obj.dataset_id ?? 'unknown_training_dataset'
    } else {
      subtask = obj.success === true ? 'successful' : 'unsuccessful'
    }

    total += 1
    subtasks.set(subtask, (subtasks.get(subtask) ?? 0) + 1)
  }

  const pairs = [...subtasks.entries()].sort((a, b) => b[1] - a[1])
  return { task, file, total, subtasks: pairs }
}

async function main() {
  const trainingFile = 'data/training_samples.jsonl'
  const evalFile = 'data/evaluation_samples.jsonl'

  const a = await scan('training', trainingFile)
  const b = await scan('evaluation', evalFile)

  for (const r of [a, b]) {
    console.log(`\n[${r.task}] ${r.file}`)
    console.log(`total: ${r.total}`)
    console.log('subtasks:')
    for (const [k, v] of r.subtasks) {
      console.log(`- ${k}: ${v}`)
    }
  }
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
