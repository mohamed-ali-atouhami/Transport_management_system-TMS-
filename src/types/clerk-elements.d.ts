declare module "@clerk/elements/common" {
  import type { ComponentType } from "react";

  export const GlobalError: ComponentType<any>;
  export const Field: ComponentType<any>;
  export const FieldError: ComponentType<any>;
  export const Label: ComponentType<any>;
  export const Input: ComponentType<any>;
}

declare module "@clerk/elements/sign-in" {
  import type { ComponentType } from "react";

  export const Root: ComponentType<any>;
  export const Step: ComponentType<any>;
  export const Action: ComponentType<any>;
}

