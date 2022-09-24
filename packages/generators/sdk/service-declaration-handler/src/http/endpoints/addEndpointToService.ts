import { HttpEndpoint } from "@fern-fern/ir-model/services/http";
import { getTextOfTsNode } from "@fern-typescript/commons";
import { SdkFile } from "@fern-typescript/sdk-declaration-handler";
import { ClassDeclaration, InterfaceDeclaration, Scope, ts } from "ts-morph";
import { generateEndpointMethodBody } from "./endpoint-method-body/generateEndpointMethodBody";
import { getHttpRequestParameters } from "./getHttpRequestParameters";
import { parseEndpoint } from "./parse-endpoint/parseEndpoint";

export function addEndpointToService({
    endpoint,
    file,
    serviceInterface,
    serviceClass,
}: {
    file: SdkFile;
    endpoint: HttpEndpoint;
    serviceInterface: InterfaceDeclaration;
    serviceClass: ClassDeclaration;
}): void {
    const parsedEndpoint = parseEndpoint({ endpoint, file });

    const parameters = getHttpRequestParameters(parsedEndpoint);

    const returnType = getTextOfTsNode(
        ts.factory.createTypeReferenceNode(ts.factory.createIdentifier("Promise"), [
            file.externalDependencies.serviceUtils._Response._getReferenceToType(
                parsedEndpoint.referenceToResponse != null
                    ? parsedEndpoint.referenceToResponse.typeNode
                    : ts.factory.createKeywordTypeNode(ts.SyntaxKind.VoidKeyword),
                parsedEndpoint.error.reference
            ),
        ])
    );

    const methodDeclaration = serviceInterface.addMethod({
        name: parsedEndpoint.endpointMethodName,
        parameters,
        returnType,
    });

    serviceClass.addMethod({
        name: methodDeclaration.getName(),
        scope: Scope.Public,
        isAsync: true,
        parameters,
        returnType,
        statements: generateEndpointMethodBody({ endpoint: parsedEndpoint, file }),
    });
}