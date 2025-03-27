import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    try {
      const data = await res.json();
      throw new Error(data.error || `${res.status}: ${res.statusText}`);
    } catch (e) {
      // If the response isn't JSON
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
  }
}

// Helper to get the auth token
function getAuthHeaders(): HeadersInit {
  const token = localStorage.getItem('auth_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

// Convert snake_case keys to camelCase
export function toCamelCase(obj: any): any {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map(v => toCamelCase(v));
  }

  return Object.keys(obj).reduce((result, key) => {
    // Convert the key from snake_case to camelCase
    const camelKey = key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
    
    // Convert the value recursively
    result[camelKey] = toCamelCase(obj[key]);
    return result;
  }, {} as Record<string, any>);
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Combine auth headers with content-type headers
  const headers: HeadersInit = { 
    ...getAuthHeaders(),
    ...(data ? { "Content-Type": "application/json" } : {})
  };

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  
  // Create a proxy to modify the json method to convert snake_case to camelCase
  const responseProxy = new Proxy(res, {
    get(target, prop) {
      // When accessing the json method, wrap it to convert the data
      if (prop === 'json') {
        return async () => {
          const data = await target.json();
          return toCamelCase(data);
        };
      }
      return Reflect.get(target, prop);
    }
  });
  
  return responseProxy;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Include auth token in all requests
    const headers = getAuthHeaders();
    
    const res = await fetch(queryKey[0] as string, {
      credentials: "include",
      headers
    });

    if (res.status === 401) {
      // Clear token on unauthorized responses
      if (localStorage.getItem('auth_token')) {
        localStorage.removeItem('auth_token');
      }
      
      if (unauthorizedBehavior === "returnNull") {
        return null;
      } else {
        throw new Error("Unauthorized");
      }
    }

    await throwIfResNotOk(res);
    const data = await res.json();
    // Convert snake_case keys to camelCase before returning
    return toCamelCase(data);
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
