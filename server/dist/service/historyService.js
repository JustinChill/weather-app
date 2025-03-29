import fs from 'node:fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
// Define a City class with name and id properties
class City {
    constructor(name, id) {
        this.name = name;
        this.id = id;
    }
}
// Complete the HistoryService class
class HistoryService {
    constructor() {
        // Get the absolute path to the db directory
        const dbDir = path.join(process.cwd(), 'db');
        this.dbPath = path.join(dbDir, 'db.json');
    }
    // Method to ensure db directory and file exist
    async ensureDbExists() {
        try {
            // Create db directory if it doesn't exist
            await fs.mkdir(path.dirname(this.dbPath), { recursive: true });
            // Check if db.json exists
            try {
                await fs.access(this.dbPath);
            }
            catch {
                // If file doesn't exist, create it with empty array
                await fs.writeFile(this.dbPath, '[]', 'utf8');
            }
        }
        catch (error) {
            console.error('Error ensuring db exists:', error);
            throw new Error('Failed to initialize database');
        }
    }
    // Method to read from the db.json file
    async read() {
        await this.ensureDbExists();
        try {
            const data = await fs.readFile(this.dbPath, {
                flag: 'a+',
                encoding: 'utf8',
            });
            return data || '[]'; // Return empty array string if file is empty
        }
        catch (error) {
            console.error('Error reading database:', error);
            return '[]';
        }
    }
    // Method to write the updated cities array to the db.json file
    async write(cities) {
        await this.ensureDbExists();
        try {
            await fs.writeFile(this.dbPath, JSON.stringify(cities, null, 2));
        }
        catch (error) {
            console.error('Error writing to database:', error);
            throw new Error('Failed to save city history');
        }
    }
    // Method to get cities from the db.json file and return them as an array of City objects
    async getCities() {
        try {
            const data = await this.read();
            const parsedCities = JSON.parse(data);
            return Array.isArray(parsedCities) ? parsedCities : [];
        }
        catch (error) {
            console.error('Error reading cities:', error);
            return [];
        }
    }
    // Method to add a city to the db.json file
    async addCity(city) {
        if (!city) {
            throw new Error('City cannot be empty');
        }
        const newCity = { name: city, id: uuidv4() };
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
    // BONUS: Method to remove a city from the db.json file by id
    // async removeCity(id: string){
    //   return await this.getCities().then((cities) => cities.filter((city) => city.id !== id)).then((filteredCities) => this.write(filteredCities));
    // }
    async removeCity(id) {
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
