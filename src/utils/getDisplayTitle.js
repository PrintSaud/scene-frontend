export default function getDisplayTitle(movie, language) {
    if (!movie) return "";
  
    // Always safe English fallback
    const enTitle = movie.title || movie.original_title || "Untitled";
  
    // Arabic user preference
    if (language === "ar") {
      // Check if movie itself is Arabic
      if (movie.original_language === "ar") {
        // Use Arabic title if available
        if (movie.title_ar && movie.title_ar.trim() !== "") {
          return movie.title_ar;
        }
      }
    }
  
    // Default: English title
    return enTitle;
  }
  