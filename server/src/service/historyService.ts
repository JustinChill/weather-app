import fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';

const DB_PATH = path.resolve(__dirname, 'db/db.json');

// Define a City class with name and id properties
class City {
  name: string;
  id: string;

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }
}

class HistoryService {
  // Read JSON file, handling errors gracefully
  private async read(): Promise<City[]> {
    try {
      const data = await fs.readFile(DB_PATH, 'utf8');
      return data ? JSON.parse(data) : [];
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        return []; // Return an empty array if file doesn't exist
      }
      console.error('Error reading the file:', error);
      throw error;
    }
  }

  // Write updated data back to the file
  private async write(cities: City[]): Promise<void> {
    try {
      await fs.writeFile(DB_PATH, JSON.stringify(cities, null, 2));
    } catch (error) {
      console.error('Error writing to the file:', error);
      throw error;
    }
  }

  // Retrieve stored cities
  async getCities(): Promise<City[]> {
    return this.read();
  }

  // Add a city if it doesn't already exist
  async addCity(cityName: string): Promise<City> {
    if (!cityName.trim()) {
      throw new Error('City cannot be empty');
    }

    const cities = await this.getCities();
    if (cities.some((city) => city.name.toLowerCase() === cityName.toLowerCase())) {
      return cities.find((city) => city.name.toLowerCase() === cityName.toLowerCase())!;
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