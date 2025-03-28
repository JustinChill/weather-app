import dayjs, { Dayjs } from "dayjs";
import dotenv from "dotenv";

dotenv.config();

interface Coordinates {
  lat: number;
  lon: number;
}

class Weather {
  city: string;
  date: Dayjs | string;
  tempF: number;
  windSpeed: number;
  humidity: number;
  icon: string;

  constructor(
    city: string,
    date: Dayjs | string,
    tempF: number,
    windSpeed: number,
    humidity: number,
    icon: string
  ) {
    this.city = city;
    this.date = date;
    this.tempF = tempF;
    this.windSpeed = windSpeed;
    this.humidity = humidity;
    this.icon = icon;
  }
}

class WeatherService {
  private baseURL: string;
  private apiKey: string;
  private cityName: string;

  constructor() {
    this.baseURL = process.env.API_BASE_URL || "";
    this.apiKey = process.env.API_KEY || "";
    this.cityName = "";
  }

  private async fetchLocationData(query: string): Promise<Coordinates> {
    try {
      if (!this.baseURL || !this.apiKey) {
        throw new Error("API key or base URL not found.");
      }
      const response: Coordinates[] = await fetch(query).then((res) => res.json());
      return response[0];
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  private destructureLocationData(locationData: Coordinates): Coordinates {
    if (!locationData) {
      throw new Error("Location not found. Please enter a valid city name.");
    }
    const { lat, lon } = locationData;
    return { lat, lon };
  }

  private buildGeocodeQuery(): string {
    return `${this.baseURL}/geo/1.0/direct?q=${this.cityName}&appid=${this.apiKey}`;
  }

  private buildWeatherQuery(coordinates: Coordinates): string {
    return `${this.baseURL}/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=imperial`;
  }

  private async fetchAndDestructureLocationData(): Promise<Coordinates> {
    const data = await this.fetchLocationData(this.buildGeocodeQuery());
    return this.destructureLocationData(data);
  }

  private async fetchWeatherData(coordinates: Coordinates): Promise<Weather[]> {
    try {
      const response = await fetch(this.buildWeatherQuery(coordinates)).then((res) => res.json());
      if (!response) {
        throw new Error("Weather data not found");
      }
      const currentWeather = this.parseCurrentWeather(response.list[0]);
      return this.buildForecastArray(currentWeather, response.list);
    } catch (error) {
      console.error(error);
      throw error;
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
      response.weather[0].icon
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
          day.weather[0].icon
        )
      );
    }
    return weatherForecast;
  }

  async getWeatherForCity(city: string): Promise<Weather[]> {
    try {
      this.cityName = city;
      const coordinates = await this.fetchAndDestructureLocationData();
      return await this.fetchWeatherData(coordinates);
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}

export default new WeatherService();
