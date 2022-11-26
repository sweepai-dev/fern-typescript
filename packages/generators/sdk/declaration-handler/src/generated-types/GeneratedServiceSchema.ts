import { Zurg } from "@fern-typescript/commons-v2";
import { ts } from "ts-morph";
import { ServiceSchemaContext } from "../contexts/ServiceSchemaContext";
import { BaseGenerated } from "./BaseGenerated";

export interface GeneratedServiceSchema extends BaseGenerated<ServiceSchemaContext> {
    // request

    // response
    getResponseSchema: () => Zurg.Schema;
    getReferenceToRawResponseBody: () => ts.TypeNode;

    // error
    getErrorSchema: () => Zurg.Schema;
    getReferenceToRawErrorBody: () => ts.TypeNode;
}
