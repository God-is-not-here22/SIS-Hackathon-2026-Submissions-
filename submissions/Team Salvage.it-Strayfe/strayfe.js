const express = require('express')
const fs = require('fs')
const path = require('path')

const app = express()
const PORT = 3000

app.use(express.json())
app.use(express.static(path.join(__dirname, 'public')))

function readJSON(filePath) {
  const data = fs.readFileSync(filePath)
  return JSON.parse(data)
}

function calculateUrgency(symptoms) {
  const weights = {
    seizure: 5,
    unconscious: 5,
    heavy_bleeding: 4,
    vomiting: 3,
    limping: 1
  }

  let score = 0
  symptoms.forEach(s => {
    if (weights[s]) score += weights[s]
  })

  const severity = score >= 5 ? "HIGH" : "LOW"
  return { score, severity }
}

function toRad(value) {
  return value * Math.PI / 180
}

function calculateDistance(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
    Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) *
    Math.sin(dLng / 2)

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function matchVolunteers(severity, location) {
  const volunteers = readJSON(path.join(__dirname, 'data/volunteers.json'))
  const available = volunteers.filter(v => v.available)

  let candidates = []

  if (severity === "HIGH") {
    candidates = available.map(v => {
      const distance = calculateDistance(
        location.lat,
        location.lng,
        v.live.lat,
        v.live.lng
      )
      return { ...v, distance }
    })
  } else {
    candidates = available.map(v => {
      const distance = calculateDistance(
        location.lat,
        location.lng,
        v.home.lat,
        v.home.lng
      );
      return { ...v, distance };
    });
  }

  candidates.sort((a, b) => a.distance - b.distance)
  return candidates.slice(0, 5)
}

function matchClinic(severity, location) {
  const clinics = readJSON(path.join(__dirname, 'data/clinics.json'))

  const eligible = severity === "HIGH"
    ? clinics.filter(c => c.hasICU)
    : clinics

  const withDistance = eligible.map(c => {
    const distance = calculateDistance(
      location.lat,
      location.lng,
      c.location.lat,
      c.location.lng
    )
    return { ...c, distance }
  })

  withDistance.sort((a, b) => a.distance - b.distance)
  return withDistance[0]
}

app.post('/report', (req, res) => {
  const { symptoms, location } = req.body

  const { score, severity } = calculateUrgency(symptoms)
  const volunteers = matchVolunteers(severity, location)
  const clinic = matchClinic(severity, location)

  res.json({
    severity,
    urgencyScore: score,
    volunteers,
    recommendedClinic: clinic
  })
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})
