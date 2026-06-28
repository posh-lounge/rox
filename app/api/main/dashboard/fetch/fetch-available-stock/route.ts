// app/api/main/dashboard/fetch/fetch-available-stock/route.ts
import { phpProxy } from '@/lib/api/v1/phpProxy';
export async function POST(request: Request) {
  return phpProxy('fetch/fetch-available-stock', request);
}