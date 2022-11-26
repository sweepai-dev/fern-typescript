import { DeclaredServiceName } from "@fern-fern/ir-model/services/commons";
import { GeneratedServiceSchema } from "../../generated-types/GeneratedServiceSchema";
import { Reference } from "../../Reference";

export interface ServiceReferencingContextMixin {
    getSchemaOfServiceBeingGenerated: () => GeneratedServiceSchema;
    getReferenceToService: (serviceName: DeclaredServiceName, options: { importAlias: string }) => Reference;
}
