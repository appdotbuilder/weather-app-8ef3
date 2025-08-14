import { db } from '../db';
import { citiesTable } from '../db/schema';
import { type SearchCityInput, type City } from '../schema';
import { ilike } from 'drizzle-orm';

export const searchCities = async (input: SearchCityInput): Promise<City[]> => {
  try {
    // Perform case-insensitive search with partial matching on city name
    const results = await db.select()
      .from(citiesTable)
      .where(ilike(citiesTable.name, `%${input.query}%`))
      .orderBy(citiesTable.name)
      .execute();

    // Convert numeric fields back to numbers
    return results.map(city => ({
      ...city,
      latitude: parseFloat(city.latitude),
      longitude: parseFloat(city.longitude)
    }));
  } catch (error) {
    console.error('City search failed:', error);
    throw error;
  }
};