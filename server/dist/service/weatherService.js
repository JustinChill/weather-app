import dayjs from "dayjs";
import dotenv from "dotenv";
// import { parse } from "node:path";
dotenv.config();
// Define a class for the Weather object
class Weather {
    constructor(city, date, tempF, windSpeed, humidity, icon) {
        this.city = city;
        this.date = date;
        this.tempF = tempF;
        this.windSpeed = windSpeed;
        this.humidity = humidity;
        this.icon = icon;
    }
}
// Complete the WeatherService class
class WeatherService {
    constructor() {
        this.cityName = "";
        this.baseURL = process.env.API_BASE_URL || "https://api.openweathermap.org";
        this.apiKey = process.env.API_KEY || "b99742f7185b2bff77835b2f8962d034";
    }
    // Create fetchLocationData method
    async fetchLocationData(query) {
        try {
            if (!this.baseURL || !this.apiKey) {
                throw new Error("Key or URL not found.");
            }
            const response = await fetch(query).then((res) => res.json());
            return response[0];
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    }
    // Create destructureLocationData method
    destructureLocationData(locationData) {
        if (!locationData) {
            throw new Error("Location you're looking for doesn't exist, please put a valid city name.");
        }
        const { lat, lon } = locationData;
        const coordinates = {
            lat,
            lon,
        };
        return coordinates;
    }
    // Create buildGeocodeQuery method
    buildGeocodeQuery() {
        const geoQuery = `${this.baseURL}/geo/1.0/direct?q=${this.cityName}&appid=${this.apiKey}`;
        return geoQuery;
    }
    // Create buildWeatherQuery method
    buildWeatherQuery(coordinates) {
        const weatherQuery = `${this.baseURL}/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=imperial`;
        return weatherQuery;
    }
    // Create fetchAndDestructureLocationData method
    async fetchAndDestructureLocationData() {
        return await this.fetchLocationData(this.buildGeocodeQuery()).then((data) => this.destructureLocationData(data));
    }
    // Create fetchWeatherData method
    async fetchWeatherData(coordinates) {
        try {
            const response = await fetch(this.buildWeatherQuery(coordinates)).then((res) => res.json());
            if (!response) {
                throw new Error("Weather data not found");
            }
            const currentWeather = this.parseCurrentWeather(response.list[0]);
            const forecast = this.buildForecastArray(currentWeather, response.list);
            return forecast;
        }
        catch (error) {
            console.error(error);
            return error;
        }
    }
    // Build parseCurrentWeather method
    parseCurrentWeather(response) {
        const parsedDate = dayjs.unix(response.dt).format("M/D/YYYY");
        const currentWeather = new Weather(this.cityName, parsedDate, response.main.temp, response.wind.speed, response.main.humidity, response.weather[0].icon);
        return currentWeather;
    }
    // Complete buildForecastArray method
    buildForecastArray(currentWeather, weatherData) {
        const weatherForecast = [currentWeather];
        const filteredWeatherData = weatherData.filter((data) => {
            return data.dt_txt.includes("12:00:00");
        });
        for (const day of filteredWeatherData) {
            weatherForecast.push(new Weather(this.cityName, dayjs.unix(day.dt).format("M/D/YYYY"), day.main.temp, day.wind.speed, day.main.humidity, day.weather[0].icon));
        }
        return weatherForecast;
    }
    // Complete getWeatherForCity method
    async getWeatherForCity(city) {
        try {
            this.cityName = city;
            const coordinates = await this.fetchAndDestructureLocationData();
            if (coordinates) {
                const weather = await this.fetchWeatherData(coordinates);
                return weather;
            }
            throw new Error("Weather data not found");
        }
        catch (error) {
            console.error(error);
            throw error;
        }
    }
}
export default new WeatherService();
