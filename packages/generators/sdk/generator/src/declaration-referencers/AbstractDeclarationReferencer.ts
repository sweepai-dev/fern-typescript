import { assertNever } from "@fern-api/core-utils";
import { FernFilepath, StringWithAllCasings } from "@fern-fern/ir-model/commons";
import { Reference } from "@fern-typescript/sdk-declaration-handler";
import { ExportedDirectory, ExportedFilePath } from "../exports-manager/ExportedFilePath";
import { ExportDeclaration } from "../exports-manager/ExportsManager";
import { DeclarationReferencer } from "./DeclarationReferencer";
import { getDirectReferenceToExport } from "./utils/getDirectReferenceToExport";
import { getReferenceToExportFromRoot } from "./utils/getReferenceToExportFromRoot";

export declare namespace AbstractDeclarationReferencer {
    export interface Init {
        containingDirectory: ExportedDirectory[];
    }
}

export abstract class AbstractDeclarationReferencer<Name> implements DeclarationReferencer<Name> {
    protected containingDirectory: ExportedDirectory[];

    constructor({ containingDirectory }: AbstractDeclarationReferencer.Init) {
        this.containingDirectory = containingDirectory;
    }

    public abstract getExportedFilepath(name: Name): ExportedFilePath;
    public abstract getFilename(name: Name): string;

    protected getExportedFilepathForReferences(name: Name): ExportedFilePath {
        return this.getExportedFilepath(name);
    }

    protected getReferenceTo(
        exportedName: string,
        { name, addImport, referencedIn, subImport, importStrategy }: DeclarationReferencer.getReferenceTo.Options<Name>
    ): Reference {
        switch (importStrategy.type) {
            case "direct":
                return getDirectReferenceToExport({
                    exportedName,
                    exportedFromPath: this.getExportedFilepathForReferences(name),
                    importAlias: importStrategy.alias,
                    addImport,
                    referencedIn,
                    subImport,
                });
            case "fromRoot":
                return getReferenceToExportFromRoot({
                    exportedName,
                    exportedFromPath: this.getExportedFilepathForReferences(name),
                    referencedIn,
                    addImport,
                    namespaceImport: importStrategy.namespaceImport,
                    subImport,
                });
            default:
                assertNever(importStrategy);
        }
    }

    protected getExportedDirectoriesForFernFilepath({
        fernFilepath,
        subExports,
    }: {
        fernFilepath: FernFilepath;
        subExports?: Record<string, ExportDeclaration>;
    }): ExportedDirectory[] {
        return fernFilepath.map((fernFilepathPart, index) =>
            index === fernFilepath.length - 1
                ? this.createExportForFernFilepathFile(fernFilepathPart, subExports)
                : this.createExportForFernFilepathDirectory(fernFilepathPart)
        );
    }

    protected createExportForFernFilepathDirectory(fernFilepathPart: StringWithAllCasings): ExportedDirectory {
        return {
            nameOnDisk: fernFilepathPart.originalValue,
            exportDeclaration: { namespaceExport: fernFilepathPart.camelCase },
        };
    }

    private createExportForFernFilepathFile(
        fernFilepathPart: StringWithAllCasings,
        subExports?: Record<string, ExportDeclaration>
    ): ExportedDirectory {
        return {
            nameOnDisk: fernFilepathPart.originalValue,
            exportDeclaration: {
                namespaceExport: fernFilepathPart.camelCase,
            },
            subExports,
        };
    }
}
