@AGENTS.md

# Save Slot — project rules

- The full spec is in `SAVE-SLOT-MASTER-PROMPT.md`. Build one phase at a time and write
  `reports/PHASE_<n>_REPORT.md` (in Dutch) after each phase.
- Save Slot is fully separate from BrickFigLy: never use its Vercel project, Supabase project,
  env vars, database or code.
- Vercel project: `save-slot` (team Merijn'Biz). Supabase: its own project in the MerijnBiz org.
- Code, identifiers, commits and UI copy in English.
- No ROMs, no emulator, no Nintendo logos or official artwork.
- Before committing: `pnpm check` (lint, typecheck, unit tests, build) and `pnpm test:e2e`.
