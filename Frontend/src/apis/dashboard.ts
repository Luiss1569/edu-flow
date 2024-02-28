import IPagination from "@interfaces/Pagination";
import Response from "@interfaces/Response";
import IActivity from "@interfaces/Activitiy";
import api from "@services/api";

type Activity = Pick<
  IActivity,
  "_id" | "name" | "description" | "createdAt" | "protocol"
> & {
  users: {
    _id: string;
    name: string;
    matriculation: string;
  }[];
};

type ReqMyActivities = Response<{
  activities: Activity[];
  pagination: IPagination;
}>;

export const getMyActivities = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivities>("/dashboard/my-activities", {
    params: { page, limit },
  });

  return res.data.data;
};

export const getApprovedActivities = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivities>("/dashboard/approved-activities", {
    params: { page, limit },
  });

  return res.data.data;
};