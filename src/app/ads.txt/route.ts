import { NextResponse } from "next/server";

const ADS_TXT = `google.com, pub-5533854580432370, RESELLER, f08c47fec0942fa0
improvedigital.com, 2031, RESELLER
uis.mobfox.com, 165, RESELLER
yandex.com, 95648425, DIRECT
hyperad.tech, 215, RESELLER
betweendigital.com, 43554, RESELLER
Contextweb.com, 562899, RESELLER, 89ff185a4c4e857c
hyperad.tech, 150, RESELLER
`;

export function GET() {
  return new NextResponse(ADS_TXT, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
}
