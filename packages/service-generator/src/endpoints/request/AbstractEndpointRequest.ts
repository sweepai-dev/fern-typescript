import { TypeReferenceNode } from "@fern-typescript/commons-v2";
import { Fetcher, ServiceContext } from "@fern-typescript/sdk-declaration-handler";
import { ts } from "ts-morph";
import urlJoin from "url-join";
import { Client } from "../../Client";
import { AbstractEndpointDeclaration } from "../AbstractEndpointDeclaration";

export interface EndpointRequest {
    writeToFile(context: ServiceContext): void;
    getRequestParameter(context: ServiceContext): { name: string; type: TypeReferenceNode } | undefined;
    buildFetcherArgs(context: ServiceContext): {
        statements: ts.Statement[];
        fetcherArgs: Fetcher.Args;
    };
}

export abstract class AbstractEndpointRequest extends AbstractEndpointDeclaration implements EndpointRequest {
    private static ENDPOINT_REQUEST_PARAMETER_NAME = "request";

    public writeToFile(context: ServiceContext): void {
        this.generateTypeDeclaration(context);
    }

    protected abstract generateTypeDeclaration(context: ServiceContext): void;

    public getRequestParameter(context: ServiceContext): { name: string; type: TypeReferenceNode } | undefined {
        const type = this.getRequestParameterType(context);
        if (type == null) {
            return undefined;
        }
        return {
            name: AbstractEndpointRequest.ENDPOINT_REQUEST_PARAMETER_NAME,
            type,
        };
    }

    protected getReferenceToRequestArgumentToEndpoint(): ts.Identifier {
        return ts.factory.createIdentifier(AbstractEndpointRequest.ENDPOINT_REQUEST_PARAMETER_NAME);
    }

    protected abstract getRequestParameterType(context: ServiceContext): TypeReferenceNode | undefined;

    public buildFetcherArgs(context: ServiceContext): {
        statements: ts.Statement[];
        fetcherArgs: Fetcher.Args;
    } {
        const statements: ts.Statement[] = [];

        const queryParameters = this.buildQueryParameters(context);
        if (queryParameters != null) {
            statements.push(...queryParameters.statements);
        }

        let referenceToOrigin = Client.getReferenceToOrigin();
        if (context.environments?.getReferenceToDefaultEnvironment != null) {
            referenceToOrigin = ts.factory.createBinaryExpression(
                referenceToOrigin,
                ts.factory.createToken(ts.SyntaxKind.QuestionQuestionToken),
                context.environments.getReferenceToDefaultEnvironment()
            );
        }

        return {
            statements,
            fetcherArgs: {
                url: context.externalDependencies.urlJoin.invoke([referenceToOrigin, this.getUrlPath(context)]),
                method: ts.factory.createStringLiteral(this.endpoint.method),
                headers: [...Client.getAuthHeaders(context), ...Client.getGlobalHeaders(context), ...this.getHeaders()],
                queryParameters: queryParameters?.referenceToUrlParams,
                body: this.hasRequestBody()
                    ? this.getReferenceToSchema(context).json(this.getReferenceToRequestBodyInsideEndpoint(context))
                    : undefined,
                timeoutMs: undefined,
            },
        };
    }

    protected abstract getUrlPath(context: ServiceContext): ts.Expression;

    protected abstract buildQueryParameters(
        file: ServiceContext
    ): { statements: ts.Statement[]; referenceToUrlParams: ts.Expression } | undefined;

    protected abstract getReferenceToRequestBodyInsideEndpoint(context: ServiceContext): ts.Expression;

    protected hasRequestBody(): boolean {
        return this.endpoint.request.type._type !== "void";
    }

    protected getUrlPathForNoPathParameters(): ts.Expression {
        if (this.service.basePathV2 != null && this.service.basePathV2.parts.length > 0) {
            throw new Error("Service base path contains parameters, but no path-parameters were specified");
        }
        if (this.endpoint.path.parts.length > 0) {
            throw new Error("Endpoint path contains parameters, but no path-parameters were specified");
        }
        if (this.service.basePathV2 == null) {
            return ts.factory.createStringLiteral(this.endpoint.path.head);
        }
        return ts.factory.createStringLiteral(urlJoin(this.service.basePathV2.head, this.endpoint.path.head));
    }

    protected abstract getHeaders(): ts.PropertyAssignment[];
}
