import { QRCodeSVG } from 'qrcode.react';

export default function QRCode({ url, size = 200 }) {
  return (
    <div className="p-3 rounded-2xl inline-block">
      <QRCodeSVG value={url} size={size} />
    </div>
  );
}
