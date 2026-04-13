# Security Policy

## Supported Versions

Security fixes are applied to the latest released version. If you are running an older deployment, update to the latest version before reporting an issue.

## Reporting a Vulnerability

If you believe you have found a security vulnerability:

1. Do **not** open a public issue with exploit details.
2. Send a private report to the maintainers with:
   - a description of the issue
   - steps to reproduce
   - potential impact
   - any suggested fixes

If you do not have a private channel for the maintainers, open a GitHub issue with **no sensitive details** and request a secure contact method.

## Scope

In scope:
- authentication/session handling
- data access controls
- injection issues (SQL, prompt injection impacting data)
- secret leakage in builds/logs

Out of scope:
- social engineering
- physical attacks

