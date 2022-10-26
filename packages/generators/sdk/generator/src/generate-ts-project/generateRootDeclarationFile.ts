import { join } from "@fern-api/core-utils";
import { Volume } from "memfs/lib/volume";
import { OUTPUT_DIRECTORY } from "./constants";
import { RootService } from "./RootService";
import { getPathToProjectFile } from "./utils";

export async function generateRootDeclarationFile({
    volume,
    rootService,
}: {
    volume: Volume;
    rootService: RootService;
}): Promise<void> {
    const pathToRootService = join(OUTPUT_DIRECTORY, rootService.relativeFilepath);

    await volume.promises.writeFile(
        getPathToProjectFile("index.d.ts"),
        [
            `export * from "./${OUTPUT_DIRECTORY}";`,
            `export { ${rootService.name} as default } from "./${pathToRootService}";`,
        ].join("\n")
    );
}
