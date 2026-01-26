# Security Policy

## Reporting a Vulnerability

If you believe you've found a security issue in Voice Prompt, please report it privately.

**Contact**: Open a private security advisory on [GitHub](https://github.com/efeecllk/voice-prompt/security/advisories/new)

When reporting, please include:
- Steps to reproduce the issue
- Impact assessment
- Minimal proof-of-concept (if available)

We take all security reports seriously and will respond promptly.

## Security Considerations


### Data Privacy

- All voice recordings are processed locally before being sent to OpenAI
- No data is stored on external servers
- History and favorites are stored locally on your device

### Network Security

- All API communications use HTTPS/TLS encryption
- The app only connects to `api.openai.com`

## Responsible Disclosure

We kindly ask that you:
- Give us reasonable time to address the issue before public disclosure
- Avoid accessing or modifying other users' data
- Act in good faith to avoid privacy violations

Thank you for helping keep Voice Prompt secure!
