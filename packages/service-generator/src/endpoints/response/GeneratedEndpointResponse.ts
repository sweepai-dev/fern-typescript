import { getTextOfTsNode } from "@fern-typescript/commons";
import { ServiceContext } from "@fern-typescript/sdk-declaration-handler";
import { ts } from "ts-morph";
import { EndpointErrorUnionGenerator } from "../error/EndpointErrorUnionGenerator";

export class GeneratedEndpointResponse {
    private static RESPONSE_VARIABLE = "response";
    private static TYPE_NAME = "Response";

    private endpointError: GeneratedEndpointError;

    constructor({ endpointError, ...superInit }: GeneratedEndpointResponse.Init) {
        super(superInit);
        this.endpointError = endpointError;
    }

    public writeToEndpointFile(context: ServiceContext): void {
        context.sourceFile.addTypeAlias({
            name: GeneratedEndpointResponse.TYPE_NAME,
            isExported: true,
            type: getTextOfTsNode(
                context.coreUtilities.fetcher.APIResponse._getReferenceToType(
                    this.endpoint.response.type._type === "void"
                        ? ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword)
                        : context.getReferenceToType(this.endpoint.response.type).typeNode,
                    this.endpointError.getReferenceTo(context).getTypeNode()
                )
            ),
        });
    }

    public getResponseType(context: ServiceContext): ts.TypeNode {
        return ts.factory.createTypeReferenceNode("Promise", [
            context
                .getReferenceToEndpointFileExport(this.endpoint.id, GeneratedEndpointResponse.TYPE_NAME)
                .getTypeNode(),
        ]);
    }

    public getReturnResponseStatements(context: ServiceContext): ts.Statement[] {
        return [
            this.getReturnResponseIfOk(context),
            ...this.getReturnResponseForKnownErrors(context),
            this.getReturnResponseForUnknownError(context),
        ];
    }

    private getReturnResponseIfOk(context: ServiceContext): ts.Statement {
        return ts.factory.createIfStatement(
            ts.factory.createPropertyAccessExpression(
                ts.factory.createIdentifier(GeneratedEndpointResponse.RESPONSE_VARIABLE),
                ts.factory.createIdentifier("ok")
            ),
            ts.factory.createBlock(
                [
                    ts.factory.createReturnStatement(
                        context.coreUtilities.fetcher.APIResponse.SuccessfulResponse._build(
                            this.getOkResponseBody(context)
                        )
                    ),
                ],
                true
            )
        );
    }

    private getOkResponseBody(context: ServiceContext): ts.Expression {
        if (!this.hasResponseBody()) {
            return ts.factory.createIdentifier("undefined");
        }

        return context
            .getSchemaOfServiceBeingGenerated()
            .getResponseSchema()
            .parse(
                ts.factory.createAsExpression(
                    ts.factory.createPropertyAccessExpression(
                        ts.factory.createIdentifier(GeneratedEndpointResponse.RESPONSE_VARIABLE),
                        context.coreUtilities.fetcher.APIResponse.SuccessfulResponse.body
                    ),
                    context.getSchemaOfServiceBeingGenerated().getReferenceToRawResponseBody()
                )
            );
    }

    private hasResponseBody(): boolean {
        return this.endpoint.response.type._type !== "void";
    }

    private getReturnResponseForKnownErrors(context: ServiceContext): ts.Statement[] {
        const allErrorsButLast = this.endpointError.getErrors();
        const lastError = allErrorsButLast.pop();

        if (lastError == null) {
            return [];
        }

        const referenceToError = ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier(GeneratedEndpointResponse.RESPONSE_VARIABLE),
            context.coreUtilities.fetcher.APIResponse.FailedResponse.error
        );
        const referenceToErrorBody = ts.factory.createPropertyAccessExpression(
            referenceToError,
            context.coreUtilities.fetcher.Fetcher.FailedStatusCodeError.body
        );

        const ifStatement = ts.factory.createIfStatement(
            ts.factory.createBinaryExpression(
                ts.factory.createPropertyAccessExpression(
                    referenceToError,
                    context.coreUtilities.fetcher.Fetcher.Error.reason
                ),
                ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                ts.factory.createStringLiteral(
                    context.coreUtilities.fetcher.Fetcher.FailedStatusCodeError._reasonLiteralValue
                )
            ),
            ts.factory.createBlock(
                [
                    ts.factory.createSwitchStatement(
                        ts.factory.createPropertyAccessChain(
                            ts.factory.createAsExpression(
                                referenceToErrorBody,
                                context.getSchemaOfServiceBeingGenerated().getReferenceToRawErrorBody()
                            ),
                            ts.factory.createToken(ts.SyntaxKind.QuestionDotToken),
                            this.endpoint.errorsV2.discriminant.wireValue
                        ),
                        ts.factory.createCaseBlock([
                            ...allErrorsButLast.map((error) =>
                                ts.factory.createCaseClause(
                                    ts.factory.createStringLiteral(error.getDiscriminantValue()),
                                    []
                                )
                            ),
                            ts.factory.createCaseClause(
                                ts.factory.createStringLiteral(lastError.getDiscriminantValue()),
                                [
                                    ts.factory.createReturnStatement(
                                        context.coreUtilities.fetcher.APIResponse.FailedResponse._build(
                                            context
                                                .getSchemaOfServiceBeingGenerated()
                                                .getErrorSchema()
                                                .parse(
                                                    ts.factory.createAsExpression(
                                                        referenceToErrorBody,
                                                        context
                                                            .getSchemaOfServiceBeingGenerated()
                                                            .getReferenceToRawErrorBody()
                                                    )
                                                )
                                        )
                                    ),
                                ]
                            ),
                        ])
                    ),
                ],
                true
            ),
            undefined
        );

        return [ifStatement];
    }

    private getReturnResponseForUnknownError(context: ServiceContext): ts.Statement {
        const referenceToError = ts.factory.createPropertyAccessExpression(
            ts.factory.createIdentifier(GeneratedEndpointResponse.RESPONSE_VARIABLE),
            context.coreUtilities.fetcher.APIResponse.FailedResponse.error
        );

        return ts.factory.createReturnStatement(
            context.coreUtilities.fetcher.APIResponse.FailedResponse._build(
                ts.factory.createObjectLiteralExpression(
                    [
                        ts.factory.createPropertyAssignment(
                            AbstractParsedSingleUnionType.getDiscriminantKey(this.endpoint.errorsV2.discriminant),
                            ts.factory.createIdentifier("undefined")
                        ),
                        ts.factory.createPropertyAssignment(
                            EndpointErrorUnionGenerator.UNKNOWN_ERROR_PROPERTY_NAME,
                            referenceToError
                        ),
                        ts.factory.createPropertyAssignment(
                            UnionModule.VISIT_UTIL_PROPERTY_NAME,
                            UnionVisitHelper.getVisitMethod({
                                visitorKey: UnionVisitHelper.UNKNOWN_VISITOR_KEY,
                                visitorArguments: [referenceToError],
                            })
                        ),
                    ],
                    true
                )
            )
        );
    }
}
