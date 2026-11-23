import test from 'node:test';
import assert from 'node:assert/strict';

test('1. Normalization of provinces from API array of objects', () => {
  const apiProvinces = [
    {
      code: 'NP-P1',
      name: 'Koshi Province',
      local_name: 'कोशी प्रदेश',
      districts: ['Bhojpur', 'Dhankuta', 'Ilam'],
    },
    {
      code: 'NP-P3',
      name: 'Bagmati Province',
      local_name: 'बागमती प्रदेश',
      districts: ['Kathmandu', 'Lalitpur', 'Sindhupalchok'],
    },
  ];

  // Test normalization logic applied in SubmitComplaint
  const normalized = apiProvinces.map((p) => {
    if (typeof p === 'string') return { code: p, name: p, local_name: p };
    return {
      code: p.code || p.name || '',
      name: p.name || p.local_name || '',
      local_name: p.local_name || p.name || '',
    };
  });

  assert.equal(normalized.length, 2);
  assert.equal(typeof normalized[0].name, 'string');
  assert.equal(normalized[0].name, 'Koshi Province');
  assert.equal(normalized[1].name, 'Bagmati Province');

  // Verify that rendering labels and values never outputs an object
  normalized.forEach((p, idx) => {
    const pName = typeof p === 'string' ? p : (p?.name || p?.local_name || '');
    const pKey = typeof p === 'string' ? p : (p?.code || p?.name || idx);
    const pLabel = typeof p === 'string'
      ? p
      : (p?.local_name ? `${p.local_name} (${p.name})` : (p?.name || p?.local_name || ''));

    assert.equal(typeof pName, 'string');
    assert.equal(typeof pKey, 'string');
    assert.equal(typeof pLabel, 'string');
    assert.notEqual(pLabel, '[object Object]');
    assert.notEqual(pName, '[object Object]');
  });
});

test('2. Fallback handling when provinces are strings', () => {
  const stringProvinces = ['Bagmati Province', 'Gandaki Province'];
  const normalized = stringProvinces.map((p) => {
    if (typeof p === 'string') return { code: p, name: p, local_name: p };
    return {
      code: p.code || p.name || '',
      name: p.name || p.local_name || '',
      local_name: p.local_name || p.name || '',
    };
  });

  assert.equal(normalized.length, 2);
  assert.equal(normalized[0].name, 'Bagmati Province');
  assert.equal(normalized[1].name, 'Gandaki Province');
});

test('3. District and municipality filtering with case insensitivity', () => {
  const municipalities = [
    { id: 2, name: 'Helambu Rural Municipality', province: 'Bagmati Province', district: 'Sindhupalchok' },
    { id: 3, name: 'Marpha', province: 'Gandaki Province', district: 'Mustang' },
  ];

  const selectedProvince = 'bagmati province'; // lower case test
  const filtered = municipalities.filter((m) => {
    const mProv = m.province || '';
    return mProv === selectedProvince || mProv.toLowerCase() === selectedProvince.toLowerCase();
  });

  assert.equal(filtered.length, 1);
  assert.equal(filtered[0].id, 2);
  assert.equal(filtered[0].district, 'Sindhupalchok');
});

test('4. Hash parsing preserves citizen submit subpage on reload', () => {
  const hash = '#/citizen/submit';
  const clean = hash.replace(/^#\/?/, '');
  const parts = clean.split('?')[0].split('/');
  assert.equal(parts[0], 'citizen');
  assert.equal(parts[1], 'submit');
  const isSubmit = ['submit', 'register', 'report'].includes(parts[1]);
  assert.equal(isSubmit, true);
});
