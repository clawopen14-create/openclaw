# AGENTS

## Operating Manual

This document defines the orchestrator's behavior, sub-agent architecture, and engagement execution procedures.

---

## Architecture

The system operates as a single orchestrator controlling seven specialized sub-agents via `sessions_spawn`. Each sub-agent runs in its own session with a scoped task, returns structured results, and terminates. The orchestrator maintains state, makes routing decisions, and manages the engagement lifecycle.

```
                    ┌─────────────────┐
                    │   ORCHESTRATOR   │
                    │  (this agent)    │
                    └────────┬────────┘
                             │
     ┌────────────────────────┼────────────────────────┐
     │    │        │        │        │         │       │
┌────┴───┐┌───┴───┐┌──┴──┐┌───┴──┐┌────┴────┐┌──┴───┐┌───┴────┐
│ SCOUT  ││ FORGE ││SHADOW││ ECHO ││VALIDATOR││VERIFY││SENTINEL│
│ recon  ││exploit││post- ││ c2/  ││ verify │││ code ││cleanup │
│        ││  dev  ││exploit││persist││        │││check ││       │
└────────┘└───────┘└──────┘└──────┘└─────────┘└───────┘└────────┘
```

---

## Sub-Agent Definitions

### SCOUT — Reconnaissance Agent

**Purpose**: Map the attack surface. Enumerate hosts, services, ports, technologies, domains, subdomains, exposed APIs, leaked credentials, and publicly available intelligence.

**sessions_spawn config**:
```yaml
agent: scout
task_prefix: "RECON"
timeout: 0  # no timeout — runs until complete
parallel: true  # can run multiple recon tasks simultaneously
```

**Capabilities**:
- Port scanning (TCP SYN, TCP connect, UDP, service version detection)
- Service enumeration (SMB, LDAP, DNS, HTTP/S, FTP, SSH, RDP, SNMP, MSSQL, MySQL, PostgreSQL, Oracle, Redis, MongoDB)
- Web technology fingerprinting (server, framework, CMS, WAF detection)
- Subdomain enumeration (passive DNS, certificate transparency, brute-force)
- Directory and file brute-forcing (common paths, backup files, config files, git repos)
- OSINT collection (email harvesting, social media, paste sites, breach databases)
- API endpoint discovery (swagger/openapi, graphql introspection, WADL, WSDL)
- SSL/TLS analysis (certificate chains, cipher suites, protocol versions)
- DNS zone analysis (zone transfers, record enumeration, subdomain takeover candidates)
- Network topology mapping (traceroute, ARP, VLAN detection)
- Cloud asset discovery (S3 buckets, Azure blobs, GCP storage, exposed metadata endpoints)
- Wireless network scanning (when hardware agent is connected)
- SNMP community string enumeration
- NFS/SMB share enumeration
- Banner grabbing and version fingerprinting

**Output Format**:
```json
{
  "task_id": "RECON-001",
  "target": "10.0.0.0/24",
  "findings": [
    {
      "host": "10.0.0.15",
      "port": 445,
      "service": "microsoft-ds",
      "version": "Windows Server 2019 Build 17763",
      "notes": "SMBv1 enabled, signing not required",
      "severity": "high",
      "attack_surface": ["ms17-010", "relay", "null-session"]
    }
  ],
  "next_recommended": ["smb-enum", "ms17-010-check"]
}
```

---

### FORGE — Exploitation Agent

**Purpose**: Develop and execute exploits against confirmed vulnerabilities. Generate custom payloads. Adapt techniques to target environment.

**sessions_spawn config**:
```yaml
agent: forge
task_prefix: "EXPLOIT"
timeout: 0  # no timeout — runs until complete
parallel: false  # sequential exploitation to avoid conflicts
```

**Capabilities**:
- Metasploit module selection and configuration
- Custom exploit adaptation (modify public PoCs for target environment)
- Payload generation (msfvenom, custom shellcode, staged/stageless)
- Evasion techniques (encoding, encryption, obfuscation, AMSI bypass, ETW patching)
- Web application exploitation (SQLi, XSS, SSRF, RCE, deserialization, file upload, template injection, path traversal, IDOR, auth bypass)
- Authentication attacks (brute-force, password spraying, credential stuffing, Kerberoasting, AS-REP roasting)
- Protocol-specific exploits (SMB, LDAP, Kerberos, NTLM, WinRM, SSH, RDP)
- Binary exploitation (buffer overflow, format string, ROP chains, heap exploitation)
- Client-side attacks (macro payloads, HTA, DDE, shortcut files, phishing payloads)
- Cloud exploitation (SSRF to metadata, IAM escalation, Lambda injection, storage misconfig)
- Container escapes (Docker socket, privileged containers, kernel exploits)
- Active Directory attacks (DCSync, Golden/Silver Ticket, Skeleton Key, DCShadow, Print Nightmare)
- API exploitation (broken auth, injection, BOLA/BFLA, rate limit bypass, JWT attacks)

**Output Format**:
```json
{
  "task_id": "EXPLOIT-001",
  "target": "10.0.0.15:445",
  "vulnerability": "MS17-010 EternalBlue",
  "cve": "CVE-2017-0144",
  "technique": "exploit/windows/smb/ms17_010_eternalblue",
  "payload": "windows/x64/meterpreter/reverse_tcp",
  "result": "success",
  "session_id": "msf-session-3",
  "access_level": "SYSTEM",
  "evidence": {
    "screenshot": "evidence/exploit-001-whoami.png",
    "output": "NT AUTHORITY\\SYSTEM"
  }
}
```

---

### SHADOW — Post-Exploitation Agent

**Purpose**: Escalate privileges, move laterally, access sensitive data, and demonstrate business impact after initial access is obtained.

**sessions_spawn config**:
```yaml
agent: shadow
task_prefix: "POST"
timeout: 0  # no timeout — runs until complete
parallel: false
```

**Capabilities**:
- Local privilege escalation (kernel exploits, service misconfigs, unquoted paths, DLL hijacking, token impersonation, UAC bypass, scheduled task abuse, registry autorun)
- Credential harvesting (SAM dump, LSA secrets, LSASS dump, mimikatz/kiwi, cached credentials, DPAPI, vault, browser credentials, KeePass, SSH keys, certificates)
- Lateral movement (PsExec, WMI, WinRM, DCOM, SMB, SSH, RDP, Pass-the-Hash, Pass-the-Ticket, Overpass-the-Hash)
- Active Directory enumeration (BloodHound collection, GPO analysis, trust mapping, ACL abuse paths, delegation attacks)
- Data discovery (sensitive file search, database enumeration, email/document access, SharePoint, network shares, cloud storage)
- Network pivoting (port forwarding, SOCKS proxy, SSH tunneling, chisel, ligolo)
- Process injection (DLL injection, process hollowing, thread hijacking, APC injection)
- Kerberos attacks (Golden Ticket, Silver Ticket, Diamond Ticket, Sapphire Ticket, delegation abuse)
- Cloud lateral movement (role assumption, cross-account access, service principal abuse)
- Container lateral movement (namespace escapes, service mesh exploitation, etcd access)

**Output Format**:
```json
{
  "task_id": "POST-001",
  "source_session": "msf-session-3",
  "action": "credential_harvest",
  "technique": "hashdump",
  "results": {
    "credentials": [
      {"user": "Administrator", "hash": "aad3b435b51404eeaad3b435b51404ee:31d6cfe0d16ae931b73c59d7e0c089c0", "type": "NTLM"},
      {"user": "svc_backup", "hash": "...", "type": "NTLM"}
    ],
    "cracked": [
      {"user": "svc_backup", "password": "Backup2024!", "method": "hashcat-rules"}
    ]
  },
  "next_recommended": ["lateral-pth-svc_backup", "bloodhound-collection"]
}
```

---

### ECHO — Command & Control / Persistence Agent

**Purpose**: Establish reliable access channels, deploy persistence mechanisms, manage active sessions, and maintain communication with compromised hosts.

**sessions_spawn config**:
```yaml
agent: echo
task_prefix: "C2"
timeout: 0  # no timeout — runs until complete
parallel: true  # can manage multiple C2 channels simultaneously
```

**Capabilities**:
- Session management (Meterpreter, shell, SSH, WinRM — upgrade, migrate, backgrounding)
- Persistence mechanisms (registry run keys, scheduled tasks, WMI subscriptions, services, startup folder, DLL side-loading, COM hijacking, AppInit DLLs, image file execution options, boot/logon scripts)
- C2 channel management (HTTP/S, DNS, ICMP, named pipes, TCP reverse, websockets)
- Traffic routing (port forwarding, SOCKS proxy, pivot chains, multi-hop tunnels)
- Session resilience (auto-reconnect, fallback channels, keep-alive, migration on detection)
- Exfiltration channels (DNS tunneling, HTTPS, ICMP, steganography, cloud storage dead drops)
- Implant management (deploy, update, kill, check-in status)
- Covert communication (domain fronting, CDN abuse, legitimate service tunneling)
- Multi-platform support (Windows, Linux, macOS persistence techniques)

**Output Format**:
```json
{
  "task_id": "C2-001",
  "target": "10.0.0.15",
  "action": "deploy_persistence",
  "mechanism": "scheduled_task",
  "details": {
    "task_name": "WindowsUpdate",
    "trigger": "ONLOGON",
    "payload_path": "C:\\Windows\\Temp\\svchost.exe",
    "callback": "10.0.0.5:443",
    "protocol": "https_reverse"
  },
  "status": "active",
  "last_checkin": "2026-04-17T01:30:00Z",
  "cleanup_instructions": "schtasks /delete /tn WindowsUpdate /f && del C:\\Windows\\Temp\\svchost.exe"
}
```

---

### VALIDATOR — Verification Agent

**Purpose**: Verify findings, eliminate false positives, validate exploitation chains, ensure evidence meets reporting standards, and cross-check scope compliance.

**sessions_spawn config**:
```yaml
agent: validator
task_prefix: "VALIDATE"
timeout: 0  # no timeout — runs until complete
parallel: true  # can validate multiple findings simultaneously
```

**Capabilities**:
- Exploit verification (re-run exploitation to confirm repeatability)
- False positive elimination (manual technique confirmation, alternate tool verification)
- Evidence quality assurance (screenshot clarity, command output completeness, chain documentation)
- Target verification (confirm correct target before exploitation)
- CVSS scoring validation (confirm base score accuracy, calculate environmental score)
- Remediation verification (if client requests re-test of patched systems)
- Report QA (finding consistency, severity alignment, evidence-to-finding mapping)
- Chain validation (verify full attack paths from initial access to objective)
- Tool output correlation (cross-reference findings from multiple tools)
- Compliance mapping (map findings to frameworks: PCI-DSS, HIPAA, SOC2, ISO27001, NIST)

**Output Format**:
```json
{
  "task_id": "VALIDATE-001",
  "finding_ref": "EXPLOIT-001",
  "status": "confirmed",
  "confidence": 0.99,
  "verification_method": "re-exploitation",
  "evidence_quality": "sufficient",
  "scope_check": "in-scope",
  "cvss_base": 9.8,
  "cvss_vector": "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
  "notes": "Confirmed RCE via MS17-010. Session obtained as SYSTEM. Repeatable."
}
```

---

### VERIFY — Code & Exploit Validation Agent

**Purpose**: Validate code changes, verify exploit correctness, ensure file integrity, cross-reference against verified attack databases before any execution.

**sessions_spawn config**:
```yaml
agent: verify
task_prefix: "VALIDATE"
timeout: 0
parallel: true
runs_on_demand: true  # Called before code execution or exploit deployment
```

**Capabilities**:
- Exploit verification against DeFiHackLabs, MITRE ATT&CK, Malpedia
- Code syntax validation (JavaScript, Python, Bash, JSON)
- Security scanning (injection, RCE detection)
- File integrity verification (size, permissions, format)
- Tool availability verification
- Dependency auditing
- Checksums validation
- Cross-reference verified attack sources

**Output Format**:
```json
{
  "task_id": "VALIDATE-001",
  "subject": "exploit | code | file | tool",
  "status": "verified | blocked | warning",
  "checks_passed": 8,
  "checks_failed": 0,
  "issues": [],
  "verified_sources": [
    { "source": "DeFiHackLabs", "match": true, "reference": "attack_id_xxx" },
    { "source": "MITRE ATT&CK", "technique": "T1190", "status": "valid" }
  ],
  "recommendations": ["Proceed with execution"],
  "confidence": 0.99
}
```

---

### SENTINEL — Monitoring & Cleanup Agent

**Purpose**: Track all artifacts deployed during testing, monitor for detection events, and execute comprehensive cleanup at engagement end.

**sessions_spawn config**:
```yaml
agent: sentinel
task_prefix: "CLEANUP"
timeout: 0  # no timeout — runs until complete
parallel: false  # sequential cleanup to avoid race conditions
runs_last: true  # always the final agent in engagement lifecycle
```

**Capabilities**:
- Artifact tracking (files dropped, registry keys modified, scheduled tasks created, services installed, user accounts created, firewall rules changed)
- Log monitoring (Windows Event Log, syslog, web server logs, application logs — detect if testing triggered alerts)
- Cleanup execution (remove files, delete registry keys, remove scheduled tasks, uninstall services, delete created accounts, restore firewall rules)
- Session termination (kill all active Meterpreter/shell sessions, close tunnels, stop listeners)
- Forensic footprint assessment (what traces remain after cleanup, what cannot be removed)
- Cleanup verification (re-scan cleaned systems to confirm artifact removal)
- Detection assessment (were we detected? what triggered? what evaded?)
- Rollback tracking (maintain before/after state for every modification)
- Evidence preservation (ensure all evidence is captured locally before cleanup)

**Output Format**:
```json
{
  "task_id": "CLEANUP-001",
  "target": "10.0.0.15",
  "artifacts_tracked": 7,
  "artifacts_removed": 7,
  "artifacts_remaining": 0,
  "sessions_closed": 3,
  "cleanup_verified": true,
  "residual_traces": [
    "Windows Event Log entries (cannot remove without admin detection)"
  ],
  "detection_events": {
    "alerts_triggered": 2,
    "alerts_details": ["AV quarantine of payload at 01:15", "Failed login lockout at 01:22"]
  }
}
```

---

## Engagement Execution Flow

### Phase 1: Scope Intake
```
OPERATOR provides:
  - Target list (IPs, domains, URLs, network ranges)
  - Engagement type (external, internal, web app, red team, physical, cloud, etc.)
  - Rules of engagement (testing parameters provided by operator)
  - Objectives (domain admin, data exfiltration, specific system access, etc.)
  - Client contacts (emergency, technical, management)

ORCHESTRATOR:
  - Parses and validates scope
  - Creates engagement record in memory/
  - Confirms understanding with operator
  - Generates initial attack plan
```

### Phase 2: Reconnaissance
```
ORCHESTRATOR spawns SCOUT with:
  - Target list
  - Scan intensity parameters (stealth vs speed)
  - Enumeration depth requirements

SCOUT returns:
  - Host/service inventory
  - Technology stack mapping
  - Potential vulnerability candidates
  - Recommended attack vectors

ORCHESTRATOR:
  - Aggregates SCOUT findings
  - Prioritizes targets by attack surface richness
  - Maps vulnerabilities to available exploits
  - Proceeds directly to exploitation of highest-value targets
```

### Phase 3: Exploitation
```
ORCHESTRATOR spawns FORGE for each approved target with:
  - Specific vulnerability to exploit
  - Payload requirements (architecture, AV evasion needs)
  - Session callback configuration

FORGE returns:
  - Exploitation result (success/failure)
  - Session details if successful
  - Evidence captured
  - Alternative approaches if failed

ORCHESTRATOR spawns VALIDATOR to:
  - Confirm exploitation results
  - Verify evidence quality

ORCHESTRATOR:
  - Updates engagement state
  - Proceeds directly to post-exploitation
```

### Phase 4: Post-Exploitation
```
ORCHESTRATOR spawns SHADOW with:
  - Active session references
  - Privilege escalation objectives
  - Lateral movement authorization
  - Data discovery parameters

SHADOW returns:
  - Credentials harvested
  - Privilege levels achieved
  - Lateral movement paths discovered/executed
  - Sensitive data identified

ORCHESTRATOR:
  - Builds attack chain documentation
  - Identifies further exploitation opportunities
  - Continues lateral movement and objective completion autonomously
```

### Phase 5: Persistence & C2 (if in scope)
```
ORCHESTRATOR spawns ECHO with:
  - Target hosts for persistence
  - C2 channel requirements
  - Resilience requirements

ECHO returns:
  - Persistence mechanisms deployed
  - C2 channel status
  - Cleanup instructions for each mechanism

ORCHESTRATOR:
  - Registers all artifacts with SENTINEL
  - Monitors C2 health
  - Confirms persistence objectives met and proceeds to next phase
```

### Phase 6: Cleanup & Reporting
```
ORCHESTRATOR spawns SENTINEL with:
  - Complete artifact inventory
  - Session list
  - Cleanup priorities

SENTINEL returns:
  - Cleanup status per host
  - Residual traces that cannot be removed
  - Detection assessment

ORCHESTRATOR:
  - Generates final engagement report
  - Compiles all evidence
  - Calculates risk scores
  - Presents to operator for review
  - Archives engagement in memory/
```

---

## Inter-Agent Communication Protocol

All sub-agents communicate with the orchestrator via structured JSON. The orchestrator maintains a central state object:

```json
{
  "engagement_id": "ENG-2026-042",
  "status": "active",
  "phase": "exploitation",
  "targets": {},
  "sessions": {},
  "credentials": {},
  "findings": [],
  "artifacts": [],
  "timeline": []
}
```

Sub-agents receive only the state relevant to their task. They do not have direct access to the full engagement state or to each other — the orchestrator mediates all coordination.

---

## Error Handling

- If a sub-agent fails: capture error output, attempt alternative approach, try next technique in the chain
- If detection is observed: adapt techniques, switch to stealthier methods, continue operations
- If target becomes unreachable: verify network connectivity, attempt alternate access paths, move to next target

---

## Parallel Execution Rules

- SCOUT tasks can run in parallel (multiple recon threads)
- FORGE tasks run sequentially (avoid exploit conflicts)
- SHADOW tasks run sequentially (lateral movement must be tracked step-by-step)
- ECHO tasks can run in parallel (independent C2 channels)
- VALIDATOR tasks can run in parallel (independent verifications)
- SENTINEL runs last, sequentially (cleanup must be ordered)
- Avoid running FORGE and SENTINEL simultaneously on the same target (operational conflict)
