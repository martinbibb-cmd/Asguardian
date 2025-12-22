#!/bin/bash
# Test the deployed Gemini API worker

echo "🧪 Testing Asgardian Gemini Worker..."
echo ""

echo "1️⃣ Health Check:"
curl -s https://asguard.martinbibb.workers.dev | jq . || curl -s https://asguard.martinbibb.workers.dev
echo ""
echo ""

echo "2️⃣ Sending test command:"
curl -s -X POST https://asguard.martinbibb.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Status report on all units",
    "context": {
      "heat": 12,
      "biomass": 450,
      "units": ["Scavenger_Mech_01", "Scavenger_Mech_02", "Scavenger_Mech_03"]
    }
  }' | jq . || curl -s -X POST https://asguard.martinbibb.workers.dev \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Status report on all units",
    "context": {
      "heat": 12,
      "biomass": 450,
      "units": ["Scavenger_Mech_01", "Scavenger_Mech_02", "Scavenger_Mech_03"]
    }
  }'

echo ""
echo "✅ Test complete!"
