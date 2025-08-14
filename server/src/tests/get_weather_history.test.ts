import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { citiesTable, weatherDataTable } from '../db/schema';
import { type GetWeatherByCityIdInput, type CreateCityInput, type CreateWeatherDataInput } from '../schema';
import { getWeatherHistory } from '../handlers/get_weather_history';
import { eq } from 'drizzle-orm';

describe('getWeatherHistory', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Test city data
  const testCity: CreateCityInput = {
    name: 'Test City',
    country: 'Test Country',
    latitude: 40.7128,
    longitude: -74.0060
  };

  // Helper function to create a test city
  const createTestCity = async () => {
    const result = await db.insert(citiesTable)
      .values({
        name: testCity.name,
        country: testCity.country,
        latitude: testCity.latitude.toString(),
        longitude: testCity.longitude.toString()
      })
      .returning()
      .execute();
    
    return result[0];
  };

  // Helper function to create test weather data
  const createTestWeatherData = async (cityId: number, weatherData: Partial<CreateWeatherDataInput> & { recorded_at: Date }) => {
    const defaultData: CreateWeatherDataInput = {
      city_id: cityId,
      temperature: 20.5,
      humidity: 65,
      pressure: 1013.25,
      wind_speed: 15.2,
      wind_direction: 180,
      condition: 'clear',
      visibility: 10.0,
      recorded_at: new Date()
    };

    const finalData = { ...defaultData, ...weatherData };
    
    const result = await db.insert(weatherDataTable)
      .values({
        city_id: finalData.city_id,
        temperature: finalData.temperature.toString(),
        humidity: finalData.humidity,
        pressure: finalData.pressure.toString(),
        wind_speed: finalData.wind_speed.toString(),
        wind_direction: finalData.wind_direction,
        condition: finalData.condition,
        visibility: finalData.visibility.toString(),
        recorded_at: finalData.recorded_at
      })
      .returning()
      .execute();
    
    return result[0];
  };

  it('should return empty array for city with no weather data', async () => {
    const city = await createTestCity();
    const input: GetWeatherByCityIdInput = { city_id: city.id };

    const result = await getWeatherHistory(input);

    expect(result).toEqual([]);
  });

  it('should return weather history for a city', async () => {
    const city = await createTestCity();
    const now = new Date();
    
    // Create test weather data
    await createTestWeatherData(city.id, {
      temperature: 25.5,
      humidity: 70,
      condition: 'clear',
      recorded_at: now
    });

    const input: GetWeatherByCityIdInput = { city_id: city.id };
    const result = await getWeatherHistory(input);

    expect(result).toHaveLength(1);
    expect(result[0].city_id).toEqual(city.id);
    expect(result[0].temperature).toEqual(25.5);
    expect(typeof result[0].temperature).toBe('number');
    expect(result[0].humidity).toEqual(70);
    expect(result[0].condition).toEqual('clear');
    expect(result[0].recorded_at).toBeInstanceOf(Date);
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple weather records ordered by recorded_at (most recent first)', async () => {
    const city = await createTestCity();
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Create weather data in mixed order
    await createTestWeatherData(city.id, {
      temperature: 20.0,
      condition: 'cloudy',
      recorded_at: oneHourAgo
    });
    
    await createTestWeatherData(city.id, {
      temperature: 25.0,
      condition: 'clear',
      recorded_at: now
    });
    
    await createTestWeatherData(city.id, {
      temperature: 18.0,
      condition: 'rain',
      recorded_at: twoHoursAgo
    });

    const input: GetWeatherByCityIdInput = { city_id: city.id };
    const result = await getWeatherHistory(input);

    expect(result).toHaveLength(3);
    
    // Verify order: most recent first
    expect(result[0].temperature).toEqual(25.0); // now
    expect(result[0].condition).toEqual('clear');
    expect(result[1].temperature).toEqual(20.0); // one hour ago
    expect(result[1].condition).toEqual('cloudy');
    expect(result[2].temperature).toEqual(18.0); // two hours ago
    expect(result[2].condition).toEqual('rain');
    
    // Verify timestamps are in descending order
    expect(result[0].recorded_at >= result[1].recorded_at).toBe(true);
    expect(result[1].recorded_at >= result[2].recorded_at).toBe(true);
  });

  it('should convert all numeric fields correctly', async () => {
    const city = await createTestCity();
    
    await createTestWeatherData(city.id, {
      temperature: 22.75,
      pressure: 1015.50,
      wind_speed: 12.8,
      visibility: 8.5,
      recorded_at: new Date()
    });

    const input: GetWeatherByCityIdInput = { city_id: city.id };
    const result = await getWeatherHistory(input);

    expect(result).toHaveLength(1);
    
    // Verify all numeric fields are properly converted
    expect(typeof result[0].temperature).toBe('number');
    expect(typeof result[0].pressure).toBe('number');
    expect(typeof result[0].wind_speed).toBe('number');
    expect(typeof result[0].visibility).toBe('number');
    
    expect(result[0].temperature).toEqual(22.75);
    expect(result[0].pressure).toEqual(1015.50);
    expect(result[0].wind_speed).toEqual(12.8);
    expect(result[0].visibility).toEqual(8.5);
  });

  it('should only return weather data for the specified city', async () => {
    // Create two cities
    const city1 = await createTestCity();
    const city2 = await db.insert(citiesTable)
      .values({
        name: 'Other City',
        country: 'Other Country',
        latitude: '41.8781',
        longitude: '-87.6298'
      })
      .returning()
      .execute()
      .then(results => results[0]);

    // Create weather data for both cities
    await createTestWeatherData(city1.id, {
      temperature: 20.0,
      recorded_at: new Date()
    });
    
    await createTestWeatherData(city2.id, {
      temperature: 30.0,
      recorded_at: new Date()
    });

    // Query weather history for city1 only
    const input: GetWeatherByCityIdInput = { city_id: city1.id };
    const result = await getWeatherHistory(input);

    expect(result).toHaveLength(1);
    expect(result[0].city_id).toEqual(city1.id);
    expect(result[0].temperature).toEqual(20.0);
  });

  it('should save weather data to database correctly', async () => {
    const city = await createTestCity();
    const now = new Date();
    
    await createTestWeatherData(city.id, {
      temperature: 23.5,
      humidity: 75,
      pressure: 1012.0,
      wind_speed: 10.5,
      wind_direction: 90,
      condition: 'partly_cloudy',
      visibility: 12.0,
      recorded_at: now
    });

    // Verify data was saved correctly in database
    const dbRecords = await db.select()
      .from(weatherDataTable)
      .where(eq(weatherDataTable.city_id, city.id))
      .execute();

    expect(dbRecords).toHaveLength(1);
    expect(dbRecords[0].city_id).toEqual(city.id);
    expect(parseFloat(dbRecords[0].temperature)).toEqual(23.5);
    expect(dbRecords[0].humidity).toEqual(75);
    expect(parseFloat(dbRecords[0].pressure)).toEqual(1012.0);
    expect(parseFloat(dbRecords[0].wind_speed)).toEqual(10.5);
    expect(dbRecords[0].wind_direction).toEqual(90);
    expect(dbRecords[0].condition).toEqual('partly_cloudy');
    expect(parseFloat(dbRecords[0].visibility)).toEqual(12.0);
    expect(dbRecords[0].recorded_at).toBeInstanceOf(Date);
  });
});