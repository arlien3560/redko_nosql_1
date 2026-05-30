db = db.getSiblingDB("spotify")

result = db.tracks.aggregate([
    {
        $unwind: "$artists"
    },
    {
        $group: {
            _id: "$artists",
            count: { $sum: 1 },
            avg_pop: { $avg: "$popularity" }
        }
    },
    {
        $match: {
            "count": { $gte: 5 }
        }
    },
    {
        $sort: { avg_pop: -1 }
    },
    {
        $limit: 10
    },
    {
        $project: {
            _id: 0,
            artist_name: "$_id",
            avg_pop: { $round: ["$avg_pop", 1] }
        }
    }
])

print("Топ 10 артистів за популярністю:", result.toArray())

result2 = db.tracks.aggregate([
    {
        $addFields: {
            mood: {
                $switch: {
                    branches: [
                        {
                            case: { $and: [ { $gt: ["$audio_features.valence", 0.5] }, { $gt: ["$audio_features.energy", 0.5] } ] },
                            then: "happy"
                        },
                        {
                            case: { $and: [ { $lte: ["$audio_features.valence", 0.5] }, { $gt: ["$audio_features.energy", 0.5] } ] },
                            then: "angry"
                        },
                        {
                            case: { $and: [ { $gt: ["$audio_features.valence", 0.5] }, { $lte: ["$audio_features.energy", 0.5] } ] },
                            then: "calm"
                        },
                        {
                            case: { $and: [ { $lte: ["$audio_features.valence", 0.5] }, { $lte: ["$audio_features.energy", 0.5] } ] },
                            then: "sad"
                        }
                    ],
                    default: "unknown"
                }
            }
        }
    },
    {
        $group: {
            _id: "$mood",
            count: { $sum: 1 }
        }
    },
    {
        $project: {
            _id: 0,
            mood: "$_id",
            count: 1
        }
    }
])

print("Кількість треків за настроєм:", result2.toArray())

result3 = db.tracks.aggregate([
    {
        $group: {
            _id: "$track_genre",
            avg_danceability: { $avg: "$audio_features.danceability" },
            avg_energy: { $avg: "$audio_features.energy" },
            avg_valence: { $avg: "$audio_features.valence" },
            count: { $sum: 1 }
        }
    },
    { 
        $addFields: {
            dance_score: { $avg: ["$avg_danceability", "$avg_energy", "$avg_valence"] }
        }
    },
    {
        $match: {
            "count": { $gte: 100 }
        }
    },
    {
        $sort: { dance_score: -1 }
    },
    {
        $project: {
            _id: 0,
            genre: "$_id",
            avg_danceability: { $round: ["$avg_danceability", 2] },
            avg_energy: { $round: ["$avg_energy", 2] },
            avg_valence: { $round: ["$avg_valence", 2] },
            count: 1
        }
    }
])

print("Середні аудіо характеристики за жанрами:", result3.toArray())
