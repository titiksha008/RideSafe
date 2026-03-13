import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  MapContainer,
  TileLayer,
  Marker,
  Polyline,
  useMap,
} from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "../styles/ride.css";
import Navbar from "../components/Navbar";

const TRAFFIC_MULTIPLIER = 1.4;

function MapUpdater({ center }) {
  const map = useMap();
  React.useEffect(() => {
    if (center) map.setView(center, 14);
  }, [center]);
  return null;
}

function haversine(a, b) {
  const R = 6371;
  const dLat = ((b[0] - a[0]) * Math.PI) / 180;
  const dLng = ((b[1] - a[1]) * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a[0] * Math.PI) / 180) *
      Math.cos((b[0] * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function closestRouteIndex(routeCoords, point) {
  let minDist = Infinity;
  let minIdx = 0;
  routeCoords.forEach((coord, i) => {
    const d = haversine(coord, point);
    if (d < minDist) { minDist = d; minIdx = i; }
  });
  return minIdx;
}

function buildCumulativeDistances(routeCoords) {
  const dists = [0];
  for (let i = 1; i < routeCoords.length; i++) {
    dists.push(dists[i - 1] + haversine(routeCoords[i - 1], routeCoords[i]));
  }
  return dists;
}

async function getPoliceStationsAlongRoute(routeCoords, totalEtaMin, totalDistKm) {
  const lats = routeCoords.map((c) => c[0]);
  const lngs = routeCoords.map((c) => c[1]);
  const minLat = (Math.min(...lats) - 0.01).toFixed(6);
  const maxLat = (Math.max(...lats) + 0.01).toFixed(6);
  const minLng = (Math.min(...lngs) - 0.01).toFixed(6);
  const maxLng = (Math.max(...lngs) + 0.01).toFixed(6);

  const query = `[out:json][timeout:15];(node["amenity"="police"](${minLat},${minLng},${maxLat},${maxLng}););out body;`;

  try {
    const res = await axios.post(
      "https://overpass-api.de/api/interpreter",
      query,
      { headers: { "Content-Type": "text/plain" }, timeout: 15000 }
    );

    const nodes = res.data?.elements || [];
    if (nodes.length === 0) return [];

    const cumDists = buildCumulativeDistances(routeCoords);
    const totalRouteDist = cumDists[cumDists.length - 1];

    const stations = nodes.map((node) => {
      const idx = closestRouteIndex(routeCoords, [node.lat, node.lon]);
      const distFromStart = cumDists[idx];
      const etaAtStation = Math.round((distFromStart / totalRouteDist) * totalEtaMin);
      const name = node.tags?.name || node.tags?.["name:en"] || "Police Station";
      return { name, etaAtStation, distFromStart };
    });

    const filtered = stations.filter((s) => {
      const stationNode = nodes.find(
        (n) => Math.round((cumDists[closestRouteIndex(routeCoords, [n.lat, n.lon])] / totalRouteDist) * totalEtaMin) === s.etaAtStation
      );
      if (!stationNode) return true;
      const closestIdx = closestRouteIndex(routeCoords, [stationNode.lat, stationNode.lon]);
      return haversine([stationNode.lat, stationNode.lon], routeCoords[closestIdx]) < 0.5;
    });

    const seen = new Set();
    return filtered
      .sort((a, b) => a.etaAtStation - b.etaAtStation)
      .filter((s) => {
        const key = Math.round(s.etaAtStation / 2);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
  } catch {
    return [];
  }
}

async function getSafestRoute(originLat, originLng, destLat, destLng) {
  const url = `https://router.project-osrm.org/route/v1/driving/${originLng},${originLat};${destLng},${destLat}?overview=full&geometries=geojson&alternatives=3`;
  const res = await axios.get(url);
  const routes = res.data.routes;
  if (!routes || routes.length === 0) throw new Error("No routes found");

  const scored = await Promise.all(
    routes.map(async (route) => {
      const coords = route.geometry.coordinates.map((c) => [c[1], c[0]]);
      const etaMin = Math.round((route.duration / 60) * TRAFFIC_MULTIPLIER);
      const distKm = (route.distance / 1000).toFixed(2);
      const lats = coords.map((c) => c[0]);
      const lngs = coords.map((c) => c[1]);
      const minLat = (Math.min(...lats) - 0.01).toFixed(6);
      const maxLat = (Math.max(...lats) + 0.01).toFixed(6);
      const minLng = (Math.min(...lngs) - 0.01).toFixed(6);
      const maxLng = (Math.max(...lngs) + 0.01).toFixed(6);
      const query = `[out:json][timeout:10];(node["amenity"="police"](${minLat},${minLng},${maxLat},${maxLng}););out count;`;

      let policeScore = 0;
      try {
        const pRes = await axios.post(
          "https://overpass-api.de/api/interpreter",
          query,
          { headers: { "Content-Type": "text/plain" }, timeout: 12000 }
        );
        policeScore = parseInt(pRes.data?.elements?.[0]?.tags?.total || "0", 10);
      } catch { /* ignore */ }

      return { coords, etaMin, distanceKm: distKm, policeScore, distance: route.distance };
    })
  );

  scored.sort((a, b) =>
    b.policeScore !== a.policeScore
      ? b.policeScore - a.policeScore
      : a.distance - b.distance
  );

  return scored[0];
}

function StartRide() {
  const navigate = useNavigate();

  const [destination, setDestination] = useState("");
  const [destinationCoords, setDestinationCoords] = useState(null);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [route, setRoute] = useState([]);
  const [distance, setDistance] = useState(null);
  const [eta, setEta] = useState(null);
  const [policeStations, setPoliceStations] = useState([]);
  const [rideStarted, setRideStarted] = useState(false);
  const [savedRideId, setSavedRideId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [locLoading, setLocLoading] = useState(false);
  const [error, setError] = useState("");

  const getLocation = () => {
    setLocLoading(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCurrentLocation([pos.coords.latitude, pos.coords.longitude]);
        setLocLoading(false);
      },
      () => {
        setError("Could not get location. Please allow location access.");
        setLocLoading(false);
      }
    );
  };

  const searchDestination = async () => {
    if (!currentLocation) { setError("Please get your current location first."); return; }
    if (!destination.trim()) { setError("Please enter a destination."); return; }

    setLoading(true);
    setError("");
    setRoute([]);
    setDestinationCoords(null);
    setDistance(null);
    setEta(null);
    setPoliceStations([]);
    setRideStarted(false);
    setSavedRideId(null);

    try {
      const geo = await axios.get(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(destination)}&format=json`
      );
      if (!geo.data || geo.data.length === 0) {
        setError("Location not found. Try a more specific name.");
        setLoading(false);
        return;
      }

      const destLat = parseFloat(geo.data[0].lat);
      const destLng = parseFloat(geo.data[0].lon);
      setDestinationCoords([destLat, destLng]);

      const best = await getSafestRoute(
        currentLocation[0], currentLocation[1], destLat, destLng
      );

      setRoute(best.coords);
      setDistance(best.distanceKm);
      setEta(best.etaMin);

      const stations = await getPoliceStationsAlongRoute(
        best.coords, best.etaMin, parseFloat(best.distanceKm)
      );
      setPoliceStations(stations);

    } catch (err) {
      console.error(err);
      setError("Could not calculate route. Please try again.");
    }

    setLoading(false);
  };

  const startRide = async () => {
    try {
      const res = await axios.post("http://localhost:5000/api/rides/start", {
        lat: currentLocation[0],
        lng: currentLocation[1],
        destLat: destinationCoords[0],
        destLng: destinationCoords[1],
        destinationName: destination,
        distance,
        expectedTime: eta,
      });
      setSavedRideId(res.data.ride._id);
      setRideStarted(true);
    } catch (err) {
      console.error(err);
      setError("Could not start ride. Please try again.");
    }
  };

  return (
    <>
      <Navbar />   {/* ✅ Navbar added */}

      <div className="ride-container">
        <h2 className="ride-title">Start Ride</h2>

        <div className="ride-inputs">
          <button className="ride-btn location-btn" onClick={getLocation} disabled={locLoading}>
            {locLoading ? "Locating…" : currentLocation ? "📍 Location Found" : "Get Current Location"}
          </button>

          <input
            type="text"
            placeholder="Enter destination"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && searchDestination()}
          />

          <button className="ride-btn search-btn" onClick={searchDestination} disabled={loading}>
            {loading ? "Searching…" : "Search"}
          </button>
        </div>

        {error && <div className="ride-error">⚠️ {error}</div>}

        {distance && !loading && (
          <div className="ride-info">
            <p>🛡️ Safest route selected</p>
            <p>📏 Distance: <strong>{distance} km</strong></p>
            <p>⏱️ Estimated Time: <strong>{eta} min</strong></p>

            {policeStations.length > 0 ? (
              <div className="police-list">
                <p className="police-header">🚔 Police stations on this route:</p>
                {policeStations.map((s, i) => (
                  <p key={i} className="police-item">
                    {s.name} — at <strong>{s.etaAtStation} min</strong>
                  </p>
                ))}
              </div>
            ) : (
              <p className="police-none">🚔 No police stations found on this route</p>
            )}
          </div>
        )}

        {destinationCoords && !rideStarted && !loading && (
          <button className="ride-btn start-btn" onClick={startRide}>
            Start Ride
          </button>
        )}

        {rideStarted && savedRideId && (
          <button className="ride-btn start-btn" onClick={() => navigate(`/tracking/${savedRideId}`)}>
            Go To Live Tracking
          </button>
        )}

        {currentLocation && (
          <div className="map-wrapper">
            <MapContainer center={currentLocation} zoom={13} style={{ height: "100%", width: "100%" }}>
              <MapUpdater center={currentLocation} />
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <Marker position={currentLocation} />
              {destinationCoords && <Marker position={destinationCoords} />}
              {route.length > 0 && (
                <Polyline positions={route} pathOptions={{ color: "#3b82f6", weight: 5, opacity: 0.85 }} />
              )}
            </MapContainer>
          </div>
        )}
      </div>
    </>
  );
}

export default StartRide;