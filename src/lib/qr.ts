import QRCode from "qrcode"

/**
 * Generates a QR Code SVG string for the given token.
 * This runs entirely on the server and generates a styled SVG.
 */
export async function renderQrSvg(token: string): Promise<string> {
  try {
    const svgString = await QRCode.toString(token, {
      type: "svg",
      margin: 1,
      color: {
        dark: "#D13F7A",  // Theme primary color (hot-pink)
        light: "#FFFFFF", // Background color
      },
      width: 256,
    })
    return svgString
  } catch (error) {
    console.error("Failed to generate QR SVG:", error)
    throw new Error("فشل توليد رمز الاستجابة السريعة QR")
  }
}

/**
 * Generates a QR Code Data URL string (Base64 PNG) for the given token.
 */
export async function renderQrDataUrl(token: string): Promise<string> {
  try {
    const dataUrl = await QRCode.toDataURL(token, {
      margin: 1,
      color: {
        dark: "#D13F7A",
        light: "#FFFFFF",
      },
      width: 256,
    })
    return dataUrl
  } catch (error) {
    console.error("Failed to generate QR Data URL:", error)
    throw new Error("فشل توليد رمز الاستجابة السريعة QR")
  }
}
