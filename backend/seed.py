"""Full seed: roles, users, categories, tags, articles, approvals, comments, ratings, bookmarks."""
import sys
import os
import random
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(__file__))

from app.database import SessionLocal, engine, Base
from app import models
from app.models.role import Role
from app.models.user import User
from app.models.category import Category
from app.models.tag import Tag
from app.models.article import Article, ArticleStatus
from app.models.approval import ApprovalWorkflow, ApprovalStatus
from app.models.comment import Comment
from app.models.rating import Rating
from app.models.bookmark import Bookmark
from app.models.search_log import SearchLog
from app.core.security import hash_password

Base.metadata.create_all(bind=engine)
db = SessionLocal()

def ago(days=0, hours=0):
    return datetime.now(timezone.utc) - timedelta(days=days, hours=hours)

# ── Roles ─────────────────────────────────────────────────────────────────────
def seed_roles():
    for r in [
        {"name": "Admin",    "description": "Full system access"},
        {"name": "Author",   "description": "Create and manage articles"},
        {"name": "Reviewer", "description": "Review and approve articles"},
        {"name": "Employee", "description": "Read and search articles"},
    ]:
        if not db.query(Role).filter(Role.name == r["name"]).first():
            db.add(Role(**r))
    db.commit()
    print("[OK] Roles seeded")

# ── Users ─────────────────────────────────────────────────────────────────────
def seed_users():
    users = [
        {"name": "System Administrator", "email": "admin@ekbms.com",    "password": "Admin@123",    "role": "Admin",    "department": "IT"},
        {"name": "Alice Author",          "email": "author@ekbms.com",   "password": "Author@123",   "role": "Author",   "department": "Content"},
        {"name": "Ryan Reviewer",         "email": "reviewer@ekbms.com", "password": "Review@123",   "role": "Reviewer", "department": "Quality"},
        {"name": "Emma Employee",         "email": "employee@ekbms.com", "password": "Employee@123", "role": "Employee", "department": "Operations"},
        {"name": "Bob Builder",           "email": "bob@ekbms.com",      "password": "Author@123",   "role": "Author",   "department": "Engineering"},
        {"name": "Sara Smith",            "email": "sara@ekbms.com",     "password": "Employee@123", "role": "Employee", "department": "HR"},
    ]
    for u in users:
        if db.query(User).filter(User.email == u["email"]).first():
            continue
        role = db.query(Role).filter(Role.name == u["role"]).first()
        db.add(User(name=u["name"], email=u["email"], password_hash=hash_password(u["password"]),
                    role_id=role.id, department=u["department"], is_active=True))
    db.commit()
    print("[OK] Users seeded")

# ── Categories ────────────────────────────────────────────────────────────────
def seed_categories():
    cats = [
        {"name": "HR Policies",       "color": "#6366f1", "description": "Company HR policies and procedures"},
        {"name": "IT Support",        "color": "#0ea5e9", "description": "Technical support guides and FAQs"},
        {"name": "Infrastructure",    "color": "#f59e0b", "description": "Server, network, and cloud resources"},
        {"name": "Training Materials","color": "#10b981", "description": "Learning resources and training guides"},
        {"name": "Finance",           "color": "#8b5cf6", "description": "Financial policies and guidelines"},
        {"name": "Operations",        "color": "#ef4444", "description": "Operational procedures and SOPs"},
        {"name": "Product Manuals",   "color": "#ec4899", "description": "Product documentation and user guides"},
        {"name": "Onboarding",        "color": "#14b8a6", "description": "New employee onboarding resources"},
    ]
    for c in cats:
        if not db.query(Category).filter(Category.name == c["name"]).first():
            db.add(Category(**c))
    db.commit()
    print("[OK] Categories seeded")

# ── Tags ──────────────────────────────────────────────────────────────────────
def seed_tags():
    for t in ["FAQ", "SOP", "Policy", "Guide", "Tutorial", "Troubleshooting",
              "Best Practices", "Security", "Compliance", "Onboarding", "Network", "Cloud"]:
        if not db.query(Tag).filter(Tag.name == t).first():
            db.add(Tag(name=t))
    db.commit()
    print("[OK] Tags seeded")

# ── Articles ──────────────────────────────────────────────────────────────────
ARTICLES = [
    # Published articles (visible to everyone)
    {
        "title": "Employee Onboarding Guide – Complete Checklist",
        "summary": "A step-by-step checklist for new employees joining the organisation, covering IT setup, HR paperwork, and first-week expectations.",
        "content": """<h2>Welcome to the Team!</h2>
<p>This guide walks new employees through everything they need to complete in their first two weeks. Follow each section in order and tick off tasks as you go.</p>
<h3>Day 1 – Arrival & IT Setup</h3>
<ul>
<li>Collect your access badge from Reception (Building A, Ground Floor)</li>
<li>Meet your line manager and team</li>
<li>Receive your laptop from IT (IT Support Desk, Level 2)</li>
<li>Set up corporate email and change your temporary password</li>
<li>Connect to the corporate VPN using the instructions in the <strong>IT Support</strong> knowledge base</li>
<li>Install required software from the Software Centre</li>
</ul>
<h3>Week 1 – HR & Compliance</h3>
<ul>
<li>Complete the mandatory Data Protection & GDPR e-learning module</li>
<li>Sign your employment contract and return to HR</li>
<li>Register your bank details in the payroll portal</li>
<li>Read and acknowledge the Code of Conduct policy</li>
<li>Complete the Health & Safety induction with your manager</li>
</ul>
<h3>Week 2 – Role-Specific Training</h3>
<ul>
<li>Shadow a senior team member for two days</li>
<li>Complete role-specific e-learning modules assigned by your manager</li>
<li>Attend the company-wide orientation webinar (every second Tuesday)</li>
<li>Set your 30/60/90-day goals with your manager</li>
</ul>
<h3>Useful Contacts</h3>
<ul>
<li><strong>IT Helpdesk:</strong> it-support@company.com | Ext. 1000</li>
<li><strong>HR Team:</strong> hr@company.com | Ext. 2000</li>
<li><strong>Facilities:</strong> facilities@company.com | Ext. 3000</li>
</ul>""",
        "category": "Onboarding", "tags": ["Guide", "Onboarding", "SOP"],
        "status": ArticleStatus.PUBLISHED, "view_count": 342, "author": "author@ekbms.com",
        "created_days_ago": 60,
    },
    {
        "title": "VPN Setup & Remote Access – Step-by-Step Guide",
        "summary": "How to install, configure, and troubleshoot the corporate VPN on Windows, Mac, and Linux.",
        "content": """<h2>Corporate VPN Setup</h2>
<p>All remote employees must use the corporate VPN to access internal systems. This guide covers installation on all supported operating systems.</p>
<h3>Prerequisites</h3>
<ul>
<li>Corporate laptop or an approved personal device</li>
<li>Your network username and password</li>
<li>Google Authenticator app installed on your mobile phone</li>
</ul>
<h3>Windows Installation</h3>
<ol>
<li>Download the GlobalProtect client from the IT portal: <strong>https://intranet/vpn</strong></li>
<li>Run the installer as Administrator</li>
<li>When prompted, enter the gateway address: <code>vpn.company.com</code></li>
<li>Log in with your network credentials</li>
<li>Approve the MFA push notification on your phone</li>
</ol>
<h3>macOS Installation</h3>
<ol>
<li>Download GlobalProtect from the IT portal</li>
<li>Open the <code>.pkg</code> file and follow the installer</li>
<li>Open System Preferences → Security & Privacy and allow the app</li>
<li>Enter gateway: <code>vpn.company.com</code> and your credentials</li>
</ol>
<h3>Common Troubleshooting</h3>
<h3>Cannot connect to VPN</h3>
<ul>
<li>Check your internet connection first</li>
<li>Verify the gateway address is exactly <code>vpn.company.com</code></li>
<li>Ensure your password has not expired (reset at: intranet/password-reset)</li>
<li>Disable any third-party firewall software temporarily</li>
</ul>
<h3>MFA not working</h3>
<ul>
<li>Ensure the time on your phone is synced correctly</li>
<li>Re-sync Google Authenticator if codes are rejected</li>
<li>Contact IT Helpdesk if you need to reset your MFA device</li>
</ul>""",
        "category": "IT Support", "tags": ["Guide", "Troubleshooting", "Security"],
        "status": ArticleStatus.PUBLISHED, "view_count": 289, "author": "bob@ekbms.com",
        "created_days_ago": 45,
    },
    {
        "title": "Annual Leave Policy – Rules, Entitlements & How to Apply",
        "summary": "Everything you need to know about annual leave entitlement, booking procedures, and carry-over rules.",
        "content": """<h2>Annual Leave Policy</h2>
<p>This policy sets out the annual leave entitlements for all permanent and fixed-term employees.</p>
<h3>Entitlement</h3>
<ul>
<li><strong>Years 0–2:</strong> 22 days per year</li>
<li><strong>Years 2–5:</strong> 25 days per year</li>
<li><strong>Years 5+:</strong> 28 days per year</li>
<li>Plus all public holidays (typically 8 days)</li>
</ul>
<p>Entitlement is calculated pro-rata for part-time employees based on contracted hours.</p>
<h3>How to Request Leave</h3>
<ol>
<li>Log in to the HR portal at <strong>hr.company.com</strong></li>
<li>Navigate to <em>My Leave → Request Annual Leave</em></li>
<li>Select start and end dates</li>
<li>Add a note for your manager if required</li>
<li>Submit — your manager will approve or decline within 3 working days</li>
</ol>
<h3>Carry-Over Rules</h3>
<ul>
<li>Up to <strong>5 days</strong> may be carried over to the next leave year</li>
<li>Carried-over days must be used by <strong>31 March</strong> of the following year</li>
<li>Any unused days beyond the carry-over allowance will be forfeited</li>
</ul>
<h3>Blackout Periods</h3>
<p>Leave requests during the following periods require Director approval:</p>
<ul>
<li>Last two weeks of December (holiday trading period)</li>
<li>Financial year-end (last week of March)</li>
<li>Any date declared a company-wide mandatory attendance day</li>
</ul>
<blockquote>For urgent leave not covered by this policy, speak directly to HR.</blockquote>""",
        "category": "HR Policies", "tags": ["Policy", "FAQ", "Compliance"],
        "status": ArticleStatus.PUBLISHED, "view_count": 415, "author": "author@ekbms.com",
        "created_days_ago": 90,
    },
    {
        "title": "Password Policy & Account Security Best Practices",
        "summary": "Requirements for creating strong passwords, when to change them, and how to protect your accounts.",
        "content": """<h2>Password Policy</h2>
<p>Strong passwords are your first line of defence. All employees must comply with this policy.</p>
<h3>Password Requirements</h3>
<ul>
<li>Minimum <strong>12 characters</strong></li>
<li>Must contain at least one uppercase letter, one lowercase letter, one number, and one special character</li>
<li>Must not contain your name, username, or company name</li>
<li>Must not reuse any of your last 12 passwords</li>
</ul>
<h3>Password Rotation</h3>
<ul>
<li>Corporate passwords must be changed every <strong>90 days</strong></li>
<li>You will receive an email reminder 14 days before expiry</li>
<li>Reset via the self-service portal: <code>intranet/password-reset</code></li>
</ul>
<h3>Multi-Factor Authentication (MFA)</h3>
<p>MFA is mandatory for all systems accessible outside the office network, including:</p>
<ul>
<li>Corporate email (Outlook)</li>
<li>VPN</li>
<li>Cloud file storage (SharePoint / OneDrive)</li>
<li>HR portal</li>
</ul>
<h3>What NOT to Do</h3>
<ul>
<li>Never share your password with anyone, including IT staff</li>
<li>Never write your password on paper or store it in an unencrypted file</li>
<li>Never use the same password for corporate and personal accounts</li>
<li>Never auto-save corporate passwords in personal browsers</li>
</ul>
<h3>Recommended: Use a Password Manager</h3>
<p>The company provides licences for <strong>1Password Teams</strong>. Request access from IT to get started.</p>""",
        "category": "IT Support", "tags": ["Security", "Policy", "Best Practices"],
        "status": ArticleStatus.PUBLISHED, "view_count": 198, "author": "bob@ekbms.com",
        "created_days_ago": 30,
    },
    {
        "title": "Expense Claims – How to Submit & What's Reimbursable",
        "summary": "Step-by-step guide to submitting business expense claims, reimbursable expense categories, and approval timelines.",
        "content": """<h2>Expense Claims Policy</h2>
<p>Employees may claim reimbursement for reasonable out-of-pocket expenses incurred on company business.</p>
<h3>How to Submit a Claim</h3>
<ol>
<li>Log in to the Finance portal at <strong>finance.company.com</strong></li>
<li>Click <em>New Expense Claim</em></li>
<li>Upload receipts (PDF or image) for all items over £10</li>
<li>Categorise each expense from the approved list</li>
<li>Submit for manager approval</li>
<li>Approved claims are paid in the following month's payroll</li>
</ol>
<h3>Reimbursable Categories</h3>
<ul>
<li><strong>Travel:</strong> Rail, flights (economy only), taxis for business trips</li>
<li><strong>Accommodation:</strong> Up to £150/night (London), £100/night (elsewhere)</li>
<li><strong>Meals:</strong> Up to £30/day when travelling overnight</li>
<li><strong>Client entertainment:</strong> Up to £50/person with prior approval</li>
<li><strong>Home office:</strong> Up to £25/month for broadband contribution (remote workers)</li>
</ul>
<h3>Non-Reimbursable Items</h3>
<ul>
<li>Alcoholic beverages (unless part of an approved client dinner)</li>
<li>Personal clothing or equipment</li>
<li>Fines and penalties</li>
<li>First-class travel upgrades without Director approval</li>
<li>Expenses older than 90 days</li>
</ul>
<h3>Approval Timeline</h3>
<ul>
<li>Manager review: within 5 working days</li>
<li>Finance processing: within 10 working days of manager approval</li>
<li>Payment: next payroll cycle</li>
</ul>""",
        "category": "Finance", "tags": ["Policy", "SOP", "Compliance"],
        "status": ArticleStatus.PUBLISHED, "view_count": 167, "author": "author@ekbms.com",
        "created_days_ago": 55,
    },
    {
        "title": "Microsoft Teams – Tips, Shortcuts & Best Practices",
        "summary": "Get the most out of Microsoft Teams with keyboard shortcuts, channel organisation tips, and meeting etiquette guidelines.",
        "content": """<h2>Getting the Most from Microsoft Teams</h2>
<p>Microsoft Teams is our primary communication and collaboration platform. This guide shares tips to help you work more efficiently.</p>
<h3>Essential Keyboard Shortcuts</h3>
<ul>
<li><code>Ctrl + E</code> – Jump to search</li>
<li><code>Ctrl + /</code> – See all keyboard shortcuts</li>
<li><code>Ctrl + Shift + M</code> – Toggle mute in a meeting</li>
<li><code>Ctrl + Shift + O</code> – Toggle camera in a meeting</li>
<li><code>Ctrl + N</code> – New chat</li>
<li><code>Alt + Up/Down</code> – Navigate between chats and channels</li>
</ul>
<h3>Channel Organisation Best Practices</h3>
<ul>
<li>Use <strong>General</strong> only for team-wide announcements</li>
<li>Create topic-specific channels for ongoing projects (e.g. <em>project-alpha</em>)</li>
<li>Pin important channels to the top of your sidebar</li>
<li>Use @mentions sparingly — only when a response is genuinely needed</li>
<li>Archive channels for completed projects instead of deleting them</li>
</ul>
<h3>Meeting Etiquette</h3>
<ul>
<li>Join 1–2 minutes early</li>
<li>Mute your microphone when not speaking</li>
<li>Turn on your camera for meetings with fewer than 10 participants</li>
<li>Use the <em>Raise Hand</em> feature to signal you want to speak</li>
<li>Always share an agenda at least 24 hours before the meeting</li>
</ul>
<h3>Useful Integrations</h3>
<ul>
<li><strong>Planner:</strong> Track tasks without leaving Teams</li>
<li><strong>Wiki:</strong> Store team documentation in the Wiki tab</li>
<li><strong>OneNote:</strong> Collaborative meeting notes</li>
<li><strong>Approvals app:</strong> Manage leave and purchase approvals in-channel</li>
</ul>""",
        "category": "Training Materials", "tags": ["Guide", "Best Practices", "Tutorial"],
        "status": ArticleStatus.PUBLISHED, "view_count": 253, "author": "bob@ekbms.com",
        "created_days_ago": 20,
    },
    {
        "title": "Server Maintenance Runbook – Monthly Checklist",
        "summary": "Monthly maintenance tasks for production and staging servers including patching, backups, and health checks.",
        "content": """<h2>Monthly Server Maintenance Runbook</h2>
<p>This runbook must be followed by the infrastructure team on the first Saturday of each month during the maintenance window (02:00–06:00 UTC).</p>
<h3>Pre-Maintenance Checklist</h3>
<ul>
<li>Notify all stakeholders 48 hours in advance via the <em>#infrastructure</em> Teams channel</li>
<li>Confirm a rollback plan is in place for each server</li>
<li>Verify all backups completed successfully within the last 24 hours</li>
<li>Confirm on-call engineer is available for the maintenance window</li>
</ul>
<h3>Step 1: Backup Verification</h3>
<ol>
<li>Log into the backup portal at <code>backup.company.internal</code></li>
<li>Confirm all servers show a green status for the last successful backup</li>
<li>Run a test restore of the most recent database backup to the DR environment</li>
<li>Document backup sizes and timestamps in the maintenance log</li>
</ol>
<h3>Step 2: OS Patching</h3>
<ol>
<li>Connect via SSH to each server in the maintenance group</li>
<li>Run <code>sudo apt update && sudo apt upgrade -y</code> (Ubuntu) or equivalent</li>
<li>Review patch notes for any breaking changes before applying</li>
<li>Reboot servers one at a time, confirming services restart correctly</li>
</ol>
<h3>Step 3: Health Checks</h3>
<ul>
<li>Verify CPU, memory, and disk utilisation are within normal ranges</li>
<li>Check application logs for errors introduced by patching</li>
<li>Run smoke tests against key API endpoints</li>
<li>Confirm monitoring alerts are active in Grafana</li>
</ul>
<h3>Post-Maintenance</h3>
<ul>
<li>Update the maintenance log with completion time and any issues</li>
<li>Send a completion notice to the #infrastructure channel</li>
<li>Review and close any related tickets in the helpdesk system</li>
</ul>""",
        "category": "Infrastructure", "tags": ["SOP", "Best Practices", "Guide"],
        "status": ArticleStatus.PUBLISHED, "view_count": 124, "author": "bob@ekbms.com",
        "created_days_ago": 15,
    },
    {
        "title": "Code of Conduct – Workplace Behaviour Standards",
        "summary": "Our standards for professional behaviour, anti-harassment commitments, and the process for raising concerns.",
        "content": """<h2>Code of Conduct</h2>
<p>We are committed to providing a respectful, inclusive, and professional working environment for all employees, contractors, and visitors.</p>
<h3>Core Principles</h3>
<ul>
<li><strong>Respect:</strong> Treat all colleagues with dignity regardless of their background, role, or opinion</li>
<li><strong>Integrity:</strong> Be honest and transparent in all professional dealings</li>
<li><strong>Accountability:</strong> Take responsibility for your actions and their impact</li>
<li><strong>Inclusion:</strong> Actively support a diverse and welcoming workplace</li>
</ul>
<h3>Prohibited Behaviour</h3>
<p>The following behaviours will not be tolerated and may result in disciplinary action up to and including dismissal:</p>
<ul>
<li>Harassment, bullying, or intimidation of any kind</li>
<li>Discrimination based on race, gender, age, disability, religion, sexual orientation, or any other protected characteristic</li>
<li>Falsification of company records or expenses</li>
<li>Misuse of company property or confidential information</li>
<li>Violence or threats of violence</li>
</ul>
<h3>How to Raise a Concern</h3>
<ol>
<li><strong>Informal route:</strong> Speak to your manager or HR Business Partner</li>
<li><strong>Formal route:</strong> Submit a written complaint via hr@company.com</li>
<li><strong>Anonymous route:</strong> Use the confidential Ethics Hotline: <code>0800 XXX XXXX</code></li>
</ol>
<p>All reports will be investigated promptly and confidentially. Retaliation against anyone who raises a concern in good faith is a serious disciplinary offence.</p>
<blockquote>A copy of the full Disciplinary & Grievance Procedure is available from HR on request.</blockquote>""",
        "category": "HR Policies", "tags": ["Policy", "Compliance"],
        "status": ArticleStatus.PUBLISHED, "view_count": 302, "author": "author@ekbms.com",
        "created_days_ago": 120,
    },

    # Pending approval
    {
        "title": "Cloud Infrastructure Cost Optimisation Guide",
        "summary": "Practical strategies to reduce AWS and Azure spend including right-sizing, reserved instances, and tagging policies.",
        "content": """<h2>Cloud Cost Optimisation</h2>
<p>This guide outlines proven strategies to reduce cloud infrastructure costs without compromising performance or reliability.</p>
<h3>1. Right-Sizing Compute Resources</h3>
<p>Regularly review CPU and memory utilisation metrics to identify over-provisioned instances. Use AWS Compute Optimizer or Azure Advisor recommendations as a starting point.</p>
<ul>
<li>Target average CPU utilisation of 40–70% for web tier instances</li>
<li>Downsize instances where 7-day peak CPU stays below 20%</li>
<li>Use auto-scaling groups instead of fixed over-provisioned fleets</li>
</ul>
<h3>2. Reserved Instances & Savings Plans</h3>
<p>Commit to 1-year reserved instances for stable baseline workloads to save 30–40% over on-demand pricing.</p>
<h3>3. Storage Optimisation</h3>
<ul>
<li>Move infrequently accessed S3 objects to Glacier after 90 days</li>
<li>Delete unattached EBS volumes and obsolete snapshots monthly</li>
<li>Enable intelligent tiering for unpredictable access patterns</li>
</ul>
<h3>4. Tagging Policy</h3>
<p>All resources must be tagged with: <code>project</code>, <code>environment</code>, <code>owner</code>, and <code>cost-centre</code>. Untagged resources will be flagged for review weekly.</p>""",
        "category": "Infrastructure", "tags": ["Guide", "Best Practices", "Cloud"],
        "status": ArticleStatus.PENDING_APPROVAL, "view_count": 0, "author": "bob@ekbms.com",
        "created_days_ago": 3,
    },
    {
        "title": "Performance Review Process – Manager Guide",
        "summary": "How to conduct fair, effective performance reviews including setting objectives, giving feedback, and rating calibration.",
        "content": """<h2>Performance Review Guide for Managers</h2>
<p>Annual performance reviews are conducted in December. This guide helps managers run effective, fair, and legally compliant review conversations.</p>
<h3>Timeline</h3>
<ul>
<li><strong>November 1:</strong> Self-assessment forms open in the HR portal</li>
<li><strong>November 15:</strong> Self-assessments due from employees</li>
<li><strong>November 20:</strong> Manager assessments due</li>
<li><strong>December 1–15:</strong> 1:1 review meetings</li>
<li><strong>December 20:</strong> Final ratings submitted to HR</li>
</ul>
<h3>The Rating Scale</h3>
<ul>
<li><strong>5 – Exceptional:</strong> Consistently exceeds all objectives; role model</li>
<li><strong>4 – Exceeds Expectations:</strong> Regularly delivers beyond expectations</li>
<li><strong>3 – Meets Expectations:</strong> Delivers what is expected; solid performer</li>
<li><strong>2 – Needs Improvement:</strong> Partially meets expectations; development plan required</li>
<li><strong>1 – Unsatisfactory:</strong> Fails to meet minimum requirements; formal process</li>
</ul>
<h3>Tips for Effective Feedback</h3>
<ul>
<li>Use the <strong>SBI model</strong>: Situation → Behaviour → Impact</li>
<li>Be specific — avoid vague statements like "good attitude"</li>
<li>Balance positive feedback with developmental areas (aim for 3:1 ratio)</li>
<li>Focus on observable behaviours, not personality</li>
</ul>""",
        "category": "HR Policies", "tags": ["SOP", "Guide", "Policy"],
        "status": ArticleStatus.PENDING_APPROVAL, "view_count": 0, "author": "author@ekbms.com",
        "created_days_ago": 1,
    },

    # Approved (not yet published)
    {
        "title": "Incident Response Playbook – Security Breach",
        "summary": "Step-by-step response procedure for suspected or confirmed security incidents including escalation paths.",
        "content": """<h2>Security Incident Response Playbook</h2>
<p>This playbook defines the response procedure for security incidents. All incidents must be treated as real until proven otherwise.</p>
<h3>Incident Severity Levels</h3>
<ul>
<li><strong>P1 – Critical:</strong> Active breach, data exfiltration, or ransomware. Response time: immediate.</li>
<li><strong>P2 – High:</strong> Suspected breach, compromised credentials, or malware detected. Response time: 1 hour.</li>
<li><strong>P3 – Medium:</strong> Phishing attempt, policy violation, unusual access pattern. Response time: 4 hours.</li>
<li><strong>P4 – Low:</strong> Failed login attempts, minor anomalies. Response time: next business day.</li>
</ul>
<h3>Immediate Response Steps (P1/P2)</h3>
<ol>
<li>Alert the Security Team immediately: security@company.com or call 999 (internal emergency line)</li>
<li>Do NOT power off affected systems without Security Team approval</li>
<li>Isolate affected systems from the network if instructed</li>
<li>Preserve evidence: take screenshots, note timestamps</li>
<li>Do NOT notify external parties until approved by Legal and Leadership</li>
</ol>
<h3>Communication Tree</h3>
<ul>
<li>Security Team → CISO → CTO → CEO (for P1)</li>
<li>Legal must be looped in for any potential data breach</li>
<li>GDPR breach notification to ICO required within 72 hours if personal data is affected</li>
</ul>""",
        "category": "IT Support", "tags": ["Security", "SOP", "Policy"],
        "status": ArticleStatus.APPROVED, "view_count": 0, "author": "bob@ekbms.com",
        "created_days_ago": 7,
    },

    # Rejected
    {
        "title": "Social Media Policy Draft v0.1",
        "summary": "Draft guidelines for employee use of social media platforms in a professional context.",
        "content": """<h2>Social Media Usage Guidelines</h2>
<p>This draft policy covers the use of personal social media accounts by employees when discussing work-related topics.</p>
<h3>General Guidelines</h3>
<ul>
<li>Do not share confidential company information</li>
<li>Do not make statements that could be construed as official company positions</li>
<li>Be respectful of colleagues, clients, and competitors</li>
</ul>
<p>More sections to be added — currently incomplete.</p>""",
        "category": "HR Policies", "tags": ["Policy"],
        "status": ArticleStatus.REJECTED, "view_count": 0, "author": "author@ekbms.com",
        "created_days_ago": 10,
    },

    # Draft
    {
        "title": "Kubernetes Deployment Guide – Internal Clusters",
        "summary": "How to deploy, manage, and troubleshoot workloads on our internal Kubernetes clusters.",
        "content": """<h2>Kubernetes Deployment Guide</h2>
<p>This document is a work in progress. It will cover deployment pipelines, namespace conventions, resource quotas, and monitoring.</p>
<h3>Cluster Overview</h3>
<ul>
<li><strong>prod-cluster:</strong> Production workloads only</li>
<li><strong>staging-cluster:</strong> Pre-production testing</li>
<li><strong>dev-cluster:</strong> Developer sandboxes</li>
</ul>
<p><em>Additional sections being authored...</em></p>""",
        "category": "Infrastructure", "tags": ["Guide", "Cloud", "SOP"],
        "status": ArticleStatus.DRAFT, "view_count": 0, "author": "bob@ekbms.com",
        "created_days_ago": 2,
    },

    # Archived
    {
        "title": "Legacy VPN Client Setup (Deprecated – Use GlobalProtect)",
        "summary": "Setup guide for the old Cisco AnyConnect VPN client. Deprecated as of Q1 2024.",
        "content": """<h2>DEPRECATED</h2>
<blockquote>This article is archived. The Cisco AnyConnect client is no longer supported. Please refer to the <strong>VPN Setup & Remote Access</strong> article for the current GlobalProtect setup guide.</blockquote>
<h2>Legacy Cisco AnyConnect Setup</h2>
<p>This guide covers the now-retired Cisco AnyConnect VPN client that was used until Q1 2024.</p>""",
        "category": "IT Support", "tags": ["Guide", "Troubleshooting"],
        "status": ArticleStatus.ARCHIVED, "view_count": 45, "author": "bob@ekbms.com",
        "created_days_ago": 400,
    },
]

def seed_articles():
    author    = db.query(User).filter(User.email == "author@ekbms.com").first()
    bob       = db.query(User).filter(User.email == "bob@ekbms.com").first()
    reviewer  = db.query(User).filter(User.email == "reviewer@ekbms.com").first()
    admin     = db.query(User).filter(User.email == "admin@ekbms.com").first()

    user_map = {"author@ekbms.com": author, "bob@ekbms.com": bob,
                "reviewer@ekbms.com": reviewer, "admin@ekbms.com": admin}

    created = 0
    for a in ARTICLES:
        if db.query(Article).filter(Article.title == a["title"]).first():
            continue

        cat  = db.query(Category).filter(Category.name == a["category"]).first()
        tags = db.query(Tag).filter(Tag.name.in_(a["tags"])).all()
        art_author = user_map[a["author"]]
        created_at = ago(days=a["created_days_ago"])
        published_at = created_at if a["status"] == ArticleStatus.PUBLISHED else None

        article = Article(
            title=a["title"],
            summary=a["summary"],
            content=a["content"],
            category_id=cat.id if cat else None,
            author_id=art_author.id,
            status=a["status"],
            view_count=a["view_count"],
            tags=tags,
            created_at=created_at,
            updated_at=created_at,
            published_at=published_at,
        )
        db.add(article)
        db.flush()

        # Approval workflows
        if a["status"] in (ArticleStatus.PENDING_APPROVAL,):
            db.add(ApprovalWorkflow(article_id=article.id, status=ApprovalStatus.PENDING,
                                    submitted_at=ago(days=a["created_days_ago"] - 1)))

        if a["status"] == ArticleStatus.APPROVED:
            db.add(ApprovalWorkflow(article_id=article.id, status=ApprovalStatus.APPROVED,
                                    reviewer_id=reviewer.id,
                                    reviewer_comments="Well written and accurate. Approved.",
                                    submitted_at=ago(days=a["created_days_ago"] + 2),
                                    reviewed_at=ago(days=a["created_days_ago"])))

        if a["status"] == ArticleStatus.REJECTED:
            db.add(ApprovalWorkflow(article_id=article.id, status=ApprovalStatus.REJECTED,
                                    reviewer_id=reviewer.id,
                                    reviewer_comments="Incomplete content. Please expand all sections before resubmitting.",
                                    submitted_at=ago(days=a["created_days_ago"] + 1),
                                    reviewed_at=ago(days=a["created_days_ago"])))

        if a["status"] == ArticleStatus.PUBLISHED:
            db.add(ApprovalWorkflow(article_id=article.id, status=ApprovalStatus.APPROVED,
                                    reviewer_id=reviewer.id,
                                    reviewer_comments="Approved and ready for publication.",
                                    submitted_at=ago(days=a["created_days_ago"] + 3),
                                    reviewed_at=ago(days=a["created_days_ago"] + 2)))

        created += 1

    db.commit()
    print(f"[OK] {created} articles seeded")

# ── Comments ──────────────────────────────────────────────────────────────────
COMMENTS = {
    "Employee Onboarding Guide – Complete Checklist": [
        ("employee@ekbms.com", "Really helpful guide! I used this on my first day and it made everything so much easier.", ago(55)),
        ("sara@ekbms.com",     "The IT setup section saved me a lot of time. Would be great to add a section on setting up Slack too.", ago(50)),
        ("author@ekbms.com",   "Good suggestion Sara, I'll add that in the next revision.", ago(49)),
        ("bob@ekbms.com",      "Bookmarked this for our next new starter. Essential reading.", ago(40)),
    ],
    "VPN Setup & Remote Access – Step-by-Step Guide": [
        ("employee@ekbms.com", "Worked perfectly on Windows 11. Thanks!", ago(40)),
        ("sara@ekbms.com",     "The Mac instructions worked but I had to restart my Mac after installation — worth adding as a step.", ago(35)),
        ("bob@ekbms.com",      "Good catch Sara, updated the macOS section.", ago(34)),
    ],
    "Annual Leave Policy – Rules, Entitlements & How to Apply": [
        ("employee@ekbms.com", "Clear and easy to understand. Can you confirm if half-days count as 0.5 days?", ago(80)),
        ("author@ekbms.com",   "Yes, half-days are counted as 0.5 against your entitlement. I'll add a note to the policy.", ago(79)),
        ("sara@ekbms.com",     "Very clear policy. Much better than the old PDF version!", ago(70)),
    ],
    "Password Policy & Account Security Best Practices": [
        ("employee@ekbms.com", "Should we also use a password manager for personal accounts?", ago(25)),
        ("bob@ekbms.com",      "Strongly recommended! 1Password works great for both personal and work.", ago(24)),
    ],
    "Microsoft Teams – Tips, Shortcuts & Best Practices": [
        ("sara@ekbms.com",     "The Ctrl+E shortcut is a game changer! Never knew about it.", ago(18)),
        ("employee@ekbms.com", "Great tips. The meeting etiquette section should be shared with the whole company.", ago(17)),
        ("author@ekbms.com",   "Agreed — I've pinned this to the General channel.", ago(16)),
    ],
    "Code of Conduct – Workplace Behaviour Standards": [
        ("employee@ekbms.com", "Thank you for the clear escalation process. It makes it much less daunting to raise concerns.", ago(100)),
        ("sara@ekbms.com",     "The anonymous Ethics Hotline is a great addition. Was this always there?", ago(90)),
        ("author@ekbms.com",   "It was introduced last year following the employee survey. Glad it's visible here.", ago(89)),
    ],
}

def seed_comments():
    user_map = {u.email: u for u in db.query(User).all()}
    count = 0
    for title, comments in COMMENTS.items():
        article = db.query(Article).filter(Article.title == title).first()
        if not article:
            continue
        for email, text, created_at in comments:
            user = user_map.get(email)
            if not user:
                continue
            exists = db.query(Comment).filter(
                Comment.article_id == article.id,
                Comment.user_id == user.id,
                Comment.content == text,
            ).first()
            if not exists:
                db.add(Comment(article_id=article.id, user_id=user.id,
                               content=text, created_at=created_at, updated_at=created_at))
                count += 1
    db.commit()
    print(f"[OK] {count} comments seeded")

# ── Ratings ───────────────────────────────────────────────────────────────────
RATINGS = {
    "Employee Onboarding Guide – Complete Checklist":       [("employee@ekbms.com", 5), ("sara@ekbms.com", 5), ("bob@ekbms.com", 4)],
    "VPN Setup & Remote Access – Step-by-Step Guide":       [("employee@ekbms.com", 4), ("sara@ekbms.com", 4), ("author@ekbms.com", 5)],
    "Annual Leave Policy – Rules, Entitlements & How to Apply": [("employee@ekbms.com", 5), ("bob@ekbms.com", 4), ("sara@ekbms.com", 5)],
    "Password Policy & Account Security Best Practices":    [("employee@ekbms.com", 4), ("sara@ekbms.com", 4)],
    "Expense Claims – How to Submit & What's Reimbursable": [("employee@ekbms.com", 4), ("sara@ekbms.com", 3), ("bob@ekbms.com", 4)],
    "Microsoft Teams – Tips, Shortcuts & Best Practices":   [("sara@ekbms.com", 5), ("employee@ekbms.com", 5), ("bob@ekbms.com", 4)],
    "Server Maintenance Runbook – Monthly Checklist":       [("author@ekbms.com", 4), ("employee@ekbms.com", 4)],
    "Code of Conduct – Workplace Behaviour Standards":      [("employee@ekbms.com", 5), ("sara@ekbms.com", 5), ("bob@ekbms.com", 4)],
}

def seed_ratings():
    user_map = {u.email: u for u in db.query(User).all()}
    count = 0
    for title, ratings in RATINGS.items():
        article = db.query(Article).filter(Article.title == title).first()
        if not article:
            continue
        for email, score in ratings:
            user = user_map.get(email)
            if not user:
                continue
            exists = db.query(Rating).filter(Rating.article_id == article.id, Rating.user_id == user.id).first()
            if not exists:
                db.add(Rating(article_id=article.id, user_id=user.id, score=score))
                count += 1
    db.commit()
    print(f"[OK] {count} ratings seeded")

# ── Bookmarks ──────────────────────────────────────────────────────────────────
BOOKMARKS = {
    "employee@ekbms.com": ["Employee Onboarding Guide – Complete Checklist", "Annual Leave Policy – Rules, Entitlements & How to Apply", "VPN Setup & Remote Access – Step-by-Step Guide"],
    "sara@ekbms.com":     ["Annual Leave Policy – Rules, Entitlements & How to Apply", "Code of Conduct – Workplace Behaviour Standards"],
    "bob@ekbms.com":      ["Server Maintenance Runbook – Monthly Checklist", "Password Policy & Account Security Best Practices"],
}

def seed_bookmarks():
    user_map = {u.email: u for u in db.query(User).all()}
    count = 0
    for email, titles in BOOKMARKS.items():
        user = user_map.get(email)
        if not user:
            continue
        for title in titles:
            article = db.query(Article).filter(Article.title == title).first()
            if not article:
                continue
            exists = db.query(Bookmark).filter(Bookmark.user_id == user.id, Bookmark.article_id == article.id).first()
            if not exists:
                db.add(Bookmark(user_id=user.id, article_id=article.id))
                count += 1
    db.commit()
    print(f"[OK] {count} bookmarks seeded")

# ── Search logs (for analytics) ───────────────────────────────────────────────
def seed_search_logs():
    if db.query(SearchLog).count() > 0:
        print("  Search logs already exist")
        return
    users = db.query(User).all()
    queries = [
        ("VPN setup", 3), ("leave policy", 5), ("password reset", 8),
        ("onboarding", 4), ("expense claim", 6), ("Teams shortcuts", 3),
        ("server maintenance", 2), ("security incident", 2), ("code of conduct", 4),
        ("payroll portal", 7), ("remote work", 5), ("cloud costs", 2),
    ]
    for query, count in queries:
        for _ in range(count):
            user = random.choice(users)
            db.add(SearchLog(user_id=user.id, query=query, results_count=random.randint(1, 10),
                             created_at=ago(days=random.randint(0, 30))))
    db.commit()
    print("[OK] Search logs seeded")


if __name__ == "__main__":
    seed_roles()
    seed_users()
    seed_categories()
    seed_tags()
    seed_articles()
    seed_comments()
    seed_ratings()
    seed_bookmarks()
    seed_search_logs()
    db.close()
    print("\n[DONE] Database fully seeded!")
