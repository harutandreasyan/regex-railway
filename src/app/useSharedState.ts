import { useEffect } from "react";
import { decodeShare } from "../engine/share";
import { useRailway } from "./store";

export function useSharedState() {
  useEffect(() => {
    const shared = decodeShare(window.location.hash);
    if (shared) useRailway.getState().loadShared(shared);
  }, []);
}
