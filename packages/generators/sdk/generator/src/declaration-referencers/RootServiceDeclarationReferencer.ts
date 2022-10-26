import { ExportedFilePath } from "../exports-manager/ExportedFilePath";
import { AbstractDeclarationReferencer } from "./AbstractDeclarationReferencer";
import { ServiceDeclarationReferencer } from "./ServiceDeclarationReferencer";

export declare namespace RootServiceDeclarationReferencer {
    export interface Init extends AbstractDeclarationReferencer.Init {
        apiName: string;
    }
}

export class RootServiceDeclarationReferencer extends ServiceDeclarationReferencer {
    private apiName: string;

    constructor({ apiName, ...superInit }: RootServiceDeclarationReferencer.Init) {
        super(superInit);
        this.apiName = apiName;
    }

    public override getExportedFilepath(): ExportedFilePath {
        return {
            directories: this.containingDirectory,
            file: {
                nameOnDisk: this.getFilename(),
            },
        };
    }

    public override getExportedName(): string {
        return `${this.apiName}Client`;
    }
}
