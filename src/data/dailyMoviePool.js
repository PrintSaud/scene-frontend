// src/data/dailyMoviePool.js
import dayjs from "dayjs";

export const specialDays = {
    "09-23": { id: 187017, title: "Wadjda" }, // Saudi National Day 🇸🇦
    "12-25": { id: 1585, title: "It’s a Wonderful Life" }, // Christmas 🎄
    "10-31": { id: 948, title: "Halloween" }, // Halloween 🎃
    "02-14": { id: 76, title: "Before Sunrise" }, // Valentine’s 💜
    "01-01": { id: 210577, title: "The Great Gatsby" }, // New Year ✨
    "12-14": { id: 44214, title: "Black Swan" }, // Special Day 🩰🖤
  };  

export const dailyMoviePool = [
  // September (1–30)
  { id: 539, title: "Psycho" },
  { id: 37257, title: "Witness for the Prosecution" },
  { id: 27205, title: "Inception" },
  { id: 278, title: "The Shawshank Redemption" },
  { id: 238, title: "The Godfather Part II" },
  { id: 807, title: "Se7en" },
  { id: 244786, title: "Whiplash" },
  { id: 13, title: "Forrest Gump" },
  { id: 680, title: "Pulp Fiction" },
  { id: 640, title: "Catch Me If You Can" },
  { id: 603, title: "The Matrix" },
  { id: 1891, title: "The Empire Strikes Back" },
  { id: 155, title: "The Dark Knight" },
  { id: 496243, title: "Parasite" },
  { id: 389, title: "12 Angry Men" },
  { id: 129, title: "Spirited Away" },
  { id: 19426, title: "Nights of Cabiria" },
  { id: 11216, title: "Cinema Paradiso" },
  { id: 603692, title: "John Wick: Chapter 4" },
  { id: 1124, title: "The Prestige" },
  { id: 857, title: "Saving Private Ryan" },
  { id: 85, title: "Raiders of the Lost Ark" },
  { id: 120467, title: "The Grand Budapest Hotel" },
  { id: 308369, title: "Me and Earl and the Dying Girl" },
  { id: 598, title: "City of God" },
  { id: 539, title: "Vertigo" },
  { id: 210577, title: "The Great Gatsby" },
  { id: 72190, title: "The Hunger Games" },
  { id: 11324, title: "Shutter Island" },
  { id: 129, title: "My Neighbor Totoro" },

  // … October, November, etc.
];

// 🎯 Pick today’s movie
export function getDailyMovie() {
    const todayKey = dayjs().format("MM-DD");
    if (specialDays[todayKey]) return specialDays[todayKey];
  
    const start = dayjs().month(8).date(1); // September = month 8 (0-based)
    const diff = dayjs().diff(start, "day");
    const index = ((diff % dailyMoviePool.length) + dailyMoviePool.length) % dailyMoviePool.length;
  
    return dailyMoviePool[index];
  }
