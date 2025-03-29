import fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import path from 'path';

// Manually define __dirname for ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.resolve(__dirname, '../../db/db.json');

class City {
  constructor(public name: string, public id: string) {}
}

class HistoryService {
  // Read JSON file, handling missing file errors
  private async read(): Promise<City[]> {
    try {
      const data = await fs.readFile(DB_PATH, 'utf8');
      return data ? JSON.parse(data) : [];
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return []; // If file doesn't exist, return an empty array
      }
      console.error('Error reading the file:', error);
      throw error;
    }
  }

  // Write data to JSON file
  private async write(cities: City[]): Promise<void> {
    try {
      await fs.writeFile(DB_PATH, JSON.stringify(cities, null, 2));
    } catch (error) {
      console.error('Error writing to the file:', error);
      throw error;
    }
  }

  async getCities(): Promise<City[]> {
    return this.read();
  }

  // Add a city if it does not already exist
  async addCity(cityName: string): Promise<City> {
    if (!cityName.trim()) {
      throw new Error('City cannot be empty');
    }

    const cities = await this.getCities();
    const normalizedCityName = cityName.toLowerCase();

    if (cities.some((city) => city.name.toLowerCase() === normalizedCityName)) {
      return cities.find((city) => city.name.toLowerCase() === normalizedCityName)!;
    }

    const newCity = new City(cityName, uuidv4());
    const updatedCities = [...cities, newCity];
    await this.write(updatedCities);

    return newCity;
  }

  // Remove a city by ID
  async removeCity(id: string): Promise<boolean> {
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