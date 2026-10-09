import axe from 'axe-core'

/** Runs axe on a rendered container and returns violations (colour contrast is checked separately). */
export async function axeViolations(container: Element) {
  const results = await axe.run(container, {
    rules: { 'color-contrast': { enabled: false }, region: { enabled: false } },
  })
  return results.violations.map((v) => `${v.id}: ${v.help}`)
}
