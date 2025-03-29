import dayjs, { Dayjs } from "dayjs";
import dotenv from "dotenv";
import fetch from "node-fetch"; // Required for Node.js versions below 18
dotenv.config();

interface Coordinates {
  lat: number;
  lon: number;
}

interface WeatherApiResponse {
  list: {
    dt: number;
    dt_txt: string;
    main: {
      temp: number;
      humidity: number;
    };
    wind: {
      speed: number;
    };
    weather: {
      icon: string;
    }[];
  }[];
}

class Weather {
  constructor(
    public city: string,
    public date: Dayjs | string,
    public tempF: number,
    public windSpeed: number,
    public humidity: number,
    public icon: string
  ) {}
}

class WeatherService {
  private baseURL: string;
  private apiKey: string;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || "";
    this.apiKey = process.env.API_KEY || "";
    if (!this.baseURL || !this.apiKey) {
      throw new Error("API base URL or API key is missing. Check your .env file.");
    }
  }

  private async fetchJSON<T>(url: string): Promise<T> {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      return (await response.json()) as T;
    } catch (error) {
      console.error("Error fetching data:", error);
      throw new Error("Failed to fetch data from the API.");
    }
  }

  private async getCoordinates(city: string): Promise<Coordinates> {
    const url = `${this.baseURL}/geo/1.0/direct?q=${encodeURIComponent(city)}&appid=${this.apiKey}`;
    const response = await this.fetchJSON<Coordinates[]>(url);
    if (!response.length) {
      throw new Error(`Location "${city}" not found.`);
    }
    return response[0];
  }

  private async getWeatherData(coordinates: Coordinates): Promise<WeatherApiResponse> {
    const url = `${this.baseURL}/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=imperial`;
    return this.fetchJSON<WeatherApiResponse>(url);
  }

  private parseWeather(data: WeatherApiResponse, city: string): Weather[] {
    if (!data.list.length) {
      throw new Error("Weather data not found.");
    }

    const weatherForecast: Weather[] = [];
    
    for (const entry of data.list) {
      if (entry.dt_txt.includes("12:00:00") || weatherForecast.length === 0) {
        weatherForecast.push(
          new Weather(
            city,
            dayjs.unix(entry.dt).format("M/D/YYYY"),
            entry.main.temp,
            entry.wind.speed,
            entry.main.humidity,
            entry.weather[0].icon
          )
        );
      }
    }

    return weatherForecast;
  }

  async getWeatherForCity(city: string): Promise<Weather[]> {
    const coordinates = await this.getCoordinates(city);
    const weatherData = await this.getWeatherData(coordinates);
    return this.parseWeather(weatherData, city);
  }
}

export default new WeatherService();