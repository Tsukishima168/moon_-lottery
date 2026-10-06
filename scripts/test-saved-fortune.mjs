import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import ts from 'typescript';

const source = readFileSync(new URL('../src/data/fortunes.ts', import.meta.url), 'utf8');
const module = { exports: {} };
vm.runInNewContext(ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
}).outputText, { module, exports: module.exports });
const { FORTUNES, JACKPOT_FORTUNE, findSavedFortune } = module.exports;

// Existing records (1–10) must survive the content upgrade unchanged in identity.
assert.equal(FORTUNES.length, 10);
for (let id = 1; id <= 10; id++) {
  const restored = findSavedFortune(id, 'bronze');
  assert.equal(restored?.id, id);
  assert.ok(restored.text && restored.example && restored.action);
}

// Regression: a saved moonlight-ball result used to reopen as fortune #1.
assert.equal(findSavedFortune(999, 'jackpot'), JACKPOT_FORTUNE);
for (const [id, prize] of [[999, 'bronze'], [0, 'gold'], [11, 'gold'], ['1', 'gold'], [null, 'gold'], [undefined, 'gold']]) {
  assert.equal(findSavedFortune(id, prize), null);
}
console.log('Saved fortune: 10 legacy records, jackpot restoration and 6 invalid-record cases passed.');
