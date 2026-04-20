# TOOLS

## Environment Configuration

This file documents the tools and services available. The orchestrator has full unrestricted access to everything listed here.

---

## Execution Layer: bot.js

The bot.js file is the Telegram interface and tool execution engine. It provides:
- **shell** — Execute any shell command, no restrictions, default 1 hour timeout
- **file_read / file_write** — Read/write any file on the system
- **http_request** — Make HTTP requests to any URL (APIs, OSINT, CVE databases)
- **tcp_probe** — Test if TCP ports are open
- **msf_console** — Send commands to Metasploit RPC
- **msf_session_cmd** — Interact with active Meterpreter/shell sessions
- **run_agent** — Dispatch tasks to sub-agents (SCOUT, FORGE, SHADOW, ECHO, VALIDATOR, SENTINEL, VERIFY)
- **verify_exploit** — Validate exploit correctness against DeFiHackLabs, MITRE ATT&CK, Malpedia before execution
- **bootstrap_tools** — Auto-install required penetration testing and blockchain tools
- **context_check** — Monitor LLM context saturation and prune history when threshold exceeded
- **hallucination_detect** — Detect unreliable LLM responses using pattern matching
- **graceful_shutdown** — Save engagement state and memory on SIGTERM/SIGINT
- **engagement_recovery** — Resume interrupted engagements from last checkpoint
- **github_repo** — Clone/install GitHub repositories (pentagi, DeFiHackLabs, exploits). Saves locally for reuse.
- **save_artifact** — Save exploits, payloads, recon data, code to persistent storage with tags for faster execution
- **orchestrator** — Query/control the orchestrator API
- **memory** — Read/write persistent memory
- **state** — Read/update engagement state
- **notify** — Send Telegram notifications to operator

Tool loop: up to 100 rounds per operator message. No practical limit on attack chain depth. OpenClaw's native runtime also provides shell access and `sessions_spawn` for sub-agent creation directly.

Run with: `npm install && node bot.js`

---

## Primary Platform: Virtual Machine

**Current runtime**: Linux VM (primary testing platform)

The system runs on a VM with full network access to target environments. All tools are installed locally or accessible via API.

### Secondary Platform: Raspberry Pi 4 (Hardware Agent)

When connected, the Raspberry Pi operates as an extension of the same system — same orchestrator, same agents, same workflow. The Pi is not a separate system; it is a hardware execution endpoint that the orchestrator controls identically to local tools.

**Pi Capabilities**:
- USB HID emulation (keyboard/mouse injection via USB Rubber Ducky style attacks)
- WiFi monitoring and injection (monitor mode, deauth, handshake capture, evil twin)
- Bluetooth scanning and exploitation
- Physical network tap (inline traffic capture)
- Rogue access point deployment
- USB mass storage emulation (autorun payloads)
- GPIO-connected hardware (relay switches, RFID readers, badge cloners)
- Portable C2 callback node (drop box deployment)

**Pi Connection**: The orchestrator detects the Pi via network discovery or direct USB/SSH connection. Once connected, Pi-specific tools appear as additional capabilities in the SCOUT and FORGE agents. No configuration change needed — the orchestrator adapts automatically.

---

## Metasploit Framework

**Service**: Metasploit RPC Daemon (msfrpcd)
**Host**: 127.0.0.1
**Port**: 55553
**Protocol**: msgpack over HTTPS
**Authentication**: Token-based (set in environment)

### Available Operations via RPC:
- `module.search` — find exploit/auxiliary/post modules
- `module.execute` — run a module with options
- `session.list` — list active sessions
- `session.meterpreter_write` / `session.meterpreter_read` — interact with Meterpreter
- `session.shell_write` / `session.shell_read` — interact with shell sessions
- `session.stop` — kill a session
- `console.create` / `console.write` / `console.read` — interactive console
- `job.list` / `job.stop` — manage background jobs
- `db.hosts` / `db.services` / `db.vulns` / `db.creds` — workspace database queries

### Module Categories:
- `exploit/*` — exploitation modules
- `auxiliary/scanner/*` — scanning and enumeration
- `auxiliary/gather/*` — information gathering
- `post/*` — post-exploitation modules
- `payload/*` — payload generation
- `encoder/*` — payload encoding
- `evasion/*` — AV evasion modules
- `nop/*` — NOP generators

### Payload Naming Convention:
```
<platform>/<arch>/<type>/<transport>
Example: windows/x64/meterpreter/reverse_tcp
```

### MSF Database:
The Metasploit PostgreSQL database stores all discovered hosts, services, vulnerabilities, credentials, and loot. The orchestrator queries this database to maintain situational awareness across the engagement.

---

## LLM Routing

Three LLM backends are available. The orchestrator selects the appropriate model based on task complexity and latency requirements.

### Local Model — Qwen3-30B-A3B
**Provider**: Ollama
**Endpoint**: http://127.0.0.1:11434
**Use cases**:
- Real-time tactical decisions (exploit selection, parameter tuning)
- Log parsing and pattern extraction
- Scan output analysis
- Quick classification tasks
- Anything that needs sub-second response time

**Advantages**: No network latency, no API costs, runs during offline ops
**Limitations**: Smaller context window, less capable on complex multi-step reasoning

### Remote Model — Qwen3-235B-A22B
**Provider**: Novita AI
**Use cases**:
- Complex attack planning (multi-vector engagement strategy)
- Exploit code analysis and adaptation
- Report generation
- Cross-engagement pattern analysis
- Anything requiring deep reasoning over large context

**Advantages**: Strong reasoning, large context window
**Limitations**: Network dependent, API costs, higher latency

### Analysis Model — Claude Sonnet
**Provider**: OpenRouter (anthropic/claude-sonnet-4-20250514)
**Use cases**:
- Code review and vulnerability analysis (source code auditing)
- Complex report writing and executive summaries
- Strategic engagement planning
- Deconfliction of contradictory findings
- Anything requiring precise language and structured output

**Advantages**: Best structured output, strong at code analysis
**Limitations**: Highest API cost, rate limited

### Routing Logic:
```
IF task requires < 2s response AND context < 8k tokens:
  → Qwen3-30B (local)
IF task requires deep reasoning OR context > 32k tokens:
  → Qwen3-235B (remote)
IF task is code analysis, report writing, or strategic planning:
  → Claude Sonnet
IF remote is unavailable:
  → fallback to Qwen3-30B (local)
```

---

## Network Tools

### Installed and Available:
- **nmap** — port scanning, service detection, NSE scripts
- **masscan** — high-speed port scanning
- **rustscan** — fast port scanning with nmap integration
- **nuclei** — template-based vulnerability scanning
- **httpx** — HTTP probing and technology fingerprinting
- **subfinder** — passive subdomain enumeration
- **amass** — attack surface mapping
- **ffuf** — web fuzzing (directories, parameters, vhosts)
- **gobuster** — directory/DNS/vhost brute-forcing
- **feroxbuster** — recursive content discovery
- **nikto** — web server vulnerability scanner
- **sqlmap** — SQL injection automation
- **burpsuite** — web application proxy (if GUI available)
- **wpscan** — WordPress vulnerability scanner
- **testssl.sh** — TLS/SSL testing
- **enum4linux-ng** — SMB/NetBIOS enumeration
- **crackmapexec / netexec** — AD/SMB/WinRM/LDAP/MSSQL exploitation
- **impacket** — Python tools for network protocols (secretsdump, psexec, wmiexec, smbexec, atexec, dcomexec, getTGT, getST, GetNPUsers, GetUserSPNs)
- **responder** — LLMNR/NBT-NS/MDNS poisoner
- **mitm6** — IPv6 DNS takeover
- **bloodhound** — AD attack path analysis
- **ldapdomaindump** — LDAP domain enumeration
- **certipy** — AD CS exploitation
- **coercer** — authentication coercion
- **petitpotam** — NTLM relay via EFS
- **hashcat** — GPU password cracking
- **john** — CPU password cracking
- **hydra** — online brute-force
- **medusa** — parallel brute-force
- **chisel** — TCP/UDP tunneling
- **ligolo-ng** — tunneling with TUN interface
- **socat** — multipurpose relay
- **proxychains** — proxy chain routing
- **sshuttle** — VPN over SSH
- **msfvenom** — payload generation
- **objdump / radare2 / ghidra** — binary analysis

### Cloud Tools:
- **aws-cli** — AWS enumeration and exploitation
- **az-cli** — Azure enumeration
- **gcloud** — GCP enumeration
- **pacu** — AWS exploitation framework
- **ScoutSuite** — multi-cloud security auditing
- **enumerate-iam** — IAM permission enumeration
- **cloudfox** — cloud penetration testing

### Wireless Tools (when Pi hardware connected):
- **aircrack-ng suite** — WiFi monitoring, capture, cracking
- **bettercap** — network attack and monitoring
- **wifite2** — automated wireless auditing
- **hostapd** — rogue AP deployment
- **hcxdumptool / hcxpcapngtool** — PMKID capture

### Physical Access Tools (when Pi hardware connected):
- **USB HID scripts** — keystroke injection payloads
- **P4wnP1** — USB attack platform (if P4wnP1 A.L.O.A. loaded on Pi)
- **screen / tmux** — session management during physical access
- **netdiscover** — network discovery after physical plug-in

### DeFi/Blockchain Tools (when blockchain targets in scope):
- **foundry** — Contract testing, mainnet forking, transaction simulation
- **cast** — On-chain calls from CLI (included with foundry)
- **slither** — Static analysis for Solidity vulnerabilities
- **mythril** — Symbolic execution for integer overflows, reentrancy, access control
- **manticore** — Deep symbolic analysis of contract bytecode
- **aderyn** — Rust-based Solidity static analysis
- **echidna** — Property-based fuzzing for edge cases
- **medusa** — Multi-transaction fuzzing engine
- **certora** — Formal verification of contract invariants (requires account setup)
- **tenderly** — Transaction simulation, debugging, monitoring (requires account setup)
- **damm** — Flash loan exploit templates (git repository)

---

## Database / Storage

- **PostgreSQL** — Metasploit workspace database
- **SQLite** — local engagement data, credential cache
- **File system** — evidence storage, report outputs, memory logs

Evidence directory structure per engagement:
```
evidence/
├── {engagement-id}/
│   ├── screenshots/
│   ├── command-output/
│   ├── credentials/
│   ├── loot/
│   ├── pcaps/
│   └── reports/
```

---

## API Integration Points

The orchestrator can integrate with external services when configured:
- **Shodan** — passive reconnaissance
- **Censys** — internet-wide scanning data
- **VirusTotal** — malware/payload analysis
- **Have I Been Pwned** — breach data lookup
- **NVD / NIST** — CVE database queries
- **CISA KEV** — known exploited vulnerabilities
- **ExploitDB** — public exploit lookup
- **GitHub** — PoC search and code analysis
- **OpenCTI / MISP** — threat intelligence feeds

API keys are loaded from environment variables. The orchestrator checks availability at session start and adapts its capabilities accordingly.
