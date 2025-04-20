const BASE_URL = 'http://YOUR_LOCAL_IP:8000/api'; // Replace with your IP if testing on device

// 🔍 Location Agent: Get nearby transport
export const getLocationSuggestions = async (latitude, longitude) => {
  const res = await fetch(`${BASE_URL}/location`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude }),
  });
  return res.json();
};

// 🗺️ Guide Agent: Get tourist places
export const getTouristGuide = async ({ latitude, longitude, city }) => {
  const res = await fetch(`${BASE_URL}/guide`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ latitude, longitude, city }),
  });
  return res.json();
};

// 🚗 Decision Agent: Decide travel mode
export const getTravelDecision = async ({ source, destination, priority = 'eco-friendly' }) => {
  const res = await fetch(`${BASE_URL}/decision`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, destination, priority }),
  });
  return res.json();
};

// 🌍 Travel Assist (Unified)
export const travelAssist = async ({ source, destination, priority = 'eco-friendly' }) => {
  const res = await fetch(`${BASE_URL}/travel-assist`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ source, destination, priority }),
  });
  return res.json();
};
