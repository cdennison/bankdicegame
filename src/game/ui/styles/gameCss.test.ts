/// <reference types="node" />
// @vitest-environment node

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const gameCss = readFileSync(resolve(process.cwd(), 'src/game/ui/styles/game.css'), 'utf8');

describe('Speed Mode styles', () => {
  it('scopes animation and transition suppression to Speed Mode', () => {
    const ruleStart = gameCss.indexOf('.speed-mode,');
    const blockStart = gameCss.indexOf('{', ruleStart);
    const blockEnd = gameCss.indexOf('}', blockStart);
    const selectors = gameCss.slice(ruleStart, blockStart);
    const declarations = gameCss.slice(blockStart + 1, blockEnd);

    expect(ruleStart).toBeGreaterThanOrEqual(0);
    expect(selectors).toContain('.speed-mode *');
    expect(declarations).toMatch(/animation:\s*none\s*!important/);
    expect(declarations).toMatch(/transition:\s*none\s*!important/);
  });
});
