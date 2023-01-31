import { assertNever } from "@fern-api/core-utils";
import { ErrorDeclaration } from "@fern-fern/ir-model/errors";
import { TypeReference } from "@fern-fern/ir-model/types";
import { ExpressErrorSchemaContext, GeneratedExpressErrorSchema } from "@fern-typescript/contexts";
import { ExpressErrorGenerator } from "@fern-typescript/express-error-generator";
import { GeneratedAliasTypeSchemaImpl } from "@fern-typescript/type-schema-generator";
import { ts } from "ts-morph";

export declare namespace GeneratedExpressErrorSchemaImpl {
    export interface Init {
        errorName: string;
        errorDeclaration: ErrorDeclaration;
        type: TypeReference;
        expressErrorGenerator: ExpressErrorGenerator;
    }
}

export class GeneratedExpressErrorSchemaImpl implements GeneratedExpressErrorSchema {
    private errorDeclaration: ErrorDeclaration;
    private type: TypeReference;
    private generatedAliasSchema: GeneratedAliasTypeSchemaImpl<ExpressErrorSchemaContext> | undefined;

    constructor({ errorName, errorDeclaration, type, expressErrorGenerator }: GeneratedExpressErrorSchemaImpl.Init) {
        this.errorDeclaration = errorDeclaration;
        this.type = type;

        // named errors are not generated - consumers should
        // (de)serialize the named type directly.
        // unknown request bodies don't need to be serialized.
        switch (type._type) {
            case "named":
            case "unknown":
                break;
            case "container":
            case "primitive":
                this.generatedAliasSchema = new GeneratedAliasTypeSchemaImpl<ExpressErrorSchemaContext>({
                    typeName: errorName,
                    shape: type,
                    getGeneratedType: () => {
                        const generatedExpressError = expressErrorGenerator.generateError({
                            errorName,
                            errorDeclaration,
                        });
                        if (generatedExpressError == null) {
                            throw new Error("Error was not generated");
                        }
                        return generatedExpressError.generateErrorBody();
                    },
                    getReferenceToGeneratedType: (context) => {
                        const GeneratedExpressError = expressErrorGenerator.generateError({
                            errorName,
                            errorDeclaration,
                        });
                        if (GeneratedExpressError == null) {
                            throw new Error("Error was not generated");
                        }
                        switch (GeneratedExpressError.type) {
                            case "class":
                                return context.type.getReferenceToType(type).typeNode;
                            case "type":
                                return context.expressError.getReferenceToError(errorDeclaration.name).getTypeNode();
                            default:
                                assertNever(GeneratedExpressError);
                        }
                    },
                    getReferenceToGeneratedTypeSchema: (context) =>
                        context.expressErrorSchema.getReferenceToExpressErrorSchema(errorDeclaration.name),
                });
                break;
            default:
                assertNever(type);
        }
    }

    public writeToFile(context: ExpressErrorSchemaContext): void {
        this.generatedAliasSchema?.writeToFile(context);
    }

    public deserializeBody(
        context: ExpressErrorSchemaContext,
        { referenceToBody }: { referenceToBody: ts.Expression }
    ): ts.Expression {
        switch (this.type._type) {
            case "named":
                return context.typeSchema
                    .getSchemaOfNamedType(this.type, { isGeneratingSchema: false })
                    .parse(
                        ts.factory.createAsExpression(
                            referenceToBody,
                            context.typeSchema.getReferenceToRawNamedType(this.type).getTypeNode()
                        )
                    );
            case "unknown":
                return referenceToBody;
            case "primitive":
            case "container":
                if (this.generatedAliasSchema == null) {
                    throw new Error("Cannot get reference to raw shape because generated alias schema does not exist.");
                }
                return context.expressErrorSchema
                    .getSchemaOfError(this.errorDeclaration.name)
                    .parse(
                        ts.factory.createAsExpression(
                            referenceToBody,
                            this.generatedAliasSchema.getReferenceToRawShape(context)
                        )
                    );
            default:
                assertNever(this.type);
        }
    }
}
