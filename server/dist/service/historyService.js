import fs from 'node:fs/promises';
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
    // Method to read from the db.json file
    async read() {
        return await fs.readFile('db/db.json', {
            flag: 'a+',
            encoding: 'utf8',
        });
    }
    // Method to write the updated cities array to the searchHistory.json file
    async write(cities) {
        return await fs.writeFile('db/db.json', JSON.stringify(cities));
    }
    // Method to get cities from the db.json file and return them as an array of City objects
    async getCities() {
        return await this.read().then((cities) => {
            let parsedCities;
            // If cities isn't an array or can't be turned into one, send back a new empty array
            try {
                parsedCities = [].concat(JSON.parse(cities));
            }
            catch (err) {
                parsedCities = [];
            }
            return parsedCities;
        });
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
    async removeCity(id) {
        return await this.getCities().then((cities) => cities.filter((city) => city.id !== id)).then((filteredCities) => this.write(filteredCities));
    }
}
export default new HistoryService();
