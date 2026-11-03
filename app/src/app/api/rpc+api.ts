import { handleRpc } from '@/server/rpc';

// The app's only endpoint for data. Runs inside `npx expo start` (web.output: "server").
export function POST(request: Request) {
  return handleRpc(request);
}
