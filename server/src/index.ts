import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';

// Import schemas
import { 
  searchCityInputSchema, 
  createCityInputSchema,
  getWeatherByCityIdInputSchema,
  createWeatherDataInputSchema,
  getActiveAlertsByCityInputSchema,
  createWeatherAlertInputSchema,
  getWeatherMapsInputSchema
} from './schema';

// Import handlers
import { searchCities } from './handlers/search_cities';
import { createCity } from './handlers/create_city';
import { getAllCities } from './handlers/get_all_cities';
import { getWeatherByCity } from './handlers/get_weather_by_city';
import { getWeatherHistory } from './handlers/get_weather_history';
import { createWeatherData } from './handlers/create_weather_data';
import { getActiveAlerts } from './handlers/get_active_alerts';
import { createWeatherAlert } from './handlers/create_weather_alert';
import { getWeatherMaps } from './handlers/get_weather_maps';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // City management endpoints
  searchCities: publicProcedure
    .input(searchCityInputSchema)
    .query(({ input }) => searchCities(input)),

  createCity: publicProcedure
    .input(createCityInputSchema)
    .mutation(({ input }) => createCity(input)),

  getAllCities: publicProcedure
    .query(() => getAllCities()),

  // Weather data endpoints
  getWeatherByCity: publicProcedure
    .input(getWeatherByCityIdInputSchema)
    .query(({ input }) => getWeatherByCity(input)),

  getWeatherHistory: publicProcedure
    .input(getWeatherByCityIdInputSchema)
    .query(({ input }) => getWeatherHistory(input)),

  createWeatherData: publicProcedure
    .input(createWeatherDataInputSchema)
    .mutation(({ input }) => createWeatherData(input)),

  // Weather alerts endpoints
  getActiveAlerts: publicProcedure
    .input(getActiveAlertsByCityInputSchema)
    .query(({ input }) => getActiveAlerts(input)),

  createWeatherAlert: publicProcedure
    .input(createWeatherAlertInputSchema)
    .mutation(({ input }) => createWeatherAlert(input)),

  // Weather maps endpoints
  getWeatherMaps: publicProcedure
    .input(getWeatherMapsInputSchema)
    .query(({ input }) => getWeatherMaps(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`Weather API server listening at port: ${port}`);
}

start();