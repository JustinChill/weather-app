import fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
const DB_PATH = path.resolve('db/db.json');
class City {
    constructor(name, id) {
        this.name = name;
        this.id = id;
    }
}
class HistoryService {
    // Read JSON file, handling missing file errors
    async read() {
        try {
            const data = await fs.readFile(DB_PATH, 'utf8');
            return data ? JSON.parse(data) : [];
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return []; // If file doesn't exist, return empty array
            }
            console.error('Error reading the file:', error);
            throw error;
        }
    }
    // Write data to JSON file
    async write(cities) {
        try {
            await fs.writeFile(DB_PATH, JSON.stringify(cities, null, 2));
        }
        catch (error) {
            console.error('Error writing to the file:', error);
            throw error;
        }
    }
    // Get all cities from the database
    async getCities() {
        return this.read();
    }
    // Add a city if it does not already exist
    async addCity(cityName) {
        if (!cityName.trim()) {
            throw new Error('City cannot be empty');
        }
        const cities = await this.getCities();
        const normalizedCityName = cityName.toLowerCase();
        if (cities.some((city) => city.name.toLowerCase() === normalizedCityName)) {
            return cities.find((city) => city.name.toLowerCase() === normalizedCityName);
        }
        const newCity = new City(cityName, uuidv4());
        const updatedCities = [...cities, newCity];
        await this.write(updatedCities);
        return newCity;
    }
    // Remove a city by ID
    async removeCity(id) {
        const cities = await this.getCities();
        const filteredCities = cities.filter((city) => city.id !== id);
        if (filteredCities.length === cities.length) {
            return false; // No city was removed
        }
        await this.write(filteredCities);
        return true;
    }
}
export default new HistoryService();
