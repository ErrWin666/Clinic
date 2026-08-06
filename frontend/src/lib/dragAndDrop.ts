import type { ComponentType } from "react";
import _withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";

// The pre-bundled CJS module exports the CJS namespace object as default.
// We need to unwrap .default to get the actual withDragAndDrop function.
type WithDragAndDropFn = <P>(calendar: ComponentType<P>) => ComponentType<P>;
const raw = _withDragAndDrop as unknown as WithDragAndDropFn | { default: WithDragAndDropFn };
const withDragAndDrop: WithDragAndDropFn = typeof raw === "function" ? raw : raw.default;

export default withDragAndDrop;
