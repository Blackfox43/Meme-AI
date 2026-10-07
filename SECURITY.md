# Security Policy

## Reporting a Vulnerability

Please open a private security advisory on GitHub or contact the maintainers directly.
Do not open public issues for sensitive findings.

## Known considerations

- Gemini, Paddle, and PayPal secrets must live only in environment variables / CI secrets.
- Firestore rules shipped with this repo are intentionally permissive for demos; lock them down before production traffic.
- AI generation endpoints should be rate-limited and preferably authenticated in production.
