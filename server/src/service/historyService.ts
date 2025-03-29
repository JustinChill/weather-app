import fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';

class City {
  constructor(public name: string, public id: string) {}
}

class HistoryService {
  private filePath = 'db/db.json';

  private async readFile(): Promise<string> {
    try {
      return await fs.readFile(this.filePath, { encoding: 'utf8' });
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File does not exist, return an empty string
        return '[]';
      }
      throw error;
    }
  }

  private async writeFile(cities: City[]): Promise<void> {
    await fs.writeFile(this.filePath, JSON.stringify(cities, null, 2));
  }

  async getCities(): Promise<City[]> {
    const data = await this.readFile();
    try {
      return JSON.parse(data) as City[];
    } catch (error) {
      return [];
    }
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

    const newCity = new City(cityName, uuidv4());
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