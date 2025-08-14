import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { weatherMapsTable } from '../db/schema';
import { type GetWeatherMapsInput } from '../schema';
import { getWeatherMaps } from '../handlers/get_weather_maps';

// Test map data entries
const testMapData = [
  {
    region: 'North America',
    map_type: 'temperature' as const,
    data_url: 'https://example.com/na-temp.png',
    timestamp: new Date('2024-01-15T12:00:00Z')
  },
  {
    region: 'Europe',
    map_type: 'precipitation' as const,
    data_url: 'https://example.com/eu-precip.png',
    timestamp: new Date('2024-01-15T11:30:00Z')
  },
  {
    region: 'North America',
    map_type: 'wind' as const,
    data_url: 'https://example.com/na-wind.png',
    timestamp: new Date('2024-01-15T11:00:00Z')
  },
  {
    region: 'Asia',
    map_type: 'temperature' as const,
    data_url: 'https://example.com/asia-temp.png',
    timestamp: new Date('2024-01-15T10:30:00Z')
  }
];

describe('getWeatherMaps', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  beforeEach(async () => {
    // Insert test weather map data
    await db.insert(weatherMapsTable)
      .values(testMapData)
      .execute();
  });

  it('should retrieve all weather maps when no filters provided', async () => {
    const input: GetWeatherMapsInput = {};
    const result = await getWeatherMaps(input);

    expect(result).toHaveLength(4);
    
    // Should be ordered by timestamp descending (most recent first)
    expect(result[0].region).toEqual('North America');
    expect(result[0].map_type).toEqual('temperature');
    expect(result[0].timestamp).toEqual(new Date('2024-01-15T12:00:00Z'));
    
    expect(result[1].region).toEqual('Europe');
    expect(result[1].map_type).toEqual('precipitation');
    
    // Verify all results have required fields
    result.forEach(map => {
      expect(map.id).toBeDefined();
      expect(map.region).toBeDefined();
      expect(map.map_type).toBeDefined();
      expect(map.data_url).toBeDefined();
      expect(map.timestamp).toBeInstanceOf(Date);
      expect(map.created_at).toBeInstanceOf(Date);
    });
  });

  it('should filter weather maps by region', async () => {
    const input: GetWeatherMapsInput = {
      region: 'North America'
    };
    const result = await getWeatherMaps(input);

    expect(result).toHaveLength(2);
    result.forEach(map => {
      expect(map.region).toEqual('North America');
    });

    // Should still be ordered by timestamp descending
    expect(result[0].map_type).toEqual('temperature');
    expect(result[1].map_type).toEqual('wind');
  });

  it('should filter weather maps by map type', async () => {
    const input: GetWeatherMapsInput = {
      map_type: 'temperature'
    };
    const result = await getWeatherMaps(input);

    expect(result).toHaveLength(2);
    result.forEach(map => {
      expect(map.map_type).toEqual('temperature');
    });

    // Should be ordered by timestamp descending
    expect(result[0].region).toEqual('North America');
    expect(result[1].region).toEqual('Asia');
  });

  it('should filter weather maps by both region and map type', async () => {
    const input: GetWeatherMapsInput = {
      region: 'North America',
      map_type: 'temperature'
    };
    const result = await getWeatherMaps(input);

    expect(result).toHaveLength(1);
    expect(result[0].region).toEqual('North America');
    expect(result[0].map_type).toEqual('temperature');
    expect(result[0].data_url).toEqual('https://example.com/na-temp.png');
  });

  it('should return empty array when no maps match filters', async () => {
    const input: GetWeatherMapsInput = {
      region: 'Antarctica',
      map_type: 'temperature'
    };
    const result = await getWeatherMaps(input);

    expect(result).toHaveLength(0);
  });

  it('should return empty array when region does not exist', async () => {
    const input: GetWeatherMapsInput = {
      region: 'Nonexistent Region'
    };
    const result = await getWeatherMaps(input);

    expect(result).toHaveLength(0);
  });

  it('should handle single filter correctly', async () => {
    const input: GetWeatherMapsInput = {
      map_type: 'wind'
    };
    const result = await getWeatherMaps(input);

    expect(result).toHaveLength(1);
    expect(result[0].map_type).toEqual('wind');
    expect(result[0].region).toEqual('North America');
  });

  it('should verify correct timestamp ordering', async () => {
    const input: GetWeatherMapsInput = {};
    const result = await getWeatherMaps(input);

    // Verify descending order by timestamp
    for (let i = 0; i < result.length - 1; i++) {
      expect(result[i].timestamp.getTime()).toBeGreaterThanOrEqual(
        result[i + 1].timestamp.getTime()
      );
    }
  });
});