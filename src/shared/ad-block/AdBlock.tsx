"use client";

import Script from "next/script";
import { useRef, useState, useEffect } from "react";

declare global {
  interface Window {
    MRGtag: unknown[];
  }
}

const AD_LOAD_CHECK_DELAY_MS = 3500;

interface AdBlockProps {
  adClient?: string;
  adSlot?: string;
  scriptId?: string;
}

const AdBlock = ({
  adClient = "ad-1977376",
  adSlot = "1977376",
  scriptId = "mrg-tag-init",
}: AdBlockProps) => {
  const insRef = useRef<HTMLModElement>(null);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      const ins = insRef.current;
      if (!ins) return;
      // Реклама загружена только если внутри есть iframe (не полагаемся на offsetHeight — у ins фиксированная высота в стиле)
      const hasContent = !!ins.querySelector("iframe");
      if (!hasContent) {
        setVisible(false);
      }
    }, AD_LOAD_CHECK_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div className="w-full max-w-7xl mx-auto px-4">
      <Script src="https://ad.mail.ru/static/ads-async.js" strategy="lazyOnload" async />
      <div className="w-full max-w-[950px] overflow-hidden">
        <ins
          ref={insRef}
          className="mrg-tag block w-full max-w-full"
          style={{
            display: "inline-block",
            width: "950px",
            maxWidth: "100%",
            height: "300px",
          }}
          data-ad-client={adClient}
          data-ad-slot={adSlot}
        />
      </div>
      <Script id={scriptId} strategy="lazyOnload">
        {`(MRGtag = window.MRGtag || []).push({});`}
      </Script>
    </div>
  );
};

export default AdBlock;
