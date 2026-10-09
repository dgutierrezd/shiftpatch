/** Builds requests the way an external API client (the graders' scripts) would. */
export function apiRequest(
  path: string,
  init: {
    method?: string;
    token?: string;
    body?: unknown;
    rawBody?: string;
    headers?: Record<string, string>;
  } = {},
): Request {
  const headers: Record<string, string> = { ...init.headers };
  if (init.token) headers.authorization = `Bearer ${init.token}`;
  let body: string | undefined = init.rawBody;
  if (init.body !== undefined) {
    headers["content-type"] = "application/json";
    body = JSON.stringify(init.body);
  }
  return new Request(`http://localhost:3000${path}`, {
    method: init.method ?? "GET",
    headers,
    body,
  });
}

export function params<T extends Record<string, string>>(value: T): { params: Promise<T> } {
  return { params: Promise.resolve(value) };
}
