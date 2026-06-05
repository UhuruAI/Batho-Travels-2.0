import { spawnSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const isWindows = process.platform === "win32";
const args = new Set(process.argv.slice(2));
const failures = [];

const excludedDirs = new Set([
  ".git",
  ".next",
  ".turbo",
  ".expo",
  ".npm-cache",
  ".pnpm-store",
  "build",
  "coverage",
  "dist",
  "node_modules",
  "store"
]);

const scannedExtensions = new Set([
  ".css",
  ".json",
  ".md",
  ".mjs",
  ".ts",
  ".tsx",
  ".txt"
]);

function bin(name, base = root) {
  return path.join(base, "node_modules", ".bin", `${name}${isWindows ? ".cmd" : ""}`);
}

function npxBin() {
  return isWindows ? "npx.cmd" : "npx";
}

function run(label, command, commandArgs, cwd = root) {
  console.log(`\n[phase12] ${label}`);
  const result = spawnSync(command, commandArgs, {
    cwd,
    shell: isWindows,
    stdio: "inherit"
  });

  if (result.status !== 0) {
    const reason = result.error ? `: ${result.error.message}` : "";
    failures.push(`${label} failed with exit code ${result.status ?? "unknown"}${reason}.`);
  }
}

function walk(dir, files = []) {
  for (const entry of readdirSync(dir)) {
    const fullPath = path.join(dir, entry);
    const relativePath = path.relative(root, fullPath);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      if (!excludedDirs.has(entry)) {
        walk(fullPath, files);
      }
      continue;
    }

    if (
      scannedExtensions.has(path.extname(entry)) &&
      !relativePath.endsWith(".env.local") &&
      !relativePath.endsWith(".env")
    ) {
      files.push(fullPath);
    }
  }

  return files;
}

function scanSource() {
  console.log("\n[phase12] Source safety scan");
  const globalPatterns = [
    {
      label: "secret key assignment",
      regex: /\b(PAYSTACK|STRIPE|OZOW|ANTHROPIC|GOOGLE)_(API_)?KEY\s*=\s*\S+/i
    },
    {
      label: "secret token assignment",
      regex: /\b[A-Z0-9_]*(SECRET|TOKEN|PASSWORD)[A-Z0-9_]*\s*=\s*\S+/
    },
    { label: "local user path", regex: /C:\\Users\\user/i },
    { label: "store directory reference", regex: /(["'`]|^)\s*store\//im }
  ];
  const publicCopyPatterns = [
    { label: "fixed split phrase", regex: /50\/25\/25/i },
    { label: "reservation copy", regex: /lock in/i }
  ];
  const matches = [];
  const publicCopyRoots = [
    `apps${path.sep}web${path.sep}app${path.sep}`,
    `apps${path.sep}web${path.sep}public${path.sep}`,
    `apps${path.sep}mobile${path.sep}`,
    `apps${path.sep}admin${path.sep}`
  ];

  for (const file of walk(root)) {
    const relativePath = path.relative(root, file);
    const text = readFileSync(file, "utf8");

    for (const pattern of globalPatterns) {
      if (pattern.regex.test(text)) {
        matches.push(`${relativePath}: ${pattern.label}`);
      }
    }

    if (publicCopyRoots.some((publicRoot) => relativePath.startsWith(publicRoot))) {
      for (const pattern of publicCopyPatterns) {
        if (pattern.regex.test(text)) {
          matches.push(`${relativePath}: ${pattern.label}`);
        }
      }
    }
  }

  if (matches.length > 0) {
    failures.push(`Source safety scan found ${matches.length} issue(s):\n${matches.join("\n")}`);
    return;
  }

  console.log("[phase12] Source safety scan passed");
}

function policySmokeCheck() {
  console.log("\n[phase12] Policy smoke check");
  const configSource = readFileSync(path.join(root, "packages/config/src/index.ts"), "utf8");
  const launchSeedSource = readFileSync(
    path.join(root, "packages/config/src/launchSeed.ts"),
    "utf8"
  );

  const expectations = [
    { label: "locked app name", passed: configSource.includes('APP_NAME = "Batho Travels"') },
    { label: "max plan months", passed: configSource.includes("MAX_PLAN_MONTHS = 12") },
    {
      label: "funding stage order",
      passed: configSource.includes('["flights", "stay", "experiences"]')
    },
    {
      label: "generic seed contacts",
      passed: launchSeedSource.includes(".example") && launchSeedSource.includes("+27000000001")
    },
    {
      label: "launch viewport coverage",
      passed:
        launchSeedSource.includes('"mobile"') &&
        launchSeedSource.includes('"tablet"') &&
        launchSeedSource.includes('"desktop"')
    }
  ];

  const failedExpectations = expectations.filter((expectation) => !expectation.passed);

  if (failedExpectations.length > 0) {
    failures.push(
      `Policy smoke check failed: ${failedExpectations
        .map((expectation) => expectation.label)
        .join(", ")}.`
    );
    return;
  }

  console.log("[phase12] Policy smoke check passed");
}

if (args.has("--vitest")) {
  run("Package policy tests", bin("vitest"), ["run", "--passWithNoTests"]);
}

policySmokeCheck();
run("Config typecheck", bin("tsc"), ["-p", "packages/config/tsconfig.json", "--noEmit"]);
run("Core typecheck", bin("tsc"), ["-p", "packages/core/tsconfig.json", "--noEmit"]);
run("Payments typecheck", bin("tsc"), ["-p", "packages/payments/tsconfig.json", "--noEmit"]);
run("Design tokens typecheck", bin("tsc"), [
  "-p",
  "packages/design-tokens/tsconfig.json",
  "--noEmit"
]);
run("UI typecheck", bin("tsc"), ["-p", "packages/ui/tsconfig.json", "--noEmit"]);
run("Mobile typecheck", bin("tsc"), ["-p", "apps/mobile/tsconfig.json", "--noEmit"]);
run("Web typecheck", bin("tsc"), ["-p", "apps/web/tsconfig.json", "--noEmit"]);
run("Admin typecheck", bin("tsc"), ["-p", "apps/admin/tsconfig.json", "--noEmit"]);
run("Web production build", bin("next", path.join(root, "apps/web")), ["build"], path.join(root, "apps/web"));
run("Admin production build", bin("next", path.join(root, "apps/admin")), ["build"], path.join(root, "apps/admin"));

if (args.has("--mobile-export")) {
  const expoBin = bin("expo", path.join(root, "apps/mobile"));
  if (existsSync(expoBin)) {
    run("Mobile export", expoBin, ["export", "--platform", "all"], path.join(root, "apps/mobile"));
  } else {
    failures.push("Mobile export requested, but Expo binary was not found.");
  }
}

if (args.has("--convex")) {
  run("Convex function check", npxBin(), ["convex", "dev", "--once"]);
}

scanSource();

if (failures.length > 0) {
  console.error("\n[phase12] Launch checks failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log("\n[phase12] Launch checks passed");
