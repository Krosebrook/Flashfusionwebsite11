export type HttpRequestResolver = (context: { request: Request }) => Promise<Response> | Response;

export interface HttpHandler {
  method: string;
  url: string;
  resolver: HttpRequestResolver;
}

const createHttpMethod = (method: string) => (url: string, resolver: HttpRequestResolver): HttpHandler => ({
  method: method.toUpperCase(),
  url,
  resolver,
});

export const http = {
  get: createHttpMethod('GET'),
  post: createHttpMethod('POST'),
  put: createHttpMethod('PUT'),
  delete: createHttpMethod('DELETE'),
};

export class HttpResponse {
  static json<Data>(data: Data, init?: ResponseInit & { headers?: HeadersInit }) {
    const headers = new Headers(init?.headers);
    if (!headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json');
    }

    return new Response(JSON.stringify(data), {
      status: init?.status ?? 200,
      headers,
    });
  }
}
