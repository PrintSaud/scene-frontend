import React, { useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import toast from "react-hot-toast";

const MovieListSortable = React.memo(({ movies, setMovies, hideNumbers = false }) => {
  const MAX_MOVIES = 4;

  const toKeyId = (movie) => {
    if (!movie) return "unknown";
    return (
      movie.tmdbId?.toString() ||
      movie.id?.toString() ||
      movie._id?.toString() ||
      Math.random().toString()
    );
  };

  const handleDragEnd = useCallback(
    (result) => {
      if (!result.destination) return;

      const reordered = Array.from(movies);
      const [moved] = reordered.splice(result.source.index, 1);
      reordered.splice(result.destination.index, 0, moved);

      setMovies(reordered);
    },
    [movies, setMovies]
  );

  const handleRemove = useCallback(
    (id) =>
      setMovies((prev) =>
        prev.filter(
          (m) =>
            m.tmdbId?.toString() !== id &&
            m.id?.toString() !== id &&
            m._id?.toString() !== id
        )
      ),
    [setMovies]
  );

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="movie-list" isDropDisabled={false}>
        {(provided) => (
          <ul
            {...provided.droppableProps}
            ref={provided.innerRef}
            style={{
              marginTop: "8px",
              maxHeight: "300px",
              overflowY: "auto",
              overflowX: "hidden",
              padding: 0,
              paddingRight: "4px",
              listStyle: "none",
            }}
          >
            {movies.map((movie, index) => {
              const keyId = toKeyId(movie);

              return (
                <Draggable key={keyId} draggableId={keyId} index={index}>
                  {(provided, snapshot) => (
                    <li
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      style={{
                        ...provided.draggableProps.style,
                        background: "#1a1a1a",
                        borderRadius: "6px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 12px",
                        marginBottom: "8px",
                        boxShadow: snapshot.isDragging
                          ? "0 2px 10px rgba(255,255,255,0.15)"
                          : "none",
                      }}
                    >
                      <span
                        {...provided.dragHandleProps}
                        style={{
                          cursor: "grab",
                          marginRight: "12px",
                          fontSize: "18px",
                        }}
                        aria-label={`Drag ${movie.title}`}
                      >
                        ≡
                      </span>

                      <span
                        style={{
                          flexGrow: 1,
                          fontFamily: "Inter, sans-serif",
                          fontSize: "15px",
                          wordBreak: "break-word",
                          overflow: "hidden",
                          textOverflow: "ellipsis",
                        }}
                      >
                        {!hideNumbers && <strong>{index + 1}.</strong>} {movie.title}
                      </span>

                      <button
                        onClick={() => handleRemove(keyId)}
                        style={{
                          marginLeft: "8px",
                          color: "#f55",
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          fontSize: "16px",
                        }}
                        aria-label={`Remove ${movie.title}`}
                      >
                        ❌
                      </button>
                    </li>
                  )}
                </Draggable>
              );
            })}

            {/* ➕ Add Movie Placeholder (disabled if 4 reached) */}
            {movies.length < MAX_MOVIES && (
              <li
                onClick={() => {
                  toast.error("Add film from the backdrop search or modal!");
                }}
                style={{
                  background: "#111",
                  border: "1px dashed #444",
                  color: "#888",
                  textAlign: "center",
                  padding: "14px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  cursor: "not-allowed",
                  userSelect: "none",
                }}
              >
                ➕ Add a film (use main modal)
              </li>
            )}

            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
});

export default MovieListSortable;
