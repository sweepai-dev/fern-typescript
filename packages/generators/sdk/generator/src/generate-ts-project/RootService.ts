import { RelativeFilePath } from "@fern-api/core-utils";

export interface RootService {
    name: string;
    relativeFilepath: RelativeFilePath;
}
