export namespace YaoApi {
  export interface API {
    id: string;
    name: string;
    source: string;
    type: string;
    http: HTTP;
  }
  export interface HTTP {
    name: string;
    version: string;
    description?: string;
    group?: string;
    guard?: string;
    paths?: Path[];
  }

  export interface Path {
    label?: string;
    description?: string;
    path: string;
    method: string;
    process: string;
    guard?: string;
    in?: string[];
    out?: Out;
  }

  export interface Out {
    status: number;
    type?: string;
    body?: any;
    headers?: { [key: string]: string };
    redirect?: Redirect;
  }

  export interface Redirect {
    code?: number;
    location?: string;
  }
}
