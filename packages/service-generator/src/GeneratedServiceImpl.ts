import { getTextOfTsNode, maybeAddDocs } from "@fern-typescript/commons";
import { AugmentedService } from "@fern-typescript/commons-v2";
import { GeneratedService, ServiceContext } from "@fern-typescript/sdk-declaration-handler";
import { Scope, ts } from "ts-morph";
import { Client } from "./Client";
import { GeneratedEndpoint } from "./GeneratedEndpoint";
import { GeneratedWrappedService } from "./GeneratedWrappedService";

export declare namespace GeneratedServiceImpl {
    export interface Init {
        serviceName: string;
        serviceDeclaration: AugmentedService;
    }
}

export class GeneratedServiceImpl implements GeneratedService {
    private static OPTIONS_INTERFACE_NAME = "Options";
    private static OPTIONS_PRIVATE_MEMBER = "options";
    private static ORIGIN_OPTION_PROPERTY_NAME = "environment";
    private static AUTH_OPTION_PROPERTY_NAME = "auth";

    private serviceName: string;
    private serviceDeclaration: AugmentedService;
    private endpoints: GeneratedEndpoint[];
    private wrappedServices: GeneratedWrappedService[];

    constructor({ serviceName, serviceDeclaration }: GeneratedServiceImpl.Init) {
        this.serviceName = serviceName;
        this.serviceDeclaration = serviceDeclaration;

        if (serviceDeclaration.originalService == null) {
            this.endpoints = [];
        } else {
            this.endpoints = serviceDeclaration.originalService.endpoints.map(
                (endpoint) => new GeneratedEndpoint({ endpoint })
            );
        }

        this.wrappedServices = serviceDeclaration.wrappedServices.map(
            (serviceName) => new GeneratedWrappedService({ wrappedService: serviceName })
        );
    }

    public writeToFile(context: ServiceContext): void {
        const serviceModule = context.sourceFile.addModule({
            name: this.serviceName,
            isExported: true,
            hasDeclareKeyword: true,
        });

        const optionsInterface = serviceModule.addInterface({
            name: GeneratedServiceImpl.OPTIONS_INTERFACE_NAME,
            properties: [
                {
                    name: GeneratedServiceImpl.ORIGIN_OPTION_PROPERTY_NAME,
                    type: getTextOfTsNode(
                        context.environments != null
                            ? ts.factory.createUnionTypeNode([
                                  context.environments.getReferenceToEnvironmentEnum().getTypeNode(),
                                  ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword),
                              ])
                            : ts.factory.createKeywordTypeNode(ts.SyntaxKind.StringKeyword)
                    ),
                    hasQuestionToken: context.environments?.getReferenceToDefaultEnvironment != null,
                },
            ],
        });

        const authProperties = context.authSchemes.getProperties();
        if (authProperties.length > 0) {
            optionsInterface.addProperty({
                name: Client.AUTH_OPTION_PROPERTY_NAME,
                type: getTextOfTsNode(ts.factory.createTypeLiteralNode(authProperties)),
                hasQuestionToken: true,
            });
        }

        const globalHeaderProperties = context.globalHeaders.getProperties();
        for (const globalHeaderProperty of globalHeaderProperties) {
            optionsInterface.addProperty(globalHeaderProperty);
        }

        const serviceClass = context.sourceFile.addClass({
            name: this.serviceName,
            isExported: true,
        });
        maybeAddDocs(serviceClass, this.serviceDeclaration.originalService?.docs);

        serviceClass.addConstructor({
            parameters: [
                {
                    name: GeneratedServiceImpl.OPTIONS_PRIVATE_MEMBER,
                    isReadonly: true,
                    scope: Scope.Private,
                    type: getTextOfTsNode(
                        ts.factory.createTypeReferenceNode(
                            ts.factory.createQualifiedName(
                                ts.factory.createIdentifier(serviceModule.getName()),
                                ts.factory.createIdentifier(optionsInterface.getName())
                            )
                        )
                    ),
                },
            ],
        });

        for (const endpoint of this.endpoints) {
            serviceClass.addMethod(endpoint.getImplementation(context));
        }

        for (const wrappedService of this.wrappedServices) {
            wrappedService.addToServiceClass(serviceClass, context);
        }
    }
}
