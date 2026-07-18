/// <reference types="vite/client" />

// The design-system ships its compiled stylesheet at this subpath; it's a
// side-effect import with no types (the `?url` theme imports and plain `.css`
// imports are covered by vite/client's ambient declarations).
declare module "@sorbet/design-system/css";
