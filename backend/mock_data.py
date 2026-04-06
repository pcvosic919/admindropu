"""
Comprehensive mock data for M365 Sentinel Platform
All timestamps in Taiwan time (UTC+8)
"""
from datetime import datetime, timedelta
import random

# Taiwan time offset
def tw_now():
    return datetime.utcnow() + timedelta(hours=8)

def tw_past(days=0, hours=0, minutes=0):
    return tw_now() - timedelta(days=days, hours=hours, minutes=minutes)

def fmt(dt):
    return dt.strftime("%Y-%m-%dT%H:%M:%S+08:00")

# ─── USERS ──────────────────────────────────────────────────────────────────

DEPARTMENTS = ["Engineering", "Finance", "HR", "Marketing", "Operations", "Legal", "IT", "Sales", "Executive", "Support"]
LICENSES = ["Microsoft 365 E5", "Microsoft 365 E3", "Microsoft 365 Business Premium", "Microsoft 365 F3", "Exchange Online Plan 1"]

def make_users():
    users = []
    first_names = ["James","Mary","John","Patricia","Robert","Jennifer","Michael","Linda","William","Barbara",
                   "David","Elizabeth","Richard","Susan","Joseph","Jessica","Thomas","Sarah","Charles","Karen",
                   "Christopher","Lisa","Daniel","Nancy","Matthew","Betty","Anthony","Dorothy","Mark","Sandra",
                   "Donald","Ashley","Steven","Dorothy","Paul","Kimberly","Andrew","Emily","Kenneth","Donna",
                   "Joshua","Michelle","Kevin","Carol","Brian","Amanda","George","Melissa","Timothy","Deborah"]
    last_names = ["Smith","Johnson","Williams","Brown","Jones","Garcia","Miller","Davis","Rodriguez","Martinez",
                  "Hernandez","Lopez","Gonzalez","Wilson","Anderson","Thomas","Taylor","Moore","Jackson","Martin",
                  "Lee","Perez","Thompson","White","Harris","Sanchez","Clark","Ramirez","Lewis","Robinson",
                  "Walker","Young","Allen","King","Wright","Scott","Torres","Nguyen","Hill","Flores",
                  "Green","Adams","Nelson","Baker","Hall","Rivera","Campbell","Mitchell","Carter","Roberts"]

    for i in range(50):
        fn = first_names[i]
        ln = last_names[i]
        dept = DEPARTMENTS[i % len(DEPARTMENTS)]
        is_guest = i >= 44
        is_disabled = i in [12, 23, 31, 42]
        days_inactive = random.choice([0, 1, 3, 7, 14, 30, 45, 60, 91, 95, 100, 110, 180]) if not is_disabled else 200

        if is_guest:
            upn = f"{fn.lower()}.{ln.lower()}@external.com#EXT#@contoso.onmicrosoft.com"
        else:
            upn = f"{fn.lower()}.{ln.lower()}@contoso.onmicrosoft.com"

        last_signin = fmt(tw_past(days=days_inactive)) if days_inactive > 0 else fmt(tw_past(hours=random.randint(1, 23)))

        mfa_enabled = True if i not in [5, 11, 18, 27, 33, 38, 46] else False
        is_admin = i in [0, 1, 2, 7, 15]
        admin_roles = []
        if i == 0: admin_roles = ["Global Administrator"]
        elif i == 1: admin_roles = ["Global Administrator", "Exchange Administrator"]
        elif i == 2: admin_roles = ["SharePoint Administrator"]
        elif i == 7: admin_roles = ["User Administrator"]
        elif i == 15: admin_roles = ["Security Administrator"]

        users.append({
            "id": f"user-{i+1:03d}",
            "displayName": f"{fn} {ln}",
            "userPrincipalName": upn,
            "department": dept,
            "jobTitle": f"Senior {dept} Analyst" if i % 3 == 0 else f"{dept} Manager" if i % 3 == 1 else f"{dept} Specialist",
            "license": LICENSES[i % len(LICENSES)],
            "lastSignIn": last_signin,
            "daysInactive": days_inactive,
            "accountEnabled": not is_disabled,
            "userType": "Guest" if is_guest else "Member",
            "mfaEnabled": mfa_enabled,
            "isAdmin": is_admin,
            "adminRoles": admin_roles,
            "createdAt": fmt(tw_past(days=random.randint(30, 730))),
            "riskLevel": "Critical" if days_inactive > 180 else "High" if days_inactive > 90 else "Medium" if days_inactive > 60 else "Low",
            "country": random.choice(["Taiwan", "USA", "Japan", "Singapore", "UK"]),
        })
    return users

MOCK_USERS = make_users()

# ─── ALERTS ─────────────────────────────────────────────────────────────────

ALERT_TEMPLATES = [
    ("Impossible Travel Detected", "Identity", "Critical", "A user signed in from two geographically distant locations within an impossible time window."),
    ("Mass File Download", "SharePoint", "Critical", "Unusual bulk file download activity detected from SharePoint Online."),
    ("Privileged Account Sign-in from Unfamiliar Location", "Identity", "Critical", "Global Admin account signed in from an IP not previously seen."),
    ("Ransomware Indicators Detected", "Defender", "Critical", "Files matching known ransomware patterns detected on endpoint."),
    ("Multiple Failed MFA Attempts", "Identity", "High", "More than 10 failed MFA push notifications in 5 minutes - potential MFA fatigue attack."),
    ("Inbox Rule Created to Forward Emails Externally", "Exchange", "High", "A new inbox rule was created to automatically forward all emails to an external address."),
    ("Malicious OAuth App Consent", "Identity", "High", "User granted permissions to an OAuth app with suspicious access scopes."),
    ("Risky Sign-in Detected", "Identity", "High", "Azure AD Identity Protection flagged a sign-in as high risk."),
    ("SharePoint Site Sharing Anomaly", "SharePoint", "High", "A SharePoint site was shared with a large number of external users."),
    ("Unusual Admin Activity", "Identity", "High", "Admin account performed unusual bulk operations outside business hours."),
    ("DLP Policy Violation - Credit Card Data", "DLP", "High", "Sensitive credit card data detected in outbound email."),
    ("Anonymous Link Created for Sensitive File", "SharePoint", "Medium", "Anonymous sharing link created for file tagged as confidential."),
    ("Stale Guest Account Still Active", "Identity", "Medium", "Guest account has not signed in for over 90 days but remains active."),
    ("Teams External Sharing Enabled in Channel", "Teams", "Medium", "External sharing was enabled in a Teams channel containing sensitive data."),
    ("User Added to Privileged Role", "Identity", "Medium", "A user was added to the Exchange Administrator role."),
    ("Email Sent with Sensitive Attachment Externally", "Exchange", "Medium", "Email with attachment marked as sensitive sent to external recipients."),
    ("Legacy Authentication Attempt", "Identity", "Medium", "Sign-in attempt using legacy authentication protocol (IMAP/POP3)."),
    ("Teams Meeting Recording Shared Externally", "Teams", "Medium", "Teams meeting recording was shared with an external email address."),
    ("Mailbox Permission Change", "Exchange", "Medium", "Full access permission granted on an executive mailbox."),
    ("Conditional Access Policy Bypassed", "Identity", "Medium", "A sign-in succeeded that should have been blocked by Conditional Access."),
    ("Secure Score Dropped Below Threshold", "Defender", "Medium", "Microsoft Secure Score dropped more than 5 points in the last 24 hours."),
    ("Guest User Invited to Sensitive Team", "Teams", "Low", "A guest user was invited to a Team containing sensitive project data."),
    ("SharePoint Storage Quota Approaching Limit", "SharePoint", "Low", "SharePoint storage usage has reached 85% of allocated quota."),
    ("User Password Expiring Soon", "Identity", "Low", "5 user passwords will expire within the next 7 days."),
    ("Audit Log Retention Policy Expiring", "Compliance", "Low", "Audit log retention policy will expire in 30 days."),
    ("New App Registration Created", "Identity", "Low", "A new app registration was created in Azure AD."),
    ("Teams Guest Access Policy Changed", "Teams", "Low", "Organization-wide Teams guest access policy was modified."),
    ("Email Forwarding Rule Detected", "Exchange", "Low", "An automatic forwarding rule was detected on a user mailbox."),
    ("Inactive Mailbox Found", "Exchange", "Low", "A licensed mailbox has not been accessed in over 60 days."),
    ("Service Account Password Not Rotated", "Identity", "Low", "Service account password has not been changed in over 90 days."),
    ("Certificate Expiring in 30 Days", "Identity", "Low", "An application certificate will expire in 30 days."),
]

STATUSES = ["Open", "Investigating", "Closed"]

def make_alerts():
    alerts = []
    for i, (title, service, severity, description) in enumerate(ALERT_TEMPLATES):
        hours_ago = random.randint(1, 72)
        status = "Open" if i < 15 else "Investigating" if i < 22 else "Closed"
        affected_user = MOCK_USERS[i % len(MOCK_USERS)]
        alerts.append({
            "id": f"alert-{i+1:03d}",
            "title": title,
            "service": service,
            "severity": severity,
            "status": status,
            "description": description,
            "triggeredAt": fmt(tw_past(hours=hours_ago)),
            "updatedAt": fmt(tw_past(hours=max(1, hours_ago - 2))),
            "affectedUser": affected_user["userPrincipalName"],
            "affectedUserId": affected_user["id"],
            "sourceIp": f"203.{random.randint(1,254)}.{random.randint(1,254)}.{random.randint(1,254)}",
            "location": random.choice(["Taipei, Taiwan", "Tokyo, Japan", "Los Angeles, USA", "London, UK", "Unknown"]),
            "recommendedActions": [
                "Investigate the user account immediately",
                "Reset credentials if compromise is confirmed",
                "Review sign-in logs for related activity",
                "Notify the security team",
            ],
            "policyId": f"policy-{(i % 30)+1:03d}",
        })
    return alerts

MOCK_ALERTS = make_alerts()

# ─── ALERT POLICIES ─────────────────────────────────────────────────────────

POLICY_NAMES = [
    "Impossible Travel", "Mass Download", "Privileged Sign-in Anomaly", "Ransomware Detection",
    "MFA Fatigue", "External Forwarding Rule", "OAuth App Consent", "Risky Sign-in",
    "External SharePoint Share", "Admin Anomaly", "DLP Credit Card", "Anonymous Link",
    "Stale Guest Account", "Teams External Share", "Privileged Role Change", "Sensitive Email External",
    "Legacy Auth", "Meeting Recording Share", "Mailbox Permission Change", "CA Bypass",
    "Secure Score Drop", "Guest Sensitive Team", "Storage Quota", "Password Expiry",
    "Audit Retention Expiry", "New App Registration", "Teams Policy Change", "Email Forwarding",
    "Inactive Mailbox", "Service Account Password", "Certificate Expiry", "Bulk Mail Delete",
    "Mass SharePoint Delete", "Privilege Escalation", "Data Exfiltration via Email",
    "Suspicious Inbox Access", "External DNS Change", "New Admin Account", "MFA Disabled",
    "Global Policy Modified", "Conditional Access Disabled", "Alert Suppression Rule",
    "Compliance Policy Bypass", "Retention Label Removed", "eDiscovery Search Created",
    "Teams Channel Deleted", "OneDrive Sync Anomaly", "Sign-in from Blocked Country",
    "Password Spray Attack", "Brute Force Attempt", "Token Theft Indicator",
    "Unfamiliar Sign-in Properties", "Anomalous Token", "Malware Detected",
    "Phishing Email Delivered", "Safe Links Click", "Anti-Spam Policy Changed",
    "Message Trace Anomaly", "Mail Flow Rule Created", "Domain Added to Tenant",
    "Federation Setting Changed", "Trust Relationship Modified", "SharePoint Admin Change",
    "Teams Admin Change", "Exchange Admin Change", "License Assignment Anomaly",
    "User Creation Burst", "User Deletion Burst", "Group Membership Flood",
    "SharePoint Site Created Bulk", "Teams Team Created Bulk", "App Permission Escalation",
    "Service Principal Anomaly", "Managed Identity Misuse", "Cross-Tenant Access Change",
    "Information Barrier Violation", "Communication Compliance Alert", "Sensitive Label Downgrade",
    "Protected Document Access", "AIP Scanner Alert", "Endpoint DLP Violation",
    "Cloud App Discovery Anomaly", "Shadow IT Detection", "Unsanctioned App Usage",
    "MCAS Anomaly Detection", "Impossible Travel MCAS", "Activity from Infected Device",
    "Activity from Anonymous Proxy", "Activity from Suspicious IP", "Admin Activity Spike",
    "User Activity Spike", "Failed Login Burst", "Successful Login After Failures",
    "New Country Login", "New Device Login", "Concurrent Sessions Detected",
    "Email Volume Anomaly", "Outbound Email Spike", "Large Attachment Sent",
    "Calendar Permission Change", "Contact Export", "People Search Anomaly",
    "Audit Log Clear Attempt", "Alert Rule Deleted", "Policy Disabled",
    "Security Default Changed", "External Identity Provider Added", "Named Location Changed",
    "Sign-in Risk Policy Disabled", "User Risk Policy Disabled", "SSPR Config Change",
    "MFA Method Change", "App Password Created", "Authenticator App Reset",
]

def make_policies():
    policies = []
    for i, name in enumerate(POLICY_NAMES):
        policies.append({
            "id": f"policy-{i+1:03d}",
            "name": name,
            "description": f"Detects and alerts on {name.lower()} events across M365 services.",
            "severity": random.choice(["Critical", "High", "Medium", "Low"]),
            "service": random.choice(["Identity", "Exchange", "SharePoint", "Teams", "DLP", "Defender", "Compliance"]),
            "enabled": random.random() > 0.1,
            "alertCount": random.randint(0, 25),
            "lastTriggered": fmt(tw_past(days=random.randint(0, 30))) if random.random() > 0.3 else None,
            "createdAt": fmt(tw_past(days=random.randint(30, 365))),
        })
    return policies

MOCK_POLICIES = make_policies()

# ─── REPORTS ────────────────────────────────────────────────────────────────

REPORT_NAMES = [
    ("User Activity Summary", "Identity", "Weekly summary of all user sign-in activity."),
    ("MFA Adoption Report", "Identity", "Current MFA enrollment status across all users."),
    ("Guest Account Inventory", "Identity", "Full inventory of all B2B guest accounts."),
    ("Inactive Account Report", "Identity", "Accounts inactive for 30, 60, 90+ days."),
    ("Privileged Access Review", "Identity", "All users with admin roles and last activity."),
    ("License Utilization Report", "Identity", "M365 license assignment and usage statistics."),
    ("Conditional Access Report", "Identity", "Conditional Access policy evaluation results."),
    ("Sign-in Risk Summary", "Identity", "Users flagged with risky sign-in events."),
    ("Mailbox Usage Report", "Exchange", "Exchange Online mailbox size and activity."),
    ("Mail Flow Statistics", "Exchange", "Inbound/outbound email volume trends."),
    ("Anti-Spam Report", "Exchange", "Spam and phishing messages blocked/delivered."),
    ("DLP Policy Match Report", "DLP", "DLP rule matches with policy details."),
    ("Email DLP Violations", "DLP", "Emails that violated DLP policies."),
    ("Sensitive Data Locations", "DLP", "Files and emails containing sensitive data."),
    ("SharePoint Usage Report", "SharePoint", "Site collection storage and activity."),
    ("SharePoint External Sharing", "SharePoint", "Files and sites shared externally."),
    ("SharePoint Permissions Audit", "SharePoint", "Overly permissive SharePoint sharing."),
    ("OneDrive Usage Report", "SharePoint", "User OneDrive storage and sync activity."),
    ("Teams Usage Report", "Teams", "Teams meetings, messages, and calls stats."),
    ("Teams Guest Activity", "Teams", "Guest user activity within Teams channels."),
    ("Teams External Access Log", "Teams", "Federated communications with external orgs."),
    ("Teams App Usage", "Teams", "Third-party app usage within Teams."),
    ("Secure Score History", "Security", "Microsoft Secure Score trend over time."),
    ("Security Recommendations", "Security", "Prioritized list of security improvements."),
    ("Alert Trend Report", "Security", "Alert volume by severity and service over time."),
    ("Incident Response Log", "Security", "Security incidents and resolution timeline."),
    ("Compliance Score Report", "Compliance", "Microsoft Compliance Manager score details."),
    ("Data Retention Summary", "Compliance", "Retention labels applied and policy coverage."),
    ("eDiscovery Activity Log", "Compliance", "eDiscovery searches and exports log."),
    ("Audit Log Summary", "Compliance", "Admin and user audit events summary."),
    ("Communication Compliance Report", "Compliance", "Policy matches in Teams/Exchange."),
    ("Information Barriers Report", "Compliance", "Segment communication restriction status."),
    ("App Consent Grant Report", "Identity", "OAuth app consents granted by users."),
    ("Service Principal Activity", "Identity", "App and service principal sign-in activity."),
    ("Device Compliance Report", "Devices", "Intune device compliance status."),
    ("Mobile App Protection Report", "Devices", "MAM policy compliance on mobile devices."),
    ("Endpoint Security Report", "Devices", "Defender for Endpoint threat summary."),
    ("Cloud App Discovery Report", "CloudApps", "Unsanctioned SaaS app usage detected."),
    ("Shadow IT Report", "CloudApps", "Cloud apps in use not approved by IT."),
    ("MCAS Activity Report", "CloudApps", "Microsoft Defender for Cloud Apps alerts."),
    ("Cross-Tenant Access Report", "Identity", "B2B collaboration and tenant trust settings."),
    ("Admin Activity Report", "Identity", "All privileged operations in M365 admin center."),
    ("Password Policy Compliance", "Identity", "Users not compliant with password policies."),
    ("Role Assignment Changes", "Identity", "History of admin role assignments and removals."),
    ("Group Membership Changes", "Identity", "M365 group and Teams membership modifications."),
    ("External Identity Report", "Identity", "External identities and federation summary."),
    ("Data Loss Prevention Dashboard", "DLP", "Consolidated DLP metrics across all workloads."),
    ("Sensitive Information Types", "DLP", "Custom and built-in sensitive info type matches."),
    ("Azure AD Audit Log Export", "Identity", "Raw audit log for compliance purposes."),
    ("Monthly Executive Security Summary", "Security", "High-level security metrics for leadership."),
    ("Quarterly Risk Assessment", "Security", "Quarterly security posture and risk overview."),
]

def make_reports():
    reports = []
    categories = list(set(r[1] for r in REPORT_NAMES))
    for i, (name, category, description) in enumerate(REPORT_NAMES):
        reports.append({
            "id": f"report-{i+1:03d}",
            "name": name,
            "category": category,
            "description": description,
            "lastGenerated": fmt(tw_past(days=random.randint(0, 14))) if random.random() > 0.2 else None,
            "frequency": random.choice(["Daily", "Weekly", "Monthly", None]),
            "format": random.choice(["Excel", "CSV", "PDF"]),
            "isScheduled": random.random() > 0.6,
            "nextRun": fmt(tw_past(days=-random.randint(1, 7))) if random.random() > 0.6 else None,
        })
    return reports

MOCK_REPORTS = make_reports()

# ─── SECURITY POSTURE ───────────────────────────────────────────────────────

MOCK_SECURE_SCORE = {
    "current": 68,
    "maxScore": 100,
    "comparisonToSimilarCompanies": 72,
    "trend": [
        {"date": fmt(tw_past(days=6)), "score": 62},
        {"date": fmt(tw_past(days=5)), "score": 63},
        {"date": fmt(tw_past(days=4)), "score": 64},
        {"date": fmt(tw_past(days=3)), "score": 65},
        {"date": fmt(tw_past(days=2)), "score": 66},
        {"date": fmt(tw_past(days=1)), "score": 67},
        {"date": fmt(tw_past(days=0)), "score": 68},
    ],
    "recommendations": [
        {"id": "rec-001", "title": "Enable MFA for all users", "impact": "High", "points": 9, "status": "Incomplete", "service": "Identity"},
        {"id": "rec-002", "title": "Block legacy authentication", "impact": "High", "points": 8, "status": "Incomplete", "service": "Identity"},
        {"id": "rec-003", "title": "Enable password hash sync", "impact": "Medium", "points": 6, "status": "Complete", "service": "Identity"},
        {"id": "rec-004", "title": "Require MFA for admin roles", "impact": "High", "points": 10, "status": "Complete", "service": "Identity"},
        {"id": "rec-005", "title": "Enable Microsoft Defender for Office 365", "impact": "High", "points": 7, "status": "Incomplete", "service": "Defender"},
        {"id": "rec-006", "title": "Enable Safe Attachments policy", "impact": "Medium", "points": 5, "status": "Incomplete", "service": "Exchange"},
        {"id": "rec-007", "title": "Enable Safe Links policy", "impact": "Medium", "points": 5, "status": "Complete", "service": "Exchange"},
        {"id": "rec-008", "title": "Review SharePoint external sharing settings", "impact": "Medium", "points": 4, "status": "Incomplete", "service": "SharePoint"},
        {"id": "rec-009", "title": "Enable DLP policies for sensitive data", "impact": "High", "points": 8, "status": "Incomplete", "service": "DLP"},
        {"id": "rec-010", "title": "Enable Privileged Identity Management", "impact": "High", "points": 9, "status": "Incomplete", "service": "Identity"},
        {"id": "rec-011", "title": "Enable Unified Audit Log", "impact": "Low", "points": 3, "status": "Complete", "service": "Compliance"},
        {"id": "rec-012", "title": "Configure Teams guest access policies", "impact": "Low", "points": 2, "status": "Incomplete", "service": "Teams"},
    ],
}

MOCK_EXCHANGE_SECURITY = {
    "malwareDetected": 47,
    "phishingBlocked": 312,
    "spamFiltered": 1842,
    "safeLinksActivations": 28,
    "safeAttachmentsScanned": 956,
    "dlpPolicyMatches": 14,
    "externalForwardingRules": 3,
    "fullAccessGrants": 7,
    "lastUpdated": fmt(tw_past(hours=1)),
}

MOCK_SHAREPOINT_SECURITY = {
    "sitesWithExternalSharing": 23,
    "anonymousLinks": 156,
    "guestAccessLinks": 342,
    "sensitiveFilesExposed": 18,
    "dontRequireSignIn": 45,
    "externalUsersWithAccess": 67,
    "sitesReviewed": 142,
    "totalSites": 189,
    "lastUpdated": fmt(tw_past(hours=2)),
}

MOCK_TEAMS_SECURITY = {
    "teamsWithGuests": 34,
    "externalAccessEnabled": True,
    "guestAccessEnabled": True,
    "channelCount": 287,
    "externalMeetingParticipants": 156,
    "sensitiveTeams": 12,
    "unownedTeams": 8,
    "archiveCandidates": 15,
    "lastUpdated": fmt(tw_past(hours=1)),
}

# ─── LICENSE DATA ───────────────────────────────────────────────────────────

MOCK_LICENSES = [
    {"name": "Microsoft 365 E5", "total": 50, "assigned": 42, "available": 8, "costPerUser": 57.0},
    {"name": "Microsoft 365 E3", "total": 100, "assigned": 87, "available": 13, "costPerUser": 36.0},
    {"name": "Microsoft 365 Business Premium", "total": 30, "assigned": 28, "available": 2, "costPerUser": 22.0},
    {"name": "Microsoft 365 F3", "total": 20, "assigned": 15, "available": 5, "costPerUser": 8.0},
    {"name": "Exchange Online Plan 1", "total": 10, "assigned": 10, "available": 0, "costPerUser": 4.0},
    {"name": "Azure AD Premium P2", "total": 50, "assigned": 38, "available": 12, "costPerUser": 9.0},
    {"name": "Microsoft Defender for Endpoint P2", "total": 50, "assigned": 45, "available": 5, "costPerUser": 5.2},
]

# ─── ACTIVITY TREND ─────────────────────────────────────────────────────────

def make_activity_trend():
    trend = []
    for i in range(7):
        day = tw_past(days=6-i)
        trend.append({
            "date": day.strftime("%m/%d"),
            "signIns": random.randint(120, 280),
            "alerts": random.randint(2, 15),
            "guestActivity": random.randint(10, 45),
        })
    return trend

MOCK_ACTIVITY_TREND = make_activity_trend()

# ─── ACCOUNT AUDIT (M11) ────────────────────────────────────────────────────

def make_teams_members():
    members = []
    teams = ["Security Team", "Finance Hub", "HR Policies", "Engineering Sync", "Executive Leadership",
             "Marketing Campaigns", "Legal Affairs", "IT Operations", "Sales Pipeline", "Product Development"]
    for i, user in enumerate(MOCK_USERS[:40]):
        team = teams[i % len(teams)]
        last_activity = tw_past(days=random.randint(0, 120))
        days_inactive = (tw_now() - last_activity).days
        risk = "Critical" if days_inactive > 180 or (user["userType"] == "Guest" and days_inactive > 60) else \
               "High" if days_inactive > 90 else "Medium" if days_inactive > 30 else "Low"
        members.append({
            "id": f"tm-{i+1:03d}",
            "userId": user["id"],
            "displayName": user["displayName"],
            "upn": user["userPrincipalName"],
            "teamName": team,
            "role": "Owner" if i % 8 == 0 else "Member",
            "userType": user["userType"],
            "lastActivity": fmt(last_activity),
            "daysInactive": days_inactive,
            "riskLevel": risk,
            "riskReason": "Guest inactive 60+ days" if user["userType"] == "Guest" and days_inactive > 60 else
                          "No activity 90+ days" if days_inactive > 90 else
                          "No activity 30+ days" if days_inactive > 30 else "Active",
        })
    return members

def make_spo_members():
    members = []
    sites = ["HR SharePoint", "Finance Documents", "IT Portal", "Legal Library", "Marketing Assets",
             "Engineering Wiki", "Executive Docs", "Compliance Center", "Project Alpha", "Sales Collateral"]
    for i, user in enumerate(MOCK_USERS[:35]):
        site = sites[i % len(sites)]
        last_activity = tw_past(days=random.randint(0, 150))
        days_inactive = (tw_now() - last_activity).days
        risk = "Critical" if days_inactive > 180 else "High" if days_inactive > 90 else \
               "Medium" if days_inactive > 30 else "Low"
        members.append({
            "id": f"spo-{i+1:03d}",
            "userId": user["id"],
            "displayName": user["displayName"],
            "upn": user["userPrincipalName"],
            "siteName": site,
            "siteUrl": f"https://contoso.sharepoint.com/sites/{site.replace(' ', '-').lower()}",
            "permissionLevel": random.choice(["Owner", "Member", "Visitor", "Full Control"]),
            "userType": user["userType"],
            "lastActivity": fmt(last_activity),
            "daysInactive": days_inactive,
            "riskLevel": risk,
        })
    return members

def make_groups():
    groups_data = []
    group_names = ["All Staff", "Finance Team", "IT Admins", "Security Group", "Marketing DL",
                   "Project Alpha", "VIP Users", "External Partners", "Contractors", "Executives"]
    for i, gname in enumerate(group_names):
        member_count = random.randint(3, 25)
        guest_count = random.randint(0, 5)
        inactive_count = random.randint(0, member_count // 3)
        risk = "High" if guest_count > 3 or inactive_count > 5 else "Medium" if guest_count > 0 or inactive_count > 2 else "Low"
        groups_data.append({
            "id": f"grp-{i+1:03d}",
            "name": gname,
            "type": random.choice(["Microsoft 365 Group", "Security Group", "Distribution List"]),
            "memberCount": member_count,
            "guestCount": guest_count,
            "inactiveCount": inactive_count,
            "lastActivity": fmt(tw_past(days=random.randint(0, 60))),
            "riskLevel": risk,
            "hasExternalMembers": guest_count > 0,
            "owners": [MOCK_USERS[i % len(MOCK_USERS)]["displayName"]],
        })
    return groups_data

MOCK_TEAMS_MEMBERS = make_teams_members()
MOCK_SPO_MEMBERS = make_spo_members()
MOCK_GROUPS = make_groups()
MOCK_GUESTS = [u for u in MOCK_USERS if u["userType"] == "Guest"]

MOCK_AUDIT_LOG = [
    {
        "id": f"audit-{i+1:03d}",
        "timestamp": fmt(tw_past(days=random.randint(0, 30), hours=random.randint(0, 23))),
        "action": random.choice(["Remove Guest", "Disable Account", "Remove from Team", "Revoke License", "Reset Password"]),
        "targetUser": MOCK_USERS[i % len(MOCK_USERS)]["userPrincipalName"],
        "performedBy": "M365 Sentinel Platform",
        "status": random.choice(["Success", "Success", "Success", "DryRun", "Failed"]),
        "isDryRun": random.random() > 0.7,
        "notes": "Automated remediation based on inactivity policy",
    }
    for i in range(20)
]

# ─── DASHBOARD SUMMARY ──────────────────────────────────────────────────────

def get_dashboard_summary():
    total = len(MOCK_USERS)
    active = sum(1 for u in MOCK_USERS if u["accountEnabled"] and u["daysInactive"] < 90)
    guests = sum(1 for u in MOCK_USERS if u["userType"] == "Guest")
    disabled = sum(1 for u in MOCK_USERS if not u["accountEnabled"])
    open_alerts = sum(1 for a in MOCK_ALERTS if a["status"] == "Open")
    critical_alerts = sum(1 for a in MOCK_ALERTS if a["severity"] == "Critical" and a["status"] != "Closed")
    mfa_enabled = sum(1 for u in MOCK_USERS if u["mfaEnabled"])
    total_licenses = sum(l["total"] for l in MOCK_LICENSES)
    assigned_licenses = sum(l["assigned"] for l in MOCK_LICENSES)

    return {
        "total_users": total,
        "active_users": active,
        "guest_users": guests,
        "disabled_users": disabled,
        "open_alerts": open_alerts,
        "critical_alerts": critical_alerts,
        "secure_score": MOCK_SECURE_SCORE["current"],
        "license_utilization": round(assigned_licenses / total_licenses * 100, 1),
        "mfa_rate": round(mfa_enabled / total * 100, 1),
        "inactive_users": sum(1 for u in MOCK_USERS if u["daysInactive"] >= 90 and u["accountEnabled"]),
        "recent_alerts": MOCK_ALERTS[:5],
        "activity_trend": MOCK_ACTIVITY_TREND,
    }


# ─── PERMISSIONS MOCK DATA ───────────────────────────────────────────────────

def _perm_risk(user_type, perm_level, sharing_scope=None):
    if sharing_scope == "Anonymous":
        return "Critical", "匿名連結分享，任何人皆可存取"
    if sharing_scope == "SpecificExternal":
        if perm_level in ("Full Control", "Edit"):
            return "Critical", "外部帳號具有編輯/完整控制權限"
        return "High", "內容分享給外部特定帳號"
    if user_type == "Guest" and perm_level in ("Full Control", "Edit"):
        return "High", "訪客帳號具有寫入權限"
    if user_type == "External":
        return "High", "外部使用者擁有存取權限"
    if perm_level == "Full Control" and user_type not in ("Member", "Internal"):
        return "High", "非內部帳號擁有完整控制權"
    if sharing_scope == "OrganizationInternal":
        return "Medium", "已分享給組織內所有人"
    return "Low", ""

_TEAMS = [
    ("IT Operations", "IT Ops"),
    ("Finance Team", "Finance"),
    ("HR Department", "Human Resources"),
    ("Sales Global", "Sales"),
    ("Dev - Backend", "Engineering"),
    ("Dev - Frontend", "Engineering"),
    ("Security Team", "Security"),
    ("Executive Staff", "Executive"),
]

_SPO_SITES = [
    ("IT Portal", "https://contoso.sharepoint.com/sites/IT"),
    ("Finance Hub", "https://contoso.sharepoint.com/sites/Finance"),
    ("HR Policies", "https://contoso.sharepoint.com/sites/HR"),
    ("Sales Collateral", "https://contoso.sharepoint.com/sites/Sales"),
    ("Engineering Docs", "https://contoso.sharepoint.com/sites/Engineering"),
    ("Exec Reports", "https://contoso.sharepoint.com/sites/Executive"),
]

_PERM_LEVELS_TEAMS = ["Full Control", "Edit", "Read"]
_PERM_LEVELS_SPO = ["Full Control", "Edit", "Read", "Limited Access"]
_SHARING_SCOPES = ["None", "None", "None", "OrganizationInternal", "SpecificExternal", "Anonymous"]
_ASSIGN_TYPES = ["Direct", "Direct", "Group", "Inherited"]
_CHANNEL_ACCESS = ["All Channels", "All Channels", "Standard Only", "Private Channel Only"]

def make_teams_permissions():
    rows = []
    pid = 1
    for team_name, dept in _TEAMS:
        # pick 4-8 members per team
        team_users = random.sample(MOCK_USERS, k=min(random.randint(4, 8), len(MOCK_USERS)))
        for i, u in enumerate(team_users):
            role = "Owner" if i == 0 else ("Member" if u["userType"] == "Member" else "Guest")
            perm = "Full Control" if role == "Owner" else (
                "Edit" if random.random() > 0.35 else "Read"
            )
            # guests always get limited perms
            if u["userType"] == "Guest":
                perm = random.choice(["Edit", "Read", "Read"])
            can_share = role == "Owner" or (perm == "Edit" and random.random() > 0.4)
            ch_access = "All Channels" if role == "Owner" else random.choice(_CHANNEL_ACCESS)
            added_days = random.randint(10, 730)
            adder = random.choice([x["userPrincipalName"] for x in MOCK_USERS if x["userType"] == "Member"])[:30]
            risk_level, risk_reason = _perm_risk(u["userType"], perm)
            rows.append({
                "id": f"tp-{pid:03d}",
                "teamName": team_name,
                "department": dept,
                "memberUPN": u["userPrincipalName"],
                "memberName": u["displayName"],
                "userType": u["userType"],
                "role": role,
                "permissionLevel": perm,
                "channelAccess": ch_access,
                "canShare": can_share,
                "addedDate": fmt(tw_past(days=added_days)),
                "addedBy": adder,
                "riskLevel": risk_level,
                "riskReason": risk_reason,
            })
            pid += 1
    return rows

def make_spo_permissions():
    rows = []
    pid = 1
    for site_name, site_url in _SPO_SITES:
        site_users = random.sample(MOCK_USERS, k=min(random.randint(5, 10), len(MOCK_USERS)))
        for i, u in enumerate(site_users):
            is_admin = i == 0
            perm = "Full Control" if is_admin else random.choice(_PERM_LEVELS_SPO)
            if u["userType"] == "Guest":
                perm = random.choice(["Read", "Read", "Limited Access", "Edit"])
            assign_type = "Direct" if is_admin else random.choice(_ASSIGN_TYPES)
            group_name = None
            if assign_type == "Group":
                group_name = f"{site_name} {random.choice(['Members','Visitors','Owners'])} Group"
            sharing_scope = "None"
            sharing_with = None
            sharing_link_type = None
            if not is_admin and random.random() > 0.55:
                sharing_scope = random.choice(_SHARING_SCOPES)
                if sharing_scope == "SpecificExternal":
                    sharing_with = f"partner{random.randint(1,20)}@external.com"
                    sharing_link_type = random.choice(["View", "Edit"])
                elif sharing_scope == "Anonymous":
                    sharing_link_type = random.choice(["View", "Edit"])
                elif sharing_scope == "OrganizationInternal":
                    sharing_link_type = "View"
            risk_level, risk_reason = _perm_risk(u["userType"], perm, sharing_scope if sharing_scope != "None" else None)
            rows.append({
                "id": f"sp-{pid:03d}",
                "siteName": site_name,
                "siteUrl": site_url,
                "memberUPN": u["userPrincipalName"],
                "memberName": u["displayName"],
                "userType": u["userType"],
                "permissionLevel": perm,
                "permissionType": assign_type,
                "groupName": group_name,
                "sharingScope": sharing_scope,
                "sharingWith": sharing_with,
                "sharingLinkType": sharing_link_type,
                "canShare": perm in ("Full Control", "Edit"),
                "addedDate": fmt(tw_past(days=random.randint(10, 730))),
                "riskLevel": risk_level,
                "riskReason": risk_reason,
            })
            pid += 1
    return rows

MOCK_TEAMS_PERMISSIONS = make_teams_permissions()
MOCK_SPO_PERMISSIONS = make_spo_permissions()
