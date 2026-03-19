export default function ReviewPage() {
  return (
    <main className="h-screen flex">
      {/* Sidebar */}
      <aside className="w-80 border-r p-4 space-y-4">
        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Training Data</div>
          <div className="mt-2 space-y-1 text-sm">
            <button className="w-full text-left hover:underline">chemrxiv-train-cc-by_sample25</button>
            <button className="w-full text-left hover:underline">dolma-chem-only-query-generated_sample25</button>
          </div>
        </div>

        <div>
          <div className="text-xs uppercase tracking-wide text-neutral-500">Evaluation Data</div>
          <div className="mt-2 space-y-1 text-sm">
            <button className="w-full text-left hover:underline">Successful</button>
            <button className="w-full text-left hover:underline">Unsuccessful</button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <section className="flex-1 p-6">
        <div className="text-sm text-neutral-600">
          Stub page. Next step: load one item from Supabase and render:
        </div>

        <div className="mt-6 grid grid-cols-2 gap-6">
          <div className="border rounded p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Presented data</div>
            <div className="mt-3 text-sm">Query + passage (or query + gold + top-10)</div>
          </div>

          <div className="border rounded p-4">
            <div className="text-xs uppercase tracking-wide text-neutral-500">Expert feedback</div>
            <div className="mt-3 text-sm">Answerability, 1–5 scales, note…</div>
          </div>
        </div>
      </section>
    </main>
  )
}
