import { DeclaredErrorName, ErrorDeclaration } from "@fern-fern/ir-model/errors";
import { Zurg } from "@fern-typescript/commons-v2";
import { Reference } from "../../Reference";

export interface ErrorReferencingContextMixin {
    getErrorDeclaration: (errorName: DeclaredErrorName) => ErrorDeclaration;
    getReferenceToError: (errorName: DeclaredErrorName) => Reference;
    getReferenceToRawError: (errorName: DeclaredErrorName) => Reference;
    getErrorSchema: (errorName: DeclaredErrorName) => Zurg.Schema;
}
