'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabaseClient'

type TaskType = 'training' | 'evaluation'
type DashboardKey =
  | 'overall'
  | 'training'
  | 'chemrxiv_train'
  | 'dolma_train'
  | 'evaluation'
  | 'successful'
  | 'unsuccessful'

type NumericMetric = 'specificity' | 'query_quality' | 'standalone_clarity' | 'scientific_validity'

type ReviewItem = {
  id: string
  task_type: TaskType
  subtask: string
  payload: {
    retrieved?: { rank?: number; text?: string; score?: number; doc_id?: string }[]
  }
}

type ReviewRow = {
  item_id: string
  answerability: boolean | null
  specificity: number | null
  query_quality: number | null
  standalone_clarity: number | null
  scientific_validity: number | null
  note: string | null
  near_miss_ranks?: number[] | null
  retrieved_relevance?: Record<string, number> | null
}

type Stats = {
  totalItems: number
  reviewedItems: number
  answerabilityRate: number | null
  answerabilityYes: number
  answerabilityNo: number
  averages: Record<NumericMetric, number | null>
  distributions: Record<NumericMetric, number[]>
  notesCount: number
  nearMissRate: number | null
  nearMissCount: number
  nearMissRankCounts: number[]
  relevanceCounts: { notRelevant: number; somewhatRelevant: number; relevant: number }
  avgRetrievedRelevance: number | null
  avgRelevanceByRank: Array<number | null>
}

type NavItem = {
  key: DashboardKey
  label: string
  indent?: boolean
}

const NUMERIC_METRICS: Array<{ key: NumericMetric; label: string }> = [
  { key: 'specificity', label: 'Specificity' },
  { key: 'query_quality', label: 'Query quality' },
  { key: 'standalone_clarity', label: 'Standalone clarity' },
  { key: 'scientific_validity', label: 'Scientific validity' },
]

const NAV_ITEMS: NavItem[] = [
  { key: 'overall', label: 'Overall' },
  { key: 'training', label: 'Training' },
  { key: 'chemrxiv_train', label: 'ChemRxiv Train', indent: true },
  { key: 'dolma_train', label: 'Dolma Chem', indent: true },
  { key: 'evaluation', label: 'Evaluation' },
  { key: 'successful', label: 'Successful', indent: true },
  { key: 'unsuccessful', label: 'Unsuccessful', indent: true },
]

const EMPTY_STATS: Stats = {
  totalItems: 0,
  reviewedItems: 0,
  answerabilityRate: null,
  answerabilityYes: 0,
  answerabilityNo: 0,
  averages: {
    specificity: null,
    query_quality: null,
    standalone_clarity: null,
    scientific_validity: null,
  },
  distributions: {
    specificity: [0, 0, 0, 0, 0],
    query_quality: [0, 0, 0, 0, 0],
    standalone_clarity: [0, 0, 0, 0, 0],
    scientific_validity: [0, 0, 0, 0, 0],
  },
  notesCount: 0,
  nearMissRate: null,
  nearMissCount: 0,
  nearMissRankCounts: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0],
  relevanceCounts: { notRelevant: 0, somewhatRelevant: 0, relevant: 0 },
  avgRetrievedRelevance: null,
  avgRelevanceByRank: Array.from({ length: 10 }, () => null),
}

function formatPercent(value: number | null) {
  return value == null ? '—' : `${(value * 100).toFixed(1)}%`
}

function formatScore(value: number | null) {
  return value == null ? '—' : value.toFixed(2)
}

function scoreBarWidth(value: number | null, max = 5) {
  if (value == null) return '0%'
  return `${Math.max(0, Math.min(100, (value / max) * 100))}%`
}

function heatColor(value: number | null) {
  if (value == null) return 'bg-neutral-900 text-neutral-500'
  if (value >= 2.5) return 'bg-emerald-700/70 text-white'
  if (value >= 2.0) return 'bg-emerald-900/70 text-emerald-100'
  if (value >= 1.5) return 'bg-amber-700/70 text-white'
  return 'bg-rose-900/70 text-rose-100'
}

function normalizeRanks(value: unknown): number[] {
  if (!Array.isArray(value)) return []
  return value
    .map((v) => Number(v))
    .filter((v) => Number.isInteger(v) && v >= 1 && v <= 10)
}

function normalizeRetrievedRelevance(value: unknown): Record<string, number> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
  const out: Record<string, number> = {}
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    const n = Number(v)
    if ((n === 1 || n === 2 || n === 3) && /^\d+$/.test(k)) out[k] = n
  }
  return out
}

function computeStats(items: ReviewItem[], reviewMap: Record<string, ReviewRow>): Stats {
  if (!items.length) return EMPTY_STATS

  const reviewed = items
    .map((item) => reviewMap[item.id])
    .filter((row): row is ReviewRow => Boolean(row))

  const answerabilityValues = reviewed.map((r) => r.answerability).filter((v): v is boolean => v !== null)
  const answerabilityYes = answerabilityValues.filter(Boolean).length
  const answerabilityNo = answerabilityValues.filter((v) => !v).length

  const averages = { ...EMPTY_STATS.averages }
  const distributions = {
    specificity: [0, 0, 0, 0, 0],
    query_quality: [0, 0, 0, 0, 0],
    standalone_clarity: [0, 0, 0, 0, 0],
    scientific_validity: [0, 0, 0, 0, 0],
  }

  for (const metric of NUMERIC_METRICS) {
    const vals = reviewed.map((r) => r[metric.key]).filter((v): v is number => typeof v === 'number')
    averages[metric.key] = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : null
    vals.forEach((v) => {
      if (v >= 1 && v <= 5) distributions[metric.key][v - 1] += 1
    })
  }

  const notesCount = reviewed.filter((r) => (r.note ?? '').trim().length > 0).length
  const nearMissCount = reviewed.filter((r) => normalizeRanks(r.near_miss_ranks).length > 0).length
  const nearMissRankCounts = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0]
  reviewed.forEach((r) => {
    normalizeRanks(r.near_miss_ranks).forEach((rank) => {
      nearMissRankCounts[rank - 1] += 1
    })
  })

  const relevanceCounts = { notRelevant: 0, somewhatRelevant: 0, relevant: 0 }
  const relevanceSums = Array.from({ length: 10 }, () => ({ sum: 0, count: 0 }))
  let relevanceTotal = 0
  let relevanceN = 0
  reviewed.forEach((r) => {
    const rel = normalizeRetrievedRelevance(r.retrieved_relevance)
    Object.entries(rel).forEach(([rankStr, value]) => {
      if (value === 1) relevanceCounts.notRelevant += 1
      else if (value === 2) relevanceCounts.somewhatRelevant += 1
      else if (value === 3) relevanceCounts.relevant += 1
      const rank = Number(rankStr)
      if (rank >= 1 && rank <= 10) {
        relevanceSums[rank - 1].sum += value
        relevanceSums[rank - 1].count += 1
      }
      relevanceTotal += value
      relevanceN += 1
    })
  })

  return {
    totalItems: items.length,
    reviewedItems: reviewed.length,
    answerabilityRate: answerabilityValues.length ? answerabilityYes / answerabilityValues.length : null,
    answerabilityYes,
    answerabilityNo,
    averages,
    distributions,
    notesCount,
    nearMissRate: reviewed.length ? nearMissCount / reviewed.length : null,
    nearMissCount,
    nearMissRankCounts,
    relevanceCounts,
    avgRetrievedRelevance: relevanceN ? relevanceTotal / relevanceN : null,
    avgRelevanceByRank: relevanceSums.map(({ sum, count }) => (count ? sum / count : null)),
  }
}

function StatCard({ label, value, subtitle }: { label: string; value: string; subtitle?: string }) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 px-4 py-3">
      <div className="text-xs uppercase tracking-wide text-neutral-400">{label}</div>
      <div className="mt-2 text-2xl font-semibold text-white">{value}</div>
      {subtitle ? <div className="mt-1 text-xs text-neutral-500">{subtitle}</div> : null}
    </div>
  )
}

function MetricComparison({
  title,
  groups,
}: {
  title: string
  groups: Array<{ label: string; stats: Stats }>
}) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <div className="mt-4 space-y-5">
        <div>
          <div className="mb-2 text-xs uppercase tracking-wide text-neutral-400">Answerability rate</div>
          <div className="space-y-2">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-neutral-300">
                  <span>{group.label}</span>
                  <span>{formatPercent(group.stats.answerabilityRate)}</span>
                </div>
                <div className="h-2 rounded bg-neutral-800">
                  <div className="h-2 rounded bg-blue-500" style={{ width: scoreBarWidth(group.stats.answerabilityRate, 1) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        {NUMERIC_METRICS.map((metric) => (
          <div key={metric.key}>
            <div className="mb-2 text-xs uppercase tracking-wide text-neutral-400">{metric.label}</div>
            <div className="space-y-2">
              {groups.map((group) => (
                <div key={`${metric.key}-${group.label}`}>
                  <div className="mb-1 flex items-center justify-between text-xs text-neutral-300">
                    <span>{group.label}</span>
                    <span>{formatScore(group.stats.averages[metric.key])}</span>
                  </div>
                  <div className="h-2 rounded bg-neutral-800">
                    <div className="h-2 rounded bg-emerald-500" style={{ width: scoreBarWidth(group.stats.averages[metric.key], 5) }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function DistributionPanel({ title, stats }: { title: string; stats: Stats }) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="text-sm font-medium text-white">{title}</h3>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        {NUMERIC_METRICS.map((metric) => {
          const total = stats.distributions[metric.key].reduce((a, b) => a + b, 0)
          return (
            <div key={metric.key} className="rounded border border-neutral-800 bg-neutral-950 p-3">
              <div className="text-sm text-neutral-200">{metric.label}</div>
              <div className="mt-3 grid grid-cols-5 gap-2">
                {stats.distributions[metric.key].map((count, idx) => {
                  const pct = total ? (count / total) * 100 : 0
                  return (
                    <div key={idx} className="space-y-1 text-center">
                      <div className="text-xs text-neutral-500">{idx + 1}</div>
                      <div className="mx-auto h-20 w-full rounded bg-neutral-800 flex items-end overflow-hidden">
                        <div className="w-full bg-blue-500" style={{ height: `${pct}%` }} />
                      </div>
                      <div className="text-xs text-neutral-300">{count}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RelevanceComposition({ groups }: { groups: Array<{ label: string; stats: Stats }> }) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="text-sm font-medium text-white">Retrieved relevance composition</h3>
      <div className="mt-2 text-xs text-neutral-400">Share of judged retrieved documents labeled not relevant, somewhat relevant, or relevant.</div>
      <div className="mt-4 space-y-4">
        {groups.map((group) => {
          const counts = group.stats.relevanceCounts
          const total = counts.notRelevant + counts.somewhatRelevant + counts.relevant
          const nr = total ? (counts.notRelevant / total) * 100 : 0
          const sr = total ? (counts.somewhatRelevant / total) * 100 : 0
          const rr = total ? (counts.relevant / total) * 100 : 0
          return (
            <div key={group.label}>
              <div className="mb-1 flex items-center justify-between text-xs text-neutral-300">
                <span>{group.label}</span>
                <span>{total} judged docs</span>
              </div>
              <div className="flex h-4 overflow-hidden rounded bg-neutral-800">
                <div className="bg-rose-600" style={{ width: `${nr}%` }} />
                <div className="bg-amber-500" style={{ width: `${sr}%` }} />
                <div className="bg-emerald-500" style={{ width: `${rr}%` }} />
              </div>
              <div className="mt-2 flex gap-4 text-xs text-neutral-400">
                <span>Not relevant: {nr.toFixed(1)}%</span>
                <span>Somewhat relevant: {sr.toFixed(1)}%</span>
                <span>Relevant: {rr.toFixed(1)}%</span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function RelevanceByRank({ groups }: { groups: Array<{ label: string; stats: Stats }> }) {
  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="text-sm font-medium text-white">Average relevance by rank</h3>
      <div className="mt-2 text-xs text-neutral-400">Ranks 1–10, with 1 = not relevant, 2 = somewhat relevant, 3 = relevant.</div>
      <div className="mt-4 space-y-3">
        {groups.map((group) => (
          <div key={group.label}>
            <div className="mb-2 text-xs text-neutral-300">{group.label}</div>
            <div className="grid grid-cols-10 gap-2">
              {group.stats.avgRelevanceByRank.map((value, idx) => (
                <div key={idx} className={`rounded px-2 py-3 text-center text-xs ${heatColor(value)}`}>
                  <div className="text-[10px] opacity-80">R{idx + 1}</div>
                  <div className="mt-1 font-medium">{formatScore(value)}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function NearMissPanel({ groups }: { groups: Array<{ label: string; stats: Stats }> }) {
  const aggregateCounts = Array.from({ length: 10 }, (_, idx) => ({
    rank: idx + 1,
    count: groups.reduce((acc, group) => acc + (group.stats.nearMissRankCounts[idx] ?? 0), 0),
  }))
  const maxCount = Math.max(1, ...aggregateCounts.map((x) => x.count))

  return (
    <div className="rounded border border-neutral-800 bg-neutral-900 p-4">
      <h3 className="text-sm font-medium text-white">Near misses</h3>
      <div className="mt-4 grid gap-6 xl:grid-cols-2">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">Rate by subset</div>
          <div className="mt-3 space-y-2">
            {groups.map((group) => (
              <div key={group.label}>
                <div className="mb-1 flex items-center justify-between text-xs text-neutral-300">
                  <span>{group.label}</span>
                  <span>{formatPercent(group.stats.nearMissRate)}</span>
                </div>
                <div className="h-2 rounded bg-neutral-800">
                  <div className="h-2 rounded bg-fuchsia-500" style={{ width: scoreBarWidth(group.stats.nearMissRate, 1) }} />
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">Near-miss rank distribution</div>
          <div className="mt-3 space-y-2">
            {aggregateCounts.map(({ rank, count }) => (
              <div key={rank}>
                <div className="mb-1 flex items-center justify-between text-xs text-neutral-300">
                  <span>Rank {rank}</span>
                  <span>{count}</span>
                </div>
                <div className="h-2 rounded bg-neutral-800">
                  <div className="h-2 rounded bg-violet-500" style={{ width: `${(count / maxCount) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DashboardPage() {
  const router = useRouter()
  const [authReady, setAuthReady] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [canReview, setCanReview] = useState(false)
  const [selected, setSelected] = useState<DashboardKey>('overall')
  const [items, setItems] = useState<ReviewItem[]>([])
  const [trainingReviews, setTrainingReviews] = useState<Record<string, ReviewRow>>({})
  const [evaluationReviews, setEvaluationReviews] = useState<Record<string, ReviewRow>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null)
      setAuthReady(true)
    })
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setAuthReady(true)
    })
    return () => data.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!authReady) return
    if (!user) {
      router.replace('/login')
      return
    }

    const resolveRole = async () => {
      const { data: profile } = await supabase.from('profiles').select('can_review').eq('user_id', user.id).maybeSingle()
      setCanReview(Boolean(profile?.can_review))
    }

    resolveRole()
  }, [authReady, user, router])

  useEffect(() => {
    if (!user) return

    const loadDashboard = async () => {
      setLoading(true)
      setError(null)

      const { data: loadedItems, error: itemsError } = await supabase
        .from('review_items')
        .select('id, task_type, subtask, payload')
        .eq('active', true)

      if (itemsError) {
        setError(itemsError.message)
        setLoading(false)
        return
      }

      const rows = (loadedItems as ReviewItem[]) ?? []
      setItems(rows)

      const trainingIds = rows.filter((r) => r.task_type === 'training').map((r) => r.id)
      const evaluationIds = rows.filter((r) => r.task_type === 'evaluation').map((r) => r.id)

      let nextTraining: Record<string, ReviewRow> = {}
      let nextEvaluation: Record<string, ReviewRow> = {}

      if (trainingIds.length) {
        const { data } = await supabase
          .from('training_reviews')
          .select('item_id, answerability, specificity, query_quality, standalone_clarity, scientific_validity, note')
          .in('item_id', trainingIds)
        nextTraining = Object.fromEntries((((data ?? []) as ReviewRow[]).map((r) => [r.item_id, r])))
      }

      if (evaluationIds.length) {
        const { data } = await supabase
          .from('evaluation_reviews')
          .select('item_id, answerability, specificity, query_quality, standalone_clarity, scientific_validity, near_miss_ranks, retrieved_relevance, note')
          .in('item_id', evaluationIds)
        nextEvaluation = Object.fromEntries((((data ?? []) as ReviewRow[]).map((r) => [r.item_id, r])))
      }

      setTrainingReviews(nextTraining)
      setEvaluationReviews(nextEvaluation)
      setLoading(false)
    }

    loadDashboard()
  }, [user])

  const dataset = useMemo(() => {
    const trainingItems = items.filter((item) => item.task_type === 'training')
    const evaluationItems = items.filter((item) => item.task_type === 'evaluation')
    const chemrxivTrainItems = trainingItems.filter((item) => item.subtask === 'BASF-AI/ChemRxiv-Train-CC-BY')
    const dolmaTrainItems = trainingItems.filter((item) => item.subtask === 'BASF-AI/dolma-chem-only-query-generated')
    const successfulItems = evaluationItems.filter((item) => item.subtask === 'successful')
    const unsuccessfulItems = evaluationItems.filter((item) => item.subtask === 'unsuccessful')

    const allReviews = { ...trainingReviews, ...evaluationReviews }

    const overall = computeStats(items, allReviews)
    const training = computeStats(trainingItems, trainingReviews)
    const chemrxivTrain = computeStats(chemrxivTrainItems, trainingReviews)
    const dolmaTrain = computeStats(dolmaTrainItems, trainingReviews)
    const evaluation = computeStats(evaluationItems, evaluationReviews)
    const successful = computeStats(successfulItems, evaluationReviews)
    const unsuccessful = computeStats(unsuccessfulItems, evaluationReviews)

    return {
      overall,
      training,
      chemrxivTrain,
      dolmaTrain,
      evaluation,
      successful,
      unsuccessful,
    }
  }, [items, trainingReviews, evaluationReviews])

  const selectedStats = useMemo(() => {
    switch (selected) {
      case 'training':
        return dataset.training
      case 'chemrxiv_train':
        return dataset.chemrxivTrain
      case 'dolma_train':
        return dataset.dolmaTrain
      case 'evaluation':
        return dataset.evaluation
      case 'successful':
        return dataset.successful
      case 'unsuccessful':
        return dataset.unsuccessful
      case 'overall':
      default:
        return dataset.overall
    }
  }, [selected, dataset])

  const navCounts: Record<DashboardKey, Stats> = {
    overall: dataset.overall,
    training: dataset.training,
    chemrxiv_train: dataset.chemrxivTrain,
    dolma_train: dataset.dolmaTrain,
    evaluation: dataset.evaluation,
    successful: dataset.successful,
    unsuccessful: dataset.unsuccessful,
  }

  if (!authReady || !user) {
    return <main className="min-h-screen flex items-center justify-center text-sm text-neutral-600">Loading session...</main>
  }

  return (
    <main className="h-screen flex bg-neutral-950 text-neutral-100">
      <aside className="w-80 border-r border-neutral-800 bg-neutral-950 p-4 flex flex-col gap-6">
        <div className="space-y-1">
          <h1 className="text-lg font-semibold">ChEmbed Dashboard</h1>
          <p className="text-xs text-neutral-300 break-all">{user.email}</p>
          <div className="text-xs text-neutral-500">Mode: {canReview ? 'Reviewer' : 'Viewer'}</div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-400">Overview</div>
          <div className="mt-2 space-y-1 text-sm">
            {NAV_ITEMS.map((item) => {
              const stats = navCounts[item.key]
              return (
                <button
                  key={item.key}
                  onClick={() => setSelected(item.key)}
                  className={`w-full rounded px-2 py-1 text-left transition-colors ${
                    selected === item.key ? 'bg-neutral-800 text-white hover:bg-neutral-700' : 'text-neutral-200 hover:bg-neutral-800'
                  } ${item.indent ? 'pl-6' : ''}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span>{item.label}</span>
                    <span className="text-xs opacity-80">{stats.reviewedItems}/{stats.totalItems}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>

        <div className="mt-auto flex flex-col gap-2">
          <Link href="/review" className="rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white transition-colors hover:bg-neutral-800 text-center">
            Back to Review
          </Link>
        </div>
      </aside>

      <section className="flex-1 overflow-y-auto p-6 space-y-6 bg-neutral-950 text-neutral-100">
        {loading ? (
          <div className="text-sm text-neutral-400">Loading dashboard…</div>
        ) : error ? (
          <div className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">Failed to load dashboard: {error}</div>
        ) : (
          <>
            <div>
              <h2 className="text-2xl font-semibold text-white">{NAV_ITEMS.find((item) => item.key === selected)?.label}</h2>
              <p className="mt-1 text-sm text-neutral-400">Live aggregates from the review tables. Read-only for both reviewers and viewers.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
              <StatCard label="Reviewed items" value={`${selectedStats.reviewedItems}/${selectedStats.totalItems}`} subtitle="completed / total" />
              <StatCard label="Answerability rate" value={formatPercent(selectedStats.answerabilityRate)} subtitle={`${selectedStats.answerabilityYes} yes • ${selectedStats.answerabilityNo} no`} />
              <StatCard label="Avg specificity" value={formatScore(selectedStats.averages.specificity)} />
              <StatCard label="Avg query quality" value={formatScore(selectedStats.averages.query_quality)} />
              <StatCard label="Avg clarity" value={formatScore(selectedStats.averages.standalone_clarity)} />
              <StatCard label="Avg scientific validity" value={formatScore(selectedStats.averages.scientific_validity)} subtitle={`${selectedStats.notesCount} notes`} />
            </div>

            {selected === 'overall' && (
              <>
                <MetricComparison
                  title="Training vs evaluation"
                  groups={[
                    { label: 'Training', stats: dataset.training },
                    { label: 'Evaluation', stats: dataset.evaluation },
                  ]}
                />
                <MetricComparison
                  title="Subset overview"
                  groups={[
                    { label: 'ChemRxiv Train', stats: dataset.chemrxivTrain },
                    { label: 'Dolma Chem', stats: dataset.dolmaTrain },
                    { label: 'Successful', stats: dataset.successful },
                    { label: 'Unsuccessful', stats: dataset.unsuccessful },
                  ]}
                />
              </>
            )}

            {selected === 'training' && (
              <>
                <MetricComparison
                  title="Training source comparison"
                  groups={[
                    { label: 'ChemRxiv Train', stats: dataset.chemrxivTrain },
                    { label: 'Dolma Chem', stats: dataset.dolmaTrain },
                  ]}
                />
                <DistributionPanel title="Training score distributions" stats={dataset.training} />
              </>
            )}

            {(selected === 'chemrxiv_train' || selected === 'dolma_train') && (
              <DistributionPanel
                title="Score distributions"
                stats={selected === 'chemrxiv_train' ? dataset.chemrxivTrain : dataset.dolmaTrain}
              />
            )}

            {selected === 'evaluation' && (
              <>
                <MetricComparison
                  title="Successful vs unsuccessful"
                  groups={[
                    { label: 'Successful', stats: dataset.successful },
                    { label: 'Unsuccessful', stats: dataset.unsuccessful },
                  ]}
                />
                <div className="grid gap-6 xl:grid-cols-2">
                  <RelevanceComposition
                    groups={[
                      { label: 'Successful', stats: dataset.successful },
                      { label: 'Unsuccessful', stats: dataset.unsuccessful },
                    ]}
                  />
                  <NearMissPanel
                    groups={[
                      { label: 'Successful', stats: dataset.successful },
                      { label: 'Unsuccessful', stats: dataset.unsuccessful },
                    ]}
                  />
                </div>
                <RelevanceByRank
                  groups={[
                    { label: 'Successful', stats: dataset.successful },
                    { label: 'Unsuccessful', stats: dataset.unsuccessful },
                  ]}
                />
              </>
            )}

            {(selected === 'successful' || selected === 'unsuccessful') && (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <StatCard label="Near-miss rate" value={formatPercent(selectedStats.nearMissRate)} subtitle={`${selectedStats.nearMissCount} items with near miss`} />
                  <StatCard label="Avg retrieved relevance" value={formatScore(selectedStats.avgRetrievedRelevance)} subtitle="1 = not relevant, 3 = relevant" />
                  <StatCard label="Judged relevance labels" value={`${selectedStats.relevanceCounts.notRelevant + selectedStats.relevanceCounts.somewhatRelevant + selectedStats.relevanceCounts.relevant}`} subtitle="total retrieved docs judged" />
                </div>
                <div className="grid gap-6 xl:grid-cols-2">
                  <RelevanceComposition groups={[{ label: NAV_ITEMS.find((item) => item.key === selected)?.label ?? selected, stats: selectedStats }]} />
                  <NearMissPanel groups={[{ label: NAV_ITEMS.find((item) => item.key === selected)?.label ?? selected, stats: selectedStats }]} />
                </div>
                <RelevanceByRank groups={[{ label: NAV_ITEMS.find((item) => item.key === selected)?.label ?? selected, stats: selectedStats }]} />
              </>
            )}
          </>
        )}
      </section>
    </main>
  )
}
