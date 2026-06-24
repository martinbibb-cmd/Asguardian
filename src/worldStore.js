import { createInitialState } from './gameState.js';

const DB_NAME = 'asguardian_worlds';
const DB_VERSION = 1;
const STORE_NAME = 'worlds';
const ACTIVE_WORLD_KEY = 'active_world';

const memoryStore = new Map();
let memoryActiveWorldId = null;

const nowIso = () => new Date().toISOString();
const createId = (prefix = 'world') => `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

const canUseIndexedDb = () => typeof indexedDB !== 'undefined';

const openDb = () => new Promise((resolve, reject) => {
  if (!canUseIndexedDb()) {
    resolve(null);
    return;
  }

  const request = indexedDB.open(DB_NAME, DB_VERSION);
  request.onupgradeneeded = () => {
    const db = request.result;
    if (!db.objectStoreNames.contains(STORE_NAME)) {
      const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      store.createIndex('updatedAt', 'updatedAt');
    }
    if (!db.objectStoreNames.contains(ACTIVE_WORLD_KEY)) {
      db.createObjectStore(ACTIVE_WORLD_KEY, { keyPath: 'key' });
    }
  };
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const withStore = async (storeName, mode, action) => {
  const db = await openDb();
  if (!db) return action(null);

  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, mode);
    const store = tx.objectStore(storeName);
    const result = action(store);
    tx.oncomplete = () => resolve(result?.result ?? result);
    tx.onerror = () => reject(tx.error);
  });
};

const requestToPromise = (request) => new Promise((resolve, reject) => {
  request.onsuccess = () => resolve(request.result);
  request.onerror = () => reject(request.error);
});

const seededName = () => `World ${Math.floor(1000 + Math.random() * 9000)}`;

export const generatePlanetSeed = () => ({
  id: createId('planet'),
  name: seededName(),
  starClass: ['cold dwarf', 'ashen binary', 'blue-white remnant'][Math.floor(Math.random() * 3)],
  climate: ['frozen nights', 'glass deserts', 'acid mist', 'thin twilight'][Math.floor(Math.random() * 4)],
  mineralBias: Math.floor(30 + Math.random() * 60),
  organicBias: Math.floor(10 + Math.random() * 45),
});

export const createInitialWorld = (overrides = {}) => {
  const planetSeed = overrides.planetSeed || generatePlanetSeed();
  const createdAt = nowIso();
  return {
    id: overrides.id || createId('world'),
    name: overrides.name || planetSeed.name,
    createdAt,
    updatedAt: createdAt,
    planetSeed,
    environmentState: overrides.environmentState || createInitialState(),
    hiveGenome: overrides.hiveGenome || {
      lineage: 'Seed Intelligence',
      playstyle: 'conservative',
      traits: ['modular cognition', 'thermal caution', 'subsurface digestion'],
      mutationPressure: 0,
    },
    knownMorphs: overrides.knownMorphs || [
      {
        id: createId('morph'),
        name: 'Worker Mycelium',
        role: 'producer',
        traits: ['mineral digestion', 'slow replication'],
        diet: 'trace organics and pulverized silicates',
        output: 'biomass slurry, structural fibers',
        weaknesses: ['thermal shock', 'radiation blooms'],
        evolutionaryHistory: ['Seeded as the first support morph.'],
        image: null,
      },
      {
        id: createId('morph'),
        name: 'Sensor Grazer',
        role: 'consumer',
        traits: ['wide-spectrum sensing', 'cold-night migration'],
        diet: 'biomass slurry and static discharge',
        output: 'terrain data, pressure warnings',
        weaknesses: ['mineral starvation', 'magnetic storms'],
        evolutionaryHistory: ['Evolved to scout beyond the hive perimeter.'],
        image: null,
      },
    ],
    discoveredAdaptations: overrides.discoveredAdaptations || [],
    archiveLogs: overrides.archiveLogs || [],
    generatedImages: overrides.generatedImages || {},
    generationCount: overrides.generationCount || 0,
    mapState: overrides.mapState || null,
    systemLog: overrides.systemLog || [],
  };
};

export const buildWorldSnapshot = (world, updates = {}) => ({
  ...world,
  ...updates,
  updatedAt: nowIso(),
});

export const generateImagePrompt = (kind, subject, world) => {
  const planet = world?.planetSeed || {};
  const base = 'dark alien science illustration, cinematic strategy game asset, readable silhouette, no text';
  if (kind === 'planet') {
    return `${base}, planet view of ${planet.name || 'a dead world'}, ${planet.climate || 'thin atmosphere'}, ${planet.starClass || 'cold star'}, visible hive territory overlays and environmental stress scars`;
  }
  if (kind === 'morph') {
    return `${base}, creature study of ${subject?.name || 'unknown morph'}, role ${subject?.role || 'hive organism'}, traits ${(subject?.traits || []).join(', ')}, diet ${subject?.diet || 'unknown'}, isolated on dark biolab background`;
  }
  if (kind === 'ecosystem') {
    return `${base}, ecosystem scene on ${planet.name || 'an alien planet'}, hive morphs exchanging nutrients, visible producer and consumer flow, ${planet.climate || 'hostile biome'}`;
  }
  return `${base}, evolutionary timeline thumbnail, pressure response adaptation on ${planet.name || 'alien world'}`;
};

export const makeImageReference = (kind, subject, world) => ({
  id: createId('image'),
  kind,
  subjectId: subject?.id || 'planet',
  prompt: generateImagePrompt(kind, subject, world),
  url: null,
  generatedAt: nowIso(),
});

export const saveWorld = async (world) => {
  const next = { ...world, updatedAt: nowIso() };
  if (!canUseIndexedDb()) {
    memoryStore.set(next.id, next);
    return next;
  }

  await withStore(STORE_NAME, 'readwrite', store => store.put(next));
  return next;
};

export const listWorlds = async () => {
  if (!canUseIndexedDb()) return Array.from(memoryStore.values()).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const request = store.getAll();
    request.onsuccess = () => resolve((request.result || []).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)));
    request.onerror = () => reject(request.error);
  });
};

export const getWorld = async (id) => {
  if (!id) return null;
  if (!canUseIndexedDb()) return memoryStore.get(id) || null;
  return withStore(STORE_NAME, 'readonly', store => store.get(id));
};

export const deleteWorld = async (id) => {
  if (!canUseIndexedDb()) {
    memoryStore.delete(id);
    if (memoryActiveWorldId === id) memoryActiveWorldId = null;
    return true;
  }
  await withStore(STORE_NAME, 'readwrite', store => store.delete(id));
  const activeId = await getActiveWorldId();
  if (activeId === id) await setActiveWorldId(null);
  return true;
};

export const duplicateWorld = async (world) => {
  const copy = {
    ...world,
    id: createId('world'),
    name: `${world.name} Copy`,
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  return saveWorld(copy);
};

export const importWorldJson = async (jsonText) => {
  const parsed = typeof jsonText === 'string' ? JSON.parse(jsonText) : jsonText;
  const imported = buildWorldSnapshot(createInitialWorld(parsed), {
    ...parsed,
    id: parsed.id || createId('world'),
    name: parsed.name || parsed.planetSeed?.name || seededName(),
  });
  return saveWorld(imported);
};

export const exportWorldJson = (world) => JSON.stringify(world, null, 2);

export const setActiveWorldId = async (id) => {
  if (!canUseIndexedDb()) {
    memoryActiveWorldId = id;
    return id;
  }
  await withStore(ACTIVE_WORLD_KEY, 'readwrite', store => store.put({ key: 'active', id }));
  return id;
};

export const getActiveWorldId = async () => {
  if (!canUseIndexedDb()) return memoryActiveWorldId;
  const db = await openDb();
  const tx = db.transaction(ACTIVE_WORLD_KEY, 'readonly');
  const store = tx.objectStore(ACTIVE_WORLD_KEY);
  const value = await requestToPromise(store.get('active'));
  return value?.id || null;
};

export const ensureWorldImages = (world) => {
  const generatedImages = { ...(world.generatedImages || {}) };
  if (!generatedImages.planet) generatedImages.planet = makeImageReference('planet', null, world);
  world.knownMorphs.forEach(morph => {
    if (!generatedImages[morph.id]) generatedImages[morph.id] = makeImageReference('morph', morph, world);
  });
  return {
    ...world,
    generatedImages,
    generationCount: Object.keys(generatedImages).length,
  };
};
