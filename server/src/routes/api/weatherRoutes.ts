import { type Request, type Response, Router } from "express";
const router = Router();

//internall
import HistoryService from "../../service/historyService.js";
import WeatherService from "../../service/weatherService.js";

// POST Request with city name to retrieve weather data
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

    return res.json(data); // Explicitly return the JSON response
  } catch (error) {
    console.error(error);
    return res.status(500).json({ msg: "An error occurred while fetching weather data." });
  }
});

// GET search history
router.get("/history", async (__req: Request, res: Response) => {
  try {
    const savedCity = await HistoryService.getCities();
    res.json(savedCity);
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

// * BONUS DELETE city from search history
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
