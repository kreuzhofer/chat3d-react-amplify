import { useNavigate, useParams } from "react-router-dom";
import { useAdmin } from "../../contexts/AdminContext";
import { AdjudicationSittingsList } from "../../components/admin/adjudication/AdjudicationSittingsList";
import { AdjudicationSittingView } from "../../components/admin/adjudication/AdjudicationSittingView";

export function AdminAdjudicationPage() {
  const { token } = useAdmin();
  const { sittingId } = useParams<{ sittingId?: string }>();
  const navigate = useNavigate();
  if (!token) return null;
  if (sittingId) return <AdjudicationSittingView token={token} sittingId={sittingId} onBack={() => navigate("/admin/adjudication")} />;
  return <AdjudicationSittingsList token={token} onOpen={(id) => navigate(`/admin/adjudication/${id}`)} />;
}
