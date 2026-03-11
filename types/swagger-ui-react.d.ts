declare module "swagger-ui-react" {
  import * as React from "react";

  export interface SwaggerUIProps {
    url?: string;
    spec?: Record<string, unknown>;
    docExpansion?: string;
    defaultModelsExpandDepth?: number;
    [key: string]: unknown;
  }

  const SwaggerUI: React.ComponentType<SwaggerUIProps>;
  export default SwaggerUI;
}
