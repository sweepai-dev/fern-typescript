import { AugmentedService } from "@fern-typescript/commons-v2";
import { GeneratedService } from "@fern-typescript/sdk-declaration-handler";
import { GeneratedServiceImpl } from "./GeneratedServiceImpl";

export declare namespace ServiceGenerator {
    export namespace generateService {
        export interface Args {
            serviceName: string;
            serviceDeclaration: AugmentedService;
        }
    }
}

export class ServiceGenerator {
    public generateService({
        serviceName,
        serviceDeclaration,
    }: ServiceGenerator.generateService.Args): GeneratedService {
        return new GeneratedServiceImpl({ serviceName, serviceDeclaration });
    }
}
