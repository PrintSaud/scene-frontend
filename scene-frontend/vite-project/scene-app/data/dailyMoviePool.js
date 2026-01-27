// src/data/dailyMoviePool.js
import dayjs from "dayjs";

export const specialDays = {
    "09-23": { id: 187017, title: "Wadjda" }, // Saudi National Day 🇸🇦
    "12-25": { id: 1585, title: "It’s a Wonderful Life" }, // Christmas 🎄
    "10-31": { id: 948, title: "Halloween" }, // Halloween 🎃
    "02-14": { id: 76, title: "Before Sunrise" }, // Valentine’s 💜
    "01-01": { id: 210577, title: "The Great Gatsby" }, // New Year ✨
    "11-29": { id: 335984, title: "Blade Runner" }, // Blade Runner 🛸
  };  

export const dailyMoviePool = [
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

  { id: 550, title: "Fight Club" },
{ id: 299534, title: "Avengers: Endgame" },
{ id: 157336, title: "Interstellar" },
{ id: 424, title: "Schindler’s List" },
{ id: 272044, title: "Ford v Ferrari" },
{ id: 597, title: "Titanic" },
{ id: 49026, title: "The Wolf of Wall Street" },
{ id: 550988, title: "Us" },
{ id: 995133, title: "Spider‑Man: No Way Home" },
{ id: 345940, title: "Shot Caller" },
{ id: 157000, title: "Gone Girl" },
{ id: 118340, title: "Guardians of the Galaxy Vol.2" },
{ id: 299537, title: "Captain Marvel" },
{ id: 120, title: "The Lord of the Rings: The Fellowship of the Ring" },
{ id: 601, title: "Titan A.E." },
{ id: 299536, title: "Avengers: Infinity War" },
{ id: 9456, title: "My Fair Lady" },
{ id: 671, title: "Harry Potter and the Philosopher’s Stone" },
{ id: 68718, title: "The Dark Knight Rises" },
{ id: 278927, title: "Joker" }



];

// 🎯 Pick today’s movie
export function getDailyMovie() {
    const todayKey = dayjs().format("MM-DD");
    if (specialDays[todayKey]) return specialDays[todayKey];
  
    const start = dayjs().month(8).date(1); 
    const diff = dayjs().diff(start, "day");
    const index = ((diff % dailyMoviePool.length) + dailyMoviePool.length) % dailyMoviePool.length;
  
    return dailyMoviePool[index];
  }
