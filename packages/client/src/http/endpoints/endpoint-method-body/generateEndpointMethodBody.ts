import { HttpEndpoint, HttpService } from "@fern-fern/ir-model/services";
import { DependencyManager, getTextOfTsNode } from "@fern-typescript/commons";
import { GeneratedHttpEndpointTypes, ModelContext } from "@fern-typescript/model-context";
import { SourceFile, StatementStructures, WriterFunction } from "ts-morph";
import { generateConstructQueryParams } from "./generateConstructQueryParams";
import { generateFetcherCall } from "./generateFetcherCall";
import { generateReturnResponse } from "./generateReturnResponse";

export async function generateEndpointMethodBody({
    endpoint,
    endpointTypes,
    serviceFile,
    serviceDefinition,
    modelContext,
    dependencyManager,
}: {
    endpoint: HttpEndpoint;
    endpointTypes: GeneratedHttpEndpointTypes;
    serviceFile: SourceFile;
    serviceDefinition: HttpService;
    modelContext: ModelContext;
    dependencyManager: DependencyManager;
}): Promise<(StatementStructures | WriterFunction | string)[]> {
    const queryParameterStatements = generateConstructQueryParams({ endpoint, modelContext });

    const statements: (StatementStructures | WriterFunction | string)[] = [];

    statements.push(
        (writer) => {
            if (queryParameterStatements.length === 0) {
                return;
            }
            for (const statement of queryParameterStatements) {
                writer.writeLine(getTextOfTsNode(statement));
            }
            writer.newLine();
        },
        await generateFetcherCall({
            endpoint,
            endpointTypes,
            serviceFile,
            serviceDefinition,
            includeQueryParams: queryParameterStatements.length > 0,
            dependencyManager,
            referenceToAuthHeader: undefined,
        }),
        (writer) => {
            writer.newLine();
        },
        getTextOfTsNode(
            await generateReturnResponse({
                endpointTypes,
                serviceFile,
                modelContext,
                dependencyManager,
            })
        )
    );

    return statements;
}