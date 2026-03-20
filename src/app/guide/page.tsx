export default function GuidePage() {
  return (
    <main className="min-h-screen bg-neutral-950 px-6 py-10 text-neutral-100">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="space-y-3">
          <h1 className="text-3xl font-semibold tracking-tight">Expert Review Guide</h1>
          <p className="max-w-3xl text-sm leading-6 text-neutral-300">
            This guide explains what the review tasks mean and how to interpret the rating fields.
            The goal is to make expert feedback more consistent and easier to compare across items.
          </p>
        </header>

        <section className="space-y-3 rounded border border-neutral-800 bg-neutral-900/60 p-5">
          <h2 className="text-lg font-semibold">1. Project overview</h2>
          <div className="space-y-3 text-sm leading-6 text-neutral-200">
            <p>
              We are building evaluation data for a chemistry retrieval system. Retrieval systems learn to
              connect a user query with the most relevant passage.
            </p>
            <p>
              Because large collections of real human chemistry queries are limited, synthetic queries were
              generated from chemistry passages using language models. The purpose of this review is to judge
              whether those generated queries are realistic and whether retrieval results are genuinely useful.
            </p>
            <p>
              When reviewing, try to think like a knowledgeable human using a search engine to find the right
              chemistry passage.
            </p>
          </div>
        </section>

        <section className="space-y-3 rounded border border-neutral-800 bg-neutral-900/60 p-5">
          <h2 className="text-lg font-semibold">2. Task A: synthetic query quality</h2>
          <div className="space-y-3 text-sm leading-6 text-neutral-200">
            <p>In Task A, you will see:</p>
            <ul className="list-disc space-y-1 pl-5 text-neutral-300">
              <li>a generated query</li>
              <li>the source passage from which the query was generated</li>
            </ul>
            <p>Your job is to judge whether the query:</p>
            <ul className="list-disc space-y-1 pl-5 text-neutral-300">
              <li>can be answered from the passage</li>
              <li>is clear and understandable on its own</li>
              <li>is scientifically faithful to the passage</li>
              <li>feels like a realistic query a human might search for</li>
            </ul>
            <p>
              Intuition: imagine a human wants to find this passage through a search engine. Does this query
              look like something that person might realistically type?
            </p>
          </div>
        </section>

        <section className="space-y-3 rounded border border-neutral-800 bg-neutral-900/60 p-5">
          <h2 className="text-lg font-semibold">3. Task B: retrieval quality</h2>
          <div className="space-y-3 text-sm leading-6 text-neutral-200">
            <p>In Task B, you will see:</p>
            <ul className="list-disc space-y-1 pl-5 text-neutral-300">
              <li>a generated query</li>
              <li>the gold/source passage</li>
              <li>the top-10 passages retrieved by the model</li>
            </ul>
            <p>There are two categories:</p>
            <ul className="list-disc space-y-1 pl-5 text-neutral-300">
              <li>
                <span className="font-medium text-white">Successful:</span> the gold passage appears somewhere in
                the top-10 retrieved passages.
              </li>
              <li>
                <span className="font-medium text-white">Unsuccessful:</span> the gold passage does not appear in
                the top-10.
              </li>
            </ul>
            <p>
              Your job is to judge how useful the retrieved passages are for satisfying the query, not only
              whether the exact gold passage is present.
            </p>
          </div>
        </section>

        <section className="space-y-4 rounded border border-neutral-800 bg-neutral-900/60 p-5">
          <h2 className="text-lg font-semibold">4. Rating definitions</h2>

          <div className="space-y-4 text-sm leading-6 text-neutral-200">
            <div>
              <h3 className="font-medium text-white">Answerability</h3>
              <p className="text-neutral-300">
                Can the given passage answer the query well enough?
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white">Query quality (1–5)</h3>
              <p className="text-neutral-300">
                How natural, useful, and realistic is the generated query as something a human might search?
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white">Standalone clarity (1–5)</h3>
              <p className="text-neutral-300">
                Is the query understandable on its own, without missing context or hidden assumptions?
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white">Scientific validity (1–5)</h3>
              <p className="text-neutral-300">
                Is the query scientifically faithful to the passage, without incorrect chemistry or misleading framing?
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white">Top-10 relevance overall (1–5)</h3>
              <p className="text-neutral-300">
                Looking at the retrieved set as a whole, how useful are the top-10 passages for answering the query?
              </p>
            </div>

            <div>
              <h3 className="font-medium text-white">Near-miss</h3>
              <p className="text-neutral-300">
                A near-miss is a retrieved passage that is not the exact gold passage but is still strongly relevant
                and likely helpful for the same information need.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-3 rounded border border-neutral-800 bg-neutral-900/60 p-5">
          <h2 className="text-lg font-semibold">5. Practical notes</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm leading-6 text-neutral-300">
            <li>Judge usefulness from the perspective of a realistic human search scenario.</li>
            <li>Do not reward a query only because it is grammatically correct; it should also be meaningful and targeted.</li>
            <li>In Task B, a result can still be useful even when the exact gold passage is missing.</li>
            <li>Use the optional note field to capture anything ambiguous, unusual, or worth revisiting later.</li>
          </ul>
        </section>
      </div>
    </main>
  )
}
