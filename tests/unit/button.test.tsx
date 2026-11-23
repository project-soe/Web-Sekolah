import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("menonaktifkan tombol dan menandai busy saat loading", () => {
    render(<Button loading>Simpan</Button>);
    const btn = screen.getByRole("button", { name: "Simpan" });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute("aria-busy", "true");
  });

  it("memakai type=button secara default", () => {
    render(<Button>Klik</Button>);
    expect(screen.getByRole("button")).toHaveAttribute("type", "button");
  });
});
