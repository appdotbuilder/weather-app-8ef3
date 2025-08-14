import { type City } from '../schema';

export const getAllCities = async (): Promise<City[]> => {
    // This is a placeholder declaration! Real code should be implemented here.
    // The goal of this handler is to fetch all cities from the database.
    // Should return cities ordered by name for better user experience.
    return Promise.resolve([
        {
            id: 1,
            name: 'New York',
            country: 'United States',
            latitude: 40.7128,
            longitude: -74.0060,
            created_at: new Date()
        },
        {
            id: 2,
            name: 'London',
            country: 'United Kingdom',
            latitude: 51.5074,
            longitude: -0.1278,
            created_at: new Date()
        }
    ] as City[]);
};