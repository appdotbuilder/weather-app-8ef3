import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  MapIcon, 
  ThermometerIcon, 
  CloudRainIcon, 
  WindIcon, 
  GaugeIcon,
  ExternalLinkIcon,
  RefreshCwIcon,
  SatelliteIcon
} from 'lucide-react';
import type { WeatherMapData } from '../../../server/src/schema';

interface WeatherMapsProps {
  maps: WeatherMapData[];
  isLoading?: boolean;
  onRefresh?: () => void;
}

export function WeatherMaps({ maps, isLoading = false, onRefresh }: WeatherMapsProps) {
  // Get map type icon and info
  const getMapTypeInfo = (mapType: string) => {
    const typeMap: Record<string, {
      icon: React.ReactElement;
      title: string;
      description: string;
      color: string;
    }> = {
      'temperature': {
        icon: <ThermometerIcon className="h-5 w-5" />,
        title: 'Temperature Map',
        description: 'Current temperature distribution across regions',
        color: 'from-red-400 to-orange-500'
      },
      'precipitation': {
        icon: <CloudRainIcon className="h-5 w-5" />,
        title: 'Precipitation Map',
        description: 'Rainfall and precipitation patterns',
        color: 'from-blue-400 to-cyan-500'
      },
      'wind': {
        icon: <WindIcon className="h-5 w-5" />,
        title: 'Wind Map',
        description: 'Wind speed and direction patterns',
        color: 'from-teal-400 to-green-500'
      },
      'pressure': {
        icon: <GaugeIcon className="h-5 w-5" />,
        title: 'Pressure Map',
        description: 'Atmospheric pressure systems',
        color: 'from-purple-400 to-indigo-500'
      }
    };
    return typeMap[mapType] || typeMap['temperature'];
  };

  // Get region emoji
  const getRegionEmoji = (region: string): string => {
    const regionMap: Record<string, string> = {
      'global': '🌍',
      'north_america': '🗺️',
      'south_america': '🌎',
      'europe': '🏰',
      'asia': '🏔️',
      'africa': '🦁',
      'oceania': '🏝️',
      'antarctica': '🧊'
    };
    return regionMap[region.toLowerCase()] || '📍';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapIcon className="h-5 w-5 animate-pulse" />
            Loading Weather Maps...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin text-4xl mb-4">🗺️</div>
            <p className="text-gray-500">Loading map data...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const mapTypes = ['temperature', 'precipitation', 'wind', 'pressure'] as const;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <MapIcon className="h-5 w-5" />
              Weather Maps & Radar
            </CardTitle>
            <CardDescription>
              Interactive weather maps and satellite imagery
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={onRefresh}>
            <RefreshCwIcon className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="temperature" className="w-full">
          <TabsList className="grid grid-cols-4 w-full mb-6">
            {mapTypes.map((mapType) => {
              const info = getMapTypeInfo(mapType);
              return (
                <TabsTrigger key={mapType} value={mapType} className="flex items-center gap-2">
                  {info.icon}
                  <span className="hidden sm:inline">{mapType}</span>
                </TabsTrigger>
              );
            })}
          </TabsList>

          {mapTypes.map((mapType) => {
            const info = getMapTypeInfo(mapType);
            const typeMaps = maps.filter((map: WeatherMapData) => map.map_type === mapType);

            return (
              <TabsContent key={mapType} value={mapType}>
                <div className="space-y-4">
                  {/* Tab Header */}
                  <div className={`p-4 rounded-lg bg-gradient-to-r ${info.color} text-white`}>
                    <div className="flex items-center gap-3 mb-2">
                      {info.icon}
                      <h3 className="text-lg font-semibold">{info.title}</h3>
                    </div>
                    <p className="text-white/90 text-sm">{info.description}</p>
                  </div>

                  {/* Maps Grid */}
                  <div className="grid gap-4">
                    {typeMaps.length > 0 ? (
                      typeMaps.map((map: WeatherMapData) => (
                        <Card key={map.id} className="overflow-hidden hover:shadow-lg transition-shadow">
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <span className="text-xl">
                                  {getRegionEmoji(map.region)}
                                </span>
                                <div>
                                  <h4 className="font-semibold capitalize">
                                    {map.region.replace('_', ' ')} Region
                                  </h4>
                                  <p className="text-sm text-gray-500">
                                    Updated: {map.timestamp.toLocaleString()}
                                  </p>
                                </div>
                              </div>
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                                Live Data
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {/* Map Preview */}
                            <div className="bg-gradient-to-br from-slate-100 to-slate-200 rounded-lg p-8 text-center mb-4">
                              <div className="mb-4">
                                <SatelliteIcon className="h-16 w-16 mx-auto text-slate-400" />
                              </div>
                              <h4 className="font-medium text-slate-700 mb-2">
                                {info.title} - {map.region.replace('_', ' ')}
                              </h4>
                              <p className="text-sm text-slate-500 mb-4">
                                Interactive map data available
                              </p>
                              <div className="text-xs text-slate-400 font-mono bg-slate-50 px-3 py-2 rounded border">
                                Data Source: {map.data_url}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex gap-2">
                              <Button variant="outline" className="flex-1">
                                <ExternalLinkIcon className="h-4 w-4 mr-2" />
                                View Full Map
                              </Button>
                              <Button variant="outline">
                                <RefreshCwIcon className="h-4 w-4" />
                              </Button>
                            </div>

                            {/* Map Info */}
                            <div className="mt-4 pt-4 border-t border-gray-200">
                              <div className="flex items-center justify-between text-sm text-gray-500">
                                <span>Map ID: #{map.id}</span>
                                <span>Created: {map.created_at.toLocaleDateString()}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <Card className="p-8 text-center">
                        <div className="text-4xl mb-4">🗺️</div>
                        <h4 className="font-semibold text-gray-900 mb-2">
                          No {mapType} maps available
                        </h4>
                        <p className="text-gray-600 mb-4">
                          {mapType} map data is currently unavailable for this region.
                        </p>
                        <Button variant="outline" size="sm" onClick={onRefresh}>
                          Try Refreshing
                        </Button>
                      </Card>
                    )}
                  </div>
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        {/* Footer Info */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-4">
              <span>Total maps: {maps.length}</span>
              <span>•</span>
              <span>Last refresh: {new Date().toLocaleTimeString()}</span>
            </div>
            <Button variant="ghost" size="sm">
              Map Settings
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}