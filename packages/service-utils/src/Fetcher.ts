export type Fetcher = (args: Fetcher.Args) => Promise<Fetcher.Response>;
export declare namespace Fetcher {
    export interface Args {
        url: string;
        method: string;
        headers: Record<string, string | null | undefined>;
        authHeader?: string | undefined;
        queryParameters?: URLSearchParams;
        body?: unknown;
    }

    export interface Response {
        statusCode: number;
        body: unknown;
    }
}