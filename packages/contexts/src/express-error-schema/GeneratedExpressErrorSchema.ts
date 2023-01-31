import { ts } from "ts-morph";
import { GeneratedFile } from "../commons/GeneratedFile";
import { ExpressErrorSchemaContext } from "./ExpressErrorSchemaContext";

export interface GeneratedExpressErrorSchema extends GeneratedFile<ExpressErrorSchemaContext> {
    deserializeBody: (context: ExpressErrorSchemaContext, args: { referenceToBody: ts.Expression }) => ts.Expression;
}
