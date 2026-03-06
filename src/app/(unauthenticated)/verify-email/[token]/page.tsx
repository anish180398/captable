import VerifyEmail from "@/components/onboarding/verify-email";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Verify Email",
};

export type PageProps = {
  params: {
    token: string;
  };
};

export default function VerifyEmailPage({ params: { token } }: PageProps) {
  return <VerifyEmail token={token} />;
}
