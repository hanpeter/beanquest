import type { PastLog, RoastingMethod, BrewingMethod } from './types';

async function request<T>(method: string, path: string, body?: unknown): Promise<T | null> {
  const init: RequestInit = { method, headers: { 'Content-Type': 'application/json' } };
  if (body !== undefined) init.body = JSON.stringify(body);
  const res = await fetch(path, init);
  if (res.status === 204) return null;
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export function getPastLogs(): Promise<PastLog[] | null> {
  return request<PastLog[]>('GET', '/api/v1/past-logs');
}

export function getRoastingMethods(): Promise<RoastingMethod[] | null> {
  return request<RoastingMethod[]>('GET', '/api/v1/roasting-methods');
}

export function getBrewingMethods(): Promise<BrewingMethod[] | null> {
  return request<BrewingMethod[]>('GET', '/api/v1/brewing-methods');
}
