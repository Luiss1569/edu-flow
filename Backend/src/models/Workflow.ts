import mongoose, { Schema } from "mongoose";

export enum NodeTypes {
  ChangeStatus = "change_status",
  SendEmail = "send_email",
  Circle = "circle",
}

export interface ISendEmail {
  name: string;
  email: string;
  to: string[];
  visible: boolean;
}

export interface IChangeStatus {
  name: string;
  status: string;
  visible: boolean;
}

export interface ICircle {
  name: string;
  visible: false;
}

export type IStep = {
  id: string;
  visible: boolean;
  next_step_id: string | null;
  position: { x: number; y: number };
} & (
  | {
      type: NodeTypes.SendEmail;
      data: ISendEmail;
    }
  | {
      type: NodeTypes.ChangeStatus;
      data: IChangeStatus;
    }
  | {
      type: NodeTypes.Circle;
      data: ICircle;
    }
);

export type IWorkflow = {
  _id: string;
  name: string;
  status: "draft" | "published";
  steps: IStep[];
  parent: string | null;
  viewport: { x: number; y: number; zoom: number };
  createdAt: string;
  updatedAt: string;
} & mongoose.Document;

export const schema: Schema = new Schema(
  {
    name: { type: String, required: true },
    version: { type: Number, default: 1, auto: true },
    status: { type: String, default: "draft", enum: ["draft", "published"] },
    parent: { type: Schema.Types.ObjectId, ref: "Workflow" },
    viewport: {
      x: { type: Number, default: 0 },
      y: { type: Number, default: 0 },
      zoom: { type: Number, default: 1 },
    },
    steps: [
      {
        _id: { type: Schema.Types.ObjectId, auto: true },
        id: { type: String, required: true },
        type: {
          type: String,
          enum: ["circle", "send_email", "change_status"],
        },
        next_step_id: { type: String, default: null },
        position: {
          x: { type: Number, required: true },
          y: { type: Number, required: true },
        },
        data: {
          type: Object,
          required: true,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
).index({ name: 1, version: 1 }, { unique: true });

export default class Workflow {
  conn: mongoose.Connection;

  constructor(conn: mongoose.Connection) {
    this.conn = conn;
  }

  model() {
    return this.conn.model<IWorkflow>("Workflow", schema);
  }
}