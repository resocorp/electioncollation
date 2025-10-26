/**
 * IndexedDB utilities for caching polling units and results
 * Provides fast offline access and reduces server load
 */

import { openDB, DBSchema, IDBPDatabase } from 'idb';

interface ElectoralDB extends DBSchema {
  'polling-units': {
    key: string;
    value: {
      data: any[];
      timestamp: number;
      version: number;
    };
  };
  'results': {
    key: string;
    value: {
      data: any[];
      timestamp: number;
    };
  };
}

const DB_NAME = 'electoral-map-cache';
const DB_VERSION = 1;
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour

let dbInstance: IDBPDatabase<ElectoralDB> | null = null;

/**
 * Initialize and get database instance
 */
async function getDB(): Promise<IDBPDatabase<ElectoralDB>> {
  if (dbInstance) return dbInstance;

  dbInstance = await openDB<ElectoralDB>(DB_NAME, DB_VERSION, {
    upgrade(db) {
      // Create object stores if they don't exist
      if (!db.objectStoreNames.contains('polling-units')) {
        db.createObjectStore('polling-units');
      }
      if (!db.objectStoreNames.contains('results')) {
        db.createObjectStore('results');
      }
    },
  });

  return dbInstance;
}

/**
 * Save polling units to cache
 */
export async function cachePollingUnits(data: any[], version: number = 1): Promise<void> {
  try {
    const db = await getDB();
    await db.put('polling-units', {
      data,
      timestamp: Date.now(),
      version,
    }, 'all');
  } catch (error) {
    console.error('Failed to cache polling units:', error);
  }
}

/**
 * Get cached polling units
 */
export async function getCachedPollingUnits(): Promise<any[] | null> {
  try {
    const db = await getDB();
    const cached = await db.get('polling-units', 'all');
    
    if (!cached) return null;
    
    // Check if cache is still fresh
    const age = Date.now() - cached.timestamp;
    if (age > CACHE_DURATION) {
      return null; // Cache expired
    }
    
    return cached.data;
  } catch (error) {
    console.error('Failed to get cached polling units:', error);
    return null;
  }
}

/**
 * Save results to cache
 */
export async function cacheResults(data: any[]): Promise<void> {
  try {
    const db = await getDB();
    await db.put('results', {
      data,
      timestamp: Date.now(),
    }, 'current');
  } catch (error) {
    console.error('Failed to cache results:', error);
  }
}

/**
 * Get cached results
 */
export async function getCachedResults(): Promise<any[] | null> {
  try {
    const db = await getDB();
    const cached = await db.get('results', 'current');
    
    if (!cached) return null;
    
    return cached.data;
  } catch (error) {
    console.error('Failed to get cached results:', error);
    return null;
  }
}

/**
 * Clear all cache
 */
export async function clearCache(): Promise<void> {
  try {
    const db = await getDB();
    await db.clear('polling-units');
    await db.clear('results');
  } catch (error) {
    console.error('Failed to clear cache:', error);
  }
}

/**
 * Check if cache exists and is fresh
 */
export async function isCacheFresh(): Promise<boolean> {
  try {
    const db = await getDB();
    const cached = await db.get('polling-units', 'all');
    
    if (!cached) return false;
    
    const age = Date.now() - cached.timestamp;
    return age <= CACHE_DURATION;
  } catch (error) {
    return false;
  }
}
