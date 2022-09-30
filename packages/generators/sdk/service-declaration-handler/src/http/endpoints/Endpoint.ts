import { DeclaredServiceName } from "@fern-fern/ir-model/services/commons";
import { HttpEndpoint } from "@fern-fern/ir-model/services/http";
import { getTextOfTsNode } from "@fern-typescript/commons";
import { SdkFile } from "@fern-typescript/sdk-declaration-handler";
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
import { EndpointError } from "./error/EndpointError";
import { EndpointRequest } from "./request/AbstractEndpointRequest";
import { NotWrappedEndpointRequest } from "./request/NotWrappedEndpointRequest";
import { WrappedEndpointRequest } from "./request/WrappedEndpointRequest";
import { EndpointResponse } from "./response/EndpointResponse";

export declare namespace Endpoint {
    export interface Init {
        file: SdkFile;
        serviceName: DeclaredServiceName;
        endpoint: HttpEndpoint;
    }
}

export class Endpoint {
    private request: EndpointRequest;
    private response: EndpointResponse;
    private error: EndpointError;
    private endpoint: HttpEndpoint;

    constructor({ serviceName, endpoint, file }: Endpoint.Init) {
        this.request = Endpoint.isRequestWrapped(endpoint)
            ? new WrappedEndpointRequest({ serviceName, endpoint })
            : new NotWrappedEndpointRequest({ serviceName, endpoint });

        this.error = new EndpointError({
            serviceName,
            endpoint,
            file,
        });

        this.response = new EndpointResponse({
            serviceName,
            endpoint,
            endpointError: this.error,
        });

        this.endpoint = endpoint;
    }

    private static isRequestWrapped(endpoint: HttpEndpoint): boolean {
        return endpoint.pathParameters.length > 0 || endpoint.queryParameters.length > 0 || endpoint.headers.length > 0;
    }

    public generate({ endpointFile, schemaFile }: { endpointFile: SdkFile; schemaFile: SdkFile }): void {
        this.request.generate({ endpointFile, schemaFile });
        this.response.generate({ endpointFile, schemaFile });
        this.error.generate({ endpointFile, schemaFile });
    }

    public getSignature(file: SdkFile): OptionalKind<MethodSignatureStructure> {
        const requestParameter = this.request.getRequestParameter(file);
        return {
            name: this.getMethodName(),
            parameters:
                requestParameter != null
                    ? [
                          {
                              name: requestParameter.name,
                              type: getTextOfTsNode(
                                  requestParameter.type.isOptional
                                      ? requestParameter.type.typeNodeWithoutUndefined
                                      : requestParameter.type.typeNode
                              ),
                              hasQuestionToken: requestParameter.type.isOptional,
                          },
                      ]
                    : [],
            returnType: getTextOfTsNode(this.response.getResponseType(file)),
        };
    }

    private getMethodName(): string {
        return this.endpoint.name.camelCase;
    }

    public getImplementation(file: SdkFile): OptionalKind<MethodDeclarationStructure> {
        const { name, parameters, returnType } = this.getSignature(file);
        return {
            name,
            parameters,
            returnType,
            scope: Scope.Public,
            isAsync: true,
            statements: this.generateMethodBody(file),
        };
    }

    private generateMethodBody(file: SdkFile): (StatementStructures | WriterFunction | string)[] {
        const statements: (StatementStructures | WriterFunction | string)[] = [];

        const { statements: statementsForRequest, fetcherArgs } = this.request.buildFetcherArgs(file);
        statements.push(...statementsForRequest.map(getTextOfTsNode));

        statements.push({
            kind: StructureKind.VariableStatement,
            declarationKind: VariableDeclarationKind.Const,
            declarations: [
                {
                    name: EndpointResponse.RESPONSE_VARIABLE,
                    initializer: getTextOfTsNode(file.coreUtilities.fetcher.Fetcher._invoke(fetcherArgs)),
                },
            ],
        });

        statements.push(...this.response.getReturnResponseStatements(file).map(getTextOfTsNode));

        return statements;
    }
}