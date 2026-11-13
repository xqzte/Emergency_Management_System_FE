import { logoResponse } from "../logo";

export const dynamic = "force-static";

export function GET() {
  return logoResponse(512, true);
}
