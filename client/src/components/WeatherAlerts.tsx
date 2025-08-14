import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  AlertTriangleIcon, 
  ThermometerIcon, 
  CloudRainIcon, 
  SnowflakeIcon, 
  WindIcon, 
  ZapIcon, 
  CloudIcon,
  ClockIcon,
  CheckCircleIcon
} from 'lucide-react';
import type { WeatherAlert } from '../../../server/src/schema';

interface WeatherAlertsProps {
  alerts: WeatherAlert[];
  cityName: string;
  isLoading?: boolean;
}

export function WeatherAlerts({ alerts, cityName, isLoading = false }: WeatherAlertsProps) {
  // Get alert type icon
  const getAlertIcon = (type: string) => {
    const iconMap: Record<string, React.ReactElement> = {
      'extreme_heat': <ThermometerIcon className="h-4 w-4 text-red-600" />,
      'extreme_cold': <SnowflakeIcon className="h-4 w-4 text-blue-600" />,
      'heavy_rain': <CloudRainIcon className="h-4 w-4 text-blue-700" />,
      'heavy_snow': <SnowflakeIcon className="h-4 w-4 text-blue-300" />,
      'strong_winds': <WindIcon className="h-4 w-4 text-gray-600" />,
      'thunderstorm': <ZapIcon className="h-4 w-4 text-purple-600" />,
      'fog': <CloudIcon className="h-4 w-4 text-gray-500" />
    };
    return iconMap[type] || <AlertTriangleIcon className="h-4 w-4" />;
  };

  // Get alert severity styling
  const getAlertSeverityStyle = (severity: string) => {
    const styleMap: Record<string, {
      badgeClass: string;
      borderClass: string;
      bgClass: string;
    }> = {
      'low': {
        badgeClass: 'bg-blue-100 text-blue-800 border-blue-200',
        borderClass: 'border-l-blue-500',
        bgClass: 'bg-blue-50/50'
      },
      'moderate': {
        badgeClass: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        borderClass: 'border-l-yellow-500',
        bgClass: 'bg-yellow-50/50'
      },
      'high': {
        badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
        borderClass: 'border-l-orange-500',
        bgClass: 'bg-orange-50/50'
      },
      'extreme': {
        badgeClass: 'bg-red-100 text-red-800 border-red-200',
        borderClass: 'border-l-red-500',
        bgClass: 'bg-red-50/50'
      }
    };
    return styleMap[severity] || styleMap['moderate'];
  };

  // Get alert type emoji
  const getAlertEmoji = (type: string): string => {
    const emojiMap: Record<string, string> = {
      'extreme_heat': '🔥',
      'extreme_cold': '🧊',
      'heavy_rain': '🌧️',
      'heavy_snow': '❄️',
      'strong_winds': '💨',
      'thunderstorm': '⚡',
      'fog': '🌫️'
    };
    return emojiMap[type] || '⚠️';
  };

  // Calculate time remaining
  const getTimeRemaining = (endTime: Date | null): string => {
    if (!endTime) return 'Ongoing';
    
    const now = new Date();
    const diff = endTime.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 24) {
      const days = Math.floor(hours / 24);
      return `${days} day${days > 1 ? 's' : ''} remaining`;
    }
    
    if (hours > 0) {
      return `${hours}h ${minutes}m remaining`;
    }
    
    return `${minutes}m remaining`;
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangleIcon className="h-5 w-5 animate-pulse" />
            Loading Alerts...
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <div className="animate-pulse text-3xl mb-3">⚠️</div>
            <p className="text-gray-500">Checking for weather alerts...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircleIcon className="h-5 w-5 text-green-600" />
            Weather Alerts - {cityName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="text-4xl mb-4">✅</div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No Active Alerts
            </h3>
            <p className="text-gray-600">
              Current weather conditions are normal. We'll notify you if any alerts are issued.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangleIcon className="h-5 w-5 text-orange-500 alert-pulse" />
          Active Weather Alerts - {cityName}
        </CardTitle>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="text-orange-700 border-orange-300">
            {alerts.length} Active Alert{alerts.length > 1 ? 's' : ''}
          </Badge>
          <span className="text-sm text-gray-500">
            Stay informed and take necessary precautions
          </span>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {alerts.map((alert: WeatherAlert, index: number) => {
            const styles = getAlertSeverityStyle(alert.severity);
            const timeRemaining = getTimeRemaining(alert.end_time);
            
            return (
              <Alert 
                key={alert.id} 
                className={`border-l-4 ${styles.borderClass} ${styles.bgClass} relative`}
              >
                <div className="absolute top-3 right-3">
                  <div className="text-2xl">
                    {getAlertEmoji(alert.type)}
                  </div>
                </div>
                
                {getAlertIcon(alert.type)}
                
                <div className="flex-1 pr-12">
                  <div className="flex items-center justify-between mb-3">
                    <AlertTitle className="text-lg font-semibold pr-2">
                      {alert.title}
                    </AlertTitle>
                    <Badge className={styles.badgeClass}>
                      {alert.severity.toUpperCase()}
                    </Badge>
                  </div>
                  
                  <AlertDescription className="text-gray-700 mb-4 leading-relaxed">
                    {alert.description}
                  </AlertDescription>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        <span>Started: {alert.start_time.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="font-medium">{timeRemaining}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">
                        Alert Type: {alert.type.replace('_', ' ').toUpperCase()} • 
                        ID: #{alert.id}
                      </div>
                      
                      {alert.severity === 'extreme' && (
                        <Button size="sm" variant="outline" className="text-xs">
                          Emergency Info
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </Alert>
            );
          })}
        </div>
        
        {/* Summary Footer */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              Last updated: {new Date().toLocaleString()}
            </span>
            <Button variant="ghost" size="sm">
              View All Alerts History
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}