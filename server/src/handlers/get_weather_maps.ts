import { db } from '../db';
import { weatherMapsTable } from '../db/schema';
import { type GetWeatherMapsInput, type WeatherMapData } from '../schema';
import { eq, and, desc, type SQL } from 'drizzle-orm';

export const getWeatherMaps = async (input: GetWeatherMapsInput): Promise<WeatherMapData[]> => {
  try {
    // Build conditions array for filters
    const conditions: SQL<unknown>[] = [];

    if (input.region) {
      conditions.push(eq(weatherMapsTable.region, input.region));
    }

    if (input.map_type) {
      conditions.push(eq(weatherMapsTable.map_type, input.map_type));
    }

    // Build query with all clauses at once to avoid type issues
    const results = conditions.length === 0 
      ? await db.select()
          .from(weatherMapsTable)
          .orderBy(desc(weatherMapsTable.timestamp))
          .execute()
      : await db.select()
          .from(weatherMapsTable)
          .where(conditions.length === 1 ? conditions[0] : and(...conditions))
          .orderBy(desc(weatherMapsTable.timestamp))
          .execute();

    // Return results (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Weather maps retrieval failed:', error);
    throw error;
  }
};