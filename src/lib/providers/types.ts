export type ModelProvider = "fal" | "kie";

export type ProviderCallResult = {
  url?: string;
  blob?: Blob;
};

export type TaskPollingConfig = {
  /**
   * Relative or absolute endpoint for checking task status.
   */
  statusEndpoint: string;
  /**
   * HTTP method for the polling request (default: GET).
   */
  method?: "GET" | "POST";
  /**
   * Where the task id should be injected (default: query for GET, body for POST).
   */
  taskIdLocation?: "query" | "body";
  /**
   * Query/body key for the task id (default: taskId).
   */
  taskIdParam?: string;
  /**
   * Additional query params appended to the status request.
   */
  query?: Record<string, string | number | boolean | undefined>;
  /**
   * Additional body payload merged with the task id when sending POST requests.
   */
  body?: Record<string, unknown>;
  /**
   * Dot-notation path to the object containing asset info (default: data).
   */
  responseDataPath?: string;
  /**
   * Dot-notation path to the status flag (default: data.state).
   */
  statePath?: string;
  /**
   * Set of states that represent a finished + successful task (default: ["success"]).
   */
  successStates?: string[];
  /**
   * States that immediately fail the task (default: ["fail"]).
   */
  failureStates?: string[];
  /**
   * Delay between polling attempts (default: 5000 ms).
   */
  pollIntervalMs?: number;
  /**
   * Maximum polling attempts before timing out (default: 60).
   */
  maxAttempts?: number;
};

export type ProviderCallOptions = {
  taskConfig?: TaskPollingConfig;
  log?: (message: string) => void;
};
