# ACIS POS v2.5.2

## Barcode label printing
- Added A4 Grid and Single Label print modes.
- Added 38×25 mm, 50×30 mm, and 60×40 mm label sizes.
- Added copy count per selected product.
- Added select-all / clear selection controls.
- Replaced placeholder barcode bars with real Code 128B SVG output.
- Improved print CSS for browser/PDF print previews.

## Cashier payments
- Cash payments now show live change / shortage information.
- Card payments now accept an optional card number/reference.
- For security, only the last four digits are transmitted/stored as the reference.
- Printed receipt now includes payment breakdown and cash change when available.
