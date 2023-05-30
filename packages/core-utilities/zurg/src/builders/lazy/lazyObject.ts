import { getObjectUtils } from "../object";
import { getObjectLikeUtils } from "../object-like";
import {
    BaseObjectSchema,
    inferObjectSchemaFromPropertySchemas,
    inferParsedObjectFromPropertySchemas,
    inferRawObjectFromPropertySchemas,
    ObjectSchema,
    PropertySchemas,
} from "../object/types";
import { getSchemaUtils } from "../schema-utils";
import { constructLazyBaseSchema, getMemoizedSchema, SchemaGetter } from "./lazy";

export function lazyObject<ParsedKeys extends string, T extends PropertySchemas<ParsedKeys>>(
    getter: SchemaGetter<ObjectSchema<inferRawObjectFromPropertySchemas<T>, inferParsedObjectFromPropertySchemas<T>>>
): inferObjectSchemaFromPropertySchemas<T> {
    const baseSchema: BaseObjectSchema<ParsedKeys, T> = {
        ...constructLazyBaseSchema<inferRawObjectFromPropertySchemas<T>, inferParsedObjectFromPropertySchemas<T>>(
            getter
        ),
        _getRawProperties: async () => (await getMemoizedSchema(getter))._getRawProperties(),
        _getParsedProperties: async () => (await getMemoizedSchema(getter))._getParsedProperties(),
        _getPropertySchemas: async () => (await getMemoizedSchema(getter))._getPropertySchemas(),
    };

    return {
        ...baseSchema,
        ...getSchemaUtils(baseSchema),
        ...getObjectLikeUtils(baseSchema),
        ...getObjectUtils(baseSchema),
    };
}
