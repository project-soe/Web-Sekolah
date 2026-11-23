import { describe, expect, it } from "vitest";
import { cn } from "@/utils/cn";

describe("cn", () => {
  it("menggabungkan class dan menyelesaikan konflik Tailwind", () => {
    expect(cn("p-2", "p-4", false && "hidden")).toBe("p-4");
  });
});
