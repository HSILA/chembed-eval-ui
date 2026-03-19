import Link from 'next/link'

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <h1 className="text-2xl font-semibold">ChEmbed Eval UI</h1>
      <p className="text-sm text-neutral-600">
        Expert review app (Training Data / Evaluation Data). Frontend-only, backed by Supabase.
      </p>

      <div className="space-y-2">
        <h2 className="text-lg font-medium">Next</h2>
        <ul className="list-disc pl-5 text-sm">
          <li>
            Add Supabase Auth login (email/password)
          </li>
          <li>
            Sidebar: Training Data + Evaluation Data (Successful / Unsuccessful)
          </li>
          <li>
            Review card: left = presented data, right = feedback form
          </li>
        </ul>
      </div>

      <div className="flex gap-3">
        <Link className="underline" href="/review">Go to review (stub)</Link>
      </div>
    </main>
  )
}
