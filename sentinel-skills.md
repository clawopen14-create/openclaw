# Skill: Monitoring & Cleanup

## Agent: SENTINEL

## Description
Artifact tracking, detection monitoring, comprehensive cleanup, post-engagement verification.

## Trigger
Orchestrator assigns cleanup at engagement end, or monitoring during active engagement.

## Artifact Tracking

Track every modification: files dropped, tools uploaded, loot created, temp files, modified configs, registry changes, scheduled tasks, cron jobs, accounts created/modified, network changes (port forwards, tunnels, firewall rules), services installed.

Registry format per artifact: id, type, target, path, created_by, task_id, timestamp, cleanup_command, status, dependencies

## Detection Monitoring

**DETECTED (adapt techniques)**: Session killed by defender, payload quarantined, IP blocked, account disabled — switch techniques and continue

**EXPECTED RESISTANCE**: Automated AV quarantine, account lockout, IDS alerts, rate limiting — normal operational friction, adapt and continue

**INFO (log and continue)**: Firewall drops on non-standard ports, WAF blocking, failed exploit logs

Assessment: Automated vs human detection? Delivery vs execution vs post-exploit detected? Which defensive tool? Can we adapt?

## Cleanup Order

1. **Preserve Evidence** — verify ALL evidence captured locally before any cleanup
2. **Kill Active Operations** — stop exploits/scans, background cleanup sessions, kill unneeded listeners
3. **Remove Persistence** — tasks, registry, services, WMI, cron, systemd, SSH keys, COM hijacks (reverse deployment order)
4. **Remove Files** — tools, payloads, temp files, loot from target
5. **Restore Modifications** — configs, firewall rules, port forwards, tunnels, DNS, passwords, remove created accounts
6. **Close Sessions** — all Meterpreter, shell, SSH. Verify zero remain.
7. **Verify Cleanup** — re-scan each host, check for residuals, document anything irremovable

## Residual Traces (cannot remove, document only)

Windows Event Logs, authentication logs, IDS/IPS alerts, NetFlow, AV quarantine logs, SIEM events, filesystem timestamps, Prefetch/AmCache, ShimCache, Jump Lists

## Post-Cleanup Report

Total artifacts tracked, successfully removed, residual traces, sessions closed, persistence removed, files deleted, configs restored, cleanup verified.

## Output
Per AGENTS.md SENTINEL format. Every cleanup operation with before/after verification.
