import { serial, text, pgTable, timestamp, numeric, integer, boolean, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums for weather conditions and alert types
export const weatherConditionEnum = pgEnum('weather_condition', [
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

export const alertSeverityEnum = pgEnum('alert_severity', [
  'low',
  'moderate',
  'high',
  'extreme'
]);

export const alertTypeEnum = pgEnum('alert_type', [
  'extreme_heat',
  'extreme_cold',
  'heavy_rain',
  'heavy_snow',
  'strong_winds',
  'thunderstorm',
  'fog'
]);

export const mapTypeEnum = pgEnum('map_type', [
  'temperature',
  'precipitation',
  'wind',
  'pressure'
]);

// Cities table
export const citiesTable = pgTable('cities', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  country: text('country').notNull(),
  latitude: numeric('latitude', { precision: 10, scale: 7 }).notNull(),
  longitude: numeric('longitude', { precision: 10, scale: 7 }).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Weather data table
export const weatherDataTable = pgTable('weather_data', {
  id: serial('id').primaryKey(),
  city_id: integer('city_id').notNull().references(() => citiesTable.id, { onDelete: 'cascade' }),
  temperature: numeric('temperature', { precision: 5, scale: 2 }).notNull(), // Celsius
  humidity: integer('humidity').notNull(), // 0-100%
  pressure: numeric('pressure', { precision: 7, scale: 2 }).notNull(), // hPa
  wind_speed: numeric('wind_speed', { precision: 5, scale: 2 }).notNull(), // km/h
  wind_direction: integer('wind_direction').notNull(), // 0-360 degrees
  condition: weatherConditionEnum('condition').notNull(),
  visibility: numeric('visibility', { precision: 5, scale: 2 }).notNull(), // km
  recorded_at: timestamp('recorded_at').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Weather alerts table
export const weatherAlertsTable = pgTable('weather_alerts', {
  id: serial('id').primaryKey(),
  city_id: integer('city_id').notNull().references(() => citiesTable.id, { onDelete: 'cascade' }),
  type: alertTypeEnum('type').notNull(),
  severity: alertSeverityEnum('severity').notNull(),
  title: text('title').notNull(),
  description: text('description').notNull(),
  start_time: timestamp('start_time').notNull(),
  end_time: timestamp('end_time'), // Nullable - some alerts may not have end time
  is_active: boolean('is_active').default(true).notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Weather maps table
export const weatherMapsTable = pgTable('weather_maps', {
  id: serial('id').primaryKey(),
  region: text('region').notNull(),
  map_type: mapTypeEnum('map_type').notNull(),
  data_url: text('data_url').notNull(),
  timestamp: timestamp('timestamp').notNull(),
  created_at: timestamp('created_at').defaultNow().notNull(),
});

// Relations
export const citiesRelations = relations(citiesTable, ({ many }) => ({
  weatherData: many(weatherDataTable),
  weatherAlerts: many(weatherAlertsTable),
}));

export const weatherDataRelations = relations(weatherDataTable, ({ one }) => ({
  city: one(citiesTable, {
    fields: [weatherDataTable.city_id],
    references: [citiesTable.id],
  }),
}));

export const weatherAlertsRelations = relations(weatherAlertsTable, ({ one }) => ({
  city: one(citiesTable, {
    fields: [weatherAlertsTable.city_id],
    references: [citiesTable.id],
  }),
}));

// TypeScript types for the table schemas
export type City = typeof citiesTable.$inferSelect;
export type NewCity = typeof citiesTable.$inferInsert;

export type WeatherData = typeof weatherDataTable.$inferSelect;
export type NewWeatherData = typeof weatherDataTable.$inferInsert;

export type WeatherAlert = typeof weatherAlertsTable.$inferSelect;
export type NewWeatherAlert = typeof weatherAlertsTable.$inferInsert;

export type WeatherMapData = typeof weatherMapsTable.$inferSelect;
export type NewWeatherMapData = typeof weatherMapsTable.$inferInsert;

// Export all tables and relations for proper query building
export const tables = {
  cities: citiesTable,
  weatherData: weatherDataTable,
  weatherAlerts: weatherAlertsTable,
  weatherMaps: weatherMapsTable
};