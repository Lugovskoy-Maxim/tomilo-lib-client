import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Подтверждение email - Tomilo-lib.ru",
  description: "Подтверждение адреса электронной почты для учётной записи Tomilo-lib.ru",
};

export default function VerifyEmailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
