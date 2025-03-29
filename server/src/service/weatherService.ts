import dayjs, { Dayjs } from "dayjs";
import dotenv from "dotenv";
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
    public icon: string
  ) {}
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
    if (!this.baseURL || !this.apiKey) {
      throw new Error("API key or base URL not found.");
    }
    const response: Coordinates[] = await fetch(query).then((res) => res.json());
    if (!response.length) {
      throw new Error("Sorry, location not found. Please enter a valid city name.");
    }
    return response[0];
  }

  private buildGeocodeQuery(): string {
    return `${this.baseURL}/geo/1.0/direct?q=${encodeURIComponent(this.cityName)}&appid=${this.apiKey}`;
  }

  private buildWeatherQuery(coordinates: Coordinates): string {
    return `${this.baseURL}/data/2.5/forecast?lat=${coordinates.lat}&lon=${coordinates.lon}&appid=${this.apiKey}&units=imperial`;
  }

  private async fetchWeatherData(coordinates: Coordinates): Promise<Weather[]> {
    const response = await fetch(this.buildWeatherQuery(coordinates)).then((res) => res.json());
    if (!response.list.length) {
      throw new Error("Weather data not found");
    }
    const currentWeather = this.parseCurrentWeather(response.list[0]);
    return this.buildForecastArray(currentWeather, response.list);
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
    this.cityName = city;
    const coordinates = await this.fetchLocationData(this.buildGeocodeQuery());
    return await this.fetchWeatherData(coordinates);
  }
}

export default new WeatherService();