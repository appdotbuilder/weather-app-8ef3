import { db } from '../db';
import { weatherDataTable } from '../db/schema';
import { type GetWeatherByCityIdInput, type WeatherData } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getWeatherHistory = async (input: GetWeatherByCityIdInput): Promise<WeatherData[]> => {
  try {
    // Fetch weather history for the specified city, ordered by recorded_at (most recent first)
    const results = await db.select()
      .from(weatherDataTable)
      .where(eq(weatherDataTable.city_id, input.city_id))
      .orderBy(desc(weatherDataTable.recorded_at))
      .execute();

    // Convert numeric fields back to numbers before returning
    return results.map(record => ({
      ...record,
      temperature: parseFloat(record.temperature),
      pressure: parseFloat(record.pressure),
      wind_speed: parseFloat(record.wind_speed),
      visibility: parseFloat(record.visibility)
    }));
  } catch (error) {
    console.error('Weather history fetch failed:', error);
    throw error;
  }
};