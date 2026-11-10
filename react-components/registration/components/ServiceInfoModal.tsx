import { useEffect, useState } from "react";
import { Button, Modal, useOverlayState } from "@heroui/react";
import { SERVICE_INFO } from "../data/service-info.ts";
import { toPersianDigits } from "../engine/digits.ts";

export type ServiceInfoModalProps = {
  serviceId: string | null;
  selected: boolean;
  canSelect: boolean;
  onClose: () => void;
  onSelect: () => void;
};

export function ServiceInfoModal({ serviceId, selected, canSelect, onClose, onSelect }: ServiceInfoModalProps) {
  const info = serviceId ? SERVICE_INFO[serviceId] : null;
  const state = useOverlayState({
    isOpen: !!info,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
  });
  const [slide, setSlide] = useState(0);

  useEffect(() => {
    setSlide(0);
  }, [serviceId]);

  if (!info) return null;

  const photos = info.photos;
  const count = photos.length;
  const current = photos[Math.min(slide, count - 1)];
  const go = (dir: -1 | 1) => setSlide((i) => (i + dir + count) % count);

  return (
    <Modal state={state}>
      <Modal.Backdrop variant="opaque">
        <Modal.Container placement="center" size="md" scroll="outside">
          <Modal.Dialog className="reg-service-sheet" dir="rtl">
            <div
              className="reg-carousel"
              aria-roledescription="کاروسل"
              aria-label={`تصاویر ${info.title}`}
            >
              <img className="reg-carousel__photo" src={current.src} alt={current.alt} />
              {count > 1 ? (
                <>
                  <button type="button" className="reg-carousel__nav reg-carousel__nav--prev" aria-label="تصویر قبلی" onClick={() => go(-1)}>
                    <Chevron dir="prev" />
                  </button>
                  <button type="button" className="reg-carousel__nav reg-carousel__nav--next" aria-label="تصویر بعدی" onClick={() => go(1)}>
                    <Chevron dir="next" />
                  </button>
                  <div className="reg-carousel__meta">
                    <span className="reg-carousel__count">
                      {toPersianDigits(Math.min(slide, count - 1) + 1)} از {toPersianDigits(count)}
                    </span>
                    <div className="reg-carousel__dots">
                      {photos.map((photo, index) => (
                        <button
                          key={photo.src}
                          type="button"
                          className={`reg-carousel__dot${index === slide ? " is-current" : ""}`}
                          aria-label={`تصویر ${toPersianDigits(index + 1)}`}
                          aria-current={index === slide ? "true" : undefined}
                          onClick={() => setSlide(index)}
                        />
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
            <Modal.CloseTrigger aria-label="بستن" />
            <Modal.Header>
              <Modal.Heading>{info.title}</Modal.Heading>
            </Modal.Header>
            <Modal.Body>
              <p className="reg-service-sheet__lead">{info.lead}</p>
              <ul className="reg-service-sheet__points">
                {info.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            </Modal.Body>
            <Modal.Footer>
              {canSelect && !selected ? (
                <Button
                  variant="primary"
                  className="reg-service-sheet__primary"
                  onPress={() => {
                    onSelect();
                    onClose();
                  }}
                >
                  انتخاب این خدمت
                </Button>
              ) : null}
              <Button variant={selected || !canSelect ? "primary" : "ghost"} className="reg-service-sheet__primary" onPress={state.close}>
                بستن
              </Button>
            </Modal.Footer>
          </Modal.Dialog>
        </Modal.Container>
      </Modal.Backdrop>
    </Modal>
  );
}

function Chevron({ dir }: { dir: "prev" | "next" }) {
  const flip = dir === "prev";
  return (
    <svg viewBox="0 0 20 20" width="18" height="18" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : undefined}>
      <path d="M11.5 4.5 6.5 10l5 5.5" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
