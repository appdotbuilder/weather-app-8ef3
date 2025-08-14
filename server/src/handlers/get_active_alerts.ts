import { db } from '../db';
import { weatherAlertsTable } from '../db/schema';
import { type GetActiveAlertsByCityInput, type WeatherAlert } from '../schema';
import { eq, and, lte, or, gt, isNull, SQL } from 'drizzle-orm';

export const getActiveAlerts = async (input: GetActiveAlertsByCityInput): Promise<WeatherAlert[]> => {
  try {
    const now = new Date();
    
    // Build query conditions
    const conditions: SQL<unknown>[] = [];
    
    // Filter by city_id
    conditions.push(eq(weatherAlertsTable.city_id, input.city_id));
    
    // Filter by is_active = true
    conditions.push(eq(weatherAlertsTable.is_active, true));
    
    // Filter by start_time <= now
    conditions.push(lte(weatherAlertsTable.start_time, now));
    
    // Filter by end_time > now OR end_time IS NULL (ongoing alerts)
    conditions.push(
      or(
        gt(weatherAlertsTable.end_time, now),
        isNull(weatherAlertsTable.end_time)
      )!
    );
    
    // Execute query with all conditions
    const results = await db.select()
      .from(weatherAlertsTable)
      .where(and(...conditions))
      .execute();
    
    // Return results (no numeric conversions needed for this table)
    return results;
  } catch (error) {
    console.error('Get active alerts failed:', error);
    throw error;
  }
};