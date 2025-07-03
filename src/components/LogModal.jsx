import React, { useState } from "react";
import { reactToLog, getLogById, addLogReply, deleteReply } from "../api/api";
import GiphyModal from "./GiphyModal";

export default function LogModal({ log, onClose }) {
  const [replyText, setReplyText] = useState("");
  const [replies, setReplies] = useState(log.replies || []);
  const [showAllReplies, setShowAllReplies] = useState(false);
  const [image, setImage] = useState(null);
  const [showGifPicker, setShowGifPicker] = useState(false);
  const TMDB_IMG = "https://image.tmdb.org/t/p/w500";
  const poster = log.movie?.customPoster || (log.movie?.poster && `${TMDB_IMG}${log.movie.poster}`) || "/default-poster.png";
  
  const token = localStorage.getItem("token");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const currentUserId = currentUser?._id;
  const emojis = ["❤️", "😂", "😢", "🔥", "👍"];
  const hasReview = !!log?.review;

  const handleReaction = async (emoji) => {
    try {
        await reactToLog(log._id, emoji);
const { data } = await getLogById(log._id);

      setReplies(data.replies);
    } catch (err) {
      console.error("Reaction failed:", err);
    }
  };

  const handleReply = async () => {
    if (!replyText.trim() && !image) return;

    const formData = new FormData();
    formData.append("text", replyText);
    if (image?.isExternal) {
      formData.append("externalImage", image.url);
    } else if (image) {
      formData.append("image", image);
    }

    try {
        const { data } = await addLogReply(log._id, formData);

      setReplies(data.replies);
      setReplyText("");
      setImage(null);
      setShowAllReplies(true);
    } catch (err) {
      console.error("Reply failed:", err);
    }
  };

  const handleDeleteReply = async (replyId) => {
    try {
        const { data } = await deleteReply(log._id, replyId);

      setReplies(data.replies);
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const visibleReplies = showAllReplies ? replies : replies.slice(0, 3);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
      <div className="bg-white p-6 rounded-xl w-full max-w-md relative">
        <button onClick={onClose} className="absolute top-2 right-4 text-xl">
          ✖️
        </button>

        <img
  src={poster}
  alt={log.movie?.title || "poster"}
  className="w-full rounded-lg"
/>


        <h3 className="text-lg font-bold mt-4">{log.movie?.title}</h3>
        <p className="text-sm text-gray-500">{log.user?.username}</p>

        {hasReview ? (
          <div className="mt-4">
            <p className="text-md">{log.review}</p>

            {/* ❤️ Reactions */}
            <div className="mt-4 flex gap-2">
              {emojis.map((emoji) => (
                <button
                  key={emoji}
                  onClick={() => handleReaction(emoji)}
                  className="text-2xl hover:scale-110 transition"
                >
                  {emoji}
                </button>
              ))}
            </div>

            {/* 💬 Replies */}
            <div className="mt-6">
              <h4 className="font-semibold mb-2">Replies 💬</h4>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {visibleReplies.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-2 text-sm border-b border-gray-200 pb-2"
                  >
                    <img
                      src={r.user.avatar || "/default-avatar.png"}
                      alt="avatar"
                      className="w-6 h-6 rounded-full mt-0.5"
                    />
                    <div className="flex flex-col">
                      <div>
                        <strong>{r.user.username}</strong>: {r.text}
                      </div>
                      {r.image && (
                        <img
                          src={r.image}
                          alt="reply media"
                          className="mt-1 max-w-[200px] rounded-lg"
                        />
                      )}
                      {r.user._id === currentUserId && (
                        <button
                          onClick={() => handleDeleteReply(r._id)}
                          className="text-xs text-red-500 mt-1 self-start"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                {!showAllReplies && replies.length > 3 && (
                  <button
                    onClick={() => setShowAllReplies(true)}
                    className="text-blue-600 text-sm mt-1"
                  >
                    View all {replies.length} replies →
                  </button>
                )}
              </div>

              {/* 📎 Upload + Input */}
              <div className="mt-3 flex flex-col gap-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setImage(e.target.files[0])}
                  className="text-sm text-black"
                />
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    className="border rounded px-2 py-1 flex-grow text-sm"
                  />
                  <button
                    onClick={handleReply}
                    className="bg-black text-white px-4 py-1 rounded text-sm"
                  >
                    Send
                  </button>
                  <button
                    onClick={() => setShowGifPicker(true)}
                    className="text-sm border px-2 py-1 rounded bg-gray-100"
                  >
                    🎞️ GIF
                  </button>
                </div>
              </div>

              {showGifPicker && (
                <GiphyModal
                  onClose={() => setShowGifPicker(false)}
                  onSelect={(gifUrl) => {
                    setImage({
                      name: "giphy.gif",
                      type: "image/gif",
                      url: gifUrl,
                      isExternal: true,
                    });
                    setShowGifPicker(false);
                  }}
                />
              )}
            </div>
          </div>
        ) : (
          <div className="mt-4">
            <a
              href={`/movie/${log.movie?._id}`}
              className="text-blue-600 underline"
            >
              View movie details →
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
