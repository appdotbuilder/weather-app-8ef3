import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { citiesTable } from '../db/schema';
import { type SearchCityInput, type CreateCityInput } from '../schema';
import { searchCities } from '../handlers/search_cities';

// Helper function to create test cities
const createTestCity = async (cityData: CreateCityInput) => {
  const result = await db.insert(citiesTable)
    .values({
      name: cityData.name,
      country: cityData.country,
      latitude: cityData.latitude.toString(),
      longitude: cityData.longitude.toString()
    })
    .returning()
    .execute();

  return result[0];
};

describe('searchCities', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should find cities with exact name match', async () => {
    // Create test city
    await createTestCity({
      name: 'New York',
      country: 'USA',
      latitude: 40.7128,
      longitude: -74.0060
    });

    const input: SearchCityInput = {
      query: 'New York'
    };

    const results = await searchCities(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('New York');
    expect(results[0].country).toEqual('USA');
    expect(results[0].latitude).toEqual(40.7128);
    expect(results[0].longitude).toEqual(-74.0060);
    expect(results[0].id).toBeDefined();
    expect(results[0].created_at).toBeInstanceOf(Date);
    expect(typeof results[0].latitude).toBe('number');
    expect(typeof results[0].longitude).toBe('number');
  });

  it('should find cities with partial name match', async () => {
    // Create multiple test cities
    await createTestCity({
      name: 'New York',
      country: 'USA',
      latitude: 40.7128,
      longitude: -74.0060
    });

    await createTestCity({
      name: 'New Delhi',
      country: 'India',
      latitude: 28.6139,
      longitude: 77.2090
    });

    await createTestCity({
      name: 'London',
      country: 'UK',
      latitude: 51.5074,
      longitude: -0.1278
    });

    const input: SearchCityInput = {
      query: 'New'
    };

    const results = await searchCities(input);

    expect(results).toHaveLength(2);
    expect(results.map(city => city.name).sort()).toEqual(['New Delhi', 'New York']);
  });

  it('should perform case-insensitive search', async () => {
    await createTestCity({
      name: 'London',
      country: 'UK',
      latitude: 51.5074,
      longitude: -0.1278
    });

    const input: SearchCityInput = {
      query: 'london'
    };

    const results = await searchCities(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('London');
  });

  it('should handle uppercase query', async () => {
    await createTestCity({
      name: 'Paris',
      country: 'France',
      latitude: 48.8566,
      longitude: 2.3522
    });

    const input: SearchCityInput = {
      query: 'PARIS'
    };

    const results = await searchCities(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Paris');
  });

  it('should return empty array when no cities match', async () => {
    await createTestCity({
      name: 'Tokyo',
      country: 'Japan',
      latitude: 35.6762,
      longitude: 139.6503
    });

    const input: SearchCityInput = {
      query: 'NonExistentCity'
    };

    const results = await searchCities(input);

    expect(results).toHaveLength(0);
    expect(results).toEqual([]);
  });

  it('should return results ordered by name', async () => {
    // Create cities in non-alphabetical order
    await createTestCity({
      name: 'Zurich',
      country: 'Switzerland',
      latitude: 47.3769,
      longitude: 8.5417
    });

    await createTestCity({
      name: 'Berlin',
      country: 'Germany',
      latitude: 52.5200,
      longitude: 13.4050
    });

    await createTestCity({
      name: 'Amsterdam',
      country: 'Netherlands',
      latitude: 52.3676,
      longitude: 4.9041
    });

    const input: SearchCityInput = {
      query: '' // Empty query to match all cities with '%'
    };

    const results = await searchCities(input);

    expect(results).toHaveLength(3);
    expect(results.map(city => city.name)).toEqual(['Amsterdam', 'Berlin', 'Zurich']);
  });

  it('should handle special characters in search query', async () => {
    await createTestCity({
      name: 'São Paulo',
      country: 'Brazil',
      latitude: -23.5558,
      longitude: -46.6396
    });

    const input: SearchCityInput = {
      query: 'São'
    };

    const results = await searchCities(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('São Paulo');
  });

  it('should handle query with spaces', async () => {
    await createTestCity({
      name: 'Los Angeles',
      country: 'USA',
      latitude: 34.0522,
      longitude: -118.2437
    });

    const input: SearchCityInput = {
      query: 'Los Angel'
    };

    const results = await searchCities(input);

    expect(results).toHaveLength(1);
    expect(results[0].name).toEqual('Los Angeles');
  });

  it('should convert numeric coordinates correctly', async () => {
    await createTestCity({
      name: 'TestCity',
      country: 'TestCountry',
      latitude: 123.456789,
      longitude: -987.654321
    });

    const input: SearchCityInput = {
      query: 'TestCity'
    };

    const results = await searchCities(input);

    expect(results).toHaveLength(1);
    expect(results[0].latitude).toEqual(123.456789);
    expect(results[0].longitude).toEqual(-987.654321);
    expect(typeof results[0].latitude).toBe('number');
    expect(typeof results[0].longitude).toBe('number');
  });
});