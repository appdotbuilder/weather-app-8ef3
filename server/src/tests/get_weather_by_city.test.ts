import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { citiesTable, weatherDataTable } from '../db/schema';
import { type GetWeatherByCityIdInput, type CreateCityInput } from '../schema';
import { getWeatherByCity } from '../handlers/get_weather_by_city';

// Test input
const testInput: GetWeatherByCityIdInput = {
  city_id: 1
};

const createTestCity = async (): Promise<number> => {
  const cityInput = {
    name: 'Test City',
    country: 'Test Country',
    latitude: 40.7128,
    longitude: -74.0060
  };

  const result = await db.insert(citiesTable)
    .values({
      name: cityInput.name,
      country: cityInput.country,
      latitude: cityInput.latitude.toString(),
      longitude: cityInput.longitude.toString()
    })
    .returning()
    .execute();

  return result[0].id;
};

const createTestWeatherData = async (cityId: number, recordedAt: Date) => {
  return await db.insert(weatherDataTable)
    .values({
      city_id: cityId,
      temperature: '22.5',
      humidity: 65,
      pressure: '1013.25',
      wind_speed: '15.2',
      wind_direction: 180,
      condition: 'partly_cloudy',
      visibility: '10.0',
      recorded_at: recordedAt
    })
    .returning()
    .execute();
};

describe('getWeatherByCity', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return the most recent weather data for a city', async () => {
    const cityId = await createTestCity();
    
    // Create multiple weather records with different timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Create older weather data first
    await createTestWeatherData(cityId, twoHoursAgo);
    await createTestWeatherData(cityId, oneHourAgo);
    
    // Create the most recent weather data
    const latestWeatherData = await createTestWeatherData(cityId, now);

    const result = await getWeatherByCity({ city_id: cityId });

    expect(result).not.toBeNull();
    expect(result!.id).toBe(latestWeatherData[0].id);
    expect(result!.city_id).toBe(cityId);
    expect(result!.temperature).toBe(22.5);
    expect(typeof result!.temperature).toBe('number');
    expect(result!.humidity).toBe(65);
    expect(result!.pressure).toBe(1013.25);
    expect(typeof result!.pressure).toBe('number');
    expect(result!.wind_speed).toBe(15.2);
    expect(typeof result!.wind_speed).toBe('number');
    expect(result!.wind_direction).toBe(180);
    expect(result!.condition).toBe('partly_cloudy');
    expect(result!.visibility).toBe(10.0);
    expect(typeof result!.visibility).toBe('number');
    expect(result!.recorded_at).toBeInstanceOf(Date);
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.recorded_at.getTime()).toBe(now.getTime());
  });

  it('should return null when no weather data exists for the city', async () => {
    const cityId = await createTestCity();
    
    const result = await getWeatherByCity({ city_id: cityId });

    expect(result).toBeNull();
  });

  it('should return null when city does not exist', async () => {
    const result = await getWeatherByCity({ city_id: 999 });

    expect(result).toBeNull();
  });

  it('should return the correct weather data when multiple cities have weather data', async () => {
    const cityId1 = await createTestCity();
    
    // Create second city
    const cityId2 = await db.insert(citiesTable)
      .values({
        name: 'Second City',
        country: 'Second Country',
        latitude: '51.5074',
        longitude: '-0.1278'
      })
      .returning()
      .execute()
      .then(result => result[0].id);

    const now = new Date();
    
    // Create weather data for both cities
    await createTestWeatherData(cityId1, now);
    const city2WeatherData = await db.insert(weatherDataTable)
      .values({
        city_id: cityId2,
        temperature: '18.3',
        humidity: 70,
        pressure: '1020.5',
        wind_speed: '8.5',
        wind_direction: 90,
        condition: 'cloudy',
        visibility: '12.5',
        recorded_at: now
      })
      .returning()
      .execute();

    // Get weather for city2
    const result = await getWeatherByCity({ city_id: cityId2 });

    expect(result).not.toBeNull();
    expect(result!.id).toBe(city2WeatherData[0].id);
    expect(result!.city_id).toBe(cityId2);
    expect(result!.temperature).toBe(18.3);
    expect(result!.condition).toBe('cloudy');
  });

  it('should handle numeric field conversions correctly', async () => {
    const cityId = await createTestCity();
    
    // Create weather data with specific numeric values
    await db.insert(weatherDataTable)
      .values({
        city_id: cityId,
        temperature: '25.75',
        humidity: 80,
        pressure: '1008.50',
        wind_speed: '22.25',
        wind_direction: 270,
        condition: 'rain',
        visibility: '5.25',
        recorded_at: new Date()
      })
      .execute();

    const result = await getWeatherByCity({ city_id: cityId });

    expect(result).not.toBeNull();
    expect(result!.temperature).toBe(25.75);
    expect(typeof result!.temperature).toBe('number');
    expect(result!.pressure).toBe(1008.50);
    expect(typeof result!.pressure).toBe('number');
    expect(result!.wind_speed).toBe(22.25);
    expect(typeof result!.wind_speed).toBe('number');
    expect(result!.visibility).toBe(5.25);
    expect(typeof result!.visibility).toBe('number');
    // Integer fields should remain as integers
    expect(result!.humidity).toBe(80);
    expect(typeof result!.humidity).toBe('number');
    expect(result!.wind_direction).toBe(270);
    expect(typeof result!.wind_direction).toBe('number');
  });
});