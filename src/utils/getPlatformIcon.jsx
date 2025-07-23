import { FaXTwitter, FaYoutube, FaInstagram, FaTiktok, FaImdb } from "react-icons/fa";
import { SiThemoviedatabase } from "react-icons/si";
import { FiGlobe } from "react-icons/fi";

export const getPlatformIcon = (platform) => {
  switch (platform.toLowerCase()) {
    case "x":
      return <FaXTwitter />;
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
