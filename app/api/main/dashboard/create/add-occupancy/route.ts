 import { phpProxy } from '@/lib/api/v1/phpProxy';
 export async function POST(request: Request) {
   return phpProxy('create/add-occupancy', request);
 }