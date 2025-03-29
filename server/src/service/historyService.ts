import fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';

class City {
  constructor(public name: string, public id: string = uuidv4()) {}
}

class HistoryService {
  private filePath = 'db/db.json';

  private async readFile(): Promise<City[]> {
    try {
      const data = await fs.readFile(this.filePath, { encoding: 'utf8' });
      return JSON.parse(data) as City[];
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File does not exist, return an empty array
        return [];
      }
      throw error;
    }
  }

  private async writeFile(cities: City[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(cities, null, 2));
  }

  async getCities(): Promise<City[]> {
    return await this.readFile();
  }

  async addCity(cityName: string): Promise<City> {
    if (!cityName) {
      throw new Error('City name cannot be empty');
    }

    const cities = await this.getCities();
    const existingCity = cities.find(city => city.name === cityName);

    if (existingCity) {
      return existingCity;
    }

    const newCity = new City(cityName);
    const updatedCities = [...cities, newCity];
    await this.writeFile(updatedCities);

    return newCity;
  }

  async removeCity(id: string): Promise<void> {
    const cities = await this.getCities();
    const filteredCities = cities.filter(city => city.id !== id);
    await this.writeFile(filteredCities);
  }
}

export default new HistoryService();