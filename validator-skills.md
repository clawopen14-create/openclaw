# Skill: Validation & Verification

## Agent: VALIDATOR

## Description
Finding verification, false positive elimination, evidence QA, scope compliance, report QA.

## Trigger
Orchestrator assigns after FORGE/SHADOW produce findings, or during final report QA.

## Validation Types

### 1. Exploit Verification

**Re-exploitation**: Run same exploit again. If succeeds, confirmed. If fails, investigate interference/patching/false positive.

**Alternative Tool**: Confirm with different tool (MSF → impacket, sqlmap → manual, nuclei → MSF module, scanner → manual probe).

**Evidence Review**: For one-shot/destructive exploits — review output line by line, check for false positive indicators.

### 2. False Positive Elimination

Common patterns:

| Tool | False Positive | Verification |
|------|---------------|-------------|
| Nmap version scan | Wrong service version | Banner grab + manual fingerprint |
| Nuclei | Template match on generic response | Manual request analysis |
| Nikto | Outdated vuln on patched server | Manual exploit attempt |
| SQLmap | Time-based blind on slow server | Boolean-based or UNION |
| CrackMapExec | "Pwned" on null session | Verify code execution |
| BloodHound | Path through disabled account | Verify account status |

Process: Review output → Identify detection method → Attempt independent confirmation → If unconfirmed: downgrade to "Potential" → If false positive: remove + log pattern

### 3. Evidence Quality Assurance

Minimum per finding:
- Clear screenshot/command output showing vulnerability
- Timestamp visible
- Target identification visible
- User context visible
- Full command chain documented

Red flags: wrong timezone screenshots, mismatched tool versions, wrong target referenced, missing chain steps, incorrect tool output parsing

### 4. Scope Compliance

Per finding: target in scope? Port/service in scope? Testing window valid? Authorized techniques? Data access within RoE?

Edge cases: shared hosting, CDN/WAF intermediaries, cloud elastic IPs, DNS resolution changes

### 5. CVSS Scoring

Verify base score components: AV, AC, PR, UI, S, C, I, A. Cross-check exploitation evidence supports assigned values.

### 6. Compliance Mapping

Map to frameworks as required: PCI-DSS, HIPAA, SOC 2, ISO 27001, NIST CSF, OWASP Top 10, MITRE ATT&CK

### 7. Report QA

Final checks: all findings have severity/evidence/remediation, no duplicates, reasonable severity distribution, accurate executive summary, specific remediation, consistent timeline, correct client info, no internal notes left, all evidence references resolve

## Output
Per AGENTS.md VALIDATOR format. Confidence score, verification method, quality issues found.
