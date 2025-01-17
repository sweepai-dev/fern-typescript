import { EnvironmentBaseUrlId } from "@fern-fern/ir-model/environment";
import { ts } from "ts-morph";
import { GeneratedFile } from "../../commons/GeneratedFile";
import { SdkContext } from "../SdkContext";

export interface GeneratedEnvironments extends GeneratedFile<SdkContext> {
    hasDefaultEnvironment: () => boolean;
    getReferenceToDefaultEnvironment: (context: SdkContext) => ts.Expression | undefined;
    getTypeForUserSuppliedEnvironment: (context: SdkContext) => ts.TypeNode;
    getReferenceToEnvironmentUrl: (args: {
        referenceToEnvironmentValue: ts.Expression;
        baseUrlId: EnvironmentBaseUrlId | undefined;
    }) => ts.Expression;
}
