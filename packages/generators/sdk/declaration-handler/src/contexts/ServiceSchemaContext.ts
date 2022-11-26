import { GeneratedType } from "../generated-types";
import { BaseContext } from "./BaseContext";
import { ServiceReferencingContextMixin } from "./mixins";
import { TypeReferencingContextMixin } from "./mixins/TypeReferencingContextMixin";
import { TypeSchemaReferencingContextMixin } from "./mixins/TypeSchemaReferencingContextMixin";

export interface ServiceSchemaContext
    extends BaseContext,
        TypeReferencingContextMixin,
        TypeSchemaReferencingContextMixin,
        ServiceReferencingContextMixin {
    getTypeBeingGenerated: () => GeneratedType;
}
