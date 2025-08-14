import { db } from '../db';
import { citiesTable } from '../db/schema';
import { type City } from '../schema';
import { asc } from 'drizzle-orm';

export const getAllCities = async (): Promise<City[]> => {
  try {
    const results = await db.select()
      .from(citiesTable)
      .orderBy(asc(citiesTable.name))
      .execute();

    // Convert numeric fields back to numbers
    return results.map(city => ({
      ...city,
      latitude: parseFloat(city.latitude),
      longitude: parseFloat(city.longitude)
    }));
  } catch (error) {
    console.error('Failed to get all cities:', error);
    throw error;
  }
};