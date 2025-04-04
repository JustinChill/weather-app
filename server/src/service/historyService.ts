import fs from 'node:fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

// Define a City class with name and id properties
class City {
  name: string;
  id: string;

  constructor(name: string, id: string) {
    this.name = name;
    this.id = id;
  }
}

// Complete the HistoryService class
class HistoryService {
  private dbPath: string;

  constructor() {
    // Get the absolute path to the db directory
    const dbDir = path.join(process.cwd(), 'db');
    this.dbPath = path.join(dbDir, 'db.json');
    
    console.log('Database path:', this.dbPath);
  }

  // Method to ensure db directory and file exist
  private async ensureDbExists() {
    try {
      // Create db directory if it doesn't exist
      await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
      
      // Check if db.json exists
      try {
        await fs.access(this.dbPath);
      } catch {
        // If file doesn't exist, create it with empty array
        await fs.writeFile(this.dbPath, '[]', 'utf8');
        console.log('Created new database file at:', this.dbPath);
      }
    } catch (error) {
      console.error('Error ensuring db exists:', error);
      // In serverless environment, we might not be able to write to the filesystem
      // In this case, we'll just log the error but continue
      if (process.env.NETLIFY) {
        console.warn('Running in Netlify environment, database operations may be limited');
        return;
      }
      throw new Error('Failed to initialize database');
    }
  }

  // Method to read from the db.json file
  private async read() {
    await this.ensureDbExists();
    try {
      const data = await fs.readFile(this.dbPath, {
        flag: 'a+',
        encoding: 'utf8',
      });
      return data || '[]'; // Return empty array string if file is empty
    } catch (error) {
      console.error('Error reading database:', error);
      // In Netlify environment, return empty array
      if (process.env.NETLIFY) {
        return '[]';
      }
      return '[]';
    }
  }

  // Method to write the updated cities array to the db.json file
  private async write(cities: City[]) {
    try {
      // In Netlify environment, we might not be able to write to the filesystem
      if (process.env.NETLIFY) {
        console.warn('Running in Netlify environment, database operations are disabled');
        return;
      }
      
      await this.ensureDbExists();
      await fs.writeFile(this.dbPath, JSON.stringify(cities, null, 2));
    } catch (error) {
      console.error('Error writing to database:', error);
      // In Netlify environment, we'll just log the error but continue
      if (process.env.NETLIFY) {
        console.warn('Running in Netlify environment, database operations are disabled');
        return;
      }
      throw new Error('Failed to save city history');
    }
  }

  // Method to get cities from the db.json file and return them as an array of City objects
  async getCities(): Promise<City[]> {
    try {
      const data = await this.read();
      const parsedCities = JSON.parse(data);
      return Array.isArray(parsedCities) ? parsedCities : [];
    } catch (error) {
      console.error('Error reading cities:', error);
      return [];
    }
  }

  // Method to add a city to the db.json file
  async addCity(city: string) {
    if (!city) {
      throw new Error('City cannot be empty');
    }
    const newCity: City = { name: city, id: uuidv4() };
    
    // In Netlify environment, just return the new city without saving
    if (process.env.NETLIFY) {
      console.warn('Running in Netlify environment, city history is not being saved');
      return newCity;
    }

    return await this.getCities()
      .then((cities) => {
        if (cities.find((index) => index.name === city)) {
          return cities;
        }
        return [...cities, newCity];
      })
      .then((updatedCitites) => this.write(updatedCitites))
      .then(() => newCity);
  }

  // Method to remove a city from the db.json file by id
  async removeCity(id: string): Promise<boolean> {
    // In Netlify environment, just return true without saving
    if (process.env.NETLIFY) {
      console.warn('Running in Netlify environment, city deletion is not being saved');
      return true;
    }

    const cities = await this.getCities();
    const filteredCities = cities.filter((city) => city.id !== id);
  
    if (cities.length === filteredCities.length) {
      return false; // No city was removed
    }
  
    await this.write(filteredCities);
    return true; // City was removed successfully
  }
}

export default new HistoryService();