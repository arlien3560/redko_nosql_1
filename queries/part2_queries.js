db = db.getSiblingDB("spotify")

result = db.tracks.find({
    "audio_features.danceability": { $gt: 0.7 },
    "audio_features.energy": { $gt: 0.7 },
    duration_ms: { $gte: 180000, $lte: 300000 }
})

print("Треків для вечірки:", result.count())

result2 = db.tracks.aggregate([
    { $unwind: "$artists" },
    { $group: {
        _id: "$artists",
        count: { $sum: 1 },
        min_pop: { $min: "$popularity" },
        avg_pop: { $avg: "$popularity" }
    }},
    { $match: {
        "min_pop": { $gte: 60 },
        "count": { $gte: 3 }
    }},
    { $sort: { avg_pop: -1 } },
    { $limit: 20 },
    { $project: {
        _id: 1,
        count: 1,
        min_pop: 1,
        avg_pop: { $round: ["$avg_pop", 1] }
    }}
])

print("Топ 20 популярних артистів:", result2.toArray())

result3 = db.tracks.aggregate([
    { 
        $group: {
            _id: "$track_genre",
            avg_tempo: { $avg: "$audio_features.tempo" },
            stdDev_tempo: { $stdDevPop: "$audio_features.tempo" },
            tracks: { 
                $push: {
                    _id: "$_id",
                    track_name: "$track_name",
                    popularity: "$popularity",
                    artists: "$artists",
                    audio_features: { tempo: "$audio_features.tempo" }
                }
            }
        }
    },
    { 
        $addFields: {
            outlier_threshold: { $add: ["$avg_tempo", { $multiply: [2, "$stdDev_tempo"] }] }
        }
    },
    { 
        $addFields: {
            outlier_tracks: {
                $filter: {
                    input: "$tracks",
                    as: "t",
                    cond: { $gt: ["$$t.audio_features.tempo", "$outlier_threshold"] }
                }
            }
        }
    },
    { $match: { "outlier_tracks.0": { $exists: true } } },
    { 
        $project: {
            _id: 0,
            genre: "$_id",
            avg_tempo: { $round: ["$avg_tempo", 1] },
            outlier_threshold: { $round: ["$outlier_threshold", 1] },
            outlier_tracks: 1
        }
    },
])

print("Треки з незвично высоким темпом для їх жанра:", result3)

result4 = db.tracks.find({
    "audio_features.loudness": { $lt: -10 },
    "audio_features.speechiness": { $lt: 0.1 },
    "audio_features.instrumentalness": { $gt: 0.5 },
    explicit: false
})

print("Треків для фонової роботи:", result4.count())