import { db } from '../db';
import { weatherAlertsTable, citiesTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type CreateWeatherAlertInput, type WeatherAlert } from '../schema';

export const createWeatherAlert = async (input: CreateWeatherAlertInput): Promise<WeatherAlert> => {
  try {
    // Validate that the city exists
    const cityExists = await db.select({ id: citiesTable.id })
      .from(citiesTable)
      .where(eq(citiesTable.id, input.city_id))
      .execute();

    if (cityExists.length === 0) {
      throw new Error(`City with ID ${input.city_id} not found`);
    }

    // Validate timing: start_time should be before end_time if end_time is provided
    if (input.end_time && input.start_time >= input.end_time) {
      throw new Error('Alert start time must be before end time');
    }

    // Insert weather alert record
    const result = await db.insert(weatherAlertsTable)
      .values({
        city_id: input.city_id,
        type: input.type,
        severity: input.severity,
        title: input.title,
        description: input.description,
        start_time: input.start_time,
        end_time: input.end_time,
        is_active: true // Default to active
      })
      .returning()
      .execute();

    const alert = result[0];
    return {
      ...alert,
      start_time: new Date(alert.start_time),
      end_time: alert.end_time ? new Date(alert.end_time) : null,
      created_at: new Date(alert.created_at)
    };
  } catch (error) {
    console.error('Weather alert creation failed:', error);
    throw error;
  }
};