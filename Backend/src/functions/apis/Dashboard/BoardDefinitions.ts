import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import Activity from "../../../models/client/Activity";
import ActivityRepository from "../../../repositories/Activity";

interface Query {
  page?: number;
  limit?: number;
}

export const handler: HttpHandler = async (conn, req, context) => {
  const { page = 1, limit = 10 } = req.query as Query;

  const activityRepository = new ActivityRepository(conn);

  const pendingActivities = await activityRepository.find({
    where: { "evaluations.not_defined_board": true },
    select: {
      _id: 1,
      protocol: 1,
      name: 1,
      description: 1,
      evaluations: 1,
      createAt: 1,
    },
  });

  const data = pendingActivities.map((a) => {
    const activity = a.toObject();

    const evaluations = activity?.evaluations?.filter(
      (evaluation) => !evaluation.finished
    );

    return {
      ...activity,
      evaluations,
    };
  });

  return res.success(data);
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
    name: "DashboardBoardDefinitions",
    permission: "activity.board-definition",
    options: {
      methods: ["GET"],
      route: "dashboard/board-definitions",
    },
  });
