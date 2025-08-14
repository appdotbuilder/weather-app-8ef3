import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { citiesTable } from '../db/schema';
import { type CreateCityInput } from '../schema';
import { getAllCities } from '../handlers/get_all_cities';

// Test data for cities
const testCities = [
  {
    name: 'Tokyo',
    country: 'Japan',
    latitude: 35.6762,
    longitude: 139.6503
  },
  {
    name: 'London',
    country: 'United Kingdom',
    latitude: 51.5074,
    longitude: -0.1278
  },
  {
    name: 'Berlin',
    country: 'Germany',
    latitude: 52.5200,
    longitude: 13.4050
  }
] as CreateCityInput[];

describe('getAllCities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no cities exist', async () => {
    const result = await getAllCities();
    expect(result).toEqual([]);
  });

  it('should return all cities ordered by name', async () => {
    // Insert test cities
    await db.insert(citiesTable)
      .values(testCities.map(city => ({
        name: city.name,
        country: city.country,
        latitude: city.latitude.toString(),
        longitude: city.longitude.toString()
      })))
      .execute();

    const result = await getAllCities();

    expect(result).toHaveLength(3);
    
    // Verify ordering by name (alphabetical)
    expect(result[0].name).toBe('Berlin');
    expect(result[1].name).toBe('London');
    expect(result[2].name).toBe('Tokyo');

    // Verify data types and content
    result.forEach((city, index) => {
      expect(city.id).toBeDefined();
      expect(typeof city.id).toBe('number');
      expect(typeof city.name).toBe('string');
      expect(typeof city.country).toBe('string');
      expect(typeof city.latitude).toBe('number');
      expect(typeof city.longitude).toBe('number');
      expect(city.created_at).toBeInstanceOf(Date);
    });

    // Verify specific city data
    const berlin = result.find(city => city.name === 'Berlin');
    expect(berlin).toBeDefined();
    expect(berlin!.country).toBe('Germany');
    expect(berlin!.latitude).toBe(52.5200);
    expect(berlin!.longitude).toBe(13.4050);
  });

  it('should handle numeric field conversions correctly', async () => {
    // Insert a city with specific coordinates
    await db.insert(citiesTable)
      .values({
        name: 'Test City',
        country: 'Test Country',
        latitude: '40.7128000',
        longitude: '-74.0060000'
      })
      .execute();

    const result = await getAllCities();

    expect(result).toHaveLength(1);
    const city = result[0];
    
    // Verify numeric conversions
    expect(typeof city.latitude).toBe('number');
    expect(typeof city.longitude).toBe('number');
    expect(city.latitude).toBe(40.7128);
    expect(city.longitude).toBe(-74.0060);
  });

  it('should handle cities with same name but different countries', async () => {
    // Insert cities with same names in different countries
    const duplicateNameCities = [
      { name: 'Paris', country: 'France', latitude: '48.8566', longitude: '2.3522' },
      { name: 'Paris', country: 'United States', latitude: '33.6617', longitude: '-95.5555' }
    ];

    await db.insert(citiesTable)
      .values(duplicateNameCities)
      .execute();

    const result = await getAllCities();

    expect(result).toHaveLength(2);
    
    // Both should be returned and ordered by name (both will have same name)
    expect(result[0].name).toBe('Paris');
    expect(result[1].name).toBe('Paris');
    
    // Should have different countries
    const countries = result.map(city => city.country).sort();
    expect(countries).toEqual(['France', 'United States']);
  });

  it('should maintain database consistency after retrieval', async () => {
    // Insert a city
    const insertResult = await db.insert(citiesTable)
      .values({
        name: 'Sydney',
        country: 'Australia',
        latitude: '-33.8688',
        longitude: '151.2093'
      })
      .returning()
      .execute();

    const result = await getAllCities();

    expect(result).toHaveLength(1);
    const retrievedCity = result[0];
    const insertedCity = insertResult[0];

    // Verify IDs match
    expect(retrievedCity.id).toBe(insertedCity.id);
    expect(retrievedCity.name).toBe(insertedCity.name);
    expect(retrievedCity.country).toBe(insertedCity.country);
    
    // Verify coordinates match after numeric conversion
    expect(retrievedCity.latitude).toBe(parseFloat(insertedCity.latitude));
    expect(retrievedCity.longitude).toBe(parseFloat(insertedCity.longitude));
    
    // Verify timestamps match
    expect(retrievedCity.created_at).toEqual(insertedCity.created_at);
  });
});