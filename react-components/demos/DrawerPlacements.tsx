import { Drawer, type DrawerAction, type DrawerPlacement } from "../ui";
import "./DrawerPlacements.css";

const placementLabels: Record<DrawerPlacement, string> = {
  bottom: "پایین",
  top: "بالا",
  left: "چپ",
  right: "راست",
};

export type DrawerPlacementsProps = {
  placements?: DrawerPlacement[];
  onOpenChange?: (placement: DrawerPlacement, open: boolean) => void;
  onAction?: (placement: DrawerPlacement, action: DrawerAction) => void;
};

export function DrawerPlacements({
  placements = ["bottom", "top", "left", "right"],
  onOpenChange,
  onAction,
}: DrawerPlacementsProps) {
  return (
    <div className="ca-drawer-placements">
      {placements.map((placement) => (
        <Drawer
          key={placement}
          placement={placement}
          triggerLabel={placementLabels[placement]}
          title={`کشوی ${placementLabels[placement]}`}
          onOpenChange={(open) => onOpenChange?.(placement, open)}
          onAction={(action) => onAction?.(placement, action)}
        >
          <p>
            این کشو از لبهٔ <strong>{placementLabels[placement]}</strong>{" "}
            صفحه وارد می‌شود.
          </p>
        </Drawer>
      ))}
    </div>
  );
}
