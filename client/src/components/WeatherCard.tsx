import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  ThermometerIcon, 
  WindIcon, 
  EyeIcon, 
  GaugeIcon,
  DropletsIcon,
  CompassIcon,
  ClockIcon
} from 'lucide-react';
import type { WeatherData, City } from '../../../server/src/schema';

interface WeatherCardProps {
  weather: WeatherData;
  city: City;
  isLoading?: boolean;
}

export function WeatherCard({ weather, city, isLoading = false }: WeatherCardProps) {
  // Get weather condition emoji and color
  const getWeatherEmoji = (condition: string): string => {
    const emojiMap: Record<string, string> = {
      'clear': '☀️',
      'partly_cloudy': '⛅',
      'cloudy': '☁️',
      'rain': '🌧️',
      'heavy_rain': '⛈️',
      'snow': '❄️',
      'heavy_snow': '🌨️',
      'thunderstorm': '⚡',
      'fog': '🌫️',
      'wind': '💨'
    };
    return emojiMap[condition] || '🌤️';
  };

  const getConditionColor = (condition: string): string => {
    const colorMap: Record<string, string> = {
      'clear': 'from-yellow-400 to-orange-500',
      'partly_cloudy': 'from-blue-400 to-cyan-500',
      'cloudy': 'from-gray-400 to-gray-600',
      'rain': 'from-blue-500 to-indigo-600',
      'heavy_rain': 'from-indigo-600 to-purple-700',
      'snow': 'from-blue-200 to-blue-400',
      'heavy_snow': 'from-blue-300 to-blue-500',
      'thunderstorm': 'from-purple-600 to-pink-700',
      'fog': 'from-gray-300 to-gray-500',
      'wind': 'from-teal-400 to-cyan-500'
    };
    return colorMap[condition] || 'from-blue-400 to-cyan-500';
  };

  // Get wind direction
  const getWindDirection = (degrees: number): string => {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    return directions[Math.round(degrees / 22.5) % 16];
  };

  // Get temperature description
  const getTemperatureDescription = (temp: number): string => {
    if (temp < 0) return 'Freezing';
    if (temp < 10) return 'Cold';
    if (temp < 20) return 'Cool';
    if (temp < 25) return 'Mild';
    if (temp < 30) return 'Warm';
    return 'Hot';
  };

  // Get humidity level description
  const getHumidityLevel = (humidity: number): string => {
    if (humidity < 30) return 'Dry';
    if (humidity < 60) return 'Comfortable';
    if (humidity < 80) return 'Humid';
    return 'Very Humid';
  };

  // Get visibility description
  const getVisibilityDescription = (visibility: number): string => {
    if (visibility < 1) return 'Very Poor';
    if (visibility < 5) return 'Poor';
    if (visibility < 10) return 'Moderate';
    return 'Excellent';
  };

  if (isLoading) {
    return (
      <Card className="weather-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ThermometerIcon className="h-5 w-5 animate-pulse" />
            Loading Weather Data...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">🌀</div>
            <p className="text-gray-500">Fetching latest weather conditions...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="weather-card overflow-hidden">
      <CardHeader className={`bg-gradient-to-r ${getConditionColor(weather.condition)} text-white`}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ThermometerIcon className="h-5 w-5" />
            Current Weather
          </div>
          <Badge variant="secondary" className="text-gray-800 bg-white/20">
            Live
          </Badge>
        </CardTitle>
        <div className="text-white/90">
          <div className="flex items-center gap-2 mb-1">
            <strong>{city.name}, {city.country}</strong>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <ClockIcon className="h-4 w-4" />
            Updated: {weather.recorded_at.toLocaleString()}
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Main Temperature Display */}
        <div className="text-center mb-6">
          <div className="text-6xl mb-2">
            {getWeatherEmoji(weather.condition)}
          </div>
          <div className="temperature-display mb-2">
            {Math.round(weather.temperature)}°C
          </div>
          <div className="text-lg text-gray-600 capitalize mb-1">
            {weather.condition.replace('_', ' ')}
          </div>
          <div className="text-sm text-gray-500">
            Feels {getTemperatureDescription(weather.temperature)}
          </div>
        </div>

        {/* Weather Details Grid */}
        <div className="grid md:grid-cols-2 gap-4">
          {/* Wind Information */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <WindIcon className="h-5 w-5 text-blue-600 wind-animation" />
              <span className="font-medium">Wind</span>
            </div>
            <div className="pl-7 space-y-1">
              <div className="text-lg font-semibold">
                {weather.wind_speed} km/h
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <CompassIcon className="h-4 w-4" />
                {getWindDirection(weather.wind_direction)} ({weather.wind_direction}°)
              </div>
            </div>
          </div>

          {/* Humidity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <DropletsIcon className="h-5 w-5 text-cyan-600" />
              <span className="font-medium">Humidity</span>
            </div>
            <div className="pl-7 space-y-2">
              <div className="text-lg font-semibold">
                {weather.humidity}%
              </div>
              <Progress value={weather.humidity} className="h-2" />
              <div className="text-sm text-gray-600">
                {getHumidityLevel(weather.humidity)}
              </div>
            </div>
          </div>

          {/* Pressure */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <GaugeIcon className="h-5 w-5 text-green-600" />
              <span className="font-medium">Pressure</span>
            </div>
            <div className="pl-7 space-y-1">
              <div className="text-lg font-semibold">
                {weather.pressure} hPa
              </div>
              <div className="text-sm text-gray-600">
                {weather.pressure > 1013 ? 'High' : weather.pressure > 1000 ? 'Normal' : 'Low'}
              </div>
            </div>
          </div>

          {/* Visibility */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-gray-700">
              <EyeIcon className="h-5 w-5 text-purple-600" />
              <span className="font-medium">Visibility</span>
            </div>
            <div className="pl-7 space-y-1">
              <div className="text-lg font-semibold">
                {weather.visibility} km
              </div>
              <div className="text-sm text-gray-600">
                {getVisibilityDescription(weather.visibility)}
              </div>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-500">
            <span>Coordinates: {city.latitude.toFixed(3)}, {city.longitude.toFixed(3)}</span>
            <span>Data ID: #{weather.id}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}