import { FaTwitter, FaYoutube, FaInstagram, FaTiktok, FaImdb } from "react-icons/fa";
import { SiThemoviedatabase } from "react-icons/si";
import { FiGlobe } from "react-icons/fi";
import { SiX } from "react-icons/si"; // ✅ this is the official "X" (Twitter) icon

export const getPlatformIcon = (platform) => {
  switch (platform.toLowerCase()) {
    case "x": // ✅ lowercase to match .toLowerCase()
      return <SiX />;
    case "youtube":
      return <FaYoutube />;
    case "instagram":
      return <FaInstagram />;
    case "tiktok":
      return <FaTiktok />;
    case "imdb":
      return <FaImdb />;
    case "tmdb":
      return <SiThemoviedatabase />;
    case "website":
      return <FiGlobe />;
    default:
      return <FiGlobe />;
  }  
};
