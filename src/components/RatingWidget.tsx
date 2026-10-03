import React, { useState, useEffect } from "react";
import { Star, Send } from "lucide-react";
import { getToolRatings, submitRating, type ToolRatings } from "@/services/ratings";

interface Props {
  toolId: string;
  /** When true, only display the summary (no input). */
  readonly?: boolean;
}

/**
 * 5-star rating widget.
 * - Display: current aggregate (avg + count)
 * - Input: hover-to-pick stars + optional comment + submit
 * - On submit: write to localStorage, re-render aggregate
 */
export function RatingWidget({ toolId, readonly }: Props) {
  const [ratings, setRatings] = useState<ToolRatings>({ count: 0, average: 0 });
  const [hoverStar, setHoverStar] = useState(0);
  const [pickedStar, setPickedStar] = useState(0);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setRatings(getToolRatings(toolId));
  }, [toolId]);

  const handleSubmit = () => {
    if (pickedStar < 1) return;
    submitRating({ toolId, stars: pickedStar, comment: comment.slice(0, 280) });
    setRatings(getToolRatings(toolId));
    setSubmitted(true);
    setPickedStar(0);
    setComment("");
  };

  if (readonly) {
    return <RatingSummary ratings={ratings} />;
  }

  return (
    <div className="border-t border-gray-200 pt-4 mt-6">
      <RatingSummary ratings={ratings} />

      {submitted ? (
        <p className="mt-3 text-sm text-green-600">Thanks for your feedback!</p>
      ) : (
        <div className="mt-3">
          <p className="text-sm text-gray-600 mb-1">Rate this tool:</p>
          <div className="flex items-center gap-3">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onMouseEnter={() => setHoverStar(n)}
                  onMouseLeave={() => setHoverStar(0)}
                  onClick={() => setPickedStar(n)}
                  aria-label={`Rate ${n} star${n > 1 ? "s" : ""}`}
                  className="p-1"
                >
                  <Star
                    className={`h-6 w-6 ${
                      n <= (hoverStar || pickedStar) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            <input
              type="text"
              placeholder="Optional comment (max 280 chars)"
              maxLength={280}
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="flex-1 text-sm border border-gray-300 rounded px-2 py-1 focus:border-blue-500 focus:outline-none"
            />
            <button
              type="button"
              onClick={handleSubmit}
              disabled={pickedStar < 1}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-3.5 w-3.5" />
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function RatingSummary({ ratings }: { ratings: ToolRatings }) {
  if (ratings.count === 0) {
    return <p className="text-sm text-gray-500">No ratings yet. Be the first!</p>;
  }
  return (
    <div className="flex items-center gap-2">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(n => (
          <Star
            key={n}
            className={`h-4 w-4 ${n <= Math.round(ratings.average) ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}`}
          />
        ))}
      </div>
      <span className="text-sm font-medium text-gray-900">{ratings.average.toFixed(1)}</span>
      <span className="text-xs text-gray-500">({ratings.count} rating{ratings.count === 1 ? "" : "s"})</span>
    </div>
  );
}
