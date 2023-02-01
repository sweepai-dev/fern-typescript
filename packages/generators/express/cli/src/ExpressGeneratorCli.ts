import { GeneratorConfig } from "@fern-fern/generator-exec-sdk/resources";
import { IntermediateRepresentation } from "@fern-fern/ir-model/ir";
import { AbstractGeneratorCli } from "@fern-typescript/abstract-generator-cli";
import { NpmPackage, PersistedTypescriptProject } from "@fern-typescript/commons";
import { GeneratorContext } from "@fern-typescript/contexts";
import { ExpressGenerator } from "@fern-typescript/express-generator";
import { camelCase, upperFirst } from "lodash-es";
import { ExpressCustomConfig } from "./custom-config/ExpressCustomConfig";
import { ExpressCustomConfigSchema } from "./custom-config/schema/ExpressCustomConfigSchema";

export class ExpressGeneratorCli extends AbstractGeneratorCli<ExpressCustomConfig> {
    protected parseCustomConfig(customConfig: unknown): ExpressCustomConfig {
        const parsed = customConfig != null ? ExpressCustomConfigSchema.parse(customConfig) : undefined;
        return {
            useBrandedStringAliases: parsed?.useBrandedStringAliases ?? false,
        };
    }

    protected async generateTypescriptProject({
        config,
        customConfig,
        npmPackage,
        generatorContext,
        intermediateRepresentation,
    }: {
        config: GeneratorConfig;
        customConfig: ExpressCustomConfig;
        npmPackage: NpmPackage;
        generatorContext: GeneratorContext;
        intermediateRepresentation: IntermediateRepresentation;
    }): Promise<PersistedTypescriptProject> {
        const expressGenerator = new ExpressGenerator({
            namespaceExport: `${upperFirst(camelCase(config.organization))}${upperFirst(
                camelCase(config.workspaceName)
            )}`,
            intermediateRepresentation,
            context: generatorContext,
            npmPackage,
            config: {
                shouldUseBrandedStringAliases: customConfig.useBrandedStringAliases,
            },
        });

        const typescriptProject = await expressGenerator.generate();
        const persistedTypescriptProject = await typescriptProject.persist();
        await expressGenerator.copyCoreUtilities({
            pathToSrc: persistedTypescriptProject.getSrcDirectory(),
        });

        return persistedTypescriptProject;
    }

    protected isPackagePrivate(): boolean {
        return true;
    }
}