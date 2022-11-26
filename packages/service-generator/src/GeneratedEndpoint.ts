import { HttpEndpoint } from "@fern-fern/ir-model/services/http";
import { getTextOfTsNode } from "@fern-typescript/commons";
import { ServiceContext } from "@fern-typescript/sdk-declaration-handler";
import {
    MethodDeclarationStructure,
    MethodSignatureStructure,
    OptionalKind,
    Scope,
    StatementStructures,
    StructureKind,
    VariableDeclarationKind,
    WriterFunction,
} from "ts-morph";

export declare namespace GeneratedEndpoint {
    export interface Init {
        endpoint: HttpEndpoint;
    }
}

export class GeneratedEndpoint {
    private static RESPONSE_VARIABLE = "response";
    private endpoint: HttpEndpoint;
    private request: GeneratedEndpointRequest;
    private response: GeneratedEndpointResponse;
    private error: GeneratedEndpointError;

    constructor({ endpoint }: GeneratedEndpoint.Init) {
        this.endpoint = endpoint;
        this.request = new GeneratedEndpointRequest();
        this.response = new GeneratedEndpointResponse();
        this.error = new GeneratedEndpointError();
    }

    public writeEndpointFile(context: ServiceContext): void {
        this.request.writeToEndpointFile(context);
        this.response.writeToEndpointFile(context);
        this.error.writeToEndpointFile(context);
    }

    public getImplementation(context: ServiceContext): OptionalKind<MethodDeclarationStructure> {
        const { name, parameters, returnType } = this.getSignature(context);
        return {
            name,
            parameters,
            returnType,
            scope: Scope.Public,
            isAsync: true,
            statements: this.generateMethodBody(context),
        };
    }

    private getSignature(context: ServiceContext): OptionalKind<MethodSignatureStructure> {
        const requestParameter = this.request.getRequestParameter(context);
        return {
            name: this.getMethodName(),
            parameters:
                requestParameter != null
                    ? [
                          {
                              name: requestParameter.name,
                              type: getTextOfTsNode(requestParameter.type.typeNodeWithoutUndefined),
                              hasQuestionToken: requestParameter.type.isOptional,
                          },
                      ]
                    : [],
            returnType: getTextOfTsNode(this.response.getResponseType(context)),
        };
    }

    private getMethodName(): string {
        return this.endpoint.name.camelCase;
    }

    private generateMethodBody(context: ServiceContext): (StatementStructures | WriterFunction | string)[] {
        const statements: (StatementStructures | WriterFunction | string)[] = [];

        const { statements: statementsForRequest, fetcherArgs } = this.request.buildFetcherArgs(context);
        statements.push(...statementsForRequest.map(getTextOfTsNode));

        statements.push({
            kind: StructureKind.VariableStatement,
            declarationKind: VariableDeclarationKind.Const,
            declarations: [
                {
                    name: GeneratedEndpoint.RESPONSE_VARIABLE,
                    initializer: getTextOfTsNode(context.coreUtilities.fetcher.Fetcher._invoke(fetcherArgs)),
                },
            ],
        });

        statements.push(...this.response.getReturnResponseStatements(context).map(getTextOfTsNode));

        return statements;
    }
}
