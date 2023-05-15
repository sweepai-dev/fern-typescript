import {
    ContainerType,
    DeclaredTypeName,
    Literal,
    PrimitiveType,
    ResolvedTypeReference,
    ShapeType,
    TypeReference,
} from "@fern-fern/ir-model/types";
import { ExpressionReferenceNode } from "@fern-typescript/commons";
import { ts } from "ts-morph";
import { AbstractTypeReferenceConverter } from "./AbstractTypeReferenceConverter";

export declare namespace TypeReferenceToStringExpressionConverter {
    export interface Init extends AbstractTypeReferenceConverter.Init {}
}

export class TypeReferenceToStringExpressionConverter extends AbstractTypeReferenceConverter<
    (reference: ts.Expression) => ExpressionReferenceNode
> {
    protected override named(typeName: DeclaredTypeName): (reference: ts.Expression) => ExpressionReferenceNode {
        const resolvedType = this.typeResolver.resolveTypeName(typeName);
        return ResolvedTypeReference._visit<(reference: ts.Expression) => ExpressionReferenceNode>(resolvedType, {
            container: this.container.bind(this),
            primitive: this.primitive.bind(this),
            named: ({ shape }) => {
                if (shape === ShapeType.Enum) {
                    return this.string();
                }
                if (shape === ShapeType.UndiscriminatedUnion) {
                    return this.jsonStringifyIfNotString.bind(this);
                }
                return this.jsonStringify.bind(this);
            },
            unknown: this.unknown.bind(this),
            _unknown: () => {
                throw new Error("Unknown ResolvedTypeReference: " + resolvedType._type);
            },
        });
    }

    protected override string(): (reference: ts.Expression) => ExpressionReferenceNode {
        return (reference) => this.maybeOptionalString(reference, { isOptional: false });
    }

    protected override number(): (reference: ts.Expression) => ExpressionReferenceNode {
        return (reference) => this.maybeOptionalNumber(reference, { isOptional: false });
    }

    protected override boolean(): (reference: ts.Expression) => ExpressionReferenceNode {
        return (reference) => this.maybeOptionalBoolean(reference, { isOptional: false });
    }

    protected override dateTime(): (reference: ts.Expression) => ExpressionReferenceNode {
        return (reference) => this.maybeOptionalDateTime(reference, { isOptional: false });
    }

    protected override optional(itemType: TypeReference): (reference: ts.Expression) => ExpressionReferenceNode {
        return (reference) => {
            return TypeReference._visit<ExpressionReferenceNode>(itemType, {
                named: (typeName) => this.optionalNamed(typeName, reference),
                primitive: (primitive) => this.optionalPrimitive(primitive, reference),
                container: (container) => this.optionalContainer(container, reference),
                unknown: () => this.optionalUnknown(reference),
                _unknown: () => {
                    throw new Error("Unexpected type reference: " + itemType._type);
                },
            });
        };
    }

    protected override unknown(): (reference: ts.Expression) => ExpressionReferenceNode {
        return this.jsonStringifyIfNotString.bind(this);
    }

    protected override list(): (reference: ts.Expression) => ExpressionReferenceNode {
        return this.jsonStringify.bind(this);
    }

    protected override literal(literal: Literal): (reference: ts.Expression) => ExpressionReferenceNode {
        return Literal._visit(literal, {
            string: () => (reference: ts.Expression) => ({
                expression: reference,
                isNullable: false,
            }),
            _unknown: () => {
                throw new Error("Unknown literal: " + literal.type);
            },
        });
    }

    protected override mapWithEnumKeys(): (reference: ts.Expression) => ExpressionReferenceNode {
        return this.jsonStringify.bind(this);
    }

    protected override mapWithNonEnumKeys(): (reference: ts.Expression) => ExpressionReferenceNode {
        return this.jsonStringify.bind(this);
    }

    protected override set(): (reference: ts.Expression) => ExpressionReferenceNode {
        return this.jsonStringify.bind(this);
    }

    private jsonStringify(reference: ts.Expression): ExpressionReferenceNode {
        return this.maybeOptionalJsonStringify(reference, { isOptional: false });
    }

    private jsonStringifyIfNotString(reference: ts.Expression): ExpressionReferenceNode {
        return this.maybeOptionalJsonStringifyIfNotString(reference, { isOptional: false });
    }

    private maybeOptionalJsonStringify(
        reference: ts.Expression,
        { isOptional }: { isOptional: boolean }
    ): ExpressionReferenceNode {
        return {
            expression: ts.factory.createCallExpression(
                ts.factory.createPropertyAccessExpression(
                    ts.factory.createIdentifier("JSON"),
                    ts.factory.createIdentifier("stringify")
                ),
                undefined,
                [reference]
            ),
            isNullable: isOptional,
        };
    }

    private maybeOptionalJsonStringifyIfNotString(
        reference: ts.Expression,
        { isOptional }: { isOptional: boolean }
    ): ExpressionReferenceNode {
        return {
            expression: ts.factory.createConditionalExpression(
                ts.factory.createBinaryExpression(
                    ts.factory.createTypeOfExpression(reference),
                    ts.factory.createToken(ts.SyntaxKind.EqualsEqualsEqualsToken),
                    ts.factory.createStringLiteral("string")
                ),
                ts.factory.createToken(ts.SyntaxKind.QuestionToken),
                reference,
                ts.factory.createToken(ts.SyntaxKind.ColonToken),
                this.jsonStringify(reference).expression
            ),
            isNullable: isOptional,
        };
    }

    private optionalNamed(typeName: DeclaredTypeName, reference: ts.Expression): ExpressionReferenceNode {
        const resolvedType = this.typeResolver.resolveTypeName(typeName);
        return ResolvedTypeReference._visit<ExpressionReferenceNode>(resolvedType, {
            container: (container) => this.optionalContainer(container, reference),
            primitive: (primitive) => this.optionalPrimitive(primitive, reference),
            named: ({ shape }) => {
                if (shape === ShapeType.Enum) {
                    return this.optionalString(reference);
                }
                if (shape === ShapeType.UndiscriminatedUnion) {
                    return this.optionalJsonStringifyIfNotString(reference);
                }
                return this.optionalJsonStringify(reference);
            },
            unknown: () => this.optionalUnknown(reference),
            _unknown: () => {
                throw new Error("Unknown ResolvedTypeReference: " + resolvedType._type);
            },
        });
    }

    private optionalContainer(container: ContainerType, reference: ts.Expression): ExpressionReferenceNode {
        return ContainerType._visit(container, {
            list: () => this.optionalList(reference),
            optional: (itemType) => this.optional(itemType)(reference),
            set: () => this.optionalSet(reference),
            map: () => this.optionalMap(reference),
            literal: (literal) => this.optionalLiteral(literal, reference),
            _unknown: () => {
                throw new Error("Unknown ContainerType: " + container._type);
            },
        });
    }

    private optionalUnknown(reference: ts.Expression): ExpressionReferenceNode {
        return {
            expression: this.optionalJsonStringifyIfNotString(reference).expression,
            isNullable: true,
        };
    }

    private optionalList(reference: ts.Expression): ExpressionReferenceNode {
        return {
            expression: this.optionalJsonStringify(reference).expression,
            isNullable: true,
        };
    }

    private optionalSet(reference: ts.Expression): ExpressionReferenceNode {
        return {
            expression: this.optionalJsonStringify(reference).expression,
            isNullable: true,
        };
    }

    private optionalMap(reference: ts.Expression): ExpressionReferenceNode {
        return {
            expression: this.optionalJsonStringify(reference).expression,
            isNullable: true,
        };
    }

    private optionalLiteral(literal: Literal, reference: ts.Expression): ExpressionReferenceNode {
        return {
            expression: this.literal(literal)(reference).expression,
            isNullable: true,
        };
    }

    private optionalPrimitive(primitive: PrimitiveType, reference: ts.Expression): ExpressionReferenceNode {
        return PrimitiveType._visit<ExpressionReferenceNode>(primitive, {
            boolean: () => this.maybeOptionalBoolean(reference, { isOptional: true }),
            double: () => this.maybeOptionalNumber(reference, { isOptional: true }),
            integer: () => this.maybeOptionalNumber(reference, { isOptional: true }),
            long: () => this.maybeOptionalNumber(reference, { isOptional: true }),
            string: () => this.optionalString(reference),
            uuid: () => this.optionalString(reference),
            dateTime: () => this.maybeOptionalDateTime(reference, { isOptional: true }),
            date: () => this.optionalString(reference),
            base64: () => this.optionalString(reference),
            _unknown: () => {
                throw new Error("Unexpected primitive type: " + primitive);
            },
        });
    }

    private optionalString(reference: ts.Expression): ExpressionReferenceNode {
        return this.maybeOptionalString(reference, { isOptional: true });
    }

    private maybeOptionalString(
        reference: ts.Expression,
        { isOptional }: { isOptional: boolean }
    ): ExpressionReferenceNode {
        return { expression: reference, isNullable: isOptional };
    }

    private maybeOptionalNumber(
        reference: ts.Expression,
        { isOptional }: { isOptional: boolean }
    ): ExpressionReferenceNode {
        return {
            expression: ts.factory.createCallExpression(
                ts.factory.createPropertyAccessChain(
                    reference,
                    isOptional ? ts.factory.createToken(ts.SyntaxKind.QuestionDotToken) : undefined,
                    "toString"
                ),
                undefined,
                undefined
            ),
            isNullable: isOptional,
        };
    }

    private maybeOptionalBoolean(
        reference: ts.Expression,
        { isOptional }: { isOptional: boolean }
    ): ExpressionReferenceNode {
        return {
            expression: ts.factory.createCallExpression(
                ts.factory.createPropertyAccessChain(
                    reference,
                    isOptional ? ts.factory.createToken(ts.SyntaxKind.QuestionDotToken) : undefined,
                    "toString"
                ),
                undefined,
                undefined
            ),
            isNullable: isOptional,
        };
    }

    private maybeOptionalDateTime(
        reference: ts.Expression,
        { isOptional }: { isOptional: boolean }
    ): ExpressionReferenceNode {
        return {
            expression: ts.factory.createCallExpression(
                ts.factory.createPropertyAccessChain(
                    reference,
                    isOptional ? ts.factory.createToken(ts.SyntaxKind.QuestionDotToken) : undefined,
                    "toISOString"
                ),
                undefined,
                undefined
            ),
            isNullable: false,
        };
    }

    private optionalJsonStringify(reference: ts.Expression): ExpressionReferenceNode {
        return this.maybeOptionalJsonStringify(reference, { isOptional: false });
    }

    private optionalJsonStringifyIfNotString(reference: ts.Expression): ExpressionReferenceNode {
        return this.maybeOptionalJsonStringifyIfNotString(reference, { isOptional: false });
    }
}
