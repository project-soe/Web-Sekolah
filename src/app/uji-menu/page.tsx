import { MobileMenu } from "@/components/layout/mobile-menu";
import { NavDropdown } from "@/components/layout/nav-dropdown";
import { publicNav } from "@/config/navigation";

export const metadata = { robots: { index: false } };

export default function Page() {
  return (
    <main className="relative p-6">
      <div className="flex gap-4">
        <MobileMenu items={publicNav} />
        <NavDropdown label="Lainnya" items={publicNav.slice(6)} />
      </div>
    </main>
  );
}
