"use client";

import { Button } from "@/components/ui/button";

export const RetryButton = () => (
  <Button type="button" variant="outline" onClick={() => window.location.reload()}>
    Try again
  </Button>
);
