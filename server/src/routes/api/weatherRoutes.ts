import { type Request, type Response, Router } from "express";
const router = Router();

import HistoryService from "../../service/historyService.js";
import WeatherService from "../../service/weatherService.js";

router.post("/", async (req: Request, res: Response) => {
  try {
    const { cityName } = req.body;
    if (!cityName) {
      return res.status(400).json({ message: "Invalid city name provided." });
    }

    const data = await WeatherService.getWeatherForCity(cityName);
    await HistoryService.addCity(cityName);
    
    return res.json(data);
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return res.status(500).json({ message: "An error occurred while fetching weather data." });
  }
});

router.get("/history", async (_req: Request, res: Response) => {
  try {
    const savedCities = await HistoryService.getCities();
    return res.json(savedCities);
  } catch (error) {
    console.error("Error fetching history:", error);
    return res.status(500).json({ message: "An error occurred while fetching history." });
  }
});

// BONUS: Remove a city from search history
router.delete("/history/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({ message: "City ID is required." });
    }

    const success = await HistoryService.removeCity(id);
    if (!success) {
      return res.status(404).json({ message: "City not found in search history." });
    }

    return res.json({ message: "City successfully removed from search history." });
  } catch (error) {
    console.error("Error removing city from history:", error);
    return res.status(500).json({ message: "An error occurred while removing city from history." });
  }
});

export default router;