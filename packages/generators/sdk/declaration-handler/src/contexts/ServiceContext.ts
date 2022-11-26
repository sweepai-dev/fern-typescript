import { HttpEndpointId } from "@fern-fern/ir-model/services/http";
import { ParsedAuthSchemes } from "../ParsedAuthSchemes";
import { ParsedEnvironments } from "../ParsedEnvironments";
import { ParsedGlobalHeaders } from "../ParsedGlobalHeaders";
import { Reference } from "../Reference";
import { BaseContext } from "./BaseContext";
import { ErrorReferencingContextMixin, ServiceReferencingContextMixin, TypeReferencingContextMixin } from "./mixins";

export interface ServiceContext
    extends BaseContext,
        TypeReferencingContextMixin,
        ErrorReferencingContextMixin,
        ServiceReferencingContextMixin {
    getReferenceToEndpointFileExport: (endpointId: HttpEndpointId, exportedName: string) => Reference;

    // TODO rename "Parsed" to "Generated"
    authSchemes: ParsedAuthSchemes;
    environments: ParsedEnvironments | undefined;
    globalHeaders: ParsedGlobalHeaders;
}
