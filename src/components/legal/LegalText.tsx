/** Renders owner-written legal text: "# " lines are headings, blank lines split paragraphs. */
export function LegalText({ text }: { text: string }) {
  const blocks = text.trim().split(/\n\s*\n/)
  return (
    <div className="space-y-3">
      {blocks.map((b, i) =>
        b.startsWith('# ') ? (
          <h2 key={i} className="pt-2 font-display text-sm uppercase">
            {b.slice(2).trim()}
          </h2>
        ) : (
          <p key={i} className="whitespace-pre-line">
            {b}
          </p>
        ),
      )}
    </div>
  )
}
