import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const paths = [...new Set(execFileSync("git", ["ls-files", "--cached", "--others", "--exclude-standard", "-z"], { encoding: "utf8" }).split("\0").filter(Boolean))];
const secretPatterns = [/-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/, /\bsk-(?:proj-)?[A-Za-z0-9_-]{24,}\b/, /\bgh[pousr]_[A-Za-z0-9]{30,}\b/, /\bAKIA[0-9A-Z]{16}\b/, /\bsb_secret_[A-Za-z0-9_-]{20,}\b/];
const findings = [];
for (const path of paths) {
  if (path === "scripts/security-check.mjs") continue;
  if (/(^|\/)\.env(?:\.|$)/.test(path) && !/example|sample|template/.test(path)) findings.push(`${path}: environment file must not be committed`);
  if (!/\.(?:tsx?|jsx?|mjs|cjs|py|md|json|ya?ml|sql|tf|rego|txt|sh|toml)$/.test(path)) continue;
  const content = readFileSync(path, "utf8");
  if (secretPatterns.some(pattern => pattern.test(content))) findings.push(`${path}: possible credential pattern (value withheld)`);
  if (/^(app|components|lib)\//.test(path) && /chatgpt\.site|\bChatGPT\b|\bCodex\b/.test(content)) findings.push(`${path}: unexpected builder branding`);
}
if (findings.length) { console.error(findings.join("\n")); process.exit(1); }
console.log(`Security source scan passed: ${paths.length} repository files; no high-confidence credential patterns or application builder branding.`);
