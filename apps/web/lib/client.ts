let refresh: Promise<Response> | undefined

export async function api<T>(path: string, method = 'GET', body?: unknown): Promise<T> {
  const request = () => fetch('/api' + path, {
    method, cache: 'no-store', headers: body === undefined ? undefined : { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  })
  let response = await request()
  if (response.status === 401 && !['/auth/login', '/auth/complete', '/auth/logout'].includes(path)) {
    refresh ||= fetch('/api/auth/refresh', { method: 'POST' }).finally(() => { refresh = undefined })
    if ((await refresh).ok) response = await request()
  }
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new HttpError(response.status, Array.isArray(result?.message) ? result.message.join('. ') : result?.message || 'The service is temporarily unavailable.')
  return result
}
export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message) }
}
