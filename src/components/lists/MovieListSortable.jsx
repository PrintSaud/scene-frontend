import React, { useCallback } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { backend } from "../../config";


const MovieListSortable = React.memo(({ movies, setMovies }) => {
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
    (id) => setMovies((prev) => prev.filter((m) => m.id !== id)),
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
              overflowX: "hidden", // ✅ prevent horizontal scroll
              padding: 0,
              paddingRight: "4px",
              listStyle: "none",
            }}
          >
            {movies.map((movie, index) => (
              <Draggable
                key={movie.id}
                draggableId={movie.id.toString()}
                index={index}
              >
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
                        wordBreak: "break-word", // ✅ allow wrapping
                        overflow: "hidden",
                        textOverflow: "ellipsis",
                      }}
                    >
                      <strong>{index + 1}.</strong> {movie.title}
                    </span>

                    <button
                      onClick={() => handleRemove(movie.id)}
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
            ))}
            {provided.placeholder}
          </ul>
        )}
      </Droppable>
    </DragDropContext>
  );
});

export default MovieListSortable;
