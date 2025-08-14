import { db } from '../db';
import { citiesTable } from '../db/schema';
import { type CreateCityInput, type City } from '../schema';
import { eq, and } from 'drizzle-orm';

export const createCity = async (input: CreateCityInput): Promise<City> => {
  try {
    // Check if city already exists with same name and country
    const existingCity = await db.select()
      .from(citiesTable)
      .where(
        and(
          eq(citiesTable.name, input.name),
          eq(citiesTable.country, input.country)
        )
      )
      .limit(1)
      .execute();

    if (existingCity.length > 0) {
      throw new Error(`City ${input.name}, ${input.country} already exists`);
    }

    // Insert city record
    const result = await db.insert(citiesTable)
      .values({
        name: input.name,
        country: input.country,
        latitude: input.latitude.toString(), // Convert number to string for numeric column
        longitude: input.longitude.toString() // Convert number to string for numeric column
      })
      .returning()
      .execute();

    // Convert numeric fields back to numbers before returning
    const city = result[0];
    return {
      ...city,
      latitude: parseFloat(city.latitude), // Convert string back to number
      longitude: parseFloat(city.longitude) // Convert string back to number
    };
  } catch (error) {
    console.error('City creation failed:', error);
    throw error;
  }
};