import fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';
import path from 'node:path';

class City {
  constructor(public name: string, public id: string = uuidv4()) {}
}

class HistoryService {
  private filePath = path.join(__dirname, 'db', 'db.json');

  private async ensureDirectoryExists(directoryPath: string): Promise<void> {
    try {
      await fs.access(directoryPath);
    } catch (error) {
      if (error.code === 'ENOENT') {
        await fs.mkdir(directoryPath, { recursive: true });
      } else {
        throw error;
      }
    }
  }

  private async readFile(): Promise<City[]> {
    try {
      await this.ensureDirectoryExists(path.dirname(this.filePath));
      const data = await fs.readFile(this.filePath, { encoding: 'utf8' });
      return JSON.parse(data) as City[];
    } catch (error) {
      if (error.code === 'ENOENT') {
        // File does not exist, return an empty array
        return [];
      }
      console.error('Error reading file:', error);
      throw new Error('Failed to read cities data');
    }
  }

  private async writeFile(cities: City[]): Promise<void> {
    try {
      await this.ensureDirectoryExists(path.dirname(this.filePath));
      await fs.writeFile(this.filePath, JSON.stringify(cities, null, 2));
    } catch (error) {
      console.error('Error writing file:', error);
      throw new Error('Failed to write cities data');
    }
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