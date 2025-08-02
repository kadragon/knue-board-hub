# Security Guidelines

## Test File Security

### Browser Test Security

The cache browser test (`tests/cache/browser-test.html`) includes security measures:

- **Protocol Detection**: Automatically uses HTTPS when available
- **URL Validation**: Only localhost connections are allowed
- **Iframe Sandboxing**: Restricted iframe permissions with `sandbox` attribute
- **Referrer Policy**: No-referrer policy to prevent information leakage

### Security Validations Applied

1. URL hostname validation (localhost/127.0.0.1 only)
2. Iframe sandbox restrictions
3. Referrer policy protection
4. Protocol-aware connection handling

## Development Guidelines

1. **Always use environment variables for secrets**
2. **Validate external connections in test files**
3. **Apply appropriate security headers and attributes**
4. **Review PR comments for security vulnerabilities**
5. **Test with both HTTP and HTTPS protocols**

## Security Checklist for PR Reviews

- [ ] No hardcoded API keys or secrets
- [ ] Environment variables used for configuration
- [ ] External connections properly validated
- [ ] Security attributes applied to iframes and external content
- [ ] Protocol-aware connection handling
