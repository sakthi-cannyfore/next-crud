export type Role = "admin" | "editor" | "viewer";
export type User = { id: string; name: string; email: string; role: Role };
export type UserInput = Pick<User, "name" | "email" | "role">;
const defaultApiUrl = process.env.NODE_ENV === "production"
  ? "https://next-crud-1-ld5m.onrender.com/api"
  : "http://localhost:4000/api";
const baseUrl = (process.env.NEXT_PUBLIC_API_URL || defaultApiUrl).replace(/\/$/, "");

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers }, signal: AbortSignal.timeout(15000) });
  } catch {
    throw new Error("Cannot reach the API. Check that the backend is running and try again.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || `Request failed (${response.status})`);
  }
  if (response.status === 204) return undefined as T;
  return response.json() as Promise<T>;
}
export const api = {
  list: () => request<User[]>("/users"),
  create: (input: UserInput) => request<User>("/users", { method: "POST", body: JSON.stringify(input) }),
  update: (id: string, input: UserInput) => request<User>(`/users/${id}`, { method: "PUT", body: JSON.stringify(input) }),
  remove: (id: string) => request<void>(`/users/${id}`, { method: "DELETE" })
};
