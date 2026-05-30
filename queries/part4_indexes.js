db = db.getSiblingDB("spotify")

result = db.tracks.find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats")

print("Пояснення виконання запиту до оптимізації:", result);

db.tracks.createIndex({ track_genre: 1, popularity: -1, "audio_features.danceability": 1 })

result2 = db.tracks.find({
  track_genre: "pop",
  "audio_features.danceability": { $gte: 0.7 }
}).sort({ popularity: -1 }).explain("executionStats")

print("Пояснення виконання запиту після створення індексу:", result2);


result3 = db.tracks.find({
    "audio_features.instrumentalness": { $gte: 0.5 },
    "audio_features.speechiness": { $lte: 0.3 },
    explicit: false
}).explain("executionStats")

print("Пояснення виконання запиту до оптимізації:", result3);

db.tracks.createIndex({
    explicit: 1,
    "audio_features.instrumentalness": 1,
    "audio_features.speechiness": 1,
})

result4 = db.tracks.find({
    "audio_features.instrumentalness": { $gte: 0.5 },
    "audio_features.speechiness": { $lte: 0.3 },
    explicit: false
}).explain("executionStats")

print("Пояснення виконання запиту після створення індексу:", result4);
