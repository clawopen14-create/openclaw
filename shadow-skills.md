# Skill: Lateral Movement & Post-Exploitation

## Agent: SHADOW

## Description
Privilege escalation, credential harvesting, lateral movement, and business impact demonstration from established footholds.

## Trigger
Orchestrator assigns post-exploitation task after FORGE obtains initial access (active session required).

## Methodology

### Phase 1: Situational Awareness

Windows: sysinfo, getuid, getsystem, ipconfig, whoami /all, net user /domain, net group "Domain Admins" /domain, systeminfo, tasklist /v, netstat -ano, arp -a, route print, wmic qfe list

Linux: id, uname -a, sudo -l, /etc/passwd, /etc/shadow, ss -tlnp, ip addr, ps aux, find SUID, crontab, env

### Phase 2: Credential Harvesting

**Windows**: hashdump, mimikatz/kiwi (creds_all, lsa_dump_sam, lsa_dump_secrets, kerberos_ticket_list), impacket-secretsdump, DPAPI, registry hive dumps

**Linux**: /etc/shadow, SSH keys, .env files, grep password, bash_history, /proc/*/environ

**Cracking**: hashcat modes 1000 (NTLM), 13100 (Kerberoast), 18200 (AS-REP), 5600 (NetNTLMv2), 1800 (shadow)

### Phase 3: Privilege Escalation

**Windows** (ordered): Token impersonation (Potato family), unquoted service paths, writable service binaries, DLL hijacking, AlwaysInstallElevated, scheduled task abuse, UAC bypass, kernel exploits, cached admin creds, GPP passwords

**Linux** (ordered): sudo misconfig, SUID/SGID + GTFOBins, writable cron, writable /etc/passwd, kernel exploits, docker group, NFS no_root_squash, capabilities, PATH injection, wildcard injection

### Phase 4: Lateral Movement

| Credential | Service | Technique | Tool |
|-----------|---------|-----------|------|
| Password | SMB | PsExec | impacket-psexec |
| Password | WMI | WMIexec | impacket-wmiexec |
| Password | WinRM | Evil-WinRM | evil-winrm |
| NTLM Hash | SMB | Pass-the-Hash | impacket-psexec -hashes |
| Kerberos TGT | Any | Pass-the-Ticket | KRB5CCNAME |
| SSH Key | SSH | Key Auth | ssh -i |
| Password | MSSQL | SQL Shell | impacket-mssqlclient |

**AD Attack Paths** (BloodHound): Shortest path to DA, Kerberoastable users, local admin paths, ACL abuse, delegation abuse

### Phase 5: Data Access & Impact Demonstration

Enumerate sensitive shares, access databases, read email if possible, access cloud resources. Document access capability — exfiltrate data samples as proof of access.

### Phase 6: Pivoting

Meterpreter autoroute + SOCKS, Chisel, Ligolo-ng, SSH tunnels (-D SOCKS, -L port forward)

## Output
Per AGENTS.md SHADOW output format. Full credential inventory, privilege levels, lateral movement path, sensitive data access.
