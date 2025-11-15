import type { HttpHandler } from './index';

interface ListenOptions {
  onUnhandledRequest?: 'bypass' | 'error';
}

export function setupServer(...initialHandlers: HttpHandler[]) {
  let activeHandlers: HttpHandler[] = [...initialHandlers];
  const defaultHandlers: HttpHandler[] = [...initialHandlers];
  let isListening = false;
  let onUnhandled: 'bypass' | 'error' = 'bypass';

  const originalFetch = globalThis.fetch.bind(globalThis);

  const matchHandler = (request: Request): HttpHandler | undefined => {
    return activeHandlers.find(handler => {
      if (handler.method !== request.method.toUpperCase()) {
        return false;
      }

      if (handler.url === request.url) {
        return true;
      }

      return request.url.startsWith(handler.url);
    });
  };

  const createInterceptFetch = () => async (input: RequestInfo | URL, init?: RequestInit) => {
    const request = input instanceof Request ? input : new Request(input, init);
    const handler = matchHandler(request);

    if (!handler) {
      if (onUnhandled === 'error') {
        throw new Error(`Unhandled ${request.method} request to ${request.url}`);
      }
      return originalFetch(request);
    }

    return handler.resolver({ request });
  };

  const interceptFetch = createInterceptFetch();

  return {
    listen(options: ListenOptions = {}) {
      onUnhandled = options.onUnhandledRequest ?? 'bypass';
      if (isListening) {
        return;
      }

      globalThis.fetch = interceptFetch as typeof globalThis.fetch;
      isListening = true;
    },
    close() {
      if (!isListening) {
        return;
      }

      globalThis.fetch = originalFetch;
      isListening = false;
    },
    resetHandlers(...nextHandlers: HttpHandler[]) {
      activeHandlers = nextHandlers.length ? [...nextHandlers] : [...defaultHandlers];
    },
    use(...nextHandlers: HttpHandler[]) {
      activeHandlers.push(...nextHandlers);
    },
  };
}
