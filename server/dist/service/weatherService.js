import dayjs from "dayjs";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();
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
class WeatherService {
    constructor() {
        this.baseURL = process.env.API_BASE_URL || "";
        this.apiKey = process.env.API_KEY || "";
        this.cityName = "";
        if (!this.baseURL || !this.apiKey) {
            throw new Error("API configuration is missing. Please check your environment variables.");
        }
        // Log API configuration (without exposing the full API key)
        console.log('API Configuration:', {
            baseURL: this.baseURL,
            apiKeyLength: this.apiKey.length,
            apiKeyPrefix: this.apiKey.substring(0, 4) + '...'
        });
    }
    static getInstance() {
        if (!WeatherService.instance) {
            WeatherService.instance = new WeatherService();
        }
        return WeatherService.instance;
    }
    async fetchLocationData(query) {
        try {
            console.log('Fetching location data from:', query.replace(this.apiKey, 'API_KEY'));
            const response = await fetch(query);
            if (!response.ok) {
                const errorText = await response.text();
                console.error('Geocoding API error response:', errorText);
                throw new Error(`Geocoding API error: ${response.statusText} (${response.status})`);
            }
            const data = await response.json();
            if (!data.length) {
                throw new Error("Sorry, location not found. Please enter a valid city name.");
            }
            return data[0];
        }
        catch (error) {
            console.error('Geocoding API error details:', error);
            throw new Error(`Failed to fetch location data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    buildGeocodeQuery() {
        const query = `${this.baseURL}/geo/1.0/direct?q=${encodeURIComponent(this.cityName)}&appid=${this.apiKey}`;
        console.log('Built geocode query:', query.replace(this.apiKey, 'API_KEY'));
        return query;
    }
    buildWeatherQuery(coordinates) {
        return `${this.baseURL}/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=imperial`;
    }
    async fetchWeatherData(coordinates) {
        try {
            const response = await fetch(this.buildWeatherQuery(coordinates));
            if (!response.ok) {
                throw new Error(`Weather API error: ${response.statusText}`);
            }
            const data = await response.json();
            if (!data.list?.length) {
                throw new Error("Weather data not found");
            }
            const currentWeather = this.parseCurrentWeather(data.list[0]);
            return this.buildForecastArray(currentWeather, data.list);
        }
        catch (error) {
            console.error('Weather API error details:', error);
            throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
    parseCurrentWeather(response) {
        const parsedDate = dayjs.unix(response.dt).format("M/D/YYYY");
        return new Weather(this.cityName, parsedDate, response.main.temp, response.wind.speed, response.main.humidity, response.weather[0].icon);
    }
    buildForecastArray(currentWeather, weatherData) {
        const weatherForecast = [currentWeather];
        const filteredWeatherData = weatherData.filter((data) => data.dt_txt.includes("12:00:00"));
        for (const day of filteredWeatherData) {
            weatherForecast.push(new Weather(this.cityName, dayjs.unix(day.dt).format("M/D/YYYY"), day.main.temp, day.wind.speed, day.main.humidity, day.weather[0].icon));
        }
        return weatherForecast;
    }
    async getWeatherForCity(city) {
        try {
            this.cityName = city;
            const coordinates = await this.fetchLocationData(this.buildGeocodeQuery());
            return await this.fetchWeatherData(coordinates);
        }
        catch (error) {
            throw new Error(`Failed to get weather for ${city}: ${error instanceof Error ? error.message : 'Unknown error'}`);
        }
    }
}
export default WeatherService.getInstance();
