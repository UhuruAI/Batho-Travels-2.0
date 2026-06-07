import { colors, shadows, radius, spacing, motion, typography, type ThemeName } from "./index";

function kebab(input: string): string {
  return input.replace(/[A-Z0-9]/g, (m) => `-${m.toLowerCase()}`).replace(/^-/, "");
}

export function tokensToCssVars(theme: ThemeName): string {
  const lines: string[] = [];
  const c = colors[theme];
  for (const [k, v] of Object.entries(c)) lines.push(`  --color-${kebab(k)}: ${v};`);
  const s = shadows[theme];
  for (const [k, v] of Object.entries(s)) lines.push(`  --shadow-${kebab(k)}: ${v};`);
  return lines.join("\n");
}

function staticVars(): string {
  const lines: string[] = [];
  for (const [k, v] of Object.entries(spacing)) lines.push(`  --space-${kebab(String(k))}: ${v}px;`);
  for (const [k, v] of Object.entries(radius)) lines.push(`  --radius-${kebab(String(k))}: ${v}px;`);
  for (const [k, v] of Object.entries(motion.duration)) lines.push(`  --duration-${kebab(k)}: ${v}ms;`);
  for (const [k, v] of Object.entries(motion.easing)) lines.push(`  --easing-${kebab(k)}: ${v};`);
  lines.push(`  --font-display: "${typography.display}", "Inter", system-ui, sans-serif;`);
  lines.push(`  --font-body: "${typography.body}", system-ui, sans-serif;`);
  lines.push(`  --font-serif: "${typography.serif}", Georgia, serif;`);
  lines.push(`  --font-data: "${typography.data}", ui-monospace, monospace;`);
  return lines.join("\n");
}

export function allTokensCss(): string {
  return `:root {
  color-scheme: light;
${staticVars()}
${tokensToCssVars("light")}
}

[data-theme="dark"] {
  color-scheme: dark;
${tokensToCssVars("dark")}
}
`;
}
