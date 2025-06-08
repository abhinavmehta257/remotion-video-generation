declare module '@vercel/node' {
  import { IncomingMessage, ServerResponse } from 'http';

  export interface VercelRequest extends IncomingMessage {
    body: unknown;
    query: Record<string, string | string[]>;
    cookies: Record<string, string>;
  }

  export interface VercelResponse extends ServerResponse {
    status(code: number): this;
    json(data: unknown): this;
    send(data: unknown): this;
    setHeader(name: string, value: string): this;
    end(data?: unknown): this;
  }

  const handler: (req: VercelRequest, res: VercelResponse) => Promise<void> | void;
  export default handler;
}
