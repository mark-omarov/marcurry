import { config } from '@/lib/config';
import { StorageAdapter } from '../adapters/StorageAdapter';
import InMemoryAdapter from '../adapters/InMemoryAdapter';

let adapterInstance: StorageAdapter | null = null;

export function initializeAdapter(): StorageAdapter {
  if (adapterInstance) {
    return adapterInstance;
  }

  const adapterType = config.DATABASE_ADAPTER;
  console.log(`Initializing database adapter: ${adapterType}`);

  switch (adapterType) {
    case 'in-memory':
      adapterInstance = new InMemoryAdapter();
      break;

    default:
      console.warn(`Unknown DATABASE_ADAPTER: "${adapterType}". Defaulting to in-memory.`);
      adapterInstance = new InMemoryAdapter();
      break;
  }

  return adapterInstance;
}
