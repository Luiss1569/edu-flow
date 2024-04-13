import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import Activity, {
  IActivityAccepted,
  IActivityState,
} from "../../../models/Activity";

interface Query {
  page?: number;
  limit?: number;
}

export const handler: HttpHandler = async (conn, req, context) => {
  const { page = 1, limit = 10 } = req.query as Query;

  const activities = await new Activity(conn)
    .model()
    .find({
      state: IActivityState.created,
      "masterminds.user._id": req.user.id,
    })
    .skip((page - 1) * limit)
    .limit(limit);

  return res.success({
    activities,
  });
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    query: schema
      .object({
        page: schema
          .number()
          .optional()
          .transform((v) => Number(v))
          .default(1)
          .min(1),
        limit: schema
          .number()
          .optional()
          .transform((v) => Number(v)),
      })
      .optional(),
  }))
  .configure({
    name: "DashboardPendingActivities",
    options: {
      methods: ["GET"],
      route: "dashboard/my-pending-activities",
    },
  });
