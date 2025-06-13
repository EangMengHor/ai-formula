import { useState, useEffect } from "react";
import axios from "axios";
import { useUser } from "@/context/UserContext";

const BASE_URL = import.meta.env.VITE_SOCKET_URL;
export const useGetUserProfileStatus = () => {
  const [hasPersonalProfile, setHasPersonalProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user } = useUser();

  const checkKnowledgeStatus = async () => {
    try {
      setLoading(true);
      const response = await axios.post(
        `${BASE_URL}/api/personalProfile/getUserPersonalProfileStatus`,
        {
          userId: user.id,
        },
      );
      setHasPersonalProfile(response.data.data);
    } catch (err) {
      setError(err.message);
      setHasPersonalProfile(false);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.id) {
      checkKnowledgeStatus();
    }
  }, [user?.id]);

  return {
    hasPersonalProfile,
    loading,
    error,
    refetch: checkKnowledgeStatus,
  };
};
