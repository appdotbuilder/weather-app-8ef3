import { db } from '../db';
import { weatherDataTable } from '../db/schema';
import { type GetWeatherByCityIdInput, type WeatherData } from '../schema';
import { eq, desc } from 'drizzle-orm';

export const getWeatherByCity = async (input: GetWeatherByCityIdInput): Promise<WeatherData | null> => {
  try {
    // Query the most recent weather data for the specified city
    const result = await db.select()
      .from(weatherDataTable)
      .where(eq(weatherDataTable.city_id, input.city_id))
      .orderBy(desc(weatherDataTable.recorded_at))
      .limit(1)
      .execute();

    if (result.length === 0) {
      return null;
    }

    const weatherData = result[0];

    // Convert numeric fields back to numbers for the response
    return {
      ...weatherData,
      temperature: parseFloat(weatherData.temperature),
      pressure: parseFloat(weatherData.pressure),
      wind_speed: parseFloat(weatherData.wind_speed),
      visibility: parseFloat(weatherData.visibility)
    };
  } catch (error) {
    console.error('Failed to fetch weather data for city:', error);
    throw error;
  }
};