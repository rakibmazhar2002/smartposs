export interface OfflineMutation {
  id: string;
  method: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  body: string | null;
  createdAt: string;
}

const QUEUE_KEY = 'smartpos.offline.mutations';

function readQueue(): OfflineMutation[] {
  try {
    const raw = window.localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) as OfflineMutation[] : [];
  } catch {
    return [];
  }
}

function writeQueue(queue: OfflineMutation[]): void {
  window.localStorage.setItem(QUEUE_KEY, JSON.stringify(queue.slice(-100)));
}

export const offlineStore = {
  list(): OfflineMutation[] {
    return readQueue();
  },
  enqueue(mutation: Omit<OfflineMutation, 'id' | 'createdAt'>): OfflineMutation {
    const item: OfflineMutation = { ...mutation, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
    writeQueue([...readQueue(), item]);
    return item;
  },
  remove(id: string): void {
    writeQueue(readQueue().filter((mutation) => mutation.id !== id));
  },
  clear(): void {
    window.localStorage.removeItem(QUEUE_KEY);
  },
};
