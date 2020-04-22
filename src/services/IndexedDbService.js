import { openDB } from 'idb';

const openPromise = openDB('PicsArt Web Action', 1, {
  upgrade(newDb) {
    newDb.createObjectStore('DataStore', { keyPath: 'key', autoIncrement: true });
  },
});

export async function addData(data) {
  const db = await openPromise;
  const tx = db.transaction('DataStore', 'readwrite');

  await tx.objectStore('DataStore').add({ ...data });
}

export async function getByKey(key) {
  const db = await openPromise;
  const tx = db.transaction('DataStore');
  const store = tx.objectStore('DataStore');

  const data = await store.get(key);

  return data;
}

export async function getAll() {
  const db = await openPromise;
  const tx = db.transaction('DataStore');
  const store = tx.objectStore('DataStore');

  const data = await store.getAll();

  return data;
}

export async function removeByKey(key) {
  const db = await openPromise;
  const tx = db.transaction('DataStore', 'readwrite');
  const store = tx.objectStore('DataStore');

  await store.delete(key);
}

export async function removeAll() {
  const db = await openPromise;
  const tx = db.transaction('DataStore', 'readwrite');
  const store = tx.objectStore('DataStore');

  await store.clear();
}
