import mongoose from "mongoose";

const EpisodeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    desc: { type: String, required: true },
    link: { type: String, required: true },
  },
  { timestamps: true }
);

const SeasonSchema = new mongoose.Schema(
  {
    seasonNumber: { type: Number, required: true },
    episodes: [EpisodeSchema],
  },
  { timestamps: true }
);

const ContentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    desc: { type: String, required: true },
    genre: { type: String, required: true },
    thumbnail: { type: String, default: "" },
    premium : {type : Boolean},
    seasons: [SeasonSchema],
  },
  { timestamps: true }
);

export default mongoose.models.Content || mongoose.model("Content", ContentSchema);