import { QRCodeSVG } from 'qrcode.react';

export default function QRCode({ url, size = 200 }) {
  return (
    <div className="p-3 rounded-xl inline-block bg-white shadow-sm">
      <QRCodeSVG value={url} size={size} />
    </div>
  );
}
