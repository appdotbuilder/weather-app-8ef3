import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weatherDataTable, citiesTable } from '../db/schema';
import { type CreateWeatherDataInput } from '../schema';
import { createWeatherData } from '../handlers/create_weather_data';
import { eq } from 'drizzle-orm';

// Test city data
const testCity = {
  name: 'Test City',
  country: 'Test Country',
  latitude: '40.7128',
  longitude: '-74.0060'
};

// Complete test input with all required fields
const testInput: CreateWeatherDataInput = {
  city_id: 1, // Will be set after creating test city
  temperature: 25.5,
  humidity: 65,
  pressure: 1013.25,
  wind_speed: 15.3,
  wind_direction: 180,
  condition: 'partly_cloudy',
  visibility: 10.0,
  recorded_at: new Date('2024-01-15T12:00:00Z')
};

describe('createWeatherData', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  let cityId: number;

  beforeEach(async () => {
    // Create a test city for weather data
    const cityResult = await db.insert(citiesTable)
      .values(testCity)
      .returning()
      .execute();
    cityId = cityResult[0].id;
    
    // Update test input with the actual city ID
    testInput.city_id = cityId;
  });

  it('should create weather data', async () => {
    const result = await createWeatherData(testInput);

    // Basic field validation
    expect(result.city_id).toEqual(cityId);
    expect(result.temperature).toEqual(25.5);
    expect(typeof result.temperature).toBe('number'); // Verify numeric conversion
    expect(result.humidity).toEqual(65);
    expect(result.pressure).toEqual(1013.25);
    expect(typeof result.pressure).toBe('number'); // Verify numeric conversion
    expect(result.wind_speed).toEqual(15.3);
    expect(typeof result.wind_speed).toBe('number'); // Verify numeric conversion
    expect(result.wind_direction).toEqual(180);
    expect(result.condition).toEqual('partly_cloudy');
    expect(result.visibility).toEqual(10.0);
    expect(typeof result.visibility).toBe('number'); // Verify numeric conversion
    expect(result.recorded_at).toEqual(testInput.recorded_at);
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save weather data to database', async () => {
    const result = await createWeatherData(testInput);

    // Query database to verify data was saved correctly
    const weatherData = await db.select()
      .from(weatherDataTable)
      .where(eq(weatherDataTable.id, result.id))
      .execute();

    expect(weatherData).toHaveLength(1);
    const savedData = weatherData[0];
    
    expect(savedData.city_id).toEqual(cityId);
    expect(parseFloat(savedData.temperature)).toEqual(25.5); // Verify stored as string, parsed as number
    expect(savedData.humidity).toEqual(65);
    expect(parseFloat(savedData.pressure)).toEqual(1013.25);
    expect(parseFloat(savedData.wind_speed)).toEqual(15.3);
    expect(savedData.wind_direction).toEqual(180);
    expect(savedData.condition).toEqual('partly_cloudy');
    expect(parseFloat(savedData.visibility)).toEqual(10.0);
    expect(savedData.recorded_at).toEqual(testInput.recorded_at);
    expect(savedData.created_at).toBeInstanceOf(Date);
  });

  it('should handle extreme weather values', async () => {
    const extremeInput: CreateWeatherDataInput = {
      ...testInput,
      temperature: -40.5, // Extreme cold
      humidity: 100, // Maximum humidity
      pressure: 950.0, // Low pressure
      wind_speed: 120.7, // Hurricane-force winds
      wind_direction: 359, // Maximum wind direction
      condition: 'heavy_snow',
      visibility: 0.1, // Very low visibility
      recorded_at: new Date('2024-02-01T06:30:00Z')
    };

    const result = await createWeatherData(extremeInput);

    expect(result.temperature).toEqual(-40.5);
    expect(result.humidity).toEqual(100);
    expect(result.pressure).toEqual(950.0);
    expect(result.wind_speed).toEqual(120.7);
    expect(result.wind_direction).toEqual(359);
    expect(result.condition).toEqual('heavy_snow');
    expect(result.visibility).toEqual(0.1);
  });

  it('should handle zero and minimum values', async () => {
    const minimalInput: CreateWeatherDataInput = {
      ...testInput,
      temperature: 0.0,
      humidity: 0, // Minimum humidity
      pressure: 500.0, // Very low pressure
      wind_speed: 0.0, // No wind
      wind_direction: 0, // North
      condition: 'clear',
      visibility: 0.0, // Zero visibility
      recorded_at: new Date('2024-03-01T00:00:00Z')
    };

    const result = await createWeatherData(minimalInput);

    expect(result.temperature).toEqual(0.0);
    expect(result.humidity).toEqual(0);
    expect(result.pressure).toEqual(500.0);
    expect(result.wind_speed).toEqual(0.0);
    expect(result.wind_direction).toEqual(0);
    expect(result.condition).toEqual('clear');
    expect(result.visibility).toEqual(0.0);
  });

  it('should handle various weather conditions', async () => {
    const conditions = ['clear', 'cloudy', 'rain', 'snow', 'thunderstorm', 'fog', 'wind'] as const;
    
    for (let i = 0; i < conditions.length; i++) {
      const condition = conditions[i];
      const conditionInput: CreateWeatherDataInput = {
        ...testInput,
        condition,
        recorded_at: new Date(`2024-01-${String(i + 1).padStart(2, '0')}T12:00:00Z`) // Ensure valid dates 01-07
      };

      const result = await createWeatherData(conditionInput);
      expect(result.condition).toEqual(condition);
    }
  });

  it('should reject weather data for non-existent city', async () => {
    const invalidInput: CreateWeatherDataInput = {
      ...testInput,
      city_id: 99999 // Non-existent city ID
    };

    await expect(createWeatherData(invalidInput)).rejects.toThrow(/City with ID 99999 does not exist/i);
  });

  it('should handle high precision decimal values', async () => {
    const precisionInput: CreateWeatherDataInput = {
      ...testInput,
      temperature: 23.456,
      pressure: 1013.789,
      wind_speed: 12.345,
      visibility: 8.987
    };

    const result = await createWeatherData(precisionInput);

    // Verify precision is maintained (within PostgreSQL numeric precision limits)
    expect(result.temperature).toBeCloseTo(23.456, 2);
    expect(result.pressure).toBeCloseTo(1013.789, 2);
    expect(result.wind_speed).toBeCloseTo(12.345, 2);
    expect(result.visibility).toBeCloseTo(8.987, 2);
  });

  it('should create multiple weather data entries for same city', async () => {
    const firstInput: CreateWeatherDataInput = {
      ...testInput,
      temperature: 20.0,
      recorded_at: new Date('2024-01-15T08:00:00Z')
    };

    const secondInput: CreateWeatherDataInput = {
      ...testInput,
      temperature: 25.0,
      recorded_at: new Date('2024-01-15T14:00:00Z')
    };

    const first = await createWeatherData(firstInput);
    const second = await createWeatherData(secondInput);

    expect(first.id).not.toEqual(second.id);
    expect(first.temperature).toEqual(20.0);
    expect(second.temperature).toEqual(25.0);
    expect(first.city_id).toEqual(second.city_id);

    // Verify both entries exist in database
    const allWeatherData = await db.select()
      .from(weatherDataTable)
      .where(eq(weatherDataTable.city_id, cityId))
      .execute();

    expect(allWeatherData).toHaveLength(2);
  });
});