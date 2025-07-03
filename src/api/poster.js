// src/api/posters.js
import axios from "./api";

export const changePoster = (movieId, { posterUrl }) => {
  return axios.patch(`/movies/${movieId}/poster`, { posterUrl });
};

// GET /api/posters/:movieId → return custom poster (if user changed it)
router.get('/:movieId', async (req, res) => {
    try {
      const { movieId } = req.params;
      const poster = await Poster.findOne({ movieId }); // adjust model/logic as needed
  
      if (!poster) return res.status(404).json({ posterUrl: null });
  
      res.json({ posterUrl: poster.url });
    } catch (err) {
      console.error("❌ Error in /api/posters/:movieId", err);
      res.status(500).json({ message: "Server error" });
    }
  });
