"use client";

import NextLink from "next/dist/client/link";
import type { ComponentProps } from "react";

/**
 * Обёртка над next/link: по умолчанию без предзагрузки маршрута (viewport/hover),
 * чтобы не тратить сеть и CPU на фоновые prefetch страниц.
 * Явно передайте prefetch={true} или "auto", где нужно ускорить переход.
 */
export default function Link({
  prefetch = false,
  ...rest
}: ComponentProps<typeof NextLink>) {
  return <NextLink prefetch={prefetch} {...rest} />;
}
