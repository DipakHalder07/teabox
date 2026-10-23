import QRCode from "qrcode";

export interface UpiDeepLinks {
  gpay: string;
  phonepe: string;
  paytm: string;
  cred: string;
  generic: string;
}

/** App-specific intent links built from a standard upi://pay URI. */
export function buildUpiDeepLinks(upiUri: string): UpiDeepLinks {
  const query = upiUri.split("?")[1] || "";
  return {
    generic: upiUri,
    gpay: `gpay://upi/pay?${query}`,
    phonepe: `phonepe://pay?${query}`,
    paytm: `paytmmp://pay?${query}`,
    cred: `cred://pay?${query}`,
  };
}

export function buildUpiQrDataUrl(upiUri: string) {
  return QRCode.toDataURL(upiUri, {
    errorCorrectionLevel: "H",
    margin: 2,
    scale: 8,
    color: {
      dark: "#1f3a2c", // Teabox luxury forest green
      light: "#ffffff",
    },
  });
}
