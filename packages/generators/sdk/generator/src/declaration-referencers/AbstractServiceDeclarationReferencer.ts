import { DeclaredServiceName } from "@fern-fern/ir-model/services/commons";
import { ExportedDirectory } from "../exports-manager/ExportedFilePath";
import { AbstractDeclarationReferencer } from "./AbstractDeclarationReferencer";

export abstract class AbstractServiceDeclarationReferencer<Name> extends AbstractDeclarationReferencer<Name> {
    protected getExportedDirectory(serviceName: DeclaredServiceName): ExportedDirectory[] {
        return [
            ...this.containingDirectory,
            ...this.getExportedDirectoriesForFernFilepath({
                fernFilepath: serviceName.fernFilepath,
            }),
            {
                nameOnDisk: "client",
                exportDeclaration: { exportAll: true },
            },
        ];
    }
}
