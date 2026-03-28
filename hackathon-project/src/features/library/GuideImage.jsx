import { useEffect, useRef, useState } from "react";
import { GUIDE_IMAGE_FALLBACK } from "./constants";
import { resolveGuideImageUrl } from "./utils";

export default function GuideImage({ image, alt, className }) {
  const [src, setSrc] = useState(() => resolveGuideImageUrl(image));
  const didError = useRef(false);

  useEffect(() => {
    didError.current = false;
    setSrc(resolveGuideImageUrl(image));
  }, [image]);

  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (didError.current) return;
        didError.current = true;
        setSrc(GUIDE_IMAGE_FALLBACK);
      }}
      className={className}
    />
  );
}
