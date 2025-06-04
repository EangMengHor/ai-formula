import axios from "axios";
import {
  getUserPersonalKnowledgeCollectionUrl,
  getUserPersonalKnowledgeStatusUrl,
} from "../../namespace/server";
import { response } from "../../lib/utils";

export async function getUserPersonalKnowledgeCollection(userId) {
  try {
    const res = await axios.get(
      getUserPersonalKnowledgeCollectionUrl.replace(":userId", userId),
    );
    return res.data;
  } catch (error) {
    console.error("Error fetching user personal knowledge collection:", error);
    throw error;
  }
}
