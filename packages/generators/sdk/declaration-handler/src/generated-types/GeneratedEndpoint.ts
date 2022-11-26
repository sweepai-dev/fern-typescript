import { MethodDeclarationStructure, MethodSignatureStructure, OptionalKind } from "ts-morph";
import { BaseGenerated } from "./BaseGenerated";

export interface GeneratedEndpoint extends BaseGenerated<EndpointContext> {
    getSignature: (context: EndpointContext) => OptionalKind<MethodSignatureStructure>;
    getImplementation: (context: EndpointContext) => OptionalKind<MethodDeclarationStructure>;
}
