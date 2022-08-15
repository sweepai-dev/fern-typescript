import { itFernETE } from "@fern-typescript/testing-utils";
import path from "path";
import { generateServerProject } from "../generateServerProject";

const FIXTURES_DIR = "fixtures";
const FIXTURES = ["posts"];

describe("generateServerProject", () => {
    for (const fixture of FIXTURES) {
        itFernETE(fixture, {
            testFile: __filename,
            pathToFixture: path.join(FIXTURES_DIR, fixture),
            generateFiles: async ({ volume, intermediateRepresentation }) => {
                await generateServerProject({
                    packageName: fixture,
                    packageVersion: "0.0.0",
                    volume,
                    intermediateRepresentation,
                });
            },
        });
    }
});