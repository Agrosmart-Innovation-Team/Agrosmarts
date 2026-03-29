import { GUIDE_IMAGE_FALLBACK } from "./constants";
import { resolveGuideImageUrl } from "./utils";

export default function GuideImage({ image, alt, className }) {
  const src = resolveGuideImageUrl(image);

  return (
    <img
      key={src}
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={(event) => {
        const target = event.currentTarget;
        if (target.dataset.fallbackApplied === "1") return;
        target.dataset.fallbackApplied = "1";
        target.src = GUIDE_IMAGE_FALLBACK;
      }}
      className={className}
    />
  );
}
