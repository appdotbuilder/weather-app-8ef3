import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weatherAlertsTable, citiesTable } from '../db/schema';
import { type CreateWeatherAlertInput, type CreateCityInput } from '../schema';
import { createWeatherAlert } from '../handlers/create_weather_alert';
import { eq } from 'drizzle-orm';

// Helper function to create a test city
const createTestCity = async (): Promise<number> => {
  const cityInput: CreateCityInput = {
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

// Test input with all required fields
const createTestInput = (cityId: number): CreateWeatherAlertInput => ({
  city_id: cityId,
  type: 'extreme_heat',
  severity: 'high',
  title: 'Heat Wave Warning',
  description: 'Extremely high temperatures expected in the region',
  start_time: new Date('2024-07-15T10:00:00Z'),
  end_time: new Date('2024-07-17T18:00:00Z')
});

describe('createWeatherAlert', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create a weather alert', async () => {
    const cityId = await createTestCity();
    const testInput = createTestInput(cityId);

    const result = await createWeatherAlert(testInput);

    // Verify all fields are correctly set
    expect(result.id).toBeDefined();
    expect(result.city_id).toEqual(cityId);
    expect(result.type).toEqual('extreme_heat');
    expect(result.severity).toEqual('high');
    expect(result.title).toEqual('Heat Wave Warning');
    expect(result.description).toEqual('Extremely high temperatures expected in the region');
    expect(result.start_time).toEqual(testInput.start_time);
    expect(result.end_time).toEqual(testInput.end_time);
    expect(result.is_active).toBe(true);
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save weather alert to database', async () => {
    const cityId = await createTestCity();
    const testInput = createTestInput(cityId);

    const result = await createWeatherAlert(testInput);

    // Query database to verify alert was saved
    const alerts = await db.select()
      .from(weatherAlertsTable)
      .where(eq(weatherAlertsTable.id, result.id))
      .execute();

    expect(alerts).toHaveLength(1);
    const savedAlert = alerts[0];
    expect(savedAlert.city_id).toEqual(cityId);
    expect(savedAlert.type).toEqual('extreme_heat');
    expect(savedAlert.severity).toEqual('high');
    expect(savedAlert.title).toEqual('Heat Wave Warning');
    expect(savedAlert.description).toEqual('Extremely high temperatures expected in the region');
    expect(savedAlert.is_active).toBe(true);
    expect(savedAlert.created_at).toBeInstanceOf(Date);
  });

  it('should create alert with null end_time', async () => {
    const cityId = await createTestCity();
    const testInput: CreateWeatherAlertInput = {
      ...createTestInput(cityId),
      end_time: null
    };

    const result = await createWeatherAlert(testInput);

    expect(result.end_time).toBeNull();

    // Verify in database
    const alerts = await db.select()
      .from(weatherAlertsTable)
      .where(eq(weatherAlertsTable.id, result.id))
      .execute();

    expect(alerts[0].end_time).toBeNull();
  });

  it('should throw error when city does not exist', async () => {
    const testInput = createTestInput(999); // Non-existent city ID

    await expect(createWeatherAlert(testInput))
      .rejects.toThrow(/City with ID 999 not found/i);
  });

  it('should throw error when start_time is after end_time', async () => {
    const cityId = await createTestCity();
    const testInput: CreateWeatherAlertInput = {
      ...createTestInput(cityId),
      start_time: new Date('2024-07-17T18:00:00Z'),
      end_time: new Date('2024-07-15T10:00:00Z') // End before start
    };

    await expect(createWeatherAlert(testInput))
      .rejects.toThrow(/Alert start time must be before end time/i);
  });

  it('should allow start_time equal to end_time when end_time is null', async () => {
    const cityId = await createTestCity();
    const testInput: CreateWeatherAlertInput = {
      ...createTestInput(cityId),
      end_time: null
    };

    const result = await createWeatherAlert(testInput);
    expect(result.id).toBeDefined();
    expect(result.end_time).toBeNull();
  });

  it('should create alerts with different alert types and severities', async () => {
    const cityId = await createTestCity();

    // Test different combinations
    const combinations = [
      { type: 'extreme_cold', severity: 'extreme' },
      { type: 'heavy_rain', severity: 'moderate' },
      { type: 'strong_winds', severity: 'low' },
      { type: 'thunderstorm', severity: 'high' }
    ] as const;

    for (const combo of combinations) {
      const testInput: CreateWeatherAlertInput = {
        ...createTestInput(cityId),
        type: combo.type,
        severity: combo.severity,
        title: `${combo.type} alert`,
        description: `${combo.severity} severity ${combo.type} expected`
      };

      const result = await createWeatherAlert(testInput);
      expect(result.type).toEqual(combo.type);
      expect(result.severity).toEqual(combo.severity);
    }
  });

  it('should create multiple alerts for the same city', async () => {
    const cityId = await createTestCity();

    // Create first alert
    const firstInput: CreateWeatherAlertInput = {
      ...createTestInput(cityId),
      type: 'heavy_rain',
      title: 'Rain Warning'
    };

    // Create second alert
    const secondInput: CreateWeatherAlertInput = {
      ...createTestInput(cityId),
      type: 'strong_winds',
      title: 'Wind Warning',
      start_time: new Date('2024-07-18T10:00:00Z'),
      end_time: new Date('2024-07-19T18:00:00Z')
    };

    const firstResult = await createWeatherAlert(firstInput);
    const secondResult = await createWeatherAlert(secondInput);

    expect(firstResult.id).not.toEqual(secondResult.id);
    expect(firstResult.city_id).toEqual(cityId);
    expect(secondResult.city_id).toEqual(cityId);
    expect(firstResult.type).toEqual('heavy_rain');
    expect(secondResult.type).toEqual('strong_winds');

    // Verify both are saved in database
    const alerts = await db.select()
      .from(weatherAlertsTable)
      .where(eq(weatherAlertsTable.city_id, cityId))
      .execute();

    expect(alerts).toHaveLength(2);
  });
});