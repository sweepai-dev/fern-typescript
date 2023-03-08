import { HttpEndpoint, MaybeStreamingResponse } from "@fern-fern/ir-model/http";
import { getTextOfTsNode } from "@fern-typescript/commons";
import { SdkClientClassContext } from "@fern-typescript/contexts";
import { zip } from "lodash-es";
import { OptionalKind, ParameterDeclarationStructure, ts } from "ts-morph";
import { AbstractNonStreamingGeneratedEndpointImplementation } from "./AbstractNonStreamingGeneratedEndpointImplementation";
import { EndpointSignature, GeneratedEndpointImplementation } from "./GeneratedEndpointImplementation";
import { GeneratedStreamingEndpointImplementation } from "./GeneratedStreamingEndpointImplementation";

export declare namespace GeneratedMaybeStreamingEndpointImplementation {
    export interface Init {
        endpoint: HttpEndpoint;
        response: MaybeStreamingResponse;
        nonStreamingEndpointImplementation: AbstractNonStreamingGeneratedEndpointImplementation;
        streamingEndpointImplementation: GeneratedStreamingEndpointImplementation;
    }
}

export class GeneratedMaybeStreamingEndpointImplementation implements GeneratedEndpointImplementation {
    public endpoint: HttpEndpoint;
    private response: MaybeStreamingResponse;
    private nonStreamingEndpointImplementation: AbstractNonStreamingGeneratedEndpointImplementation;
    private streamingEndpointImplementation: GeneratedStreamingEndpointImplementation;

    constructor({
        endpoint,
        response,
        nonStreamingEndpointImplementation,
        streamingEndpointImplementation,
    }: GeneratedMaybeStreamingEndpointImplementation.Init) {
        this.endpoint = endpoint;
        this.response = response;
        this.nonStreamingEndpointImplementation = nonStreamingEndpointImplementation;
        this.streamingEndpointImplementation = streamingEndpointImplementation;
    }

    public getStatements(context: SdkClientClassContext): ts.Statement[] {
        const referenceToRequestBody = this.nonStreamingEndpointImplementation.getReferenceToRequestBody(context);
        if (referenceToRequestBody == null) {
            throw new Error("Cannot generate maybe-streaming endpoint because request parameter is not defined.");
        }

        return [
            ts.factory.createIfStatement(
                ts.factory.createPropertyAccessExpression(
                    referenceToRequestBody,
                    ts.factory.createIdentifier(this.response.condition.requestPropertyKey)
                ),
                ts.factory.createBlock(this.streamingEndpointImplementation.getStatements(context), true),
                ts.factory.createBlock(this.nonStreamingEndpointImplementation.getStatements(context), true)
            ),
        ];
    }

    public getOverloads(context: SdkClientClassContext): EndpointSignature[] {
        return [
            this.nonStreamingEndpointImplementation.getSignature(context, {
                requestBodyIntersection: ts.factory.createTypeLiteralNode([
                    ts.factory.createPropertySignature(
                        undefined,
                        ts.factory.createIdentifier(this.response.condition.requestPropertyKey),
                        ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                        ts.factory.createLiteralTypeNode(ts.factory.createFalse())
                    ),
                ]),
            }),

            this.streamingEndpointImplementation.getSignature(context, {
                requestBodyIntersection: ts.factory.createTypeLiteralNode([
                    ts.factory.createPropertySignature(
                        undefined,
                        ts.factory.createIdentifier(this.response.condition.requestPropertyKey),
                        undefined,
                        ts.factory.createLiteralTypeNode(ts.factory.createTrue())
                    ),
                ]),
            }),
        ];
    }

    public getSignature(context: SdkClientClassContext): EndpointSignature {
        const nonStreamingSignature = this.nonStreamingEndpointImplementation.getSignature(context);
        const streamingSignature = this.streamingEndpointImplementation.getSignature(context);
        return {
            parameters: this.mergeEndpointParameters(nonStreamingSignature.parameters, streamingSignature.parameters),
            returnTypeWithoutPromise: this.maybeUnionTypes(
                nonStreamingSignature.returnTypeWithoutPromise,
                streamingSignature.returnTypeWithoutPromise
            ),
        };
    }

    private mergeEndpointParameters(
        aParameters: OptionalKind<ParameterDeclarationStructure>[],
        bParameters: OptionalKind<ParameterDeclarationStructure>[]
    ): OptionalKind<ParameterDeclarationStructure>[] {
        return zip(aParameters, bParameters).map(([aParam, bParam]) => {
            const firstDefinedParam: OptionalKind<ParameterDeclarationStructure> | undefined = aParam ?? bParam;
            if (firstDefinedParam == null) {
                throw new Error("zip() resulted in two undefined parameters.");
            }
            if (aParam != null && bParam != null && aParam.type !== bParam.type) {
                throw new Error("Two parameters at same index hae different types.");
            }
            return {
                name: firstDefinedParam.name,
                hasQuestionToken:
                    aParam == null ||
                    bParam == null ||
                    (aParam.hasQuestionToken ?? false) ||
                    (bParam.hasQuestionToken ?? false),
                type: firstDefinedParam.type,
            };
        });
    }

    private maybeUnionTypes(a: ts.TypeNode, b: ts.TypeNode) {
        if (getTextOfTsNode(a) === getTextOfTsNode(b)) {
            return a;
        } else {
            return ts.factory.createUnionTypeNode([a, b]);
        }
    }

    public getDocs(): string | undefined {
        return this.endpoint.docs ?? undefined;
    }
}