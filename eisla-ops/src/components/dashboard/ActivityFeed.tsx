import Link from "next/link";
import type { ActivityItem } from "@/lib/dashboard-queries";

function timeAgo(date: Date): string {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function ActivityFeed({ items }: { items: ActivityItem[] }) {
  if (items.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-gray-400">
        No recent activity
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {items.map((item) => (
        <li key={item.id} className="flex items-start gap-3 text-sm">
          <div className="mt-1 h-2 w-2 flex-shrink-0 rounded-full bg-copper" />
          <div className="flex-1">
            <p className="text-gray-700">
              <Link
                href={`/ops/orders/${item.orderId}`}
                className="font-medium text-copper hover:underline"
              >
                {item.orderNumber}
              </Link>{" "}
              {item.event}
            </p>
            <p className="text-xs text-gray-400">
              {item.actor && `${item.actor} · `}
              {timeAgo(item.createdAt)}
            </p>
          </div>
        </li>
      ))}
    </ul>
  );
}
