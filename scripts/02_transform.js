db = db.getSiblingDB("spotify")

db.tracks.drop()

db.tracks_raw.aggregate([
    {
        $project: {
            _id: 0,
            track_id: "$track_id",
            track_name: "$track_name",
            album_name: "$album_name",
            explicit: "$explicit",
            popularity: "$popularity",
            duration_ms: "$duration_ms",
            track_genre: "$track_genre",
            artists: {
                $map: {
                    input: { $split: ["$artists", ";"] },
                    as: "artist",
                    in: { $trim: { input: "$$artist" } }
                }
            },
            audio_features: {
                danceability: "$danceability",
                energy: "$energy",
                loudness: "$loudness",
                speechiness: "$speechiness",
                acousticness: "$acousticness",
                instrumentalness: "$instrumentalness",
                liveness: "$liveness",
                valence: "$valence",
                tempo: "$tempo",
                key: "$key",
                mode: "$mode",
                time_signature: "$time_signature",
            },
            duration_sec: { $round: [{ $divide: ["$duration_ms", 1000] }, 1] },
            popularity_tier: {
                $switch: {
                    branches: [
                        { case: { $gte: ["$popularity", 70] }, then: "high" },
                        { case: { $and: [{ $gte: ["$popularity", 40] }, { $lt: ["$popularity", 70] }] }, then: "medium" },
                        { case: { $lt: ["$popularity", 40] }, then: "low" }
                    ],
                    default: "unknown"
                }
            }
        }
    },
    {
        $out: "tracks"
    }
])

print("Кількість документів у tracks:", db.tracks.countDocuments())
print("Приклад документа:")
printjson(db.tracks.findOne())