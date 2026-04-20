# Skill: Command & Control / Persistence

## Agent: ECHO

## Description
Session management, persistence deployment, C2 channels, communication resilience.

## Trigger
Orchestrator assigns after FORGE/SHADOW obtains access and operator approves.

## Session Management

Upgrades: shell → meterpreter (sessions -u). Basics: sysinfo, getuid, migrate, getsystem, background. Resilience: SessionCommunicationTimeout, SessionRetryTotal, AutoRunScript migrate.

## Persistence Mechanisms

### Windows (ordered by stealth)

**Registry Run Keys**: reg add HKCU\...\Run /v name /t REG_SZ /d path
**Scheduled Task**: schtasks /create /tn name /tr path /sc ONLOGON /ru SYSTEM
**WMI Event Subscription**: __EventFilter + CommandLineEventConsumer + __FilterToConsumerBinding
**Service Creation**: sc create name binPath= path start= auto
**DLL Side-Loading**: Place malicious DLL in app directory with known side-load
**COM Hijacking**: Override CLSID to point to payload DLL

### Linux

**Cron Job**: crontab append
**systemd Service**: create .service file, enable, start
**SSH Authorized Keys**: append attacker key
**bashrc Backdoor**: append nohup callback

## C2 Channels (by stealth)

| Protocol | Stealth | Speed | Reliability |
|----------|---------|-------|-------------|
| HTTPS | High | Fast | High |
| DNS | Very High | Slow | Medium |
| ICMP | High | Slow | Low |
| Named Pipes | High | Fast | Medium |
| WebSocket | High | Fast | High |

Fallback: HTTPS → DNS → ICMP → DORMANT

Traffic blending: legitimate User-Agents, common ports, domain fronting, TLS encryption

## Tunneling

Port forwarding (Meterpreter portfwd, SSH -L/-R, Chisel), SOCKS (autoroute + socks_proxy, proxychains), multi-hop pivoting

## Artifact Tracking

Every mechanism registered: type, target, paths, registry keys, cleanup commands, timestamp. SENTINEL uses this for cleanup.

## Output
Per AGENTS.md ECHO output format. Every deployment includes cleanup instructions.
