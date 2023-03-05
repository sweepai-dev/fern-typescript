import { itSchema, itSchemaIdentity } from "../../../__test__/utils/itSchema";
import { itValidate } from "../../../__test__/utils/itValidate";
import { object } from "../../object";
import { boolean, number, string } from "../../primitives";
import { discriminant } from "../discriminant";
import { union } from "../union";

describe("union", () => {
    itSchemaIdentity(
        union("type", {
            lion: object({
                meows: boolean(),
            }),
            giraffe: object({
                heightInInches: number(),
            }),
        }),
        { type: "lion", meows: true },
        { title: "doesn't transform discriminant when it's a string" }
    );

    itSchema(
        "transforms discriminant when it's a discriminant()",
        union(discriminant("type", "_type"), {
            lion: object({ meows: boolean() }),
            giraffe: object({ heightInInches: number() }),
        }),
        {
            raw: { _type: "lion", meows: true },
            parsed: { type: "lion", meows: true },
        }
    );

    describe("allowUnrecognizedUnionMembers", () => {
        itSchema(
            "transforms discriminant & passes through values when discriminant value is unrecognized",
            union(discriminant("type", "_type"), {
                lion: object({ meows: boolean() }),
                giraffe: object({ heightInInches: number() }),
            }),
            {
                // @ts-expect-error
                raw: { _type: "moose", isAMoose: true },
                // @ts-expect-error
                parsed: { type: "moose", isAMoose: true },
                opts: {
                    allowUnrecognizedUnionMembers: true,
                },
            }
        );
    });

    describe("withParsedProperties", () => {
        it("Added property is included on parsed object", async () => {
            const schema = union("type", {
                lion: object({}),
                tiger: object({ value: string() }),
            }).withParsedProperties({
                printType: (parsed) => () => parsed.type,
            });

            const parsed = await schema.parse({ type: "lion" });
            if (!parsed.ok) {
                throw new Error("Failed to parse");
            }
            expect(parsed.value.printType()).toBe("lion");
        });
    });

    itValidate(
        "non-object",
        union("type", {
            lion: object({}),
            tiger: object({ value: string() }),
        }),
        [],
        [
            {
                path: [],
                message: "Not an object",
            },
        ]
    );

    itValidate(
        "missing discriminant",
        union("type", {
            lion: object({}),
            tiger: object({ value: string() }),
        }),
        {},
        [
            {
                path: [],
                message: 'Missing discriminant ("type")',
            },
        ]
    );

    itValidate(
        "unrecognized discriminant value",
        union("type", {
            lion: object({}),
            tiger: object({ value: string() }),
        }),
        {
            type: "bear",
        },
        [
            {
                path: ["type"],
                message: "Not one of the allowed values",
            },
        ]
    );
});
