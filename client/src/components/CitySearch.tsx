import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SearchIcon, MapPinIcon, GlobeIcon } from 'lucide-react';
import { trpc } from '@/utils/trpc';
import type { City } from '../../../server/src/schema';

interface CitySearchProps {
  onCitySelect: (city: City) => void;
  selectedCity?: City | null;
}

export function CitySearch({ onCitySelect, selectedCity }: CitySearchProps) {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [cities, setCities] = useState<City[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Search for cities
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const results = await trpc.searchCities.query({ query: searchQuery });
      setCities(results);
    } catch (error) {
      console.error('Failed to search cities:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle city selection
  const handleCityClick = (city: City) => {
    onCitySelect(city);
    // Keep the search results visible but clear the input
    setSearchQuery('');
  };

  // Get country flag (simple mapping for demo - in real app would use proper flag API)
  const getCountryFlag = (country: string): string => {
    const flagMap: Record<string, string> = {
      'USA': '🇺🇸',
      'Canada': '🇨🇦',
      'UK': '🇬🇧',
      'France': '🇫🇷',
      'Germany': '🇩🇪',
      'Japan': '🇯🇵',
      'Australia': '🇦🇺',
      'Brazil': '🇧🇷',
      'India': '🇮🇳',
      'China': '🇨🇳'
    };
    return flagMap[country] || '🌍';
  };

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <SearchIcon className="h-5 w-5" />
          City Search
        </CardTitle>
        <CardDescription>
          Search for any city worldwide to view its current weather conditions and forecasts
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Current Selection */}
        {selectedCity && (
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <MapPinIcon className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium text-blue-900">Currently Viewing:</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg">{getCountryFlag(selectedCity.country)}</span>
              <span className="font-semibold">{selectedCity.name}, {selectedCity.country}</span>
              <Badge variant="outline" className="text-xs">
                {selectedCity.latitude.toFixed(2)}, {selectedCity.longitude.toFixed(2)}
              </Badge>
            </div>
          </div>
        )}

        {/* Search Form */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <GlobeIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              type="text"
              placeholder="Enter city name (e.g., London, Tokyo, New York)..."
              value={searchQuery}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" disabled={isLoading || !searchQuery.trim()}>
            {isLoading ? (
              <div className="flex items-center gap-2">
                <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                Searching...
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <SearchIcon className="h-4 w-4" />
                Search
              </div>
            )}
          </Button>
        </form>

        {/* Search Results */}
        {cities.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-900">
                Search Results ({cities.length} found)
              </h4>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setCities([])}
                className="text-gray-500 hover:text-gray-700"
              >
                Clear Results
              </Button>
            </div>
            <div className="grid gap-2 max-h-64 overflow-y-auto">
              {cities.map((city: City) => (
                <Button
                  key={city.id}
                  variant="outline"
                  className={`justify-start h-auto p-3 hover:bg-gray-50 transition-colors ${
                    selectedCity?.id === city.id ? 'bg-blue-50 border-blue-300' : ''
                  }`}
                  onClick={() => handleCityClick(city)}
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="text-xl flex-shrink-0">
                      {getCountryFlag(city.country)}
                    </div>
                    <div className="text-left flex-1 min-w-0">
                      <div className="font-medium text-gray-900 truncate">
                        {city.name}
                      </div>
                      <div className="text-sm text-gray-500">
                        {city.country}
                      </div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="text-xs text-gray-400 font-mono">
                        {city.latitude.toFixed(2)}°
                      </div>
                      <div className="text-xs text-gray-400 font-mono">
                        {city.longitude.toFixed(2)}°
                      </div>
                    </div>
                    {selectedCity?.id === city.id && (
                      <Badge variant="default" className="flex-shrink-0">
                        Active
                      </Badge>
                    )}
                  </div>
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Search Tips */}
        {cities.length === 0 && !isLoading && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
            <h5 className="text-sm font-medium text-gray-700 mb-2">Search Tips:</h5>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Try searching for major cities like "London", "Tokyo", or "New York"</li>
              <li>• You can search by city name only or include the country</li>
              <li>• Partial matches are supported - try "San" to find San Francisco, San Diego, etc.</li>
            </ul>
          </div>
        )}

        {/* Error State */}
        {cities.length === 0 && searchQuery && !isLoading && (
          <div className="text-center py-6">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-gray-600 mb-2">No cities found for "{searchQuery}"</p>
            <p className="text-sm text-gray-500">Try searching with a different spelling or a more general term</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}