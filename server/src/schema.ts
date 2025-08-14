import { z } from 'zod';

// Weather condition enum
export const weatherConditionSchema = z.enum([
  'clear',
  'partly_cloudy',
  'cloudy',
  'rain',
  'heavy_rain',
  'snow',
  'heavy_snow',
  'thunderstorm',
  'fog',
  'wind'
]);

export type WeatherCondition = z.infer<typeof weatherConditionSchema>;

// Alert severity enum
export const alertSeveritySchema = z.enum([
  'low',
  'moderate',
  'high',
  'extreme'
]);

export type AlertSeverity = z.infer<typeof alertSeveritySchema>;

// Alert type enum
export const alertTypeSchema = z.enum([
  'extreme_heat',
  'extreme_cold',
  'heavy_rain',
  'heavy_snow',
  'strong_winds',
  'thunderstorm',
  'fog'
]);

export type AlertType = z.infer<typeof alertTypeSchema>;

// City schema
export const citySchema = z.object({
  id: z.number(),
  name: z.string(),
  country: z.string(),
  latitude: z.number(),
  longitude: z.number(),
  created_at: z.coerce.date()
});

export type City = z.infer<typeof citySchema>;

// Weather data schema
export const weatherDataSchema = z.object({
  id: z.number(),
  city_id: z.number(),
  temperature: z.number(), // in Celsius
  humidity: z.number().int().min(0).max(100), // percentage
  pressure: z.number(), // in hPa
  wind_speed: z.number(), // in km/h
  wind_direction: z.number().int().min(0).max(360), // degrees
  condition: weatherConditionSchema,
  visibility: z.number(), // in km
  recorded_at: z.coerce.date(),
  created_at: z.coerce.date()
});

export type WeatherData = z.infer<typeof weatherDataSchema>;

// Weather alert schema
export const weatherAlertSchema = z.object({
  id: z.number(),
  city_id: z.number(),
  type: alertTypeSchema,
  severity: alertSeveritySchema,
  title: z.string(),
  description: z.string(),
  start_time: z.coerce.date(),
  end_time: z.coerce.date().nullable(),
  is_active: z.boolean(),
  created_at: z.coerce.date()
});

export type WeatherAlert = z.infer<typeof weatherAlertSchema>;

// Input schema for searching cities
export const searchCityInputSchema = z.object({
  query: z.string().min(1, "City name cannot be empty")
});

export type SearchCityInput = z.infer<typeof searchCityInputSchema>;

// Input schema for creating a city
export const createCityInputSchema = z.object({
  name: z.string().min(1, "City name is required"),
  country: z.string().min(1, "Country is required"),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180)
});

export type CreateCityInput = z.infer<typeof createCityInputSchema>;

// Input schema for getting weather by city ID
export const getWeatherByCityIdInputSchema = z.object({
  city_id: z.number().positive()
});

export type GetWeatherByCityIdInput = z.infer<typeof getWeatherByCityIdInputSchema>;

// Input schema for creating weather data
export const createWeatherDataInputSchema = z.object({
  city_id: z.number().positive(),
  temperature: z.number(),
  humidity: z.number().int().min(0).max(100),
  pressure: z.number().positive(),
  wind_speed: z.number().min(0),
  wind_direction: z.number().int().min(0).max(360),
  condition: weatherConditionSchema,
  visibility: z.number().min(0),
  recorded_at: z.coerce.date()
});

export type CreateWeatherDataInput = z.infer<typeof createWeatherDataInputSchema>;

// Input schema for creating weather alerts
export const createWeatherAlertInputSchema = z.object({
  city_id: z.number().positive(),
  type: alertTypeSchema,
  severity: alertSeveritySchema,
  title: z.string().min(1, "Alert title is required"),
  description: z.string().min(1, "Alert description is required"),
  start_time: z.coerce.date(),
  end_time: z.coerce.date().nullable()
});

export type CreateWeatherAlertInput = z.infer<typeof createWeatherAlertInputSchema>;

// Input schema for getting active alerts by city
export const getActiveAlertsByCityInputSchema = z.object({
  city_id: z.number().positive()
});

export type GetActiveAlertsByCityInput = z.infer<typeof getActiveAlertsByCityInputSchema>;

// Weather map data schema
export const weatherMapDataSchema = z.object({
  id: z.number(),
  region: z.string(),
  map_type: z.enum(['temperature', 'precipitation', 'wind', 'pressure']),
  data_url: z.string().url(),
  timestamp: z.coerce.date(),
  created_at: z.coerce.date()
});

export type WeatherMapData = z.infer<typeof weatherMapDataSchema>;

// Input schema for getting weather maps
export const getWeatherMapsInputSchema = z.object({
  region: z.string().optional(),
  map_type: z.enum(['temperature', 'precipitation', 'wind', 'pressure']).optional()
});

export type GetWeatherMapsInput = z.infer<typeof getWeatherMapsInputSchema>;