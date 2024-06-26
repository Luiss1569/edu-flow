import IPagination from "@interfaces/Pagination";
import Response from "@interfaces/Response";
import IActivity from "@interfaces/Activitiy";
import api from "@services/api";
import IForm from "@interfaces/Form";

type Activity = Pick<
  IActivity,
  | "_id"
  | "name"
  | "description"
  | "createdAt"
  | "protocol"
  | "state"
  | "form_draft"
  | "finished_at"
> & {
  users: {
    _id: string;
    name: string;
    matriculation: string;
  }[];
  form: {
    name: string;
    slug: string;
  };
};

type ReqMyActivities = Response<{
  activities: Activity[];
  finishedActivities: Activity[];
  pagination: IPagination;
}>;

export const getMyActivities = async ({
  queryKey: [, finished = "finished", page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivities>("/dashboard/my-activities", {
    params: { page, limit, finished: finished === "finished" },
  });

  return res.data.data;
};

export const getOpenForms = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<Response<IForm[]>>("/dashboard/open-forms", {
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

export const getMyActivitiesPendingAcceptance = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivities>(
    "/dashboard/my-pending-activities",
    {
      params: { page, limit },
    }
  );

  return res.data.data;
};

type ReqMyActivitiesPendingInteractions = Response<
  (Pick<IActivity, "_id" | "name" | "description" | "protocol" | "users"> & {
    form: Pick<IForm, "_id" | "name" | "description" | "slug" | "period">;
    status: "idle" | "pending" | "approved" | "rejected";
  })[]
>;

export const getMyActivitiesPendingInteractions = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivitiesPendingInteractions>(
    "/dashboard/my-pending-interactions",
    {
      params: { page, limit },
    }
  );

  return res.data.data;
};

export const getMyActivitiesPendingEvaluations = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivitiesPendingInteractions>(
    "/dashboard/my-pending-evaluations",
    {
      params: { page, limit },
    }
  );

  return res.data.data;
};

type ReqBoardDefinitions = Response<
  Pick<
    IActivity,
    "_id" | "name" | "description" | "protocol" | "evaluations" | "createdAt"
  >[]
>;

export const getBoardDefinitions = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqBoardDefinitions>(
    "/dashboard/board-definitions",
    {
      params: { page, limit },
    }
  );

  return res.data.data;
};

export const getMyActivitiesTracking = async ({
  queryKey: [, page = "1", limit = "10"],
}: {
  queryKey: string[];
}) => {
  const res = await api.get<ReqMyActivities>("/dashboard/my-activity-tracking", {
    params: { page, limit },
  });

  return res.data.data;
}