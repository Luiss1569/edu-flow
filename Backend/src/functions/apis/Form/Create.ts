import Http, { HttpHandler } from "../../../middlewares/http";
import res from "../../../utils/apiResponse";
import Form, { IForm } from "../../../models/Form";

const handler: HttpHandler = async (conn, req) => {
  const formData = req.body as IForm;

  const form = await new Form(conn).model().create(formData);

  form.save();

  return res.created(form);
};

export default new Http(handler)
  .setSchemaValidator((schema) => ({
    body: schema.object().shape({
      name: schema.string().required().min(3).max(255),
      type: schema
        .string()
        .required()
        .oneOf(["created", "interaction", "available"]),
      initial_status: schema.string().when("type", ([type], schema) => {
        if (type === "created") {
          return schema.required();
        }
        return schema.nullable().default(null);
      }),
      period: schema.object().shape({
        open: schema.date().required().nullable(),
        close: schema.date().required().nullable(),
      }),
      fields: schema.array().of(
        schema.object().shape({
          id: schema
            .string()
            .required()
            .matches(/^[0-9a-fA-F]{24}$/),
          type: schema
            .string()
            .required()
            .oneOf([
              "text",
              "number",
              "email",
              "password",
              "textarea",
              "checkbox",
              "radio",
              "select",
              "date",
              "file",
              "teachers",
            ]),
          value: schema.string().nullable(),
          visible: schema.boolean().default(true),
          required: schema.boolean().required(),
          options: schema
            .array()
            .of(
              schema.object().shape({
                label: schema.string().required(),
                value: schema.string().required(),
              })
            )
            .when("type", ([type], schema) => {
              if (["select", "radio", "checkbox"].includes(type)) {
                return schema.required(
                  "options is required for select, radio and checkbox fields"
                );
              }
              return schema.nullable().default(null);
            }),
        })
      ),
    }),
  }))
  .configure({
    name: "FormCreate",
    options: {
      methods: ["POST"],
      route: "form",
    },
  });