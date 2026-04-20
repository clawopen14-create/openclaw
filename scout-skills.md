# SCOUT Skills — Reconnaissance Agent

## Primary Skill: Full-Spectrum Attack Surface Enumeration

Passive and active reconnaissance across network, web, cloud, and physical layers.

### Trigger
Orchestrator assigns a recon task with target specification and intensity level.

---

## Phase 1: Passive Reconnaissance (No Target Interaction)

Execute these without touching target infrastructure:

**DNS Intelligence**
- Subdomain enumeration via certificate transparency logs (crt.sh, Censys)
- Passive DNS history (SecurityTrails, DNSdumpster)
- Reverse DNS lookups on IP ranges
- MX, TXT, SPF, DKIM, DMARC record analysis

**OSINT Collection**
- Email address harvesting (theHarvester, Hunter.io patterns)
- Employee enumeration (LinkedIn scraping patterns, org chart reconstruction)
- Technology stack identification (BuiltWith, Wappalyzer signatures, job postings)
- Code repository scanning (GitHub/GitLab dorks for target domain, leaked credentials, API keys)
- Paste site monitoring (Pastebin, GitHub Gists for target references)
- Breach database queries (credential leak correlation)
- Google dorking (site:target.com filetype:pdf, inurl:admin, etc.)

**Infrastructure Mapping**
- ASN lookup and IP range identification
- Cloud provider identification (AWS, Azure, GCP — IP range matching)
- CDN detection (Cloudflare, Akamai, Fastly — real IP discovery techniques)
- WAF fingerprinting (passive indicators in headers, cookies, error pages)
- Shodan/Censys queries for target IPs and domains

---

## Phase 2: Active Reconnaissance (Target Interaction)

**Network Scanning**
```bash
# Stealth scan (default)
nmap -sS -sV -O -Pn --top-ports 1000 -T3 --open -oA scan_{target} {target}

# Comprehensive scan (operator-approved)
nmap -sS -sV -sC -O -p- -T4 --open -oA full_{target} {target}

# UDP scan (slow, targeted)
nmap -sU --top-ports 100 -T3 -oA udp_{target} {target}

# Masscan for speed on large ranges
masscan {range} -p1-65535 --rate=1000 -oJ masscan_{target}.json
```

**Service Enumeration** (per discovered service)
- HTTP/S: technology fingerprint, directory brute-force, virtual host enumeration, API endpoint discovery, robots.txt, sitemap.xml, .well-known, security.txt
- SMB: null session check, share enumeration, user enumeration, OS detection, signing check
- LDAP: anonymous bind check, base DN enumeration, user/group/computer objects
- DNS: zone transfer attempt, version query, recursion check
- SSH: algorithm enumeration, banner grab, auth method detection
- RDP: NLA check, screenshot, encryption level
- SNMP: community string guessing, MIB walk
- MSSQL/MySQL/PostgreSQL: version, auth check, default credentials
- FTP: anonymous access, version, bounce scan
- SMTP: VRFY, EXPN, open relay check
- Redis: AUTH check, INFO dump
- MongoDB: no-auth access check

**Web Application Reconnaissance**
```bash
# Technology fingerprinting
httpx -l urls.txt -tech-detect -status-code -title -follow-redirects -o httpx_results.json

# Directory discovery
ffuf -u https://target.com/FUZZ -w /usr/share/wordlists/dirb/common.txt -mc 200,301,302,403 -o ffuf_results.json

# Parameter fuzzing
ffuf -u https://target.com/page?FUZZ=test -w /usr/share/wordlists/params.txt -mc 200 -fs {baseline_size}

# Virtual host enumeration
ffuf -u https://target.com -H "Host: FUZZ.target.com" -w subdomains.txt -mc 200 -fs {baseline_size}
```

**Cloud Enumeration**
- S3 bucket discovery (naming patterns, DNS CNAME, brute-force)
- Azure blob storage enumeration
- GCP storage bucket discovery
- Metadata endpoint probing (169.254.169.254 if internal)
- IAM role enumeration (if cloud access obtained)

---

## Phase 3: Vulnerability Mapping

After enumeration, correlate findings against:
- NVD/CVE database (exact version matching)
- CISA KEV (known exploited vulnerabilities — high priority)
- ExploitDB (available public exploits)
- Metasploit module database (available MSF modules)
- Nuclei templates (automated vulnerability checks)

```bash
# Nuclei scan against discovered hosts
nuclei -l discovered_urls.txt -t cves/ -t vulnerabilities/ -t misconfigurations/ -severity critical,high -o nuclei_results.json
```

---

## Output Format

Structured JSON per AGENTS.md SCOUT output format. Include:
- Complete host/service inventory
- Technology stack per host
- Vulnerability candidates with CVE mapping
- Prioritized attack vector recommendations
- Risk-ranked target list for exploitation phase
