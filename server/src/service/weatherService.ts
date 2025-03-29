import dayjs, { Dayjs } from "dayjs";
import dotenv from "dotenv";
import fetch from "node-fetch";
dotenv.config();

interface Coordinates {
  lat: number;
  lon: number;
}

class Weather {
  constructor(
    public city: string,
    public date: Dayjs | string,
    public tempF: number,
    public windSpeed: number,
    public humidity: number,
    public icon: string,
    public iconDescription: string
  ) {}
}

class WeatherService {
  private static instance: WeatherService;
  private baseURL: string;
  private apiKey: string;
  private cityName: string;

  private constructor() {
    // Ensure environment variables are loaded
    if (!process.env.API_BASE_URL || !process.env.API_KEY) {
      console.error('Missing environment variables:', {
        hasBaseUrl: !!process.env.API_BASE_URL,
        hasApiKey: !!process.env.API_KEY
      });
      throw new Error("API configuration is missing. Please check your environment variables.");
    }

    this.baseURL = process.env.API_BASE_URL;
    this.apiKey = process.env.API_KEY;
    this.cityName = "";
    
    // Log API configuration (without exposing the full API key)
    console.log('API Configuration:', {
      baseURL: this.baseURL,
      apiKeyLength: this.apiKey.length,
      apiKeyPrefix: this.apiKey.substring(0, 4) + '...',
      environment: process.env.NODE_ENV
    });
  }

  public static getInstance(): WeatherService {
    if (!WeatherService.instance) {
      WeatherService.instance = new WeatherService();
    }
    return WeatherService.instance;
  }

  private async fetchLocationData(query: string): Promise<Coordinates> {
    try {
      console.log('Fetching location data from:', query.replace(this.apiKey, 'API_KEY'));
      const response = await fetch(query);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Geocoding API error response:', {
          status: response.status,
          statusText: response.statusText,
          error: errorText
        });
        throw new Error(`Geocoding API error: ${response.statusText} (${response.status})`);
      }
      
      const data: Coordinates[] = await response.json();
      if (!data.length) {
        throw new Error("Sorry, location not found. Please enter a valid city name.");
      }
      return data[0];
    } catch (error) {
      console.error('Geocoding API error details:', error);
      throw new Error(`Failed to fetch location data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private buildGeocodeQuery(): string {
    const query = `${this.baseURL}/geo/1.0/direct?q=${encodeURIComponent(this.cityName)}&appid=${this.apiKey}`;
    console.log('Built geocode query:', query.replace(this.apiKey, 'API_KEY'));
    return query;
  }

  private buildWeatherQuery(coordinates: Coordinates): string {
    return `${this.baseURL}/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=imperial`;
  }

  private async fetchWeatherData(coordinates: Coordinates): Promise<Weather[]> {
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
    } catch (error) {
      console.error('Weather API error details:', error);
      throw new Error(`Failed to fetch weather data: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private parseCurrentWeather(response: any): Weather {
    const parsedDate = dayjs.unix(response.dt).format("M/D/YYYY");
    return new Weather(
      this.cityName,
      parsedDate,
      response.main.temp,
      response.wind.speed,
      response.main.humidity,
      response.weather[0].icon,
      response.weather[0].description
    );
  }

  private buildForecastArray(currentWeather: Weather, weatherData: any[]): Weather[] {
    const weatherForecast: Weather[] = [currentWeather];
    const filteredWeatherData = weatherData.filter((data) => data.dt_txt.includes("12:00:00"));
    for (const day of filteredWeatherData) {
      weatherForecast.push(
        new Weather(
          this.cityName,
          dayjs.unix(day.dt).format("M/D/YYYY"),
          day.main.temp,
          day.wind.speed,
          day.main.humidity,
          day.weather[0].icon,
          day.weather[0].description
        )
      );
    }
    return weatherForecast;
  }

  public async getWeatherForCity(city: string): Promise<Weather[]> {
    try {
      this.cityName = city;
      const coordinates = await this.fetchLocationData(this.buildGeocodeQuery());
      return await this.fetchWeatherData(coordinates);
    } catch (error) {
      throw new Error(`Failed to get weather for ${city}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

export default WeatherService.getInstance();