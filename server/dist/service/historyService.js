import fs from 'node:fs/promises';
import { v4 as uuidv4 } from 'uuid';
class City {
    constructor(name, id) {
        this.name = name;
        this.id = id;
    }
}
class HistoryService {
    constructor() {
        this.filePath = 'db/db.json';
    }
    async readFile() {
        try {
            return await fs.readFile(this.filePath, { encoding: 'utf8' });
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                // File does not exist, return an empty string
                return '[]';
            }
            throw error;
        }
    }
    async writeFile(cities) {
        await fs.writeFile(this.filePath, JSON.stringify(cities, null, 2));
    }
    async getCities() {
        const data = await this.readFile();
        try {
            return JSON.parse(data);
        }
        catch (error) {
            return [];
        }
    }
    async addCity(cityName) {
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
    async removeCity(id) {
        const cities = await this.getCities();
        const filteredCities = cities.filter(city => city.id !== id);
        await this.writeFile(filteredCities);
    }
}
export default new HistoryService();
