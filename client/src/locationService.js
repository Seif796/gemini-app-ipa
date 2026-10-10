// Location & Proximity Alert Service
// Requests user geolocation, tracks coordinates, and calculates real-time proximity to friends

// Calculate distance between two coordinates in meters using Haversine formula
export function calculateDistanceMeters(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return Infinity;

  const R = 6371e3; // Earth radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c);
}

// Proximity alert threshold in meters (default 500 meters)
export const PROXIMITY_THRESHOLD_METERS = 500;

// Cooldown between repeated proximity alerts for the same friend (20 minutes)
const PROXIMITY_COOLDOWN_MS = 20 * 60 * 1000;

let lastKnownLocation = null;
let watchId = null;

export function getLastKnownLocation() {
  if (lastKnownLocation) return lastKnownLocation;
  try {
    const raw = localStorage.getItem('seif_my_last_location');
    if (raw) lastKnownLocation = JSON.parse(raw);
  } catch (_) {}
  return lastKnownLocation;
}

// Request location permission and start tracking coordinates
export function initLocationTracking(onLocationUpdate) {
  if (!('geolocation' in navigator)) {
    console.warn('Geolocation not supported on this device/browser');
    return false;
  }

  const successHandler = (position) => {
    const coords = {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
      accuracy: position.coords.accuracy,
      updatedAt: Date.now()
    };
    lastKnownLocation = coords;
    try {
      localStorage.setItem('seif_my_last_location', JSON.stringify(coords));
    } catch (_) {}

    if (typeof onLocationUpdate === 'function') {
      onLocationUpdate(coords);
    }
  };

  const errorHandler = (err) => {
    console.warn('Geolocation permission error or unavailable:', err.message);
  };

  const options = {
    enableHighAccuracy: false,
    timeout: 8000,
    maximumAge: 120000
  };

  try {
    // 1. Immediate position
    navigator.geolocation.getCurrentPosition(successHandler, errorHandler, options);

    // 2. Continuous watch
    if (watchId !== null) {
      navigator.geolocation.clearWatch(watchId);
    }
    watchId = navigator.geolocation.watchPosition(successHandler, errorHandler, options);
    return true;
  } catch (err) {
    console.warn('Failed to start geolocation tracking:', err);
    return false;
  }
}

// Check if any friends are within close proximity (< 500m)
export function findNearbyFriends(myUsername, registry) {
  if (!myUsername || !registry) return [];

  const myLoc = getLastKnownLocation();
  if (!myLoc || !myLoc.lat || !myLoc.lng) return [];

  const friendships = registry.friendships || {};
  const myFriends = friendships[myUsername] || [];
  if (!Array.isArray(myFriends) || myFriends.length === 0) return [];

  const users = registry.users || {};
  const nearby = [];
  const now = Date.now();

  for (const friendName of myFriends) {
    const friendObj = users[friendName];
    if (!friendObj || !friendObj.location) continue;

    const fLoc = friendObj.location;
    if (!fLoc.lat || !fLoc.lng) continue;

    // Only consider friend location fresh within the last 4 hours
    if (fLoc.updatedAt && now - fLoc.updatedAt > 4 * 60 * 60 * 1000) {
      continue;
    }

    const dist = calculateDistanceMeters(myLoc.lat, myLoc.lng, fLoc.lat, fLoc.lng);
    if (dist <= PROXIMITY_THRESHOLD_METERS) {
      // Check alert cooldown
      const cooldownKey = `seif_proximity_alert_${friendName}`;
      let lastAlertTime = 0;
      try {
        lastAlertTime = parseInt(localStorage.getItem(cooldownKey) || '0', 10);
      } catch (_) {}

      if (now - lastAlertTime > PROXIMITY_COOLDOWN_MS) {
        try {
          localStorage.setItem(cooldownKey, String(now));
        } catch (_) {}

        nearby.push({
          friend: friendName,
          distance: dist
        });
      }
    }
  }

  return nearby;
}

// Departed threshold in meters (when distance increases after being nearby)
export const DEPARTED_THRESHOLD_METERS = 1000;
const DEPARTED_COOLDOWN_MS = 20 * 60 * 1000;

export function findDepartedFriends(myUsername, registry) {
  if (!myUsername || !registry) return [];

  const myLoc = getLastKnownLocation();
  if (!myLoc || !myLoc.lat || !myLoc.lng) return [];

  const friendships = registry.friendships || {};
  const myFriends = friendships[myUsername] || [];
  if (!Array.isArray(myFriends) || myFriends.length === 0) return [];

  const users = registry.users || {};
  const departed = [];
  const now = Date.now();

  for (const friendName of myFriends) {
    const friendObj = users[friendName];
    if (!friendObj || !friendObj.location) continue;

    const fLoc = friendObj.location;
    if (!fLoc.lat || !fLoc.lng) continue;

    if (fLoc.updatedAt && now - fLoc.updatedAt > 4 * 60 * 60 * 1000) {
      continue;
    }

    const dist = calculateDistanceMeters(myLoc.lat, myLoc.lng, fLoc.lat, fLoc.lng);
    const stateKey = `seif_friend_was_nearby_${friendName}`;
    let wasNearby = false;
    try {
      wasNearby = localStorage.getItem(stateKey) === 'true';
    } catch (_) {}

    if (dist <= PROXIMITY_THRESHOLD_METERS) {
      try {
        localStorage.setItem(stateKey, 'true');
      } catch (_) {}
    } else if (dist >= DEPARTED_THRESHOLD_METERS && wasNearby) {
      // Friend was close and is now far apart
      const cooldownKey = `seif_departed_alert_${friendName}`;
      let lastAlertTime = 0;
      try {
        lastAlertTime = parseInt(localStorage.getItem(cooldownKey) || '0', 10);
      } catch (_) {}

      if (now - lastAlertTime > DEPARTED_COOLDOWN_MS) {
        try {
          localStorage.setItem(cooldownKey, String(now));
          localStorage.setItem(stateKey, 'false'); // reset state
        } catch (_) {}

        departed.push({
          friend: friendName,
          distance: dist
        });
      }
    }
  }

  return departed;
}

