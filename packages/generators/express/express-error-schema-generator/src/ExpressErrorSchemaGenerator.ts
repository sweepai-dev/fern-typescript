import { ErrorDeclaration } from "@fern-fern/ir-model/errors";
import { GeneratedExpressErrorSchema } from "@fern-typescript/contexts";
import { ExpressErrorGenerator } from "@fern-typescript/express-error-generator";
import { GeneratedExpressErrorSchemaImpl } from "./GeneratedExpressErrorSchemaImpl";

export declare namespace ExpressErrorSchemaGenerator {
    export interface Init {
        expressErrorGenerator: ExpressErrorGenerator;
    }

    export namespace generateError {
        export interface Args {
            errorName: string;
            errorDeclaration: ErrorDeclaration;
        }
    }
}

export class ExpressErrorSchemaGenerator {
    private expressErrorGenerator: ExpressErrorGenerator;

    constructor({ expressErrorGenerator }: ExpressErrorSchemaGenerator.Init) {
        this.expressErrorGenerator = expressErrorGenerator;
    }

    public generateExpressErrorSchema({
        errorDeclaration,
        errorName,
    }: ExpressErrorSchemaGenerator.generateError.Args): GeneratedExpressErrorSchema | undefined {
        if (errorDeclaration.type == null) {
            return undefined;
        }
        return new GeneratedExpressErrorSchemaImpl({
            errorDeclaration,
            type: errorDeclaration.type,
            errorName,
            expressErrorGenerator: this.expressErrorGenerator,
        });
    }
}
