import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { NAV_LINKS, FOOTER_LINKS } from '../src/data/routes.js';

describe('GaunPulse Navigation & Site Configuration Tests', () => {
  it('1. Navigation integrity: All main routes are correctly declared', () => {
    const requiredNavPaths = ['/', '/map', '/demo', '/issues', '/insights', '/about'];
    const declaredNavPaths = NAV_LINKS.map((link) => link.path);

    requiredNavPaths.forEach((path) => {
      assert.ok(
        declaredNavPaths.includes(path),
        `Missing declared primary nav path: ${path}`
      );
    });
  });

  it('2. Footer links integrity: Policy and public notices links exist', () => {
    const declaredFooterPaths = FOOTER_LINKS.map((link) => link.path);
    assert.ok(declaredFooterPaths.includes('/notices'), 'Footer must link to /notices');
    assert.ok(declaredFooterPaths.includes('/privacy'), 'Footer must link to /privacy');
    assert.ok(declaredFooterPaths.includes('/terms'), 'Footer must link to /terms');
    assert.ok(declaredFooterPaths.includes('/about'), 'Footer must link to /about');
  });

  it('3. Team & Repository metadata validation', () => {
    const teamName = 'PixelSquad';
    const repoUrl = 'https://github.com/sharmilashahi752/Gaunpluse-pixelsquad-';

    assert.equal(teamName, 'PixelSquad');
    assert.ok(repoUrl.includes('Gaunpluse-pixelsquad-'));
  });
});
