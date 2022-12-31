/**********
 * SCHEMA *
 **********/

export type Schema<Raw = unknown, Parsed = unknown> = BaseSchema<Raw, Parsed> & SchemaUtils<Raw, Parsed>;

export type inferRaw<S extends Schema> = S extends Schema<infer Raw, any> ? Raw : never;
export type inferParsed<S extends Schema> = S extends Schema<any, infer Parsed> ? Parsed : never;

export interface BaseSchema<Raw, Parsed> {
    parse: (raw: Raw, opts?: SchemaOptions) => Parsed | Promise<Parsed>;
    json: (parsed: Parsed, opts?: SchemaOptions) => Raw | Promise<Raw>;
}

export interface SchemaOptions {
    /**
     * @default false
     */
    skipUnknownKeysOnParse?: boolean;

    /**
     * @default false
     */
    includeUnknownKeysOnJson?: boolean;
}

/****************
 * SCHEMA UTILS *
 ****************/

export interface SchemaUtils<Raw, Parsed> {
    optional: () => OptionalSchema<Raw, Parsed>;
    transform: <PostTransform>(transformer: BaseSchema<Parsed, PostTransform>) => Schema<Raw, PostTransform>;
}

export function getSchemaUtils<Raw, Parsed>(schema: BaseSchema<Raw, Parsed>): SchemaUtils<Raw, Parsed> {
    return {
        optional: () => optional(schema),
        transform: (transformer) => transform(schema, transformer),
    };
}

export function optional<Raw, Parsed>(schema: BaseSchema<Raw, Parsed>): OptionalSchema<Raw, Parsed> {
    const baseSchema: BaseSchema<Raw | null | undefined, Parsed | undefined> = {
        parse: (raw, opts) => (raw != null ? schema.parse(raw, opts) : undefined),
        json: (parsed, opts) => (parsed != null ? schema.json(parsed, opts) : undefined),
    };

    return {
        ...OPTIONAL_BRAND,
        ...baseSchema,
        ...getSchemaUtils(baseSchema),
    };
}

export function transform<PreTransformRaw, PreTransformParsed, PostTransform>(
    schema: BaseSchema<PreTransformRaw, PreTransformParsed>,
    transformer: BaseSchema<PreTransformParsed, PostTransform>
): Schema<PreTransformRaw, PostTransform> {
    const baseSchema: BaseSchema<PreTransformRaw, PostTransform> = {
        parse: async (raw, opts) => {
            const postTransformParsed = await schema.parse(raw, opts);
            return transformer.parse(postTransformParsed, opts);
        },
        json: async (parsed, opts) => {
            const preTransformParsed = await transformer.json(parsed, opts);
            return schema.json(preTransformParsed, opts);
        },
    };

    return {
        ...baseSchema,
        ...getSchemaUtils(baseSchema),
    };
}

export const OPTIONAL_BRAND = undefined as unknown as { _isOptional: void };

export type OptionalSchema<Raw, Parsed> = Schema<Raw | null | undefined, Parsed | undefined> & {
    _isOptional: void;
};

/**********
 * OBJECT *
 **********/

/***************
 * OBJECT-LIKE *
 ***************/

/**********
 * RECORD *
 **********/

/********
 * LIST *
 ********/

/*******
 * SET *
 *******/

/********
 * DATE *
 ********/

/********
 * ENUM *
 ********/

/************
 * IDENTITY *
 ************/

/************
 * LITERALS *
 ************/

/**************
 * PRIMITIVES *
 **************/

/* string */

/* number */

/* boolean */

/* any */

/* unknown */

/********
 * LAZY *
 ********/

/***************
 * LAZY OBJECT *
 ***************/

/*********
 * UTILS *
 *********/

/* addQuestionMarksToNullableProperties */

type addQuestionMarksToNullableProperties<T> = {
    [K in OptionalKeys<T>]?: undefined extends T[K] ? T[K] : never;
} & Pick<T, RequiredKeys<T>>;

type OptionalKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? K : never;
}[keyof T];

type RequiredKeys<T> = {
    [K in keyof T]: undefined extends T[K] ? never : K;
}[keyof T];

/* entries */

function entries<T>(object: T): [keyof T, T[keyof T]][] {
    return Object.entries(object) as [keyof T, T[keyof T]][];
}

/* keys */

function keys<T>(object: T): (keyof T)[] {
    return Object.keys(object) as (keyof T)[];
}

/* filterObject */

function filterObject<T, K extends keyof T>(obj: T, keysToInclude: K[]): Pick<T, K> {
    const keysToIncludeSet = new Set(keysToInclude);
    return Object.entries(obj).reduce((acc, [key, value]) => {
        if (keysToIncludeSet.has(key as K)) {
            acc[key as K] = value;
        }
        return acc;
        // eslint-disable-next-line @typescript-eslint/prefer-reduce-type-parameter
    }, {} as Pick<T, K>);
}

/* partition */

function partition<T>(items: readonly T[], predicate: (item: T) => boolean): [T[], T[]] {
    const trueItems: T[] = [],
        falseItems: T[] = [];
    for (const item of items) {
        if (predicate(item)) {
            trueItems.push(item);
        } else {
            falseItems.push(item);
        }
    }
    return [trueItems, falseItems];
}
