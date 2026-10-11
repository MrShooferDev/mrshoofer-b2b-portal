import type { MouseEvent, ReactNode } from "react";
import { CtaPlanet } from "./CtaPlanet";
import "./CtaBanner.css";

export type CtaAction = {
  label: ReactNode;
  href?: string;
};

export type CtaBannerProps = {
  titleStart?: ReactNode;
  titleHighlight?: ReactNode;
  titleEnd?: ReactNode;
  description?: ReactNode;
  primaryAction?: CtaAction;
  secondaryAction?: CtaAction;
  proofItems?: ReactNode[];
  imageSrc?: string;
  onAction?: (action: "primary" | "secondary") => void;
  className?: string;
};

const DEFAULT_IMAGE_SRC =
  "https://images.unsplash.com/photo-1770723963970-ace02c7db50e?w=2000&q=80&auto=format&fit=crop";

function resolveImageSrc(imageSrc: string | undefined) {
  if (imageSrc === undefined) return DEFAULT_IMAGE_SRC;
  if (imageSrc.trim() === "") return null;
  return imageSrc;
}

function ProofCheckIcon() {
  return (
    <svg
      className="ca-cta__proof-svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M3 12a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" />
      <path d="M9 12l2 2l4 -4" />
    </svg>
  );
}

type ActionControlProps = {
  action: CtaAction;
  variant: "primary" | "secondary";
  onActivate: () => void;
};

function ActionControl({ action, variant, onActivate }: ActionControlProps) {
  const className =
    variant === "primary" ? "ca-cta__btn ca-cta__btn--primary" : "ca-cta__btn ca-cta__btn--secondary";

  const handleClick = (_event: MouseEvent<HTMLAnchorElement | HTMLButtonElement>) => {
    onActivate();
  };

  if (action.href) {
    return (
      <a href={action.href} className={className} onClick={handleClick}>
        {action.label}
      </a>
    );
  }

  return (
    <button type="button" className={className} onClick={handleClick}>
      {action.label}
    </button>
  );
}

export function CtaBanner({
  titleStart,
  titleHighlight,
  titleEnd,
  description,
  primaryAction,
  secondaryAction,
  proofItems,
  imageSrc,
  onAction,
  className,
}: CtaBannerProps) {
  const orbSrc = resolveImageSrc(imageSrc);
  const hasTitle = titleStart != null || titleHighlight != null || titleEnd != null;
  const hasActions = primaryAction != null || secondaryAction != null;
  const proof = proofItems ?? [];
  const hasProof = proof.length > 0;

  return (
    <div className={className ? `ca-cta ${className}` : "ca-cta"}>
      <div className="ca-cta__grid" aria-hidden="true" />
      <div className="ca-cta__glow" aria-hidden="true" />
      {orbSrc && (
        <div className="ca-cta__orb" aria-hidden="true">
          <CtaPlanet src={orbSrc} />
        </div>
      )}

      <div className="ca-cta__content">
        {(hasTitle || description != null) && (
          <div className="ca-cta__heading">
            {hasTitle && (
              <h2 className="ca-cta__title">
                {titleStart != null && <span>{titleStart}</span>}
                {titleStart != null && titleHighlight != null && " "}
                {titleHighlight != null && (
                  <strong className="ca-cta__title-highlight">{titleHighlight}</strong>
                )}
                {(titleStart != null || titleHighlight != null) && titleEnd != null && " "}
                {titleEnd != null && <span>{titleEnd}</span>}
              </h2>
            )}

            {description != null && <p className="ca-cta__description">{description}</p>}
          </div>
        )}

        {hasActions && (
          <div className="ca-cta__actions">
            {primaryAction && (
              <ActionControl
                action={primaryAction}
                variant="primary"
                onActivate={() => onAction?.("primary")}
              />
            )}
            {secondaryAction && (
              <ActionControl
                action={secondaryAction}
                variant="secondary"
                onActivate={() => onAction?.("secondary")}
              />
            )}
          </div>
        )}

        {hasProof && (
          <div className="ca-cta__footer">
            <div className="ca-cta__separator" role="separator" aria-orientation="horizontal" />
            <ul className="ca-cta__proof">
              {proof.map((item, index) => (
                <li key={index} className="ca-cta__proof-item">
                  <span className="ca-cta__proof-icon">
                    <span
                      className="ca-cta__proof-ring"
                      style={{ animationDelay: `${index * 1.8}s` }}
                      aria-hidden="true"
                    />
                    <ProofCheckIcon />
                  </span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

export default CtaBanner;
