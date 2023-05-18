import { AbsoluteFilePath } from "@fern-api/fs-utils";
import { HttpService } from "@fern-fern/ir-model/http";
import { IntermediateRepresentation } from "@fern-fern/ir-model/ir";
import {
    convertExportedFilePathToFilePath,
    CoreUtilitiesManager,
    DependencyManager,
    ExportedDirectory,
    ExportedFilePath,
    ExportsManager,
    ImportsManager,
    NpmPackage,
    PackageId,
    SimpleTypescriptProject,
    TypescriptProject,
} from "@fern-typescript/commons";
import { GeneratorContext } from "@fern-typescript/contexts";
import { ExpressEndpointTypeSchemasGenerator } from "@fern-typescript/express-endpoint-type-schemas-generator";
import { ExpressErrorGenerator } from "@fern-typescript/express-error-generator";
import { ExpressErrorSchemaGenerator } from "@fern-typescript/express-error-schema-generator";
import { ExpressInlinedRequestBodyGenerator } from "@fern-typescript/express-inlined-request-body-generator";
import { ExpressInlinedRequestBodySchemaGenerator } from "@fern-typescript/express-inlined-request-schema-generator";
import { ExpressRegisterGenerator } from "@fern-typescript/express-register-generator";
import { ExpressServiceGenerator } from "@fern-typescript/express-service-generator";
import { GenericAPIExpressErrorGenerator } from "@fern-typescript/generic-express-error-generators";
import { ErrorResolver, PackageResolver, TypeResolver } from "@fern-typescript/resolvers";
import { TypeGenerator } from "@fern-typescript/type-generator";
import { TypeReferenceExampleGenerator } from "@fern-typescript/type-reference-example-generator";
import { TypeSchemaGenerator } from "@fern-typescript/type-schema-generator";
import { Directory, Project, SourceFile } from "ts-morph";
import { ExpressEndpointTypeSchemasContextImpl } from "./contexts/express-endpoint-type-schemas/ExpressEndpointTypeSchemasContextImpl";
import { ExpressErrorSchemaContextImpl } from "./contexts/express-error-schema/ExpressErrorSchemaContextImpl";
import { ExpressErrorContextImpl } from "./contexts/express-error/ExpressErrorContextImpl";
import { ExpressInlinedRequestBodySchemaContextImpl } from "./contexts/express-inlined-request-body-schema/ExpressInlinedRequestBodySchemaContextImpl";
import { ExpressInlinedRequestBodyContextImpl } from "./contexts/express-inlined-request-body/ExpressInlinedRequestBodyContextImpl";
import { ExpressRegisterContextImpl } from "./contexts/express-register/ExpressRegisterContextImpl";
import { ExpressServiceContextImpl } from "./contexts/express-service/ExpressServiceContextImpl";
import { GenericAPIExpressErrorContextImpl } from "./contexts/generic-api-express-error/GenericAPIExpressErrorContextImpl";
import { TypeSchemaContextImpl } from "./contexts/type-schema/TypeSchemaContextImpl";
import { TypeContextImpl } from "./contexts/type/TypeContextImpl";
import { EndpointDeclarationReferencer } from "./declaration-referencers/EndpointDeclarationReferencer";
import { ExpressErrorDeclarationReferencer } from "./declaration-referencers/ExpressErrorDeclarationReferencer";
import { ExpressInlinedRequestBodyDeclarationReferencer } from "./declaration-referencers/ExpressInlinedRequestBodyDeclarationReferencer";
import { ExpressRegisterDeclarationReferencer } from "./declaration-referencers/ExpressRegisterDeclarationReferencer";
import { ExpressServiceDeclarationReferencer } from "./declaration-referencers/ExpressServiceDeclarationReferencer";
import { GenericAPIExpressErrorDeclarationReferencer } from "./declaration-referencers/GenericAPIExpressErrorDeclarationReferencer";
import { TypeDeclarationReferencer } from "./declaration-referencers/TypeDeclarationReferencer";

const FILE_HEADER = `/**
 * This file was auto-generated by Fern from our API Definition.
 */
`;

export declare namespace ExpressGenerator {
    export interface Init {
        namespaceExport: string;
        intermediateRepresentation: IntermediateRepresentation;
        context: GeneratorContext;
        npmPackage: NpmPackage;
        config: Config;
    }

    export interface Config {
        shouldUseBrandedStringAliases: boolean;
        areImplementationsOptional: boolean;
        doNotHandleUnrecognizedErrors: boolean;
        includeUtilsOnUnionMembers: boolean;
        includeOtherInUnionTypes: boolean;
    }
}

export class ExpressGenerator {
    private context: GeneratorContext;
    private intermediateRepresentation: IntermediateRepresentation;
    private npmPackage: NpmPackage;

    private project: Project;
    private rootDirectory: Directory;
    private exportsManager: ExportsManager;
    private dependencyManager = new DependencyManager();
    private coreUtilitiesManager: CoreUtilitiesManager;
    private typeResolver: TypeResolver;
    private errorResolver: ErrorResolver;
    private packageResolver: PackageResolver;

    private typeDeclarationReferencer: TypeDeclarationReferencer;
    private typeSchemaDeclarationReferencer: TypeDeclarationReferencer;
    private expressInlinedRequestBodyDeclarationReferencer: ExpressInlinedRequestBodyDeclarationReferencer;
    private expressInlinedRequestBodySchemaDeclarationReferencer: ExpressInlinedRequestBodyDeclarationReferencer;
    private expressEndpointSchemaDeclarationReferencer: EndpointDeclarationReferencer;
    private expressServiceDeclarationReferencer: ExpressServiceDeclarationReferencer;
    private expressRegisterDeclarationReferencer: ExpressRegisterDeclarationReferencer;
    private genericApiExpressErrorDeclarationReferencer: GenericAPIExpressErrorDeclarationReferencer;
    private expressErrorDeclarationReferencer: ExpressErrorDeclarationReferencer;
    private expressErrorSchemaDeclarationReferencer: ExpressErrorDeclarationReferencer;

    private typeGenerator: TypeGenerator;
    private typeSchemaGenerator: TypeSchemaGenerator;
    private typeReferenceExampleGenerator: TypeReferenceExampleGenerator;
    private expressInlinedRequestBodyGenerator: ExpressInlinedRequestBodyGenerator;
    private expressInlinedRequestBodySchemaGenerator: ExpressInlinedRequestBodySchemaGenerator;
    private expressEndpointTypeSchemasGenerator: ExpressEndpointTypeSchemasGenerator;
    private expressServiceGenerator: ExpressServiceGenerator;
    private expressRegisterGenerator: ExpressRegisterGenerator;
    private genericApiExpressErrorGenerator: GenericAPIExpressErrorGenerator;
    private expressErrorGenerator: ExpressErrorGenerator;
    private expressErrorSchemaGenerator: ExpressErrorSchemaGenerator;

    constructor({ namespaceExport, intermediateRepresentation, context, npmPackage, config }: ExpressGenerator.Init) {
        this.context = context;
        this.intermediateRepresentation = intermediateRepresentation;
        this.npmPackage = npmPackage;

        this.exportsManager = new ExportsManager();
        this.coreUtilitiesManager = new CoreUtilitiesManager();

        this.project = new Project({
            useInMemoryFileSystem: true,
        });
        this.rootDirectory = this.project.createDirectory("/");
        this.typeResolver = new TypeResolver(intermediateRepresentation);
        this.errorResolver = new ErrorResolver(intermediateRepresentation);
        this.packageResolver = new PackageResolver(intermediateRepresentation);

        const apiDirectory: ExportedDirectory[] = [
            {
                nameOnDisk: "api",
                exportDeclaration: { namespaceExport },
            },
        ];

        const schemaDirectory: ExportedDirectory[] = [
            {
                nameOnDisk: "serialization",
            },
        ];

        this.typeDeclarationReferencer = new TypeDeclarationReferencer({
            containingDirectory: apiDirectory,
            namespaceExport,
        });
        this.typeSchemaDeclarationReferencer = new TypeDeclarationReferencer({
            containingDirectory: schemaDirectory,
            namespaceExport,
        });
        this.expressInlinedRequestBodyDeclarationReferencer = new ExpressInlinedRequestBodyDeclarationReferencer({
            packageResolver: this.packageResolver,
            containingDirectory: apiDirectory,
            namespaceExport,
        });
        this.expressInlinedRequestBodySchemaDeclarationReferencer = new ExpressInlinedRequestBodyDeclarationReferencer({
            packageResolver: this.packageResolver,
            containingDirectory: schemaDirectory,
            namespaceExport,
        });
        this.expressEndpointSchemaDeclarationReferencer = new EndpointDeclarationReferencer({
            packageResolver: this.packageResolver,
            containingDirectory: schemaDirectory,
            namespaceExport,
        });
        this.expressServiceDeclarationReferencer = new ExpressServiceDeclarationReferencer({
            packageResolver: this.packageResolver,
            containingDirectory: apiDirectory,
            namespaceExport,
        });
        this.expressRegisterDeclarationReferencer = new ExpressRegisterDeclarationReferencer({
            containingDirectory: [],
            namespaceExport,
        });
        this.genericApiExpressErrorDeclarationReferencer = new GenericAPIExpressErrorDeclarationReferencer({
            containingDirectory: [],
            namespaceExport,
        });
        this.expressErrorDeclarationReferencer = new ExpressErrorDeclarationReferencer({
            containingDirectory: apiDirectory,
            namespaceExport,
        });
        this.expressErrorSchemaDeclarationReferencer = new ExpressErrorDeclarationReferencer({
            containingDirectory: schemaDirectory,
            namespaceExport,
        });

        this.typeGenerator = new TypeGenerator({
            useBrandedStringAliases: config.shouldUseBrandedStringAliases,
            includeUtilsOnUnionMembers: config.includeUtilsOnUnionMembers,
            includeOtherInUnionTypes: config.includeOtherInUnionTypes,
        });
        this.typeSchemaGenerator = new TypeSchemaGenerator({
            includeUtilsOnUnionMembers: config.includeUtilsOnUnionMembers,
        });
        this.typeReferenceExampleGenerator = new TypeReferenceExampleGenerator();
        this.expressInlinedRequestBodyGenerator = new ExpressInlinedRequestBodyGenerator();
        this.expressInlinedRequestBodySchemaGenerator = new ExpressInlinedRequestBodySchemaGenerator();
        this.expressEndpointTypeSchemasGenerator = new ExpressEndpointTypeSchemasGenerator();
        this.expressServiceGenerator = new ExpressServiceGenerator({
            packageResolver: this.packageResolver,
            doNotHandleUnrecognizedErrors: config.doNotHandleUnrecognizedErrors,
        });
        this.expressRegisterGenerator = new ExpressRegisterGenerator({
            packageResolver: this.packageResolver,
            intermediateRepresentation: this.intermediateRepresentation,
            registerFunctionName: this.expressRegisterDeclarationReferencer.getRegisterFunctionName(),
            areImplementationsOptional: config.areImplementationsOptional,
        });
        this.genericApiExpressErrorGenerator = new GenericAPIExpressErrorGenerator();
        this.expressErrorGenerator = new ExpressErrorGenerator();
        this.expressErrorSchemaGenerator = new ExpressErrorSchemaGenerator();
    }

    public async generate(): Promise<TypescriptProject> {
        this.generateTypeDeclarations();
        this.generateTypeSchemas();
        this.generateInlinedRequestBodies();
        this.generateInlinedRequestBodySchemas();
        this.generateEndpointTypeSchemas();
        this.generateExpressServices();
        this.generateExpressRegister();
        this.generateGenericApiExpressGenerator();
        this.generateErrorDeclarations();
        this.generateErrorSchemas();

        this.coreUtilitiesManager.finalize(this.exportsManager, this.dependencyManager);
        this.exportsManager.writeExportsToProject(this.rootDirectory);

        return new SimpleTypescriptProject({
            npmPackage: this.npmPackage,
            dependencies: this.dependencyManager.getDependencies(),
            tsMorphProject: this.project,
            outputEsm: false,
            extraDependencies: {},
        });
    }

    public async copyCoreUtilities({ pathToSrc }: { pathToSrc: AbsoluteFilePath }): Promise<void> {
        await this.coreUtilitiesManager.copyCoreUtilities({ pathToSrc });
    }

    private generateTypeDeclarations() {
        for (const typeDeclaration of Object.values(this.intermediateRepresentation.types)) {
            this.withSourceFile({
                filepath: this.typeDeclarationReferencer.getExportedFilepath(typeDeclaration.name),
                run: ({ sourceFile, importsManager }) => {
                    const typeContext = new TypeContextImpl({
                        sourceFile,
                        coreUtilitiesManager: this.coreUtilitiesManager,
                        dependencyManager: this.dependencyManager,
                        fernConstants: this.intermediateRepresentation.constants,
                        importsManager,
                        typeResolver: this.typeResolver,
                        typeDeclarationReferencer: this.typeDeclarationReferencer,
                        typeGenerator: this.typeGenerator,
                        typeReferenceExampleGenerator: this.typeReferenceExampleGenerator,
                    });
                    typeContext.type.getGeneratedType(typeDeclaration.name).writeToFile(typeContext);
                },
            });
        }
    }

    private generateTypeSchemas() {
        for (const typeDeclaration of Object.values(this.intermediateRepresentation.types)) {
            this.withSourceFile({
                filepath: this.typeSchemaDeclarationReferencer.getExportedFilepath(typeDeclaration.name),
                run: ({ sourceFile, importsManager }) => {
                    const typeSchemaContext = new TypeSchemaContextImpl({
                        sourceFile,
                        coreUtilitiesManager: this.coreUtilitiesManager,
                        dependencyManager: this.dependencyManager,
                        fernConstants: this.intermediateRepresentation.constants,
                        importsManager,
                        typeResolver: this.typeResolver,
                        typeDeclarationReferencer: this.typeDeclarationReferencer,
                        typeSchemaDeclarationReferencer: this.typeSchemaDeclarationReferencer,
                        typeGenerator: this.typeGenerator,
                        typeSchemaGenerator: this.typeSchemaGenerator,
                        typeReferenceExampleGenerator: this.typeReferenceExampleGenerator,
                    });
                    typeSchemaContext.typeSchema
                        .getGeneratedTypeSchema(typeDeclaration.name)
                        .writeToFile(typeSchemaContext);
                },
            });
        }
    }

    private generateErrorDeclarations() {
        for (const errorDeclaration of Object.values(this.intermediateRepresentation.errors)) {
            this.withSourceFile({
                filepath: this.expressErrorDeclarationReferencer.getExportedFilepath(errorDeclaration.name),
                run: ({ sourceFile, importsManager }) => {
                    const errorContext = new ExpressErrorContextImpl({
                        sourceFile,
                        coreUtilitiesManager: this.coreUtilitiesManager,
                        dependencyManager: this.dependencyManager,
                        fernConstants: this.intermediateRepresentation.constants,
                        importsManager,
                        typeResolver: this.typeResolver,
                        typeDeclarationReferencer: this.typeDeclarationReferencer,
                        typeGenerator: this.typeGenerator,
                        typeReferenceExampleGenerator: this.typeReferenceExampleGenerator,
                        expressErrorGenerator: this.expressErrorGenerator,
                        errorDeclarationReferencer: this.expressErrorDeclarationReferencer,
                        errorResolver: this.errorResolver,
                        genericAPIExpressErrorDeclarationReferencer: this.genericApiExpressErrorDeclarationReferencer,
                        genericAPIExpressErrorGenerator: this.genericApiExpressErrorGenerator,
                        expressErrorSchemaDeclarationReferencer: this.expressErrorSchemaDeclarationReferencer,
                        expressErrorSchemaGenerator: this.expressErrorSchemaGenerator,
                        typeSchemaDeclarationReferencer: this.typeSchemaDeclarationReferencer,
                        typeSchemaGenerator: this.typeSchemaGenerator,
                    });
                    errorContext.expressError.getGeneratedExpressError(errorDeclaration.name).writeToFile(errorContext);
                },
            });
        }
    }

    private generateErrorSchemas() {
        for (const errorDeclaration of Object.values(this.intermediateRepresentation.errors)) {
            this.withSourceFile({
                filepath: this.expressErrorSchemaDeclarationReferencer.getExportedFilepath(errorDeclaration.name),
                run: ({ sourceFile, importsManager }) => {
                    const errorContext = new ExpressErrorSchemaContextImpl({
                        sourceFile,
                        coreUtilitiesManager: this.coreUtilitiesManager,
                        dependencyManager: this.dependencyManager,
                        fernConstants: this.intermediateRepresentation.constants,
                        importsManager,
                        typeResolver: this.typeResolver,
                        typeDeclarationReferencer: this.typeDeclarationReferencer,
                        typeGenerator: this.typeGenerator,
                        typeReferenceExampleGenerator: this.typeReferenceExampleGenerator,
                        expressErrorGenerator: this.expressErrorGenerator,
                        errorDeclarationReferencer: this.expressErrorDeclarationReferencer,
                        errorResolver: this.errorResolver,
                        genericAPIExpressErrorDeclarationReferencer: this.genericApiExpressErrorDeclarationReferencer,
                        genericAPIExpressErrorGenerator: this.genericApiExpressErrorGenerator,
                        expressErrorSchemaDeclarationReferencer: this.expressErrorSchemaDeclarationReferencer,
                        expressErrorSchemaGenerator: this.expressErrorSchemaGenerator,
                        typeSchemaDeclarationReferencer: this.typeSchemaDeclarationReferencer,
                        typeSchemaGenerator: this.typeSchemaGenerator,
                    });
                    errorContext.expressErrorSchema
                        .getGeneratedExpressErrorSchema(errorDeclaration.name)
                        ?.writeToFile(errorContext);
                },
            });
        }
    }

    private generateInlinedRequestBodies() {
        this.forEachService((service, packageId) => {
            for (const endpoint of service.endpoints) {
                if (endpoint.requestBody?.type === "inlinedRequestBody") {
                    this.withSourceFile({
                        filepath: this.expressInlinedRequestBodyDeclarationReferencer.getExportedFilepath({
                            packageId,
                            endpoint,
                        }),
                        run: ({ sourceFile, importsManager }) => {
                            const context = new ExpressInlinedRequestBodyContextImpl({
                                sourceFile,
                                coreUtilitiesManager: this.coreUtilitiesManager,
                                dependencyManager: this.dependencyManager,
                                fernConstants: this.intermediateRepresentation.constants,
                                importsManager,
                                typeResolver: this.typeResolver,
                                typeDeclarationReferencer: this.typeDeclarationReferencer,
                                typeReferenceExampleGenerator: this.typeReferenceExampleGenerator,
                                typeGenerator: this.typeGenerator,
                                expressInlinedRequestBodyDeclarationReferencer:
                                    this.expressInlinedRequestBodyDeclarationReferencer,
                                expressInlinedRequestBodyGenerator: this.expressInlinedRequestBodyGenerator,
                                packageResolver: this.packageResolver,
                            });
                            context.expressInlinedRequestBody
                                .getGeneratedInlinedRequestBody(packageId, endpoint.name)
                                .writeToFile(context);
                        },
                    });
                }
            }
        });
    }

    private generateInlinedRequestBodySchemas() {
        this.forEachService((service, packageId) => {
            for (const endpoint of service.endpoints) {
                if (endpoint.requestBody?.type === "inlinedRequestBody") {
                    this.withSourceFile({
                        filepath: this.expressInlinedRequestBodySchemaDeclarationReferencer.getExportedFilepath({
                            packageId,
                            endpoint,
                        }),
                        run: ({ sourceFile, importsManager }) => {
                            const context = new ExpressInlinedRequestBodySchemaContextImpl({
                                sourceFile,
                                coreUtilitiesManager: this.coreUtilitiesManager,
                                dependencyManager: this.dependencyManager,
                                fernConstants: this.intermediateRepresentation.constants,
                                importsManager,
                                typeResolver: this.typeResolver,
                                typeDeclarationReferencer: this.typeDeclarationReferencer,
                                typeReferenceExampleGenerator: this.typeReferenceExampleGenerator,
                                typeGenerator: this.typeGenerator,
                                packageResolver: this.packageResolver,
                                expressInlinedRequestBodyDeclarationReferencer:
                                    this.expressInlinedRequestBodyDeclarationReferencer,
                                expressInlinedRequestBodyGenerator: this.expressInlinedRequestBodyGenerator,
                                expressInlinedRequestBodySchemaGenerator: this.expressInlinedRequestBodySchemaGenerator,
                                expressInlinedRequestBodySchemaDeclarationReferencer:
                                    this.expressInlinedRequestBodySchemaDeclarationReferencer,
                                typeSchemaGenerator: this.typeSchemaGenerator,
                                typeSchemaDeclarationReferencer: this.typeSchemaDeclarationReferencer,
                            });
                            context.expressInlinedRequestBodySchema
                                .getGeneratedInlinedRequestBodySchema(packageId, endpoint.name)
                                .writeToFile(context);
                        },
                    });
                }
            }
        });
    }

    private generateEndpointTypeSchemas() {
        this.forEachService((service, packageId) => {
            for (const endpoint of service.endpoints) {
                this.withSourceFile({
                    filepath: this.expressEndpointSchemaDeclarationReferencer.getExportedFilepath({
                        packageId,
                        endpoint,
                    }),
                    run: ({ sourceFile, importsManager }) => {
                        const endpointTypeSchemasContext = new ExpressEndpointTypeSchemasContextImpl({
                            sourceFile,
                            coreUtilitiesManager: this.coreUtilitiesManager,
                            dependencyManager: this.dependencyManager,
                            fernConstants: this.intermediateRepresentation.constants,
                            importsManager,
                            typeResolver: this.typeResolver,
                            typeDeclarationReferencer: this.typeDeclarationReferencer,
                            typeSchemaDeclarationReferencer: this.typeSchemaDeclarationReferencer,
                            typeReferenceExampleGenerator: this.typeReferenceExampleGenerator,
                            expressEndpointSchemaDeclarationReferencer: this.expressEndpointSchemaDeclarationReferencer,
                            typeGenerator: this.typeGenerator,
                            packageResolver: this.packageResolver,
                            expressEndpointTypeSchemasGenerator: this.expressEndpointTypeSchemasGenerator,
                            typeSchemaGenerator: this.typeSchemaGenerator,
                        });
                        endpointTypeSchemasContext.expressEndpointTypeSchemas
                            .getGeneratedEndpointTypeSchemas(packageId, endpoint.name)
                            .writeToFile(endpointTypeSchemasContext);
                    },
                });
            }
        });
    }

    private generateExpressServices() {
        this.forEachService((_service, packageId) => {
            this.withSourceFile({
                filepath: this.expressServiceDeclarationReferencer.getExportedFilepath(packageId),
                run: ({ sourceFile, importsManager }) => {
                    const expressServiceContext = new ExpressServiceContextImpl({
                        sourceFile,
                        coreUtilitiesManager: this.coreUtilitiesManager,
                        dependencyManager: this.dependencyManager,
                        fernConstants: this.intermediateRepresentation.constants,
                        importsManager,
                        typeResolver: this.typeResolver,
                        typeDeclarationReferencer: this.typeDeclarationReferencer,
                        typeSchemaDeclarationReferencer: this.typeSchemaDeclarationReferencer,
                        typeReferenceExampleGenerator: this.typeReferenceExampleGenerator,
                        expressEndpointSchemaDeclarationReferencer: this.expressEndpointSchemaDeclarationReferencer,
                        typeGenerator: this.typeGenerator,
                        packageResolver: this.packageResolver,
                        expressEndpointTypeSchemasGenerator: this.expressEndpointTypeSchemasGenerator,
                        typeSchemaGenerator: this.typeSchemaGenerator,
                        expressInlinedRequestBodyDeclarationReferencer:
                            this.expressInlinedRequestBodyDeclarationReferencer,
                        expressInlinedRequestBodyGenerator: this.expressInlinedRequestBodyGenerator,
                        expressInlinedRequestBodySchemaDeclarationReferencer:
                            this.expressInlinedRequestBodySchemaDeclarationReferencer,
                        expressInlinedRequestBodySchemaGenerator: this.expressInlinedRequestBodySchemaGenerator,
                        expressServiceDeclarationReferencer: this.expressServiceDeclarationReferencer,
                        expressServiceGenerator: this.expressServiceGenerator,
                        expressErrorGenerator: this.expressErrorGenerator,
                        errorDeclarationReferencer: this.expressErrorDeclarationReferencer,
                        errorResolver: this.errorResolver,
                        genericAPIExpressErrorDeclarationReferencer: this.genericApiExpressErrorDeclarationReferencer,
                        genericAPIExpressErrorGenerator: this.genericApiExpressErrorGenerator,
                    });
                    expressServiceContext.expressService
                        .getGeneratedExpressService(packageId)
                        .writeToFile(expressServiceContext);
                },
            });
        });
    }

    private generateExpressRegister() {
        this.withSourceFile({
            filepath: this.expressRegisterDeclarationReferencer.getExportedFilepath(),
            run: ({ sourceFile, importsManager }) => {
                const expressRegisterContext = new ExpressRegisterContextImpl({
                    sourceFile,
                    coreUtilitiesManager: this.coreUtilitiesManager,
                    dependencyManager: this.dependencyManager,
                    fernConstants: this.intermediateRepresentation.constants,
                    importsManager,
                    typeResolver: this.typeResolver,
                    typeDeclarationReferencer: this.typeDeclarationReferencer,
                    typeSchemaDeclarationReferencer: this.typeSchemaDeclarationReferencer,
                    typeReferenceExampleGenerator: this.typeReferenceExampleGenerator,
                    expressEndpointSchemaDeclarationReferencer: this.expressEndpointSchemaDeclarationReferencer,
                    typeGenerator: this.typeGenerator,
                    packageResolver: this.packageResolver,
                    expressEndpointTypeSchemasGenerator: this.expressEndpointTypeSchemasGenerator,
                    typeSchemaGenerator: this.typeSchemaGenerator,
                    expressInlinedRequestBodyDeclarationReferencer: this.expressInlinedRequestBodyDeclarationReferencer,
                    expressInlinedRequestBodyGenerator: this.expressInlinedRequestBodyGenerator,
                    expressInlinedRequestBodySchemaDeclarationReferencer:
                        this.expressInlinedRequestBodySchemaDeclarationReferencer,
                    expressInlinedRequestBodySchemaGenerator: this.expressInlinedRequestBodySchemaGenerator,
                    expressServiceDeclarationReferencer: this.expressServiceDeclarationReferencer,
                    expressServiceGenerator: this.expressServiceGenerator,
                    expressRegisterGenerator: this.expressRegisterGenerator,
                });
                expressRegisterContext.expressRegister
                    .getGeneratedExpressRegister()
                    ?.writeToFile(expressRegisterContext);
            },
        });
    }

    private generateGenericApiExpressGenerator() {
        this.withSourceFile({
            filepath: this.genericApiExpressErrorDeclarationReferencer.getExportedFilepath(),
            run: ({ sourceFile, importsManager }) => {
                const genericAPIExpressErrorContext = new GenericAPIExpressErrorContextImpl({
                    sourceFile,
                    coreUtilitiesManager: this.coreUtilitiesManager,
                    dependencyManager: this.dependencyManager,
                    fernConstants: this.intermediateRepresentation.constants,
                    importsManager,
                    genericAPIExpressErrorDeclarationReferencer: this.genericApiExpressErrorDeclarationReferencer,
                    genericAPIExpressErrorGenerator: this.genericApiExpressErrorGenerator,
                });
                genericAPIExpressErrorContext.genericAPIExpressError
                    .getGeneratedGenericAPIExpressError()
                    .writeToFile(genericAPIExpressErrorContext);
            },
        });
    }

    private withSourceFile({
        run,
        filepath,
    }: {
        run: (args: { sourceFile: SourceFile; importsManager: ImportsManager }) => void;
        filepath: ExportedFilePath;
    }) {
        const filepathStr = convertExportedFilePathToFilePath(filepath);
        this.context.logger.debug(`Generating ${filepathStr}`);

        const sourceFile = this.rootDirectory.createSourceFile(filepathStr);
        const importsManager = new ImportsManager();

        run({ sourceFile, importsManager });

        if (sourceFile.getStatements().length === 0) {
            sourceFile.delete();
            this.context.logger.debug(`Skipping ${filepathStr} (no content)`);
        } else {
            importsManager.writeImportsToSourceFile(sourceFile);
            this.exportsManager.addExportsForFilepath(filepath);

            // this needs to be last.
            // https://github.com/dsherret/ts-morph/issues/189#issuecomment-414174283
            sourceFile.insertText(0, (writer) => {
                writer.writeLine(FILE_HEADER);
            });

            this.context.logger.debug(`Generated ${filepathStr}`);
        }
    }

    private getAllPackageIds(): PackageId[] {
        return [
            { isRoot: true },
            ...Object.keys(this.intermediateRepresentation.subpackages).map(
                (subpackageId): PackageId => ({ isRoot: false, subpackageId })
            ),
        ];
    }

    private forEachService(run: (service: HttpService, packageId: PackageId) => void): void {
        for (const packageId of this.getAllPackageIds()) {
            const service = this.packageResolver.getServiceDeclaration(packageId);
            if (service != null) {
                run(service, packageId);
            }
        }
    }
}
