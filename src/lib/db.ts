import { getDB } from './sqlite';

let isInitialized = false;

export async function connectDB() {
  if (!isInitialized) {
    getDB();
    isInitialized = true;
    console.log('⚡ [SQLite] WAL mode initialized (Zero MongoDB dependencies)');
  }
  return getDB();
}

export default connectDB;
