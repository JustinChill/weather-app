import { type Request, type Response, Router } from "express";
const router = Router();

import HistoryService from "../../service/historyService.js";
import WeatherService from "../../service/weatherService.js";

router.post('/', async (req: Request, res: Response) => {
  try {
    const cityName = req.body.cityName;
    if (!cityName) {
      return res.status(400).json({ msg: "Invalid city name provided." });
    }
    const data = await WeatherService.getWeatherForCity(cityName);
    if (!data) {
      return res.status(404).json({ msg: `City "${cityName}" not found.` });
    }
    await HistoryService.addCity(cityName);
    return res.json(data); 
  } catch (error) {
    
    console.error(error);
    return res.status(500).json({ msg: "An error occurred while fetching weather data." });
  }
});

router.get("/history", async (__req: Request, res: Response) => {
  try {
    const savedCity = await HistoryService.getCities();
    res.json(savedCity);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// BONUS
router.delete("/history/:id", async (req: Request, res: Response) => {
  try {
    if (!req.params.id) {
      res.status(400).json({ msg: "City id is required." });
    }
    await HistoryService.removeCity(req.params.id);
    res.json({ success: "City successfully removed from search history." });
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

export default router;
