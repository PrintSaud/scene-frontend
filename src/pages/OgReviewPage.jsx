import { useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";

export default function OgReviewPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  useEffect(() => {
    if (id) {
      navigate(`/review/${id}`, { replace: true });
    }
  }, [id]);

  return null; // or a loading spinner if you want
}
