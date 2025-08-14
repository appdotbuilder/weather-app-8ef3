import { db } from '../db';
import { weatherDataTable, citiesTable } from '../db/schema';
import { type CreateWeatherDataInput, type WeatherData } from '../schema';
import { eq } from 'drizzle-orm';

export const createWeatherData = async (input: CreateWeatherDataInput): Promise<WeatherData> => {
  try {
    // Validate that the city exists to prevent foreign key constraint violations
    const cityExists = await db.select()
      .from(citiesTable)
      .where(eq(citiesTable.id, input.city_id))
      .limit(1)
      .execute();

    if (cityExists.length === 0) {
      throw new Error(`City with ID ${input.city_id} does not exist`);
    }

    // Insert weather data record
    const result = await db.insert(weatherDataTable)
      .values({
        city_id: input.city_id,
        temperature: input.temperature.toString(), // Convert number to string for numeric column
        humidity: input.humidity, // Integer column - no conversion needed
        pressure: input.pressure.toString(), // Convert number to string for numeric column
        wind_speed: input.wind_speed.toString(), // Convert number to string for numeric column
        wind_direction: input.wind_direction, // Integer column - no conversion needed
        condition: input.condition,
        visibility: input.visibility.toString(), // Convert number to string for numeric column
        recorded_at: input.recorded_at
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const weatherData = result[0];
    return {
      ...weatherData,
      temperature: parseFloat(weatherData.temperature), // Convert string back to number
      pressure: parseFloat(weatherData.pressure), // Convert string back to number
      wind_speed: parseFloat(weatherData.wind_speed), // Convert string back to number
      visibility: parseFloat(weatherData.visibility) // Convert string back to number
    };
  } catch (error) {
    console.error('Weather data creation failed:', error);
    throw error;
  }
};