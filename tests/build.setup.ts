import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { TestProject } from "vitest/node";

declare module "vitest" {
  export interface ProvidedContext {
    buildError: string | null;
  }
}

const root = path.resolve(__dirname, "..");

// Roda `astro build` uma vez antes de todos os testes. dist/ é apagado antes, para
// que um dist antigo nunca faça um teste passar. Se o build falhar, não derrubamos
// os testes de schema: o erro é repassado via inject("buildError") e o teste
// "build conclui" (tests/pages.test.ts) falha com a mensagem.
export default function setup(project: TestProject) {
  fs.rmSync(path.join(root, "dist"), { recursive: true, force: true });
  let buildError: string | null = null;
  try {
    execSync("npx astro build", { cwd: root, stdio: "pipe", timeout: 300_000 });
  } catch (e: any) {
    buildError = `${e.stdout?.toString() ?? ""}\n${e.stderr?.toString() ?? ""}`.trim().slice(-4000) || String(e);
  }
  project.provide("buildError", buildError);
}
