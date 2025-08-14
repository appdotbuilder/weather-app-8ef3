import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { citiesTable } from '../db/schema';
import { type CreateCityInput } from '../schema';
import { createCity } from '../handlers/create_city';
import { eq, and } from 'drizzle-orm';

// Test input with valid coordinates
const testInput: CreateCityInput = {
  name: 'Test City',
  country: 'Test Country',
  latitude: 40.7128,
  longitude: -74.0060
};

describe('createCity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a city with valid input', async () => {
    const result = await createCity(testInput);

    // Basic field validation
    expect(result.name).toEqual('Test City');
    expect(result.country).toEqual('Test Country');
    expect(result.latitude).toEqual(40.7128);
    expect(result.longitude).toEqual(-74.0060);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);

    // Ensure numeric fields are actually numbers
    expect(typeof result.latitude).toBe('number');
    expect(typeof result.longitude).toBe('number');
  });

  it('should save city to database correctly', async () => {
    const result = await createCity(testInput);

    // Query database to verify the city was saved
    const cities = await db.select()
      .from(citiesTable)
      .where(eq(citiesTable.id, result.id))
      .execute();

    expect(cities).toHaveLength(1);
    expect(cities[0].name).toEqual('Test City');
    expect(cities[0].country).toEqual('Test Country');
    expect(parseFloat(cities[0].latitude)).toEqual(40.7128);
    expect(parseFloat(cities[0].longitude)).toEqual(-74.0060);
    expect(cities[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle extreme coordinate values correctly', async () => {
    const extremeInput: CreateCityInput = {
      name: 'North Pole',
      country: 'Arctic',
      latitude: 90, // Maximum latitude
      longitude: 180 // Maximum longitude
    };

    const result = await createCity(extremeInput);

    expect(result.latitude).toEqual(90);
    expect(result.longitude).toEqual(180);
    expect(typeof result.latitude).toBe('number');
    expect(typeof result.longitude).toBe('number');
  });

  it('should handle negative coordinates correctly', async () => {
    const negativeInput: CreateCityInput = {
      name: 'South City',
      country: 'Southern Hemisphere',
      latitude: -33.8688, // Sydney latitude
      longitude: -151.2093 // Sydney longitude (adjusted to negative)
    };

    const result = await createCity(negativeInput);

    expect(result.latitude).toEqual(-33.8688);
    expect(result.longitude).toEqual(-151.2093);
    expect(typeof result.latitude).toBe('number');
    expect(typeof result.longitude).toBe('number');
  });

  it('should prevent duplicate cities with same name and country', async () => {
    // Create the first city
    await createCity(testInput);

    // Attempt to create duplicate city
    await expect(createCity(testInput))
      .rejects.toThrow(/already exists/i);
  });

  it('should allow cities with same name but different countries', async () => {
    // Create first city
    const city1 = await createCity(testInput);

    // Create city with same name but different country
    const differentCountryInput: CreateCityInput = {
      name: 'Test City', // Same name
      country: 'Different Country', // Different country
      latitude: 51.5074,
      longitude: -0.1278
    };

    const city2 = await createCity(differentCountryInput);

    expect(city1.name).toEqual(city2.name);
    expect(city1.country).not.toEqual(city2.country);
    expect(city1.id).not.toEqual(city2.id);
  });

  it('should handle precision in coordinates correctly', async () => {
    const preciseInput: CreateCityInput = {
      name: 'Precise Location',
      country: 'Precision Country',
      latitude: 40.7589123, // High precision
      longitude: -73.9851456 // High precision
    };

    const result = await createCity(preciseInput);

    expect(result.latitude).toBeCloseTo(40.7589123, 7);
    expect(result.longitude).toBeCloseTo(-73.9851456, 7);
  });

  it('should query cities correctly after creation', async () => {
    // Create multiple cities
    await createCity(testInput);

    const secondInput: CreateCityInput = {
      name: 'Second City',
      country: 'Second Country',
      latitude: 51.5074,
      longitude: -0.1278
    };
    await createCity(secondInput);

    // Query all cities
    const allCities = await db.select()
      .from(citiesTable)
      .execute();

    expect(allCities).toHaveLength(2);
    
    // Verify both cities exist with correct data
    const testCity = allCities.find(city => city.name === 'Test City');
    const secondCity = allCities.find(city => city.name === 'Second City');

    expect(testCity).toBeDefined();
    expect(secondCity).toBeDefined();
    expect(parseFloat(testCity!.latitude)).toEqual(40.7128);
    expect(parseFloat(secondCity!.latitude)).toEqual(51.5074);
  });

  it('should query cities by country correctly', async () => {
    // Create cities in different countries
    await createCity(testInput);

    const ukInput: CreateCityInput = {
      name: 'London',
      country: 'United Kingdom',
      latitude: 51.5074,
      longitude: -0.1278
    };
    await createCity(ukInput);

    const anotherUkInput: CreateCityInput = {
      name: 'Manchester',
      country: 'United Kingdom',
      latitude: 53.4808,
      longitude: -2.2426
    };
    await createCity(anotherUkInput);

    // Query cities from UK
    const ukCities = await db.select()
      .from(citiesTable)
      .where(eq(citiesTable.country, 'United Kingdom'))
      .execute();

    expect(ukCities).toHaveLength(2);
    expect(ukCities.every(city => city.country === 'United Kingdom')).toBe(true);

    const cityNames = ukCities.map(city => city.name).sort();
    expect(cityNames).toEqual(['London', 'Manchester']);
  });
});