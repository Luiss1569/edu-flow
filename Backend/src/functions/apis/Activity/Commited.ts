import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import {
  IActivityState,
  IActivityStepStatus,
} from "../../../models/client/Activity";
import { IUser, IUserRoles } from "../../../models/client/User";
import { IForm } from "../../../models/client/Form";
import { IWorkflow } from "../../../models/client/Workflow";
import sendNextQueue from "../../../utils/sendNextQueue";
import sbusOutputs from "../../../utils/sbusOutputs";
import ActivityRepository from "../../../repositories/Activity";
import UserRepository from "../../../repositories/User";
import WorkflowDraftRepository from "../../../repositories/WorkflowDraft";
import FormRepository from "../../../repositories/Form";

interface IActivityUpdate {
  name: string;
  description: string;
  users: string[];
  masterminds: Omit<IUser, "password">[];
  sub_masterminds: Omit<IUser, "password">[];
}

const handler: HttpHandler = async (conn, req, context) => {
  const { id } = req.params as { id: string };

  const activityRepository = new ActivityRepository(conn);
  const userRepository = new UserRepository(conn);
  const workflowDraftRepository = new WorkflowDraftRepository(conn);
  const formRepository = new FormRepository(conn);

  const activityData = await activityRepository.findById({ id });

  if (!activityData) {
    return res.error(404, {}, "Activity not found");
  }

  const { name, description, users, sub_masterminds } =
    req.body as IActivityUpdate;

  const subMastermind = await Promise.all(
    sub_masterminds.map(async (sub) => {
      if (sub.isExternal) {
        const subMastermindData = await userRepository.findOne({
          where: { email: sub.email },
        });
        if (!subMastermindData) {
          const newUser = await userRepository.create({
            ...sub,
            roles: [IUserRoles.teacher],
            password: "password",
            isExternal: true,
          });

          return newUser.toObject();
        }

        return subMastermindData.toObject();
      }
      return sub;
    })
  );

  if (subMastermind.includes(null)) {
    return res.error(400, {}, "Invalid sub mastermind id");
  }

  activityData.sub_masterminds = subMastermind;
  activityData.save();

  const userData = await userRepository.find({
    where: { _id: { $in: users } },
  });

  if (userData.length !== users.length) {
    return res.error(400, {}, "Invalid user id");
  }

  activityData.name = name;
  activityData.description = description;
  activityData.users = userData.map((user) => user.toObject());
  activityData.sub_masterminds = subMastermind;
  activityData.state = IActivityState.processing;

  const form = (await formRepository.findById({
    id: activityData.form.toString(),
    select: { workflow: 1 },
    populate: [{
      path: "workflow",
    }]
  })) as IForm & { workflow: IWorkflow };

  const workflowDraft = await workflowDraftRepository.findById({
    id: form.workflow.published,
    select: { steps: 1 },
  });

  const firstStep = workflowDraft.steps.find((step) => step.id === "start");

  if (!firstStep) {
    return res.error(400, {}, "Invalid workflow");
  }

  activityData.workflows.push({
    workflow_draft: workflowDraft,
    steps: [
      {
        step: firstStep._id,
        status: IActivityStepStatus.inProgress,
      },
    ],
  });

  await sendNextQueue({
    conn,
    context,
    activity: activityData,
  }).catch((error) => {
    console.error("Error sending to queue", error);
    throw new Error(error);
  });

  activityData.workflows[0].steps[0].status = IActivityStepStatus.finished;

  await activityData.save();

  return res.success(activityData.toObject());
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    params: schema.object({
      id: schema.string().required(),
    }),
    body: schema.object({
      name: schema.string().required(),
      description: schema.string().required(),
      users: schema.array(schema.string()).required(),
      sub_masterminds: schema
        .array(
          schema.object({
            _id: schema.string().optional(),
            name: schema.string().required(),
            email: schema.string().email().required(),
          })
        )
        .required(),
    }),
  }))
  .configure({
    name: "ActivityCommitted",
    permission: "activity.committed",
    options: {
      methods: ["PUT"],
      route: "activity-committed/{id}",
      extraOutputs: sbusOutputs,
    },
  });
