import fs from "fs";
import path from "path";

interface CacheItem<T> {
  value: T;
  expiresAt: number; // timestamp in ms
}

export class CacheService {
  private static cacheFilePath = path.join(process.cwd(), ".cache", "music-api-cache.json");
  private static inMemoryStore = new Map<string, CacheItem<any>>();
  private static isInitialized = false;

  private static ensureInitialized() {
    if (this.isInitialized) return;

    try {
      const cacheDir = path.dirname(this.cacheFilePath);
      if (!fs.existsSync(cacheDir)) {
        fs.mkdirSync(cacheDir, { recursive: true });
      }

      if (fs.existsSync(this.cacheFilePath)) {
        const fileContent = fs.readFileSync(this.cacheFilePath, "utf8");
        const parsed = JSON.parse(fileContent);
        
        // Load into memory
        Object.entries(parsed).forEach(([key, value]) => {
          const item = value as CacheItem<any>;
          if (item.expiresAt > Date.now()) {
            this.inMemoryStore.set(key, item);
          }
        });
      }
    } catch (error) {
      console.warn("Failed to initialize persistent cache file, falling back to in-memory only:", error);
    }
    
    this.isInitialized = true;
  }

  private static saveToFile() {
    try {
      const data: Record<string, CacheItem<any>> = {};
      const now = Date.now();
      
      this.inMemoryStore.forEach((item, key) => {
        if (item.expiresAt > now) {
          data[key] = item;
        }
      });

      fs.writeFileSync(this.cacheFilePath, JSON.stringify(data, null, 2), "utf8");
    } catch (error) {
      console.warn("Failed to write cache to file:", error);
    }
  }

  public static async get<T>(key: string): Promise<T | null> {
    this.ensureInitialized();
    const item = this.inMemoryStore.get(key);

    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.inMemoryStore.delete(key);
      this.saveToFile();
      return null;
    }

    return item.value as T;
  }

  public static async set<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
    this.ensureInitialized();
    const expiresAt = Date.now() + ttlSeconds * 1000;
    this.inMemoryStore.set(key, { value, expiresAt });
    this.saveToFile();
  }

  public static async clear(): Promise<void> {
    this.inMemoryStore.clear();
    try {
      if (fs.existsSync(this.cacheFilePath)) {
        fs.unlinkSync(this.cacheFilePath);
      }
    } catch (error) {
      console.warn("Failed to delete cache file:", error);
    }
  }
}
