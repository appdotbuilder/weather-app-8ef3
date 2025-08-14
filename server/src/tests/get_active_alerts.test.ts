import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { citiesTable, weatherAlertsTable } from '../db/schema';
import { type GetActiveAlertsByCityInput, type CreateCityInput } from '../schema';
import { getActiveAlerts } from '../handlers/get_active_alerts';

// Test input
const testInput: GetActiveAlertsByCityInput = {
  city_id: 1
};

// Helper to create test city
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

// Helper to create test alert
const createTestAlert = async (
  cityId: number,
  options: {
    startTime?: Date;
    endTime?: Date | null;
    isActive?: boolean;
    type?: 'extreme_heat' | 'extreme_cold' | 'heavy_rain' | 'heavy_snow' | 'strong_winds' | 'thunderstorm' | 'fog';
    severity?: 'low' | 'moderate' | 'high' | 'extreme';
  } = {}
) => {
  const now = new Date();
  const defaultStartTime = new Date(now.getTime() - 60 * 60 * 1000); // 1 hour ago
  const defaultEndTime = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour from now

  const result = await db.insert(weatherAlertsTable)
    .values({
      city_id: cityId,
      type: options.type || 'extreme_heat',
      severity: options.severity || 'high',
      title: 'Test Alert',
      description: 'A test weather alert',
      start_time: options.startTime || defaultStartTime,
      end_time: options.endTime !== undefined ? options.endTime : defaultEndTime,
      is_active: options.isActive !== undefined ? options.isActive : true
    })
    .returning()
    .execute();

  return result[0];
};

describe('getActiveAlerts', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return active alerts for a city', async () => {
    const cityId = await createTestCity();
    
    // Create an active alert
    await createTestAlert(cityId, {
      type: 'extreme_heat',
      severity: 'high'
    });

    const result = await getActiveAlerts({ city_id: cityId });

    expect(result).toHaveLength(1);
    expect(result[0].city_id).toEqual(cityId);
    expect(result[0].type).toEqual('extreme_heat');
    expect(result[0].severity).toEqual('high');
    expect(result[0].title).toEqual('Test Alert');
    expect(result[0].is_active).toBe(true);
    expect(result[0].id).toBeDefined();
    expect(result[0].created_at).toBeInstanceOf(Date);
  });

  it('should return multiple active alerts for a city', async () => {
    const cityId = await createTestCity();
    
    // Create multiple active alerts
    await createTestAlert(cityId, { type: 'extreme_heat', severity: 'high' });
    await createTestAlert(cityId, { type: 'heavy_rain', severity: 'moderate' });
    await createTestAlert(cityId, { type: 'strong_winds', severity: 'low' });

    const result = await getActiveAlerts({ city_id: cityId });

    expect(result).toHaveLength(3);
    expect(result.every(alert => alert.city_id === cityId)).toBe(true);
    expect(result.every(alert => alert.is_active === true)).toBe(true);
    
    // Check we have all different alert types
    const alertTypes = result.map(alert => alert.type);
    expect(alertTypes).toContain('extreme_heat');
    expect(alertTypes).toContain('heavy_rain');
    expect(alertTypes).toContain('strong_winds');
  });

  it('should return empty array when no active alerts exist', async () => {
    const cityId = await createTestCity();
    
    const result = await getActiveAlerts({ city_id: cityId });

    expect(result).toHaveLength(0);
  });

  it('should not return inactive alerts', async () => {
    const cityId = await createTestCity();
    
    // Create an inactive alert
    await createTestAlert(cityId, { isActive: false });

    const result = await getActiveAlerts({ city_id: cityId });

    expect(result).toHaveLength(0);
  });

  it('should not return expired alerts', async () => {
    const cityId = await createTestCity();
    const now = new Date();
    
    // Create an expired alert (ended 1 hour ago)
    await createTestAlert(cityId, {
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000), // 2 hours ago
      endTime: new Date(now.getTime() - 60 * 60 * 1000) // 1 hour ago (expired)
    });

    const result = await getActiveAlerts({ city_id: cityId });

    expect(result).toHaveLength(0);
  });

  it('should not return future alerts', async () => {
    const cityId = await createTestCity();
    const now = new Date();
    
    // Create a future alert (starts in 1 hour)
    await createTestAlert(cityId, {
      startTime: new Date(now.getTime() + 60 * 60 * 1000), // 1 hour from now
      endTime: new Date(now.getTime() + 2 * 60 * 60 * 1000) // 2 hours from now
    });

    const result = await getActiveAlerts({ city_id: cityId });

    expect(result).toHaveLength(0);
  });

  it('should return alerts with null end_time (ongoing alerts)', async () => {
    const cityId = await createTestCity();
    
    // Create an ongoing alert with no end time
    await createTestAlert(cityId, {
      endTime: null // Ongoing alert
    });

    const result = await getActiveAlerts({ city_id: cityId });

    expect(result).toHaveLength(1);
    expect(result[0].end_time).toBeNull();
    expect(result[0].city_id).toEqual(cityId);
  });

  it('should only return alerts for the specified city', async () => {
    const cityId1 = await createTestCity();
    
    // Create another city
    const cityResult2 = await db.insert(citiesTable)
      .values({
        name: 'Other City',
        country: 'Other Country',
        latitude: '51.5074',
        longitude: '-0.1278'
      })
      .returning()
      .execute();
    const cityId2 = cityResult2[0].id;
    
    // Create alerts for both cities
    await createTestAlert(cityId1, { type: 'extreme_heat' });
    await createTestAlert(cityId2, { type: 'heavy_rain' });

    const result = await getActiveAlerts({ city_id: cityId1 });

    expect(result).toHaveLength(1);
    expect(result[0].city_id).toEqual(cityId1);
    expect(result[0].type).toEqual('extreme_heat');
  });

  it('should handle mixed conditions correctly', async () => {
    const cityId = await createTestCity();
    const now = new Date();
    
    // Create various types of alerts
    await createTestAlert(cityId, { // Active and current
      type: 'extreme_heat'
    });
    
    await createTestAlert(cityId, { // Active but expired
      type: 'heavy_rain',
      startTime: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      endTime: new Date(now.getTime() - 60 * 60 * 1000)
    });
    
    await createTestAlert(cityId, { // Inactive but current
      type: 'strong_winds',
      isActive: false
    });
    
    await createTestAlert(cityId, { // Active and ongoing (null end_time)
      type: 'thunderstorm',
      endTime: null
    });

    const result = await getActiveAlerts({ city_id: cityId });

    // Should only return the first (active+current) and last (active+ongoing) alerts
    expect(result).toHaveLength(2);
    
    const alertTypes = result.map(alert => alert.type);
    expect(alertTypes).toContain('extreme_heat');
    expect(alertTypes).toContain('thunderstorm');
    expect(alertTypes).not.toContain('heavy_rain'); // expired
    expect(alertTypes).not.toContain('strong_winds'); // inactive
  });
});