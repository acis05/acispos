# ACIS POS v2.5.3

## QR Code product labels
- Added label type selector: Barcode Code 128 or QR Code.
- QR Code encodes the product barcode, falling back to SKU.
- QR printing works with A4 Grid and Single Label modes.
- QR labels support 38×25 mm, 50×30 mm, and 60×40 mm sizes.
- Existing copy-per-product and product selection controls remain available.
- QR SVG is generated server-side using the `qrcode` package and returned only to authenticated users.

## Existing v2.5.2 payment improvements retained
- Cash payments show change/shortage in real time.
- Card payments allow an optional card/reference number while only the last four digits are retained.
