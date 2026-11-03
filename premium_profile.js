const fs = require('fs');
const path = require('path');

const stylePath = path.join(__dirname, 'style.css');

const premiumProfileCSS = `
/* --- Premium Profile Overhaul --- */
.profile-section {
  background: var(--bg); /* Soft ivory background */
  padding-bottom: 100px;
}

.profile-layout {
  gap: 60px; /* More generous spacing */
}

/* Sidebar Redesign */
.profile-sidebar {
  background: transparent !important;
  border: none !important;
  box-shadow: none !important;
  padding: 0 !important;
  width: 300px;
}

.profile-user-info {
  background: white;
  padding: 40px 30px;
  border-radius: 12px;
  box-shadow: 0 20px 40px rgba(58, 53, 50, 0.04);
  flex-direction: column;
  text-align: center;
  border: none;
  margin-bottom: 40px;
  border-bottom: none !important;
}

.profile-user-info .avatar {
  width: 80px !important;
  height: 80px !important;
  font-size: 28px !important;
  font-weight: 300;
  background: var(--primary) !important;
  margin: 0 auto 20px;
  box-shadow: 0 10px 20px rgba(166, 124, 82, 0.2);
}

.profile-user-info .details h3 {
  font-size: 24px !important;
  font-weight: 400;
}

/* Sidebar Navigation */
.profile-nav {
  padding: 0 10px;
}
.profile-nav h4 {
  color: var(--ink-muted) !important;
  font-size: 10px !important;
  letter-spacing: 0.15em !important;
  margin-bottom: 20px !important;
  margin-top: 40px !important;
}
.profile-nav ul li a {
  font-family: var(--font-body);
  font-size: 15px !important;
  color: var(--ink-soft) !important;
  padding: 12px 16px;
  border-radius: 8px;
  margin-bottom: 4px;
  transition: all 0.3s ease !important;
}
.profile-nav ul li a:hover {
  background: rgba(166, 124, 82, 0.05);
  color: var(--primary) !important;
  transform: none !important;
  padding-left: 20px;
}
.profile-nav ul li a.active {
  background: white;
  color: var(--primary) !important;
  font-weight: 500 !important;
  box-shadow: 0 10px 20px rgba(58, 53, 50, 0.03);
  transform: none !important;
}

.logout-btn {
  margin-top: 30px !important;
  padding: 12px 16px;
  width: 100%;
  text-align: center;
  border: 1px solid rgba(231, 76, 60, 0.2);
  border-radius: 8px;
  text-decoration: none !important;
}
.logout-btn:hover {
  background: rgba(231, 76, 60, 0.05);
}

/* Content Area Redesign */
.profile-card {
  background: white !important;
  border: none !important;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(58, 53, 50, 0.05) !important;
  padding: 50px !important;
}

.profile-card h3 {
  font-size: 32px !important;
  margin-bottom: 40px !important;
  border-bottom: 1px solid rgba(58, 53, 50, 0.06) !important;
  padding-bottom: 20px !important;
}

/* Order Item Redesign */
.order-item {
  border: none !important;
  box-shadow: 0 10px 30px rgba(58, 53, 50, 0.03);
  border-radius: 12px !important;
  margin-bottom: 30px;
  background: var(--bg);
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}
.order-item:hover {
  transform: translateY(-4px);
  box-shadow: 0 15px 40px rgba(58, 53, 50, 0.06);
}

.order-header {
  background: transparent !important;
  border-bottom: 1px dashed rgba(58, 53, 50, 0.1) !important;
  padding: 24px 32px !important;
}
.order-id {
  font-size: 16px !important;
}
.order-date {
  font-family: var(--font-body);
}

.order-details {
  padding: 32px !important;
  background: white;
  border-radius: 0 0 12px 12px;
}
.order-details img {
  border-radius: 6px !important;
  box-shadow: 0 10px 20px rgba(0,0,0,0.05);
}

/* Mobile Overrides */
@media (max-width: 900px) {
  .profile-layout { gap: 30px; }
  .profile-card { padding: 30px 20px !important; }
  .profile-user-info { flex-direction: row; text-align: left; padding: 24px; margin-bottom: 10px; }
  .profile-user-info .avatar { margin: 0 20px 0 0; width: 60px !important; height: 60px !important; }
  .profile-nav { padding: 0; }
  .order-details { flex-direction: column; align-items: flex-start; }
}
`;

fs.appendFileSync(stylePath, premiumProfileCSS, 'utf8');
console.log("Premium profile CSS applied.");
