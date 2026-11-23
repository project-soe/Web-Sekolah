import { AlertTriangle, Inbox } from "lucide-react";

type StateProps = {
  title: string;
  description?: string;
  action?: React.ReactNode;
};

function State({ icon, title, description, action }: StateProps & { icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed border-border px-6 py-12 text-center">
      <div className="text-muted-foreground">{icon}</div>
      <h3 className="text-base font-semibold">{title}</h3>
      {description && <p className="max-w-md text-sm text-muted-foreground">{description}</p>}
      {action}
    </div>
  );
}

export function EmptyState(props: StateProps) {
  return <State icon={<Inbox className="size-8" aria-hidden />} {...props} />;
}

export function ErrorState(props: StateProps) {
  return (
    <div role="alert">
      <State icon={<AlertTriangle className="size-8 text-danger" aria-hidden />} {...props} />
    </div>
  );
}
