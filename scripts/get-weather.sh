#!/bin/bash
# get-weather.sh — Get Toronto weather from Open-Meteo (free, no API key, reliable)
# Output: JSON with current conditions + today/tomorrow forecast
# Replaces flaky wttr.in dependency

set -uo pipefail

LAT=43.65
LON=-79.38
TZ="America/New_York"

# WMO weather code descriptions
wmo_desc() {
  case "$1" in
    0) echo "Clear sky" ;; 1) echo "Mainly clear" ;; 2) echo "Partly cloudy" ;; 3) echo "Overcast" ;;
    45|48) echo "Foggy" ;;
    51|53|55) echo "Drizzle" ;;
    61) echo "Light rain" ;; 63) echo "Moderate rain" ;; 65) echo "Heavy rain" ;;
    66|67) echo "Freezing rain" ;;
    71) echo "Light snow" ;; 73) echo "Moderate snow" ;; 75) echo "Heavy snow" ;;
    77) echo "Snow grains" ;;
    80|81|82) echo "Rain showers" ;;
    85|86) echo "Snow showers" ;;
    95|96|99) echo "Thunderstorm" ;;
    *) echo "Unknown" ;;
  esac
}

# Fetch from Open-Meteo
RAW=$(curl -sf --max-time 10 \
  "https://api.open-meteo.com/v1/forecast?latitude=${LAT}&longitude=${LON}&current=temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max&temperature_unit=celsius&wind_speed_unit=kmh&timezone=${TZ}&forecast_days=2" 2>/dev/null)

if [[ -z "$RAW" ]]; then
  echo '{"error":"Weather API unavailable","raw":"","condition":"Unknown","temp":"N/A","feels_like":"N/A","wind":"N/A","humidity":"N/A","forecast_today":"","forecast_tomorrow":""}'
  exit 1
fi

# Parse current conditions
TEMP=$(echo "$RAW" | jq -r '.current.temperature_2m')
FEELS=$(echo "$RAW" | jq -r '.current.apparent_temperature')
HUMID=$(echo "$RAW" | jq -r '.current.relative_humidity_2m')
WIND=$(echo "$RAW" | jq -r '.current.wind_speed_10m')
CODE=$(echo "$RAW" | jq -r '.current.weather_code')
PRECIP=$(echo "$RAW" | jq -r '.current.precipitation')
CONDITION=$(wmo_desc "$CODE")

# Parse daily forecasts
TODAY_HIGH=$(echo "$RAW" | jq -r '.daily.temperature_2m_max[0]')
TODAY_LOW=$(echo "$RAW" | jq -r '.daily.temperature_2m_min[0]')
TODAY_CODE=$(echo "$RAW" | jq -r '.daily.weather_code[0]')
TODAY_PRECIP=$(echo "$RAW" | jq -r '.daily.precipitation_sum[0]')
TODAY_PRECIP_PROB=$(echo "$RAW" | jq -r '.daily.precipitation_probability_max[0]')
TODAY_COND=$(wmo_desc "$TODAY_CODE")

TOMORROW_HIGH=$(echo "$RAW" | jq -r '.daily.temperature_2m_max[1]')
TOMORROW_LOW=$(echo "$RAW" | jq -r '.daily.temperature_2m_min[1]')
TOMORROW_CODE=$(echo "$RAW" | jq -r '.daily.weather_code[1]')
TOMORROW_PRECIP=$(echo "$RAW" | jq -r '.daily.precipitation_sum[1]')
TOMORROW_PRECIP_PROB=$(echo "$RAW" | jq -r '.daily.precipitation_probability_max[1]')
TOMORROW_COND=$(wmo_desc "$TOMORROW_CODE")

# Format human-readable strings
WEATHER_RAW="${CONDITION} ${TEMP}°C (feels ${FEELS}°C) Wind: ${WIND}km/h Humidity: ${HUMID}%"
FORECAST_TODAY="${TODAY_COND}, High ${TODAY_HIGH}°C / Low ${TODAY_LOW}°C, Precip: ${TODAY_PRECIP}mm (${TODAY_PRECIP_PROB}% chance)"
FORECAST_TOMORROW="${TOMORROW_COND}, High ${TOMORROW_HIGH}°C / Low ${TOMORROW_LOW}°C, Precip: ${TOMORROW_PRECIP}mm (${TOMORROW_PRECIP_PROB}% chance)"

# Output JSON
jq -n \
  --arg raw "$WEATHER_RAW" \
  --arg condition "$CONDITION" \
  --arg temp "${TEMP}°C" \
  --arg feels_like "${FEELS}°C" \
  --arg wind "${WIND} km/h" \
  --arg humidity "${HUMID}%" \
  --arg precipitation "${PRECIP} mm" \
  --arg forecast_today "$FORECAST_TODAY" \
  --arg forecast_tomorrow "$FORECAST_TOMORROW" \
  --arg today_high "${TODAY_HIGH}°C" \
  --arg today_low "${TODAY_LOW}°C" \
  --arg tomorrow_high "${TOMORROW_HIGH}°C" \
  --arg tomorrow_low "${TOMORROW_LOW}°C" \
  '{
    raw: $raw,
    condition: $condition,
    temp: $temp,
    feels_like: $feels_like,
    wind: $wind,
    humidity: $humidity,
    precipitation: $precipitation,
    forecast_today: $forecast_today,
    forecast_tomorrow: $forecast_tomorrow,
    today_high: $today_high,
    today_low: $today_low,
    tomorrow_high: $tomorrow_high,
    tomorrow_low: $tomorrow_low
  }'
