const iconLabels = {
  "01d": "Clear day",
  "01n": "Clear night",
  "02d": "Few clouds",
  "02n": "Few clouds",
  "03d": "Scattered clouds",
  "03n": "Scattered clouds",
  "04d": "Broken clouds",
  "04n": "Broken clouds",
  "09d": "Shower rain",
  "09n": "Shower rain",
  "10d": "Rain",
  "10n": "Rain",
  "11d": "Thunderstorm",
  "11n": "Thunderstorm",
  "13d": "Snow",
  "13n": "Snow",
  "50d": "Mist",
  "50n": "Mist"
};

export function mapWeatherIcon(iconCode) {
  return {
    label: iconLabels[iconCode] || "Weather",
    url: `https://openweathermap.org/img/wn/${iconCode}@2x.png`
  };
}
