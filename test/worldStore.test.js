import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createInitialWorld,
  duplicateWorld,
  ensureWorldImages,
  getActiveWorldId,
  getWorld,
  listWorlds,
  makeImageReference,
  saveWorld,
  setActiveWorldId,
} from '../src/worldStore.js';

test('world store saves complete local world records without IndexedDB', async () => {
  const world = ensureWorldImages(createInitialWorld({ name: 'Test World' }));
  const saved = await saveWorld(world);
  await setActiveWorldId(saved.id);

  const loaded = await getWorld(saved.id);
  assert.equal(loaded.name, 'Test World');
  assert.ok(loaded.planetSeed);
  assert.ok(loaded.environmentState);
  assert.ok(loaded.hiveGenome);
  assert.ok(Array.isArray(loaded.knownMorphs));
  assert.ok(Array.isArray(loaded.discoveredAdaptations));
  assert.ok(Array.isArray(loaded.archiveLogs));
  assert.ok(loaded.generatedImages.planet.prompt.includes('planet view'));
  assert.equal(await getActiveWorldId(), saved.id);
});

test('world store duplicates worlds and generates morph image references', async () => {
  const source = ensureWorldImages(createInitialWorld({ name: 'Source World' }));
  const saved = await saveWorld(source);
  const duplicate = await duplicateWorld(saved);
  const morph = duplicate.knownMorphs[0];
  const image = makeImageReference('morph', morph, duplicate);

  assert.notEqual(duplicate.id, saved.id);
  assert.equal(duplicate.name, 'Source World Copy');
  assert.equal(image.kind, 'morph');
  assert.equal(image.subjectId, morph.id);
  assert.ok(image.prompt.includes(morph.name));

  const worlds = await listWorlds();
  assert.ok(worlds.some(world => world.id === duplicate.id));
});
