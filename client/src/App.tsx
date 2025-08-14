import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { trpc } from '@/utils/trpc';
import { WeatherCard } from '@/components/WeatherCard';
import { WeatherAlerts } from '@/components/WeatherAlerts';
import { WeatherMaps } from '@/components/WeatherMaps';
import { CitySearch } from '@/components/CitySearch';
import { MapIcon, ThermometerIcon } from 'lucide-react';

// Using type-only imports for better TypeScript compliance
import type { City, WeatherData, WeatherAlert, WeatherMapData } from '../../server/src/schema';

function App() {
  // State management
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [currentWeather, setCurrentWeather] = useState<WeatherData | null>(null);
  const [weatherAlerts, setWeatherAlerts] = useState<WeatherAlert[]>([]);
  const [weatherMaps, setWeatherMaps] = useState<WeatherMapData[]>([]);
  const [isWeatherLoading, setIsWeatherLoading] = useState(false);

  // Load weather data for selected city
  const loadCityWeather = useCallback(async (city: City) => {
    setIsWeatherLoading(true);
    try {
      // Load current weather
      const weather = await trpc.getWeatherByCity.query({ city_id: city.id });
      setCurrentWeather(weather);

      // Load active alerts
      const alerts = await trpc.getActiveAlerts.query({ city_id: city.id });
      setWeatherAlerts(alerts);
    } catch (error) {
      console.error('Failed to load weather data:', error);
    } finally {
      setIsWeatherLoading(false);
    }
  }, []);

  // Load weather maps
  const loadWeatherMaps = useCallback(async () => {
    try {
      const maps = await trpc.getWeatherMaps.query({});
      setWeatherMaps(maps);
    } catch (error) {
      console.error('Failed to load weather maps:', error);
    }
  }, []);

  // Load weather maps on component mount
  useEffect(() => {
    loadWeatherMaps();
  }, [loadWeatherMaps]);

  // Handle city selection
  const handleCitySelect = async (city: City) => {
    setSelectedCity(city);
    setCurrentWeather(null); // Clear previous weather data
    setWeatherAlerts([]); // Clear previous alerts
    await loadCityWeather(city);
  };



  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-4">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">🌤️ Weather Dashboard</h1>
          <p className="text-gray-600">Get current weather conditions, forecasts, and alerts</p>
        </div>

        {/* Search Section */}
        <CitySearch 
          onCitySelect={handleCitySelect} 
          selectedCity={selectedCity}
        />

        {/* Weather Display */}
        {selectedCity && (
          <div className="grid gap-6">
            {/* Current Weather */}
            {currentWeather ? (
              <WeatherCard 
                weather={currentWeather} 
                city={selectedCity} 
                isLoading={isWeatherLoading} 
              />
            ) : (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ThermometerIcon className="h-5 w-5" />
                    Current Weather - {selectedCity.name}, {selectedCity.country}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isWeatherLoading ? (
                    <div className="text-center py-8">
                      <div className="animate-spin text-4xl mb-4">🌀</div>
                      <p className="text-gray-500">Loading weather data...</p>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      No weather data available for this city
                    </div>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Weather Alerts */}
            <WeatherAlerts 
              alerts={weatherAlerts} 
              cityName={`${selectedCity.name}, ${selectedCity.country}`}
              isLoading={isWeatherLoading} 
            />

            {/* Weather Maps */}
            <WeatherMaps 
              maps={weatherMaps} 
              onRefresh={loadWeatherMaps}
            />
          </div>
        )}

        {/* Welcome Message */}
        {!selectedCity && (
          <Card className="text-center py-12">
            <CardContent>
              <div className="text-6xl mb-4">🌍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Welcome to Weather Dashboard
              </h3>
              <p className="text-gray-600 mb-4">
                Search for a city above to get started with real-time weather information,
                detailed forecasts, and important weather alerts.
              </p>
              <div className="flex justify-center gap-8 text-sm text-gray-500 mb-6">
                <div className="flex items-center gap-2">
                  <ThermometerIcon className="h-4 w-4" />
                  Temperature
                </div>
                <div className="flex items-center gap-2">
                  🚨 Weather Alerts
                </div>
                <div className="flex items-center gap-2">
                  <MapIcon className="h-4 w-4" />
                  Weather Maps
                </div>
              </div>
              <div className="grid md:grid-cols-3 gap-4 mt-8 text-left">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl mb-2">🌡️</div>
                  <h4 className="font-semibold mb-1">Real-time Data</h4>
                  <p className="text-sm text-gray-600">Get current temperature, humidity, wind speed, and visibility</p>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg">
                  <div className="text-2xl mb-2">⚠️</div>
                  <h4 className="font-semibold mb-1">Weather Alerts</h4>
                  <p className="text-sm text-gray-600">Stay informed about extreme weather conditions and safety warnings</p>
                </div>
                <div className="p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl mb-2">🗺️</div>
                  <h4 className="font-semibold mb-1">Weather Maps</h4>
                  <p className="text-sm text-gray-600">View radar and satellite imagery for comprehensive weather tracking</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

export default App;