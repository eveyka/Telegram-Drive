export function renderAdminDashboardHtml(appName: string): string {
  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover">
  <title>${appName} - Admin Licensing Control Panel</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;600;700&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Plus Jakarta Sans', sans-serif;
      background-color: #080d1a;
      color: #f1f5f9;
      padding-bottom: env(safe-area-inset-bottom);
      -webkit-tap-highlight-color: transparent;
    }
    .mono { font-family: 'JetBrains Mono', monospace; }
    .glass {
      background: rgba(13, 19, 33, 0.88);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .glass-card {
      background: linear-gradient(145deg, rgba(22, 32, 53, 0.7) 0%, rgba(11, 17, 30, 0.9) 100%);
      border: 1px solid rgba(255, 255, 255, 0.08);
    }
    .glow-cyan {
      box-shadow: 0 0 25px -5px rgba(6, 182, 212, 0.25);
    }
    .glow-purple {
      box-shadow: 0 0 25px -5px rgba(168, 85, 247, 0.25);
    }
    .glow-blue {
      box-shadow: 0 0 25px -5px rgba(59, 130, 246, 0.25);
    }
    ::-webkit-scrollbar { width: 4px; height: 4px; }
    ::-webkit-scrollbar-track { background: #080d1a; }
    ::-webkit-scrollbar-thumb { background: #334155; border-radius: 9999px; }
    .scrollbar-none::-webkit-scrollbar { display: none; }
    .scrollbar-none { -ms-overflow-style: none; scrollbar-width: none; }

    /* ── Mobile Phone Responsive Card Transformation ── */
    @media (max-width: 640px) {
      .mobile-card-table thead {
        display: none !important;
      }
      .mobile-card-table,
      .mobile-card-table tbody,
      .mobile-card-table tr,
      .mobile-card-table td {
        display: block !important;
        width: 100% !important;
      }
      .mobile-card-table tr {
        background: rgba(15, 23, 42, 0.92) !important;
        border: 1px solid rgba(255, 255, 255, 0.1) !important;
        border-radius: 0.875rem !important;
        padding: 0.75rem !important;
        margin-bottom: 0.625rem !important;
        box-shadow: 0 4px 14px -2px rgba(0, 0, 0, 0.5) !important;
      }
      .mobile-card-table td {
        padding: 0.25rem 0 !important;
        border: none !important;
      }
      .mobile-card-table td.card-header-cell {
        padding-bottom: 0.5rem !important;
        margin-bottom: 0.35rem !important;
        border-bottom: 1px solid rgba(255, 255, 255, 0.08) !important;
      }
      .mobile-card-table td.card-actions-cell {
        padding-top: 0.5rem !important;
        margin-top: 0.5rem !important;
        border-top: 1px dashed rgba(255, 255, 255, 0.12) !important;
        display: flex !important;
        justify-content: flex-end !important;
        align-items: center !important;
        flex-wrap: wrap !important;
        gap: 0.35rem !important;
      }
    }
  </style>
</head>
<body class="min-h-screen flex flex-col antialiased selection:bg-cyan-500 selection:text-black">
  
  <!-- Top Navigation Header (Compact & Mobile-Optimized) -->
  <header class="glass sticky top-0 z-40 border-b border-slate-800/90 px-3 sm:px-6 py-2.5 flex items-center justify-between">
    <div class="flex items-center gap-2">
      <div class="h-8 w-8 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-xs shadow-md shadow-cyan-500/25 shrink-0">
        TG
      </div>
      <div>
        <div class="flex items-center gap-1.5 flex-wrap">
          <h1 class="text-xs sm:text-sm font-bold tracking-tight text-white leading-tight">
            ${appName}
          </h1>
          <span class="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
            Admin
          </span>
          <span class="inline-flex items-center gap-1 text-[9px] text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full font-semibold border border-emerald-500/20">
            <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span> Live
          </span>
        </div>
      </div>
    </div>
    
    <div id="authHeaderSection" class="flex items-center gap-1.5">
      <button onclick="showDashboard()" title="Refresh Dashboard" class="p-1.5 sm:px-2.5 sm:py-1 rounded-lg border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1">
        <span>🔄</span>
        <span class="hidden sm:inline">Sync</span>
      </button>
      <button id="logoutBtn" onclick="logout()" class="hidden text-xs font-semibold px-2.5 py-1 rounded-lg border border-rose-500/30 hover:bg-rose-500/10 text-rose-300 transition-colors flex items-center gap-1">
        <span>🚪</span>
        <span class="hidden xs:inline">Logout</span>
      </button>
    </div>
  </header>

  <!-- Login Overlay -->
  <div id="loginView" class="flex-1 flex items-center justify-center p-4">
    <div class="glass-card w-full max-w-sm p-6 rounded-2xl glow-cyan space-y-4">
      <div class="text-center space-y-1.5">
        <div class="h-10 w-10 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 mx-auto flex items-center justify-center text-lg font-bold">
          🔒
        </div>
        <h2 class="text-base font-bold text-white">Admin Authentication</h2>
        <p class="text-[11px] text-slate-400">Enter master admin secret to unlock system controls</p>
      </div>

      <form id="loginForm" onsubmit="handleLogin(event)" class="space-y-3">
        <div>
          <label class="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Master Admin Secret</label>
          <input type="password" id="adminSecretInput" required placeholder="••••••••••••••••" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-cyan-500 transition-colors font-mono">
        </div>
        <button type="submit" class="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold text-xs hover:from-cyan-400 hover:to-blue-500 transition-all shadow-md shadow-cyan-500/25 active:scale-[0.98] flex items-center justify-center gap-1.5">
          <span>⚡</span> Unlock Admin Portal
        </button>
        <p id="loginError" class="text-xs text-rose-400 text-center hidden"></p>
      </form>
    </div>
  </div>

  <!-- Main Dashboard View -->
  <main id="dashboardView" class="hidden flex-1 max-w-7xl w-full mx-auto p-2.5 sm:p-5 space-y-3">
    
    <!-- ── Compact KPI Metric Micro-Grid (Organized for Phone & Desktop) ── -->
    <div class="grid grid-cols-3 sm:grid-cols-6 gap-1.5 sm:gap-2.5">
      <!-- 1. Total Pro -->
      <div class="glass-card p-2 sm:p-3 rounded-xl border border-violet-500/20 flex flex-col justify-between">
        <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span class="truncate">Total Pro</span>
          <span class="text-xs">💎</span>
        </div>
        <div class="mt-1 flex items-baseline gap-1">
          <span id="statTotalProUsers" class="text-sm sm:text-lg font-black text-white mono">0</span>
          <span class="text-[9px] text-violet-400 font-bold hidden sm:inline">Users</span>
        </div>
      </div>

      <!-- 2. Active Pro -->
      <div class="glass-card p-2 sm:p-3 rounded-xl border border-emerald-500/20 flex flex-col justify-between">
        <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span class="truncate">Active</span>
          <span class="text-xs">🟢</span>
        </div>
        <div class="mt-1 flex items-baseline gap-1">
          <span id="statActiveProUsers" class="text-sm sm:text-lg font-black text-emerald-400 mono">0</span>
          <span class="text-[9px] text-emerald-400 font-bold hidden sm:inline">Live</span>
        </div>
      </div>

      <!-- 3. Monthly -->
      <div class="glass-card p-2 sm:p-3 rounded-xl border border-purple-500/20 flex flex-col justify-between">
        <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span class="truncate">Monthly</span>
          <span class="text-xs">📅</span>
        </div>
        <div class="mt-1 flex items-baseline gap-1">
          <span id="statMonthlyUsers" class="text-sm sm:text-lg font-black text-purple-300 mono">0</span>
          <span class="text-[9px] text-purple-300 font-bold hidden sm:inline">30d</span>
        </div>
      </div>

      <!-- 4. Annual -->
      <div class="glass-card p-2 sm:p-3 rounded-xl border border-sky-500/20 flex flex-col justify-between">
        <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span class="truncate">Annual</span>
          <span class="text-xs">🌟</span>
        </div>
        <div class="mt-1 flex items-baseline gap-1">
          <span id="statAnnualUsers" class="text-sm sm:text-lg font-black text-sky-400 mono">0</span>
          <span class="text-[9px] text-sky-400 font-bold hidden sm:inline">365d</span>
        </div>
      </div>

      <!-- 5. Lifetime VIP -->
      <div class="glass-card p-2 sm:p-3 rounded-xl border border-amber-500/20 flex flex-col justify-between">
        <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span class="truncate">Lifetime</span>
          <span class="text-xs">👑</span>
        </div>
        <div class="mt-1 flex items-baseline gap-1">
          <span id="statLifetimeUsers" class="text-sm sm:text-lg font-black text-amber-400 mono">0</span>
          <span class="text-[9px] text-amber-400 font-bold hidden sm:inline">VIP</span>
        </div>
      </div>

      <!-- 6. Total Revenue -->
      <div class="glass-card p-2 sm:p-3 rounded-xl border border-emerald-500/30 flex flex-col justify-between glow-cyan">
        <div class="flex items-center justify-between text-[10px] text-slate-400 font-semibold">
          <span class="truncate">Revenue</span>
          <span class="text-xs">💰</span>
        </div>
        <div class="mt-1 flex items-baseline gap-0.5">
          <span class="text-[10px] font-mono font-bold text-emerald-400">₹</span>
          <span id="statTotalRevenue" class="text-sm sm:text-lg font-black text-white mono truncate">0</span>
        </div>
      </div>
    </div>

    <!-- Hidden telemetry container keeping test element IDs and legacy metrics sync intact -->
    <div class="hidden">
      <span id="statTotalLicenses">0</span>
      <span id="statActiveDevices">0</span>
      <span id="statLifetime">0</span>
      <span id="statBanned">0</span>
      <span id="statCrashReports">0</span>
    </div>

    <!-- ── Category-Wise Systematic Navigation Hub (Clean, Structured, Compact) ── -->
    <div class="glass p-2 sm:p-3 rounded-2xl border border-slate-800/90 space-y-2">
      
      <!-- Tier 1: Main Category Segmented Bar (Category Division) -->
      <div class="grid grid-cols-4 gap-1 p-1 bg-slate-900/90 rounded-xl border border-slate-800/80">
        <button type="button" onclick="selectAdminCategory('users', this)" class="admin-cat-pill active py-1.5 px-1 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 bg-violet-600 text-white shadow-sm">
          <span>👥</span> <span class="truncate">Users</span>
        </button>
        <button type="button" onclick="selectAdminCategory('sales', this)" class="admin-cat-pill py-1.5 px-1 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 text-slate-400 hover:text-white">
          <span>⚡</span> <span class="truncate">Plans & Promos</span>
        </button>
        <button type="button" onclick="selectAdminCategory('system', this)" class="admin-cat-pill py-1.5 px-1 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 text-slate-400 hover:text-white">
          <span>⚙️</span> <span class="truncate">System</span>
        </button>
        <button type="button" onclick="selectAdminCategory('all', this)" class="admin-cat-pill py-1.5 px-1 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 text-slate-400 hover:text-white">
          <span>✨</span> <span class="truncate">All</span>
        </button>
      </div>

      <!-- Tier 2: Sub-Tools Bar (Compact "Chota-Chota" Buttons with Icons) -->
      <div id="subTabsBar" class="flex items-center gap-1.5 overflow-x-auto pb-0.5 scrollbar-none">
        
        <!-- Category: Users -->
        <button type="button" data-cat="users" data-tab="pro_users" onclick="switchAdminTab('pro_users', this)" class="admin-tab-btn active px-2.5 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1 whitespace-nowrap transition-all bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm border border-violet-500/40">
          <span>💎</span>
          <span>Pro Accounts</span>
        </button>

        <button type="button" data-cat="users" data-tab="referrals" onclick="switchAdminTab('referrals', this)" class="admin-tab-btn px-2.5 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1 whitespace-nowrap transition-all text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800">
          <span>🤝</span>
          <span>Refer & Earn</span>
        </button>

        <button type="button" data-cat="users" data-tab="broadcast" onclick="switchAdminTab('broadcast', this)" class="admin-tab-btn px-2.5 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1 whitespace-nowrap transition-all text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800">
          <span>📢</span>
          <span>Bot Broadcast</span>
        </button>

        <!-- Category: Plans & Promos (Sales) -->
        <button type="button" data-cat="sales" data-tab="plans" onclick="switchAdminTab('plans', this)" class="admin-tab-btn px-2.5 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1 whitespace-nowrap transition-all text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800 hidden">
          <span>⚡</span>
          <span>Plans & Pricing</span>
        </button>

        <button type="button" data-cat="sales" data-tab="offers" onclick="switchAdminTab('offers', this)" class="admin-tab-btn px-2.5 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1 whitespace-nowrap transition-all text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800 hidden">
          <span>🎁</span>
          <span>Promo & Deals</span>
        </button>

        <button type="button" data-cat="sales" data-tab="payments" onclick="switchAdminTab('payments', this)" class="admin-tab-btn px-2.5 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1 whitespace-nowrap transition-all text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800 hidden">
          <span>💳</span>
          <span>Razorpay Orders</span>
        </button>

        <!-- Category: System -->
        <button type="button" data-cat="system" data-tab="crashes" onclick="switchAdminTab('crashes', this)" class="admin-tab-btn px-2.5 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1 whitespace-nowrap transition-all text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800 hidden">
          <span>🐛</span>
          <span>Crash Logs</span>
        </button>

        <button type="button" data-cat="system" data-tab="licenses" onclick="switchAdminTab('licenses', this)" class="admin-tab-btn px-2.5 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1 whitespace-nowrap transition-all text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800 hidden">
          <span>🔑</span>
          <span>License Keys</span>
        </button>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB 1: 💎 Pro Telegram Subscriptions (Category: Users)             -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div id="tab-pro_users" class="space-y-3">
      <div class="glass-card p-3 sm:p-4 rounded-2xl border border-violet-500/30 glow-purple">
        
        <!-- Header & Action Toolbar -->
        <div class="flex flex-col gap-2 pb-2.5 border-b border-slate-800/80">
          <div class="flex items-center justify-between gap-1.5 flex-wrap">
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-violet-400 bg-violet-500/10 px-2 py-0.5 rounded-full border border-violet-500/20 flex items-center gap-1">
                <span>💎</span> Pro Telegram Accounts
              </span>
              <span id="proUsersCountBadge" class="text-[10px] text-emerald-400 font-semibold bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">0 Account(s)</span>
            </div>
            
            <div class="flex items-center gap-1">
              <button onclick="loadProUsers()" title="Refresh" class="p-1 px-2 rounded-lg border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1">
                <span>🔄</span>
                <span class="hidden sm:inline">Refresh</span>
              </button>
              <button onclick="openUpgradeProModal()" class="px-2.5 py-1 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98] flex items-center gap-1">
                <span>➕</span>
                <span>Grant Pro</span>
              </button>
            </div>
          </div>

          <!-- Search & Filter Controls -->
          <div class="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-1.5 pt-1">
            <div class="relative flex-1">
              <input type="text" id="proUserSearchInput" oninput="handleProUserSearch()" placeholder="Search ID / Username / Phone..." class="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500">
              <span class="absolute left-2 top-1.5 text-slate-500 text-xs">🔍</span>
            </div>

            <!-- Filter Pills Bar -->
            <div class="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none">
              <button type="button" onclick="filterProUsersByPlan('all', this)" class="pro-plan-filter-btn px-2 py-1 rounded-lg bg-violet-600 text-white font-bold text-[10px] shadow-sm whitespace-nowrap">All Plans</button>
              <button type="button" onclick="filterProUsersByPlan('monthly', this)" class="pro-plan-filter-btn px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-purple-300 font-bold text-[10px] hover:bg-slate-800 whitespace-nowrap">📅 Monthly</button>
              <button type="button" onclick="filterProUsersByPlan('annual', this)" class="pro-plan-filter-btn px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-sky-300 font-bold text-[10px] hover:bg-slate-800 whitespace-nowrap">🌟 Annual</button>
              <button type="button" onclick="filterProUsersByPlan('lifetime', this)" class="pro-plan-filter-btn px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-amber-300 font-bold text-[10px] hover:bg-slate-800 whitespace-nowrap">👑 Lifetime</button>
              <button type="button" onclick="filterProUsersByPlan('expired', this)" class="pro-plan-filter-btn px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-rose-300 font-bold text-[10px] hover:bg-slate-800 whitespace-nowrap">🔴 Expired</button>
            </div>
          </div>
        </div>

        <!-- Table with Mobile Card View transformation -->
        <div class="mt-2.5 overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300 mobile-card-table">
            <thead class="text-[11px] uppercase bg-slate-900/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th class="px-3 py-2">Telegram User</th>
                <th class="px-3 py-2">Phone</th>
                <th class="px-3 py-2">Plan</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2">Expiry</th>
                <th class="px-3 py-2">Joined</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="proUsersTableBody" class="divide-y divide-slate-800/60">
              <tr>
                <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                  Loading Pro subscriptions...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB 2: 💳 Razorpay Direct Transactions (Category: Sales)           -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div id="tab-payments" class="hidden space-y-3">
      <div id="paymentTransactionsSection" class="glass-card p-3 sm:p-4 rounded-2xl border border-blue-500/20 glow-blue">
        <div class="flex items-center justify-between gap-1.5 pb-2.5 border-b border-slate-800/80 flex-wrap">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20 flex items-center gap-1">
                <span>💳</span> Razorpay Orders
              </span>
              <span class="text-[10px] text-slate-400 hidden xs:inline">Direct In-App Purchases</span>
            </div>
          </div>
          <button onclick="loadPaymentTransactions()" class="px-2.5 py-1 rounded-lg border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1">
            <span>🔄</span> <span>Refresh</span>
          </button>
        </div>

        <div class="mt-2.5 overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300 mobile-card-table">
            <thead class="text-[11px] uppercase bg-slate-900/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th class="px-3 py-2">Order ID</th>
                <th class="px-3 py-2">Payment ID</th>
                <th class="px-3 py-2">User</th>
                <th class="px-3 py-2">Plan</th>
                <th class="px-3 py-2">Amount</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2">Created</th>
                <th class="px-3 py-2">Paid</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="paymentTransactionsTableBody" class="divide-y divide-slate-800/60">
              <tr>
                <td colspan="9" class="px-4 py-8 text-center text-slate-500">
                  Loading transactions...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB 3: ⚡ Plans, Pricing & Free Trial (Category: Sales)             -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div id="tab-plans" class="hidden space-y-3">
      
      <!-- Membership Plans & Dynamic Pricing Controller -->
      <div class="glass-card p-3 sm:p-4 rounded-2xl border border-cyan-500/30 glow-cyan space-y-3">
        <div class="flex items-center justify-between gap-1.5 border-b border-slate-800/80 pb-2.5 flex-wrap">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1">
                <span>⚡</span> Membership Pricing
              </span>
              <span id="pricingStatusBadge" class="text-[10px] text-emerald-400 font-semibold">🟢 Synced with Live App</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">Whatever you set here will instantly appear inside apps.</p>
          </div>
        </div>

        <form id="plansForm" onsubmit="handleSavePlans(event)" class="space-y-3">
          <div class="grid grid-cols-1 md:grid-cols-3 gap-2.5">
            
            <!-- 1. Lifetime Pro Plan -->
            <div class="p-3 rounded-xl bg-slate-900/80 border-2 border-amber-500/40 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black uppercase text-amber-400 flex items-center gap-1">
                  👑 Lifetime Pro
                </span>
                <span class="text-[9px] bg-amber-500/20 text-amber-300 font-bold px-1.5 py-0.5 rounded">Best Value</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Live Price (₹)</label>
                  <input type="number" id="planLifetimePrice" min="1" step="1" placeholder="499" required class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-amber-400 focus:outline-none focus:border-amber-400">
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Crossed (₹)</label>
                  <input type="number" id="planLifetimeOrig" min="1" step="1" placeholder="1499" required class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-slate-400 focus:outline-none focus:border-amber-400">
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Razorpay Checkout URL</label>
                <input type="url" id="planLifetimeUrl" placeholder="https://rzp.io/rzp/..." class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-white focus:outline-none focus:border-amber-400 font-mono">
              </div>
            </div>

            <!-- 2. 1-Year Annual Pass -->
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black uppercase text-sky-400 flex items-center gap-1">
                  🌟 1-Year Pass
                </span>
                <span class="text-[9px] bg-sky-500/20 text-sky-300 font-bold px-1.5 py-0.5 rounded">365 Days</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Live Price (₹)</label>
                  <input type="number" id="planAnnualPrice" min="1" step="1" placeholder="299" required class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-sky-400 focus:outline-none focus:border-sky-400">
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Crossed (₹)</label>
                  <input type="number" id="planAnnualOrig" min="1" step="1" placeholder="599" required class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-slate-400 focus:outline-none focus:border-sky-400">
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Razorpay Checkout URL</label>
                <input type="url" id="planAnnualUrl" placeholder="https://rzp.io/rzp/..." class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-white focus:outline-none focus:border-sky-400 font-mono">
              </div>
            </div>

            <!-- 3. 1-Month Pass -->
            <div class="p-3 rounded-xl bg-slate-900/80 border border-slate-700/80 space-y-2">
              <div class="flex items-center justify-between">
                <span class="text-xs font-black uppercase text-purple-400 flex items-center gap-1">
                  📅 1-Month Pass
                </span>
                <span class="text-[9px] bg-purple-500/20 text-purple-300 font-bold px-1.5 py-0.5 rounded">30 Days</span>
              </div>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Live Price (₹)</label>
                  <input type="number" id="planMonthlyPrice" min="1" step="1" placeholder="49" required class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-purple-400 focus:outline-none focus:border-purple-400">
                </div>
                <div>
                  <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Crossed (₹)</label>
                  <input type="number" id="planMonthlyOrig" min="1" step="1" placeholder="99" required class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-slate-400 focus:outline-none focus:border-purple-400">
                </div>
              </div>
              <div>
                <label class="block text-[10px] font-semibold text-slate-400 mb-0.5">Razorpay Checkout URL</label>
                <input type="url" id="planMonthlyUrl" placeholder="https://rzp.io/rzp/..." class="w-full px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-700 text-[11px] text-white focus:outline-none focus:border-purple-400 font-mono">
              </div>
            </div>
          </div>

          <div class="flex items-center justify-end pt-1">
            <button type="submit" id="btnSavePlans" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-600 hover:brightness-110 text-slate-950 font-black text-xs shadow-md shadow-emerald-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1">
              <span>💾</span> Save All Membership Plans
            </button>
          </div>
        </form>
        <div id="plansUpdateMsg" class="hidden text-xs p-2 rounded-xl text-center"></div>
      </div>

      <!-- Free Trial Controller -->
      <div class="glass-card p-3 sm:p-4 rounded-2xl border border-purple-500/20 glow-blue">
        <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded-full border border-purple-500/20 flex items-center gap-1">
                <span>🎁</span> Free Trial Controller
              </span>
              <span id="trialStatusBadge" class="text-[10px] text-emerald-400 font-semibold">🟢 Active: 30-Day Free Trial</span>
            </div>
            <h3 class="text-xs sm:text-sm font-bold text-white mt-1 flex items-center gap-2">
              Trial Duration: <span id="displayTrialDuration" class="text-purple-300 font-mono text-sm sm:text-base font-black">1 Month (30 Days)</span>
            </h3>
          </div>

          <form id="trialForm" onsubmit="handleUpdateTrial(event)" class="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <div class="flex items-center gap-1">
              <label class="text-[10px] font-semibold text-slate-300">Status:</label>
              <select id="inputTrialEnabled" class="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-purple-500">
                <option value="1">Enabled</option>
                <option value="0">Disabled</option>
              </select>
            </div>

            <div class="flex items-center gap-1">
              <label class="text-[10px] font-semibold text-slate-300">Duration:</label>
              <select id="inputTrialDays" class="px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-purple-300 focus:outline-none focus:border-purple-500">
                <option value="7">7 Days</option>
                <option value="14">14 Days</option>
                <option value="30" selected>30 Days (1 Mo)</option>
                <option value="60">60 Days (2 Mo)</option>
                <option value="90">90 Days (3 Mo)</option>
                <option value="180">180 Days (6 Mo)</option>
                <option value="365">365 Days (1 Yr)</option>
              </select>
            </div>

            <button type="submit" id="btnUpdateTrial" class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-400 hover:to-indigo-500 text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98]">
              Save Trial
            </button>
          </form>
        </div>
        <div id="trialUpdateMsg" class="hidden mt-2 text-xs p-2 rounded-xl text-center"></div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB 4: 🔥 Flash Deals & Coupons Manager (Category: Sales)           -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div id="tab-offers" class="hidden space-y-3">
      
      <!-- Special Offers & Flash Sales Manager -->
      <div class="glass-card p-3 sm:p-4 rounded-2xl border border-amber-500/20 glow-blue">
        <div class="flex items-center justify-between gap-1.5 pb-2.5 border-b border-slate-800/80 flex-wrap">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20 flex items-center gap-1">
                <span>🔥</span> Flash Deals & Banners
              </span>
              <span class="text-[10px] text-slate-400 hidden xs:inline">App Promotions</span>
            </div>
          </div>
          <button onclick="openCreateOfferModal()" class="px-2.5 py-1 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-bold shadow-sm transition-all active:scale-[0.98] flex items-center gap-1">
            <span>➕</span> New Offer
          </button>
        </div>

        <div id="offersList" class="grid grid-cols-1 md:grid-cols-2 gap-2.5 mt-2.5">
          <p class="text-xs text-slate-500 py-3 italic col-span-full text-center">Loading special promotional offers...</p>
        </div>
      </div>

      <!-- Coupons & Promotional Offers Manager -->
      <div class="glass-card p-3 sm:p-4 rounded-2xl border border-indigo-500/20 glow-blue">
        <div class="flex items-center justify-between gap-1.5 pb-2.5 border-b border-slate-800/80 flex-wrap">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1">
                <span>🎁</span> Promo Codes & Coupons
              </span>
              <span class="text-[10px] text-slate-400 hidden xs:inline">Usage Limits</span>
            </div>
          </div>
          <button onclick="openCreateCouponModal()" class="px-2.5 py-1 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98] flex items-center gap-1">
            <span>➕</span> New Coupon
          </button>
        </div>

        <div id="couponsList" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 mt-2.5">
          <p class="text-xs text-slate-500 py-3 italic col-span-full text-center">Loading promotional coupons...</p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB 5: 🤝 Refer & Earn Controller & Payouts (Category: Users)       -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div id="tab-referrals" class="hidden space-y-3">
      
      <!-- Refer & Earn Settings Controller -->
      <div class="glass-card p-3 sm:p-4 rounded-2xl border border-emerald-500/20 glow-cyan">
        <div class="flex items-center justify-between gap-1.5 pb-2.5 border-b border-slate-800/80 flex-wrap">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20 flex items-center gap-1">
                <span>🤝</span> Referral Program
              </span>
              <span id="referralStatusBadge" class="text-[10px] text-emerald-400 font-semibold">🟢 Active: ₹50 / Sale</span>
            </div>
            <h3 class="text-xs sm:text-sm font-bold text-white mt-1 flex items-center gap-2">
              Commission: <span id="displayReferralReward" class="text-emerald-400 font-mono text-sm sm:text-base font-black">₹50.00 / Sale</span>
            </h3>
          </div>
        </div>

        <form id="referralSettingsForm" onsubmit="handleUpdateReferralSettings(event)" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mt-2.5 items-end">
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Status</label>
            <select id="inputReferralEnabled" class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500">
              <option value="1">Enabled</option>
              <option value="0">Disabled</option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Type</label>
            <select id="inputReferralRewardType" class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-emerald-500">
              <option value="fixed">Fixed (₹)</option>
              <option value="percent">Percentage (%)</option>
            </select>
          </div>

          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Reward Value</label>
            <input type="number" id="inputReferralRewardValue" min="1" step="1" required class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-emerald-400 focus:outline-none focus:border-emerald-500">
          </div>

          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Friend Disc (%)</label>
            <input type="number" id="inputReferralFriendDiscount" min="0" max="100" step="1" required class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-cyan-400 focus:outline-none focus:border-emerald-500">
          </div>

          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Min Payout (₹)</label>
            <input type="number" id="inputReferralMinPayout" min="10" step="10" required class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-amber-400 focus:outline-none focus:border-emerald-500">
          </div>

          <div class="col-span-2 sm:col-span-1">
            <button type="submit" id="btnSaveReferralSettings" class="w-full py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-slate-950 text-xs font-bold shadow-sm transition-all active:scale-[0.98]">
              Save Settings
            </button>
          </div>
        </form>
        <div id="referralUpdateMsg" class="hidden mt-2 text-xs p-2 rounded-xl text-center"></div>
      </div>

      <!-- Withdrawal & Payout Requests Manager -->
      <div class="glass-card p-3 sm:p-4 rounded-2xl border border-cyan-500/20 glow-blue">
        <div class="flex items-center justify-between gap-1.5 pb-2.5 border-b border-slate-800/80 flex-wrap">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-full border border-cyan-500/20 flex items-center gap-1">
                <span>💸</span> Payout Requests
              </span>
              <span id="pendingPayoutBadge" class="text-[10px] text-amber-400 font-semibold">0 Pending</span>
            </div>
          </div>

          <!-- Filter Buttons -->
          <div class="flex items-center gap-1 p-0.5 rounded-lg bg-slate-900 border border-slate-800 text-[10px]">
            <button type="button" onclick="loadPayoutRequests('all', this)" class="payout-filter-btn px-2 py-1 rounded text-slate-400 hover:text-white font-semibold">All</button>
            <button type="button" onclick="loadPayoutRequests('pending', this)" class="payout-filter-btn px-2 py-1 rounded bg-cyan-500 text-slate-950 font-bold">Pending</button>
            <button type="button" onclick="loadPayoutRequests('completed', this)" class="payout-filter-btn px-2 py-1 rounded text-slate-400 hover:text-white font-semibold">Completed</button>
            <button type="button" onclick="loadPayoutRequests('rejected', this)" class="payout-filter-btn px-2 py-1 rounded text-slate-400 hover:text-white font-semibold">Rejected</button>
          </div>
        </div>

        <div class="overflow-x-auto mt-2.5">
          <table class="w-full text-left text-xs text-slate-300 mobile-card-table">
            <thead class="bg-slate-900/80 uppercase font-semibold text-slate-400 border-b border-slate-800 text-[11px]">
              <tr>
                <th class="px-3 py-2">User / Code</th>
                <th class="px-3 py-2">Amount</th>
                <th class="px-3 py-2">Payment Details</th>
                <th class="px-3 py-2">Requested</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="payoutsTableBody" class="divide-y divide-slate-800/60">
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-slate-500">Loading payout requests...</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Top Referrers Leaderboard -->
      <div class="glass-card p-3 sm:p-4 rounded-2xl border border-indigo-500/20">
        <div class="flex items-center justify-between pb-2.5 border-b border-slate-800/80">
          <div class="flex items-center gap-1.5">
            <span class="text-xs font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 px-2 py-0.5 rounded-full border border-indigo-500/20 flex items-center gap-1">
              <span>🏆</span> Top Affiliates
            </span>
          </div>
          <button onclick="loadTopReferrers()" class="text-xs text-indigo-400 hover:text-indigo-300 font-semibold flex items-center gap-1">
            <span>🔄</span> Refresh
          </button>
        </div>
        <div id="topReferrersList" class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mt-2.5">
          <p class="text-xs text-slate-500 py-3 italic col-span-full text-center">Loading top referrers...</p>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB 6: 📢 Telegram Bot & Broadcast Manager (Category: Users)        -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div id="tab-broadcast" class="hidden space-y-3">
      <div id="broadcastSection" class="glass-card p-3 sm:p-4 rounded-2xl border border-sky-500/30 glow-cyan space-y-3">
        <div class="flex items-center justify-between gap-1.5 pb-2.5 border-b border-slate-800/80 flex-wrap">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-sky-400 bg-sky-500/10 px-2 py-0.5 rounded-full border border-sky-500/20 flex items-center gap-1">
                <span>📢</span> Bot Broadcast
              </span>
              <span id="botSubscriberCountBadge" class="text-[10px] text-emerald-400 font-semibold">0 Active Subscribers</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">Broadcast messages directly to Telegram user inboxes.</p>
          </div>
        </div>

        <form id="broadcastForm" onsubmit="handleSendBroadcast(event)" class="space-y-2.5">
          <div>
            <label class="block text-[11px] font-semibold text-slate-300 mb-1">Message Text (Markdown supported)</label>
            <textarea id="broadcastMessageInput" rows="3" required placeholder="🔥 *Special 50% OFF Deal!* 💎&#10;&#10;Upgrade to TG Drive PRO today for only ₹199! No ads forever.&#10;&#10;Tap below to claim now! 👇" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 font-mono"></textarea>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div>
              <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">CTA Button Text (Optional)</label>
              <input type="text" id="broadcastButtonTextInput" placeholder="🚀 Upgrade to PRO" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500">
            </div>
            <div>
              <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">CTA Button URL (Optional)</label>
              <input type="url" id="broadcastButtonUrlInput" placeholder="https://rzp.io/rzp/..." class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-sky-500 font-mono">
            </div>
          </div>

          <div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 pt-1">
            <span class="text-[10px] text-slate-400">💡 Uses official Telegram Bot API with rate-limited queueing.</span>
            <button type="submit" id="btnSendBroadcast" class="w-full sm:w-auto px-4 py-2 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white text-xs font-bold transition-all shadow-sm active:scale-[0.98] flex items-center justify-center gap-1.5">
              <span>🚀</span> Send Broadcast
            </button>
          </div>
        </form>
        <div id="broadcastStatusMsg" class="hidden text-xs p-2 rounded-xl text-center"></div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB 7: 🐛 Crash Telemetry & Diagnostics (Category: System)          -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div id="tab-crashes" class="hidden space-y-3">
      <div id="crashReportsSection" class="glass-card p-3 sm:p-4 rounded-2xl border border-rose-500/20 glow-blue">
        <div class="flex items-center justify-between gap-1.5 pb-2.5 border-b border-slate-800/80 flex-wrap">
          <div>
            <div class="flex items-center gap-1.5">
              <span class="text-xs font-bold uppercase tracking-wider text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded-full border border-rose-500/20 flex items-center gap-1">
                <span>🐛</span> Crash Diagnostics
              </span>
              <span id="crashTelemetryStatusBadge" class="text-[10px] text-emerald-400 font-semibold">🟢 Active Ingestion</span>
            </div>
            <p class="text-[11px] text-slate-400 mt-0.5">Desktop & Android unhandled error telemetry.</p>
          </div>
          <div class="flex items-center gap-1">
            <button onclick="loadCrashReports()" class="px-2 py-1 rounded-lg border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-bold transition-colors flex items-center gap-1">
              <span>🔄</span> <span>Refresh</span>
            </button>
            <button onclick="handleClearAllCrashes()" class="px-2 py-1 rounded-lg border border-rose-500/30 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition-colors flex items-center gap-1">
              <span>🗑️</span> <span>Clear Logs</span>
            </button>
          </div>
        </div>

        <div class="mt-2.5 overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300 mobile-card-table">
            <thead class="text-[11px] uppercase bg-slate-900/60 text-slate-400 border-b border-slate-800">
              <tr>
                <th class="px-3 py-2">Error Type</th>
                <th class="px-3 py-2">Source</th>
                <th class="px-3 py-2">Version</th>
                <th class="px-3 py-2">Platform</th>
                <th class="px-3 py-2">Occurred At</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="crashReportsTableBody" class="divide-y divide-slate-800/60">
              <tr>
                <td colspan="6" class="px-4 py-8 text-center text-slate-500">
                  Loading crash reports...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <!-- TAB 8: 🔑 Legacy Software License Keys (Category: System)           -->
    <!-- ═══════════════════════════════════════════════════════════════════ -->
    <div id="tab-licenses" class="hidden space-y-3">
      <div class="glass p-3 rounded-2xl flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2">
        <div class="relative flex-1">
          <input type="text" id="searchInput" oninput="handleSearch()" placeholder="Search License Key, Customer Name, Email..." class="w-full pl-7 pr-3 py-1.5 rounded-lg bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 transition-colors">
          <span class="absolute left-2 top-1.5 text-slate-500 text-xs">🔍</span>
        </div>

        <div class="flex items-center gap-1.5 justify-end">
          <button onclick="loadLicenses()" class="px-2.5 py-1.5 rounded-lg border border-slate-700/80 hover:bg-slate-800 text-slate-300 text-xs font-semibold transition-colors flex items-center gap-1">
            <span>🔄</span> <span>Refresh</span>
          </button>
          <button onclick="openCreateModal()" class="px-3 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-sm transition-all active:scale-[0.98] flex items-center gap-1 whitespace-nowrap">
            <span>➕</span> <span>Generate Key</span>
          </button>
        </div>
      </div>

      <div class="glass rounded-2xl overflow-hidden border border-slate-800">
        <div class="overflow-x-auto">
          <table class="w-full text-left text-xs text-slate-300 mobile-card-table">
            <thead class="bg-slate-900/80 text-[11px] uppercase font-semibold text-slate-400 border-b border-slate-800">
              <tr>
                <th class="px-3 py-2">License Key</th>
                <th class="px-3 py-2">Customer / Notes</th>
                <th class="px-3 py-2">Plan</th>
                <th class="px-3 py-2">Devices</th>
                <th class="px-3 py-2">Status</th>
                <th class="px-3 py-2">Created</th>
                <th class="px-3 py-2 text-right">Actions</th>
              </tr>
            </thead>
            <tbody id="licensesTableBody" class="divide-y divide-slate-800/60">
              <tr>
                <td colspan="7" class="px-4 py-8 text-center text-slate-500">
                  Loading licenses...
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </main>

  <!-- Create License Modal -->
  <div id="createModal" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm hidden flex items-center justify-center p-3">
    <div class="glass-card w-full max-w-md p-4 sm:p-5 rounded-2xl glow-cyan space-y-3 border border-slate-700 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 class="text-sm font-bold text-white flex items-center gap-1.5">
          <span>✨</span> Generate Commercial License
        </h3>
        <button onclick="closeCreateModal()" class="text-slate-400 hover:text-white text-base">✕</button>
      </div>

      <form id="createLicenseForm" onsubmit="handleCreateLicense(event)" class="space-y-2.5">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Plan Duration</label>
            <select id="planTypeSelect" class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500">
              <option value="lifetime">⭐ Lifetime Pro</option>
              <option value="annual">📅 1 Year</option>
              <option value="monthly">🌙 1 Month</option>
              <option value="trial">⏳ 7-Day Trial</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Max Devices</label>
            <select id="maxDevicesSelect" class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500">
              <option value="1">1 Device</option>
              <option value="2" selected>2 Devices</option>
              <option value="3">3 Devices</option>
              <option value="5">5 Devices</option>
            </select>
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Customer Name (Optional)</label>
          <input type="text" id="customerNameInput" placeholder="John Doe" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500">
        </div>

        <div>
          <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Customer Email (Optional)</label>
          <input type="text" id="customerEmailInput" placeholder="customer@example.com" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Telegram User ID</label>
            <input type="text" id="telegramUserIdInput" placeholder="58291039" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono">
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Phone Number</label>
            <input type="text" id="phoneNumberInput" placeholder="+919876543210" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500 font-mono">
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Memo / Notes</label>
          <input type="text" id="notesInput" placeholder="Order memo or UPI reference" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-white text-xs focus:outline-none focus:border-cyan-500">
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button type="button" onclick="closeCreateModal()" class="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-semibold">Cancel</button>
          <button type="submit" class="px-4 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 text-white text-xs font-bold hover:from-cyan-400 hover:to-blue-500 shadow-sm">Generate</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Generated Key Success Modal -->
  <div id="successModal" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm hidden flex items-center justify-center p-3">
    <div class="glass-card w-full max-w-xs p-4 rounded-2xl glow-cyan space-y-3 border border-cyan-500/40 text-center">
      <div class="h-9 w-9 rounded-full bg-emerald-500/10 text-emerald-400 mx-auto flex items-center justify-center text-lg font-bold border border-emerald-500/20">
        ✓
      </div>
      <h3 class="text-sm font-bold text-white">License Key Ready!</h3>
      
      <div class="p-2.5 rounded-xl bg-slate-900/90 border border-cyan-500/30 flex items-center justify-between gap-1.5">
        <span id="generatedKeyDisplay" class="mono text-xs font-bold text-cyan-400 tracking-wider truncate"></span>
        <button onclick="copyGeneratedKey()" class="px-2 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs shrink-0">
          Copy
        </button>
      </div>

      <button onclick="closeSuccessModal()" class="w-full py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold">
        Done
      </button>
    </div>
  </div>

  <!-- Create Coupon Modal -->
  <div id="createCouponModal" class="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm hidden animate-fade-in">
    <div class="glass-card w-full max-w-sm p-4 rounded-2xl border border-indigo-500/30 space-y-3 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 class="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
          <span>🎁</span> Create Promo Coupon
        </h3>
        <button onclick="closeCreateCouponModal()" class="text-slate-400 hover:text-white">&times;</button>
      </div>

      <form id="createCouponForm" onsubmit="handleCreateCoupon(event)" class="space-y-2.5">
        <div>
          <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Coupon Code (Uppercase)</label>
          <input type="text" id="couponCodeInput" required placeholder="LAUNCH50 or DIWALI" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-indigo-400 uppercase tracking-wider focus:outline-none focus:border-indigo-500">
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Discount Value</label>
            <input type="number" id="couponAmountInput" min="1" max="100" required placeholder="50" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-indigo-500">
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Type</label>
            <select id="couponTypeInput" class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500">
              <option value="percent">Percentage (%)</option>
              <option value="fixed">Flat (₹)</option>
            </select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">User Limit</label>
            <input type="number" id="couponLimitInput" min="0" placeholder="0 = unlimited" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500">
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Duration</label>
            <select id="couponDurationInput" class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-indigo-500">
              <option value="0">Never</option>
              <option value="1">24 Hours</option>
              <option value="3">3 Days</option>
              <option value="7" selected>7 Days</option>
              <option value="30">30 Days</option>
            </select>
          </div>
        </div>

        <div id="couponCreateError" class="hidden text-xs p-1.5 rounded-lg text-center bg-rose-500/10 text-rose-400 border border-rose-500/20"></div>

        <div class="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
          <button type="button" onclick="closeCreateCouponModal()" class="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800">Cancel</button>
          <button type="submit" id="btnSubmitCoupon" class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-400 hover:to-purple-500 text-white text-xs font-bold shadow-sm">
            Create Coupon
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Create Special Offer Modal -->
  <div id="createOfferModal" class="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/80 backdrop-blur-sm hidden animate-fade-in overflow-y-auto">
    <div class="glass-card w-full max-w-md p-4 rounded-2xl border border-amber-500/30 space-y-3 my-4 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 class="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
          <span>🔥</span> Publish Promotional Deal
        </h3>
        <button onclick="closeCreateOfferModal()" class="text-slate-400 hover:text-white">&times;</button>
      </div>

      <form id="createOfferForm" onsubmit="handleCreateOffer(event)" class="space-y-2.5">
        <div class="grid grid-cols-3 gap-2">
          <div class="col-span-2">
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Headline</label>
            <input type="text" id="offerTitleInput" required placeholder="Diwali Mega Sale: 50% OFF" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-amber-500">
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Badge</label>
            <input type="text" id="offerBadgeInput" value="50% OFF" class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-amber-400 uppercase focus:outline-none focus:border-amber-500">
          </div>
        </div>

        <div>
          <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Description</label>
          <textarea id="offerDescriptionInput" required rows="2" placeholder="Get lifetime unlimited cloud storage at 50% off!" class="w-full px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500"></textarea>
        </div>

        <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-amber-400 block">💰 Pricing Calculation</span>
          <div class="grid grid-cols-4 gap-1.5">
            <div>
              <label class="block text-[9px] text-slate-400 mb-0.5">Type</label>
              <select id="offerDiscountType" onchange="calculateOfferPrice()" class="w-full px-1.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-amber-500">
                <option value="percent">%</option>
                <option value="flat">₹</option>
              </select>
            </div>
            <div>
              <label class="block text-[9px] text-slate-400 mb-0.5">Orig (₹)</label>
              <input type="number" id="offerOriginalPrice" value="399" oninput="calculateOfferPrice()" class="w-full px-1.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-white">
            </div>
            <div>
              <label class="block text-[9px] text-slate-400 mb-0.5">Discount</label>
              <input type="number" id="offerDiscountValue" value="50" oninput="calculateOfferPrice()" class="w-full px-1.5 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs font-bold text-amber-400">
            </div>
            <div>
              <label class="block text-[9px] text-slate-400 mb-0.5">Deal (₹)</label>
              <input type="number" id="offerFinalPrice" value="199.50" class="w-full px-1.5 py-1 rounded-lg bg-slate-950 border border-emerald-500/40 text-xs font-black text-emerald-400">
            </div>
          </div>
        </div>

        <div class="p-2.5 rounded-xl bg-slate-900/90 border border-slate-800 space-y-1.5">
          <span class="text-[10px] font-bold uppercase tracking-wider text-cyan-400 block">🎁 Perks Included</span>
          <div class="grid grid-cols-2 gap-1 text-[11px] text-slate-300">
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" name="offerPerk" value="Lifetime Unlimited Cloud Storage" checked class="accent-cyan-500 rounded">
              <span class="truncate">Unlimited Storage</span>
            </label>
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" name="offerPerk" value="2 Hardware Device Slots" checked class="accent-cyan-500 rounded">
              <span class="truncate">2 Device Slots</span>
            </label>
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" name="offerPerk" value="High-Speed Multi-Part Engine" checked class="accent-cyan-500 rounded">
              <span class="truncate">High-Speed Engine</span>
            </label>
            <label class="flex items-center gap-1 cursor-pointer">
              <input type="checkbox" name="offerPerk" value="100% Offline Vault Capable" checked class="accent-cyan-500 rounded">
              <span class="truncate">Offline Vault</span>
            </label>
          </div>
          <input type="text" id="offerCustomPerk" placeholder="Custom Extra Perk (Optional)" class="w-full px-2 py-1 rounded-lg bg-slate-950 border border-slate-700 text-xs text-slate-200 focus:outline-none focus:border-cyan-500">
        </div>

        <div class="grid grid-cols-3 gap-1.5">
          <div>
            <label class="block text-[10px] text-slate-300 mb-0.5">⏳ Duration</label>
            <select id="offerDurationInput" class="w-full px-1.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white">
              <option value="6">6 Hours</option>
              <option value="12">12 Hours</option>
              <option value="24" selected>24 Hours</option>
              <option value="48">48 Hours</option>
              <option value="72">3 Days</option>
              <option value="168">7 Days</option>
              <option value="0">Ongoing</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] text-slate-300 mb-0.5">Coupon Code</label>
            <input type="text" id="offerCouponInput" placeholder="DIWALI50" class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-indigo-400 uppercase">
          </div>
          <div>
            <label class="block text-[10px] text-slate-300 mb-0.5">Theme</label>
            <select id="offerStyleInput" class="w-full px-1.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white">
              <option value="gold">🏆 Gold</option>
              <option value="fire">🔥 Fire</option>
              <option value="cyan">⚡ Cyan</option>
              <option value="emerald">💎 Emerald</option>
              <option value="purple">🔮 Purple</option>
            </select>
          </div>
        </div>

        <div id="offerCreateError" class="hidden text-xs p-1.5 rounded-lg text-center bg-rose-500/10 text-rose-400 border border-rose-500/20"></div>

        <div class="pt-2 flex items-center justify-end gap-2 border-t border-slate-800">
          <button type="button" onclick="closeCreateOfferModal()" class="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800">Cancel</button>
          <button type="submit" id="btnSubmitOffer" class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 text-xs font-bold shadow-sm">
            Publish Offer
          </button>
        </div>
      </form>
    </div>
  </div>

  <!-- Stack Trace & Crash Inspection Modal -->
  <div id="crashInspectModal" class="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm hidden flex items-center justify-center p-3">
    <div class="glass-card w-full max-w-lg p-4 sm:p-5 rounded-2xl glow-cyan space-y-3 border border-slate-700 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 class="text-xs sm:text-sm font-bold text-white flex items-center gap-1.5">
          <span class="text-rose-400">⚡</span> Crash Diagnostic Details
        </h3>
        <button onclick="closeCrashInspectModal()" class="text-slate-400 hover:text-white text-base font-bold">✕</button>
      </div>
      
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-1.5 text-xs">
        <div class="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <span class="text-slate-400 block text-[9px] uppercase">Error Type</span>
          <span id="inspectErrorType" class="font-bold text-rose-400 mono text-xs truncate block"></span>
        </div>
        <div class="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <span class="text-slate-400 block text-[9px] uppercase">Source</span>
          <span id="inspectSource" class="font-bold text-cyan-400 text-xs block"></span>
        </div>
        <div class="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <span class="text-slate-400 block text-[9px] uppercase">App Version</span>
          <span id="inspectVersion" class="font-bold text-white mono text-xs block"></span>
        </div>
        <div class="p-1.5 rounded-lg bg-slate-900 border border-slate-800">
          <span class="text-slate-400 block text-[9px] uppercase">Platform</span>
          <span id="inspectPlatform" class="font-bold text-indigo-400 text-xs block"></span>
        </div>
      </div>

      <div>
        <label class="block text-[10px] font-semibold text-slate-300 uppercase tracking-wider mb-1">Stack Frames</label>
        <div id="inspectFrames" class="p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs max-h-48 overflow-y-auto space-y-1"></div>
      </div>

      <div class="text-[10px] text-slate-500">
        Timestamp: <span id="inspectOccurredAt" class="text-slate-400 mono"></span>
      </div>

      <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
        <button type="button" onclick="closeCrashInspectModal()" class="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold">Close</button>
      </div>
    </div>
  </div>

  <!-- Toast Notification -->
  <div id="toast" class="fixed bottom-4 right-4 z-50 hidden px-3.5 py-2 rounded-xl bg-slate-800 text-white text-xs font-medium border border-slate-700 shadow-xl flex items-center gap-1.5"></div>

  <!-- Grant Pro Modal -->
  <div id="upgradeProModal" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm hidden flex items-center justify-center p-3">
    <div class="glass-card w-full max-w-sm p-4 sm:p-5 rounded-2xl glow-cyan space-y-3 border border-slate-700 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 class="text-sm font-bold text-white flex items-center gap-1.5">
          <span>💎</span> Grant Pro Access
        </h3>
        <button onclick="closeUpgradeProModal()" class="text-slate-400 hover:text-white text-base">✕</button>
      </div>

      <form id="grantProForm" onsubmit="handleGrantPro(event)" class="space-y-2.5">
        <div>
          <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Telegram User ID <span class="text-rose-400">*</span></label>
          <input type="text" id="grantTgUserId" required placeholder="123456789" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-violet-500 font-mono">
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">First Name</label>
            <input type="text" id="grantFirstName" placeholder="John" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-violet-500">
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Username</label>
            <input type="text" id="grantUsername" placeholder="@john_doe" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-violet-500">
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Plan</label>
            <select id="grantPlanType" class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-violet-500">
              <option value="lifetime">⭐ Lifetime Pro</option>
              <option value="annual">📅 1 Year</option>
              <option value="monthly">🌙 1 Month</option>
            </select>
          </div>
          <div>
            <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Days (0=Forever)</label>
            <input type="number" id="grantDurationDays" placeholder="0" min="0" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-violet-500">
          </div>
        </div>
        <div>
          <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Notes</label>
          <input type="text" id="grantNotes" placeholder="VIP Supporter / Referral" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-violet-500">
        </div>

        <div class="pt-2 flex justify-end gap-2 border-t border-slate-800">
          <button type="button" onclick="closeUpgradeProModal()" class="px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 text-xs font-semibold hover:bg-slate-800">Cancel</button>
          <button type="submit" id="btnSubmitGrantPro" class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-violet-500 to-indigo-600 text-white text-xs font-bold hover:from-violet-400 hover:to-indigo-500 shadow-sm">Grant Pro</button>
        </div>
      </form>
    </div>
  </div>

  <!-- Process Payout Modal -->
  <div id="processPayoutModal" class="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm hidden flex items-center justify-center p-3">
    <div class="glass-card w-full max-w-sm p-4 rounded-2xl glow-cyan space-y-3 border border-slate-700 max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <h3 class="text-sm font-bold text-white flex items-center gap-1.5">
          <span>💸</span> Process Payout
        </h3>
        <button onclick="closeProcessPayoutModal()" class="text-slate-400 hover:text-white text-base">✕</button>
      </div>

      <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 space-y-1 text-xs">
        <div class="flex justify-between"><span class="text-slate-400">User:</span> <span id="modalPayoutUser" class="font-bold text-white truncate max-w-[150px]"></span></div>
        <div class="flex justify-between"><span class="text-slate-400">Amount:</span> <span id="modalPayoutAmount" class="font-bold text-emerald-400 font-mono text-sm"></span></div>
        <div class="flex justify-between"><span class="text-slate-400">Method:</span> <span id="modalPayoutMethod" class="font-bold text-cyan-300 uppercase"></span></div>
        <div class="pt-1 border-t border-slate-800">
          <div class="text-slate-400 text-[10px] mb-0.5">Destination:</div>
          <div id="modalPayoutDetails" class="font-mono text-slate-200 bg-slate-950 p-1.5 rounded-lg border border-slate-800 text-[11px] break-all select-all"></div>
        </div>
      </div>

      <form id="processPayoutForm" onsubmit="handleProcessPayoutSubmit(event)" class="space-y-2.5">
        <input type="hidden" id="modalPayoutId">
        
        <div>
          <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Action</label>
          <select id="modalPayoutAction" onchange="togglePayoutActionFields()" class="w-full px-2 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs font-bold text-white focus:outline-none focus:border-cyan-500">
            <option value="completed">✅ Mark Paid (Completed)</option>
            <option value="rejected">❌ Reject & Refund</option>
          </select>
        </div>

        <div id="fieldUtr">
          <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">UTR / Reference Number</label>
          <input type="text" id="modalPayoutUtr" placeholder="426189218291" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono">
        </div>

        <div id="fieldRejectReason" class="hidden">
          <label class="block text-[10px] font-semibold text-slate-300 mb-0.5">Rejection Reason</label>
          <input type="text" id="modalPayoutReason" placeholder="Invalid UPI ID" class="w-full px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-700 text-xs text-white focus:outline-none focus:border-rose-500">
        </div>

        <div class="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
          <button type="button" onclick="closeProcessPayoutModal()" class="px-3 py-1.5 rounded-lg text-slate-400 hover:text-white text-xs font-semibold">Cancel</button>
          <button type="submit" id="btnSubmitProcessPayout" class="px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-bold shadow-sm">
            Confirm
          </button>
        </div>
      </form>
    </div>
  </div>

  <script>
    let adminToken = localStorage.getItem('tg_admin_secret') || '';
    let currentCategory = 'users';
    let currentTab = 'pro_users';

    const CATEGORY_MAP = {
      users: ['pro_users', 'referrals', 'broadcast'],
      sales: ['plans', 'offers', 'payments'],
      system: ['crashes', 'licenses']
    };

    window.addEventListener('DOMContentLoaded', () => {
      if (adminToken) {
        showDashboard();
      } else {
        showLogin();
      }
    });

    function showToast(msg) {
      const toast = document.getElementById('toast');
      toast.textContent = msg;
      toast.classList.remove('hidden');
      setTimeout(() => toast.classList.add('hidden'), 3000);
    }

    function showLogin() {
      document.getElementById('loginView').classList.remove('hidden');
      document.getElementById('dashboardView').classList.add('hidden');
      document.getElementById('logoutBtn').classList.add('hidden');
    }

    function showDashboard() {
      document.getElementById('loginView').classList.add('hidden');
      document.getElementById('dashboardView').classList.remove('hidden');
      document.getElementById('logoutBtn').classList.remove('hidden');
      loadStats();
      loadProUsers();
      loadPaymentTransactions();
      loadBotSubscribers();
      loadLicenses();
      loadPlans();
      loadTrialSettings();
      loadDiscounts();
      loadOffers();
      loadReferralSettings();
      loadPayoutRequests('pending');
      loadTopReferrers();
      loadCrashReports();
    }

    function selectAdminCategory(cat, btnEl) {
      currentCategory = cat;

      // Update Category pills UI
      document.querySelectorAll('.admin-cat-pill').forEach(btn => {
        btn.className = 'admin-cat-pill py-1.5 px-1 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 text-slate-400 hover:text-white';
      });
      if (btnEl) {
        btnEl.className = 'admin-cat-pill active py-1.5 px-1 sm:px-3 rounded-lg text-[11px] sm:text-xs font-bold transition-all text-center flex items-center justify-center gap-1 bg-violet-600 text-white shadow-sm';
      }

      // Filter visible subtabs
      const tabBtns = document.querySelectorAll('.admin-tab-btn');
      let firstVisibleTab = null;
      let activeTabStillVisible = false;

      tabBtns.forEach(b => {
        const tabName = b.getAttribute('data-tab');
        const tabCat = b.getAttribute('data-cat');
        if (cat === 'all' || tabCat === cat) {
          b.classList.remove('hidden');
          if (!firstVisibleTab) firstVisibleTab = tabName;
          if (tabName === currentTab) activeTabStillVisible = true;
        } else {
          b.classList.add('hidden');
        }
      });

      // If active tab was hidden by category filter, switch to first visible tab
      if (!activeTabStillVisible && firstVisibleTab) {
        const targetBtn = document.querySelector('.admin-tab-btn[data-tab="' + firstVisibleTab + '"]');
        switchAdminTab(firstVisibleTab, targetBtn);
      }
    }

    function switchAdminTab(tabName, clickedBtn) {
      currentTab = tabName;
      const allTabs = ['pro_users', 'payments', 'plans', 'offers', 'referrals', 'broadcast', 'crashes', 'licenses'];
      allTabs.forEach(t => {
        const el = document.getElementById('tab-' + t);
        if (el) el.classList.add('hidden');
      });

      const target = document.getElementById('tab-' + tabName);
      if (target) target.classList.remove('hidden');

      // Update button styling
      document.querySelectorAll('.admin-tab-btn').forEach(b => {
        b.className = 'admin-tab-btn px-2.5 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1 whitespace-nowrap transition-all text-slate-400 hover:text-white hover:bg-slate-800/70 border border-slate-800';
      });
      if (!clickedBtn) {
        clickedBtn = document.querySelector('.admin-tab-btn[data-tab="' + tabName + '"]');
      }
      if (clickedBtn) {
        clickedBtn.className = 'admin-tab-btn active px-2.5 py-1.5 rounded-lg font-bold text-[11px] sm:text-xs flex items-center gap-1 whitespace-nowrap transition-all bg-gradient-to-r from-violet-600 to-indigo-600 text-white shadow-sm border border-violet-500/40';
      }

      // Auto-load tab data
      if (tabName === 'pro_users') loadProUsers();
      else if (tabName === 'payments') loadPaymentTransactions();
      else if (tabName === 'plans') { loadPlans(); loadTrialSettings(); }
      else if (tabName === 'offers') { loadDiscounts(); loadOffers(); }
      else if (tabName === 'referrals') { loadReferralSettings(); loadPayoutRequests(); }
      else if (tabName === 'broadcast') loadBotSubscribers();
      else if (tabName === 'crashes') loadCrashReports();
      else if (tabName === 'licenses') loadLicenses();
    }

    async function loadStats() {
      try {
        const res = await fetch('/api/admin/stats', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (res.ok) {
          const data = await res.json();
          if (document.getElementById('statTotalProUsers')) document.getElementById('statTotalProUsers').textContent = data.totalProUsers || 0;
          if (document.getElementById('statActiveProUsers')) document.getElementById('statActiveProUsers').textContent = data.activeProUsers || 0;
          if (document.getElementById('statMonthlyUsers')) document.getElementById('statMonthlyUsers').textContent = data.monthlyProUsers || 0;
          if (document.getElementById('statAnnualUsers')) document.getElementById('statAnnualUsers').textContent = data.annualProUsers || 0;
          if (document.getElementById('statLifetimeUsers')) document.getElementById('statLifetimeUsers').textContent = data.lifetimeProUsers || 0;
          if (document.getElementById('statTotalRevenue')) document.getElementById('statTotalRevenue').textContent = (data.totalRevenueInr || 0).toLocaleString();

          if (document.getElementById('statTotalLicenses')) document.getElementById('statTotalLicenses').textContent = data.totalLicenses || 0;
          if (document.getElementById('statActiveDevices')) document.getElementById('statActiveDevices').textContent = data.activeDevices || 0;
          if (document.getElementById('statLifetime')) document.getElementById('statLifetime').textContent = data.lifetimeLicenses || 0;
          if (document.getElementById('statBanned')) document.getElementById('statBanned').textContent = data.bannedLicenses || 0;
          const crashStatEl = document.getElementById('statCrashReports');
          if (crashStatEl) {
            crashStatEl.textContent = data.totalCrashes || 0;
          }
        }
      } catch (err) {
        console.error('Stats error:', err);
      }
    }

    async function handleLogin(e) {
      e.preventDefault();
      const secret = document.getElementById('adminSecretInput').value.trim();
      const errEl = document.getElementById('loginError');
      errEl.classList.add('hidden');

      try {
        const res = await fetch('/api/admin/auth/verify', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer ' + secret
          },
          body: JSON.stringify({ secret })
        });
        const data = await res.json();
        if (res.ok && data.valid) {
          adminToken = secret;
          localStorage.setItem('tg_admin_secret', secret);
          showDashboard();
        } else {
          errEl.textContent = data.error || 'Invalid admin secret';
          errEl.classList.remove('hidden');
        }
      } catch (err) {
        errEl.textContent = 'Failed to connect to server';
        errEl.classList.remove('hidden');
      }
    }

    function logout() {
      localStorage.removeItem('tg_admin_secret');
      adminToken = '';
      showLogin();
    }

    function escapeHtml(str) {
      if (!str) return '';
      return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
    }

    // ── Pro Users Management ──
    let cachedProUsers = [];
    let currentProPlanFilter = 'all';

    async function loadProUsers(query = '') {
      const tbody = document.getElementById('proUsersTableBody');
      tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">Loading Pro subscriptions...</td></tr>';
      try {
        const url = query ? '/api/admin/pro-users?q=' + encodeURIComponent(query) : '/api/admin/pro-users';
        const res = await fetch(url, { headers: { 'Authorization': 'Bearer ' + adminToken } });
        if (!res.ok) {
          tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-rose-400">Failed to load Pro subscriptions</td></tr>';
          return;
        }
        const data = await res.json();
        cachedProUsers = data.users || [];
        document.getElementById('proUsersCountBadge').textContent = \`\${cachedProUsers.length} Account(s)\`;
        renderProUsers();
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-rose-400">Network error loading Pro subscriptions</td></tr>';
      }
    }

    function handleProUserSearch() {
      const q = document.getElementById('proUserSearchInput').value.toLowerCase().trim();
      renderProUsers(q);
    }

    function filterProUsersByPlan(plan, btnEl) {
      currentProPlanFilter = plan;
      document.querySelectorAll('.pro-plan-filter-btn').forEach(b => {
        b.className = 'pro-plan-filter-btn px-2 py-1 rounded-lg bg-slate-900 border border-slate-700/80 text-slate-300 font-bold text-[10px] hover:bg-slate-800 whitespace-nowrap';
      });
      if (btnEl) {
        btnEl.className = 'pro-plan-filter-btn px-2 py-1 rounded-lg bg-violet-600 text-white font-bold text-[10px] shadow-sm whitespace-nowrap';
      }
      handleProUserSearch();
    }

    function renderProUsers(query = '') {
      const tbody = document.getElementById('proUsersTableBody');
      const now = Math.floor(Date.now() / 1000);

      let filtered = cachedProUsers;
      if (query) {
        filtered = filtered.filter(u => 
          String(u.telegram_user_id).includes(query) ||
          (u.username && u.username.toLowerCase().includes(query)) ||
          (u.first_name && u.first_name.toLowerCase().includes(query)) ||
          (u.phone_number && u.phone_number.includes(query))
        );
      }

      if (currentProPlanFilter === 'monthly') {
        filtered = filtered.filter(u => u.plan_type === 'monthly');
      } else if (currentProPlanFilter === 'annual') {
        filtered = filtered.filter(u => u.plan_type === 'annual');
      } else if (currentProPlanFilter === 'lifetime') {
        filtered = filtered.filter(u => u.plan_type === 'lifetime');
      } else if (currentProPlanFilter === 'expired') {
        filtered = filtered.filter(u => u.expires_at && u.expires_at <= now);
      }

      if (filtered.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-4 py-8 text-center text-slate-500">No matching Pro accounts found.</td></tr>';
        return;
      }

      tbody.innerHTML = filtered.map(u => {
        const joined = u.created_at ? new Date(u.created_at * 1000).toLocaleDateString('en-IN') : '—';
        const isBanned = u.is_banned === 1;
        const isExpired = Boolean(u.expires_at && u.expires_at <= now);

        let planBadge = '';
        if (u.plan_type === 'monthly') {
          planBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-purple-500/20 text-purple-300 border border-purple-500/30">📅 Monthly Pass</span>';
        } else if (u.plan_type === 'annual') {
          planBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-sky-500/20 text-sky-300 border border-sky-500/30">🌟 Annual Pass</span>';
        } else if (u.plan_type === 'lifetime') {
          planBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">👑 Lifetime VIP</span>';
        } else {
          planBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-black uppercase bg-slate-800 text-slate-300 border border-slate-700">' + (u.plan_type || 'PRO') + '</span>';
        }

        let statusBadge = '';
        if (isBanned) {
          statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">🚫 Banned</span>';
        } else if (isExpired) {
          statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse">🔴 Expired</span>';
        } else {
          statusBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">🟢 Active</span>';
        }

        let expiryDisplay = '';
        if (!u.expires_at || u.plan_type === 'lifetime') {
          expiryDisplay = '<span class="text-amber-400 font-bold font-mono">👑 Lifetime</span>';
        } else {
          const diff = u.expires_at - now;
          const expDate = new Date(u.expires_at * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
          if (diff <= 0) {
            const expDaysAgo = Math.floor(Math.abs(diff) / 86400);
            expiryDisplay = '<span class="text-rose-400 font-bold font-mono">🔴 Expired ' + (expDaysAgo > 0 ? expDaysAgo + 'd ago' : 'today') + '</span>';
          } else {
            const daysLeft = Math.floor(diff / 86400);
            const hoursLeft = Math.floor((diff % 86400) / 3600);
            const cdText = daysLeft > 0 ? (daysLeft + 'd left') : (hoursLeft + 'h left');
            if (daysLeft <= 3) {
              expiryDisplay = '<span class="text-amber-400 font-bold font-mono">⚠️ ' + cdText + ' (' + expDate + ')</span>';
            } else {
              expiryDisplay = '<span class="text-emerald-400 font-bold font-mono">🟢 ' + cdText + ' (' + expDate + ')</span>';
            }
          }
        }

        const nameDisp = u.first_name || u.username ? ((u.first_name || '') + (u.username ? ' (@' + u.username + ')' : '')).trim() : 'Telegram User';

        return \`
          <tr class="hover:bg-slate-900/50 transition-colors">
            <td class="card-header-cell px-3 py-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-2">
                  <span class="text-base">\${u.plan_type === 'lifetime' ? '👑' : '💎'}</span>
                  <div>
                    <div class="flex items-center gap-1.5">
                      <span class="font-mono font-bold text-white text-xs">\${u.telegram_user_id}</span>
                      <button type="button" onclick="navigator.clipboard.writeText('\${u.telegram_user_id}'); showToast('Copied ID!')" class="text-slate-500 hover:text-white text-xs">📋</button>
                    </div>
                    <div class="text-[11px] font-sans font-normal text-slate-400 truncate max-w-xs">\${nameDisp}</div>
                  </div>
                </div>
                <div class="sm:hidden">\${statusBadge}</div>
              </div>
            </td>
            <td class="px-3 py-1 sm:py-2 text-slate-300 font-mono text-xs flex items-center justify-between">
              <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Phone:</span>
              <span>\${u.phone_number || '—'}</span>
            </td>
            <td class="px-3 py-1 sm:py-2 flex items-center justify-between">
              <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Plan:</span>
              <span>\${planBadge}</span>
            </td>
            <td class="px-3 py-1 sm:py-2 hidden sm:table-cell">\${statusBadge}</td>
            <td class="px-3 py-1 sm:py-2 text-xs flex items-center justify-between">
              <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Expiry:</span>
              <span>\${expiryDisplay}</span>
            </td>
            <td class="px-3 py-1 sm:py-2 text-slate-400 text-xs flex items-center justify-between">
              <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Joined:</span>
              <span>\${joined}</span>
            </td>
            <td class="card-actions-cell px-3 py-2 text-right whitespace-nowrap">
              <button onclick="handleQuickExtend('\${u.telegram_user_id}', 30, 'monthly')" title="Extend +30 Days" class="px-2 py-1 rounded bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 font-bold text-[10px] transition-all">+30d</button>
              <button onclick="handleQuickExtend('\${u.telegram_user_id}', 365, 'annual')" title="Extend +1 Year" class="px-2 py-1 rounded bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 font-bold text-[10px] transition-all">+1yr</button>
              <button onclick="handleQuickExtend('\${u.telegram_user_id}', 0, 'lifetime')" title="Make Lifetime VIP" class="px-2 py-1 rounded bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 font-bold text-[10px] transition-all">👑 VIP</button>
              \${isBanned 
                ? \`<button onclick="handleUnbanProUser('\${u.telegram_user_id}')" class="px-2 py-1 rounded bg-emerald-500/20 text-emerald-400 hover:bg-emerald-500/30 font-bold text-[10px]">Unban</button>\`
                : \`<button onclick="handleBanProUser('\${u.telegram_user_id}')" class="px-2 py-1 rounded bg-rose-500/20 text-rose-400 hover:bg-rose-500/30 font-bold text-[10px]">Ban</button>\`
              }
              <button onclick="handleDeleteProUser('\${u.telegram_user_id}')" class="px-2 py-1 rounded bg-slate-800 text-slate-400 hover:text-rose-400 font-bold text-[10px]">Delete</button>
            </td>
          </tr>
        \`;
      }).join('');
    }

    async function handleQuickExtend(tgUserId, days, planType) {
      if (!confirm(\`Extend user \${tgUserId} by \${days === 0 ? 'LIFETIME' : days + ' days'} (\${planType})?\`)) return;
      try {
        const res = await fetch('/api/admin/pro-users/extend', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_user_id: tgUserId, duration_days: days, plan_type: planType })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Updated Pro plan successfully!');
          loadProUsers();
          loadStats();
        } else {
          showToast(data.error || 'Failed to update user');
        }
      } catch (err) {
        showToast('Network error');
      }
    }

    async function handleBanProUser(tgUserId) {
      if (!confirm(\`Ban user \${tgUserId} from Telegram Pro access?\`)) return;
      try {
        const res = await fetch('/api/admin/pro-users/ban', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_user_id: tgUserId })
        });
        if (res.ok) {
          showToast('User banned');
          loadProUsers();
          loadStats();
        } else {
          showToast('Failed to ban user');
        }
      } catch (err) {
        showToast('Network error');
      }
    }

    async function handleUnbanProUser(tgUserId) {
      try {
        const res = await fetch('/api/admin/pro-users/unban', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_user_id: tgUserId })
        });
        if (res.ok) {
          showToast('User unbanned');
          loadProUsers();
          loadStats();
        } else {
          showToast('Failed to unban user');
        }
      } catch (err) {
        showToast('Network error');
      }
    }

    async function handleDeleteProUser(tgUserId) {
      if (!confirm(\`Permanently delete Pro status for user \${tgUserId}?\`)) return;
      try {
        const res = await fetch('/api/admin/pro-users/delete', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({ telegram_user_id: tgUserId })
        });
        if (res.ok) {
          showToast('User Pro record deleted');
          loadProUsers();
          loadStats();
        } else {
          showToast('Failed to delete user');
        }
      } catch (err) {
        showToast('Network error');
      }
    }

    function openUpgradeProModal() {
      document.getElementById('upgradeProModal').classList.remove('hidden');
    }

    function closeUpgradeProModal() {
      document.getElementById('upgradeProModal').classList.add('hidden');
      document.getElementById('grantProForm').reset();
    }

    async function handleGrantPro(e) {
      e.preventDefault();
      const tgUserId = document.getElementById('grantTgUserId').value.trim();
      const firstName = document.getElementById('grantFirstName').value.trim();
      const username = document.getElementById('grantUsername').value.trim().replace(/^@/, '');
      const planType = document.getElementById('grantPlanType').value;
      const durationDays = parseInt(document.getElementById('grantDurationDays').value, 10) || 0;
      const notes = document.getElementById('grantNotes').value.trim();

      const btn = document.getElementById('btnSubmitGrantPro');
      btn.disabled = true;
      btn.textContent = 'Granting...';

      try {
        const res = await fetch('/api/admin/pro-users/grant', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            telegram_user_id: tgUserId,
            first_name: firstName,
            username: username,
            plan_type: planType,
            duration_days: durationDays,
            notes: notes
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Pro granted to ' + tgUserId);
          closeUpgradeProModal();
          loadProUsers();
          loadStats();
        } else {
          showToast(data.error || 'Failed to grant Pro');
        }
      } catch (err) {
        showToast('Network error');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Grant Pro';
      }
    }

    // ── Payment Transactions (Razorpay) ──
    async function loadPaymentTransactions() {
      const tbody = document.getElementById('paymentTransactionsTableBody');
      tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-slate-500">Loading transactions...</td></tr>';
      try {
        const res = await fetch('/api/admin/payment-transactions', { headers: { 'Authorization': 'Bearer ' + adminToken } });
        if (!res.ok) return;
        const data = await res.json();
        const txs = data.transactions || [];

        if (txs.length === 0) {
          tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-slate-500">No payment transactions recorded yet.</td></tr>';
          return;
        }

        tbody.innerHTML = txs.map(t => {
          const amt = '₹' + (t.amount >= 100 ? (t.amount / 100).toFixed(2) : t.amount);
          const created = t.created_at ? new Date(t.created_at * 1000).toLocaleString('en-IN') : '—';
          const paid = t.paid_at ? new Date(t.paid_at * 1000).toLocaleString('en-IN') : '—';
          const statusBadge = t.status === 'paid'
            ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">✅ Paid</span>'
            : t.status === 'created'
              ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">⏳ Created</span>'
              : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">❌ Failed</span>';

          const planDisp = t.plan_type === 'monthly'
            ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300">📅 Monthly</span>'
            : t.plan_type === 'annual'
              ? '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-sky-500/20 text-sky-300">🌟 Annual</span>'
              : '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300">👑 Lifetime</span>';

          return \`
            <tr class="hover:bg-slate-900/50 transition-colors">
              <td class="card-header-cell px-3 py-2">
                <div class="flex items-center justify-between">
                  <div class="font-mono font-bold text-white text-xs truncate max-w-[200px]">\${t.order_id}</div>
                  <div class="sm:hidden">\${statusBadge}</div>
                </div>
              </td>
              <td class="px-3 py-1 sm:py-2 font-mono text-slate-300 text-xs flex items-center justify-between">
                <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Payment ID:</span>
                <span>\${t.payment_id || '—'}</span>
              </td>
              <td class="px-3 py-1 sm:py-2 text-cyan-400 text-xs flex items-center justify-between">
                <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Telegram User:</span>
                <span class="font-mono">\${t.telegram_user_id} \${t.phone_number ? '(' + t.phone_number + ')' : ''}</span>
              </td>
              <td class="px-3 py-1 sm:py-2 flex items-center justify-between">
                <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Plan:</span>
                <span>\${planDisp}</span>
              </td>
              <td class="px-3 py-1 sm:py-2 font-mono font-bold text-emerald-400 text-xs flex items-center justify-between">
                <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Amount:</span>
                <span>\${amt}</span>
              </td>
              <td class="px-3 py-1 sm:py-2 hidden sm:table-cell">\${statusBadge}</td>
              <td class="px-3 py-1 sm:py-2 text-slate-400 text-[11px] flex items-center justify-between">
                <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Created:</span>
                <span>\${created}</span>
              </td>
              <td class="px-3 py-1 sm:py-2 text-slate-400 text-[11px] flex items-center justify-between">
                <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Paid:</span>
                <span>\${paid}</span>
              </td>
              <td class="card-actions-cell px-3 py-2 text-right">
                <button type="button" onclick="handleVerifyPaymentLink('\${t.order_id}', '\${t.payment_id || ''}', '\${t.telegram_user_id}')" class="px-2.5 py-1 rounded-lg bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 border border-cyan-500/40 text-[10px] font-bold transition-all active:scale-95 whitespace-nowrap">
                  ⚡ Verify with Razorpay
                </button>
              </td>
            </tr>
          \`;
        }).join('');
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="9" class="px-4 py-8 text-center text-rose-400">Error loading payment transactions</td></tr>';
      }
    }

    async function handleVerifyPaymentLink(orderId, paymentId, tgUserId) {
      if (!confirm(\`Verify order \${orderId} against Razorpay API now?\`)) return;
      try {
        const res = await fetch('/api/admin/payments/verify-link', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: orderId,
            payment_link_id: orderId.startsWith('plink_') ? orderId : undefined,
            payment_id: paymentId || undefined,
            telegram_user_id: tgUserId
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Payment verified successfully: ' + data.status);
          loadPaymentTransactions();
          loadProUsers();
          loadStats();
        } else {
          showToast(data.error || 'Verification returned status: ' + (data.status || 'unknown'));
        }
      } catch (err) {
        showToast('Network error verifying payment link');
      }
    }

    // ── Plans & Dynamic Pricing ──
    async function loadPlans() {
      try {
        const res = await fetch('/api/admin/plans', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (!res.ok) return;
        const data = await res.json();
        if (document.getElementById('planLifetimePrice')) {
          document.getElementById('planLifetimePrice').value = data.lifetime_price || 499;
          document.getElementById('planLifetimeOrig').value = data.lifetime_orig || 1499;
          document.getElementById('planLifetimeUrl').value = data.lifetime_url || '';

          document.getElementById('planAnnualPrice').value = data.annual_price || 299;
          document.getElementById('planAnnualOrig').value = data.annual_orig || 599;
          document.getElementById('planAnnualUrl').value = data.annual_url || '';

          document.getElementById('planMonthlyPrice').value = data.monthly_price || 49;
          document.getElementById('planMonthlyOrig').value = data.monthly_orig || 99;
          document.getElementById('planMonthlyUrl').value = data.monthly_url || '';
        }
      } catch (err) {
        console.error('Failed to load plans:', err);
      }
    }

    async function handleSavePlans(e) {
      e.preventDefault();
      const btn = document.getElementById('btnSavePlans');
      const msgBox = document.getElementById('plansUpdateMsg');
      btn.disabled = true;
      btn.textContent = 'Saving Plans…';
      msgBox.classList.add('hidden');

      const payload = {
        lifetime_price: parseFloat(document.getElementById('planLifetimePrice').value) || 499,
        lifetime_orig: parseFloat(document.getElementById('planLifetimeOrig').value) || 1499,
        lifetime_url: document.getElementById('planLifetimeUrl').value.trim(),
        annual_price: parseFloat(document.getElementById('planAnnualPrice').value) || 299,
        annual_orig: parseFloat(document.getElementById('planAnnualOrig').value) || 599,
        annual_url: document.getElementById('planAnnualUrl').value.trim(),
        monthly_price: parseFloat(document.getElementById('planMonthlyPrice').value) || 49,
        monthly_orig: parseFloat(document.getElementById('planMonthlyOrig').value) || 99,
        monthly_url: document.getElementById('planMonthlyUrl').value.trim(),
      };

      try {
        const res = await fetch('/api/admin/plans', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          msgBox.className = 'mt-2 text-xs p-2 rounded-xl text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          msgBox.textContent = data.message || 'All membership plans updated successfully! Apps will sync immediately.';
          msgBox.classList.remove('hidden');
          showToast('Membership plans saved live!');
        } else {
          msgBox.className = 'mt-2 text-xs p-2 rounded-xl text-center bg-rose-500/10 text-rose-400 border border-rose-500/20';
          msgBox.textContent = data.error || 'Failed to save plans.';
          msgBox.classList.remove('hidden');
        }
      } catch (err) {
        msgBox.className = 'mt-2 text-xs p-2 rounded-xl text-center bg-rose-500/10 text-rose-400 border border-rose-500/20';
        msgBox.textContent = 'Network error while updating plans.';
        msgBox.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save All Membership Plans';
      }
    }

    // ── Free Trial Controller ──
    async function loadTrialSettings() {
      try {
        const res = await fetch('/api/admin/trial', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (!res.ok) return;
        const data = await res.json();
        const enabled = !!data.trial_enabled;
        const days = data.trial_days || 30;

        document.getElementById('inputTrialEnabled').value = enabled ? '1' : '0';
        document.getElementById('inputTrialDays').value = String(days);
        
        let label = days + ' Days';
        if (days === 30) label = '1 Month (30 Days)';
        else if (days === 90) label = '3 Months (90 Days)';
        else if (days === 365) label = '1 Year (365 Days)';

        document.getElementById('displayTrialDuration').textContent = enabled ? label : 'Disabled';
        document.getElementById('trialStatusBadge').textContent = enabled ? '🟢 Active: ' + label : '🔴 Disabled';
        document.getElementById('trialStatusBadge').className = enabled ? 'text-[10px] text-emerald-400 font-semibold' : 'text-[10px] text-rose-400 font-semibold';
      } catch (err) {
        console.error('Failed to load trial settings:', err);
      }
    }

    async function handleUpdateTrial(e) {
      e.preventDefault();
      const enabled = document.getElementById('inputTrialEnabled').value === '1';
      const days = parseInt(document.getElementById('inputTrialDays').value, 10) || 30;

      const btn = document.getElementById('btnUpdateTrial');
      const msgBox = document.getElementById('trialUpdateMsg');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      msgBox.classList.add('hidden');

      try {
        const res = await fetch('/api/admin/trial/update', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ trial_enabled: enabled, trial_days: days })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          msgBox.className = 'mt-2 text-xs p-2 rounded-xl text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          msgBox.textContent = data.message || 'Trial settings saved!';
          msgBox.classList.remove('hidden');

          let label = days + ' Days';
          if (days === 30) label = '1 Month (30 Days)';
          else if (days === 90) label = '3 Months (90 Days)';
          else if (days === 365) label = '1 Year (365 Days)';

          document.getElementById('displayTrialDuration').textContent = enabled ? label : 'Disabled';
          document.getElementById('trialStatusBadge').textContent = enabled ? '🟢 Active: ' + label : '🔴 Disabled';
          document.getElementById('trialStatusBadge').className = enabled ? 'text-[10px] text-emerald-400 font-semibold' : 'text-[10px] text-rose-400 font-semibold';
          showToast('Free trial settings updated live!');
        } else {
          msgBox.className = 'mt-2 text-xs p-2 rounded-xl text-center bg-rose-500/10 text-rose-400 border border-rose-500/20';
          msgBox.textContent = data.error || 'Failed to update trial settings.';
          msgBox.classList.remove('hidden');
        }
      } catch (err) {
        msgBox.className = 'mt-2 text-xs p-2 rounded-xl text-center bg-rose-500/10 text-rose-400 border border-rose-500/20';
        msgBox.textContent = 'Network error while updating trial.';
        msgBox.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Trial';
      }
    }

    // ── Flash Deals & Offers ──
    async function loadOffers() {
      const container = document.getElementById('offersList');
      try {
        const res = await fetch('/api/admin/offers', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (!res.ok) {
          container.innerHTML = '<p class="text-xs text-slate-500 py-3 italic col-span-full text-center">Unable to load offers from server.</p>';
          return;
        }
        const data = await res.json();
        const offers = data.offers || [];

        if (offers.length === 0) {
          container.innerHTML = '<p class="text-xs text-slate-500 py-4 italic col-span-full text-center">No promotional offers published yet. Click "+ New Offer" to launch a campaign!</p>';
          return;
        }

        container.innerHTML = offers.map(o => {
          const isActive = o.is_active === 1;
          const now = Math.floor(Date.now() / 1000);
          const isExpired = o.countdown_end && o.countdown_end <= now;
          
          let statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE NOW</span>';
          if (isExpired) {
            statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">EXPIRED</span>';
          } else if (!isActive) {
            statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">PAUSED</span>';
          }

          let countdownText = 'Ongoing';
          if (o.countdown_end) {
            const remSec = o.countdown_end - now;
            if (remSec <= 0) {
              countdownText = 'Expired';
            } else {
              const hours = Math.floor(remSec / 3600);
              const mins = Math.floor((remSec % 3600) / 60);
              countdownText = hours + 'h ' + mins + 'm remaining';
            }
          }

          let styleBorder = 'border-amber-500/40 bg-gradient-to-br from-amber-500/10 via-slate-900/90 to-slate-950';
          let badgeColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
          if (o.banner_style === 'fire') {
            styleBorder = 'border-orange-500/40 bg-gradient-to-br from-orange-500/10 via-slate-900/90 to-slate-950';
            badgeColor = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
          } else if (o.banner_style === 'cyan') {
            styleBorder = 'border-cyan-500/40 bg-gradient-to-br from-cyan-500/10 via-slate-900/90 to-slate-950';
            badgeColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
          } else if (o.banner_style === 'emerald') {
            styleBorder = 'border-emerald-500/40 bg-gradient-to-br from-emerald-500/10 via-slate-900/90 to-slate-950';
            badgeColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
          } else if (o.banner_style === 'purple') {
            styleBorder = 'border-purple-500/40 bg-gradient-to-br from-purple-500/10 via-slate-900/90 to-slate-950';
            badgeColor = 'text-purple-400 bg-purple-500/10 border-purple-500/20';
          }

          const perksHtml = (o.perks_list || []).map(p => 
            '<div class="flex items-center gap-1.5 text-[11px] text-slate-300"><span>✓</span><span>' + p + '</span></div>'
          ).join('');

          return \`
            <div class="p-3 sm:p-3.5 rounded-2xl border \${styleBorder} flex flex-col justify-between gap-2 shadow-sm transition-all">
              <div class="space-y-1.5">
                <div class="flex items-start justify-between gap-2">
                  <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border \${badgeColor}">
                    \${o.badge || 'LIMITED OFFER'}
                  </span>
                  <div>\${statusBadge}</div>
                </div>

                <div>
                  <h4 class="text-xs sm:text-sm font-bold text-white">\${o.title}</h4>
                  <p class="text-[11px] text-slate-400 mt-0.5">\${o.description}</p>
                </div>

                <div class="flex items-baseline gap-2 pt-0.5">
                  <span class="text-sm sm:text-base font-black text-emerald-400 font-mono">₹\${o.offer_price || 0}</span>
                  \${o.original_price ? \`<span class="text-xs text-slate-500 line-through">₹\${o.original_price}</span>\` : ''}
                  \${o.coupon_code ? \`<span class="text-[9px] font-bold text-indigo-400 bg-indigo-500/10 px-1.5 py-0.5 rounded border border-indigo-500/20">CODE: \${o.coupon_code}</span>\` : ''}
                </div>

                \${perksHtml ? \`<div class="p-1.5 rounded-lg bg-slate-950/60 border border-slate-800/80 space-y-0.5">\${perksHtml}</div>\` : ''}
              </div>

              <div class="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[10px]">
                <span class="text-slate-400">⏳ \${countdownText}</span>
                <div class="flex items-center gap-1">
                  <button onclick="toggleOfferActive('\${o.id}', \${isActive ? 1 : 0})" class="px-2 py-0.5 rounded text-[10px] font-semibold \${isActive ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}">
                    \${isActive ? 'Pause' : 'Activate'}
                  </button>
                  <button onclick="deleteOffer('\${o.id}')" class="text-slate-500 hover:text-rose-400 text-xs p-1" title="Delete">
                    🗑️
                  </button>
                </div>
              </div>
            </div>
          \`;
        }).join('');
      } catch (err) {
        container.innerHTML = '<p class="text-xs text-rose-400 py-3 italic col-span-full text-center">Failed to load offers.</p>';
      }
    }

    function openCreateOfferModal() {
      document.getElementById('createOfferModal').classList.remove('hidden');
    }

    function closeCreateOfferModal() {
      document.getElementById('createOfferModal').classList.add('hidden');
      document.getElementById('createOfferForm').reset();
      document.getElementById('offerCreateError').classList.add('hidden');
    }

    function calculateOfferPrice() {
      const type = document.getElementById('offerDiscountType').value;
      const orig = parseFloat(document.getElementById('offerOriginalPrice').value) || 0;
      const val = parseFloat(document.getElementById('offerDiscountValue').value) || 0;
      let finalPrice = orig;

      if (type === 'percent') {
        finalPrice = Math.max(0, orig - (orig * (val / 100)));
      } else if (type === 'flat') {
        finalPrice = Math.max(0, orig - val);
      } else {
        finalPrice = val;
      }
      document.getElementById('offerFinalPrice').value = finalPrice.toFixed(2);
    }

    async function handleCreateOffer(e) {
      e.preventDefault();
      const errBox = document.getElementById('offerCreateError');
      errBox.classList.add('hidden');

      const perks = [];
      document.querySelectorAll('input[name="offerPerk"]:checked').forEach(c => perks.push(c.value));
      const customPerk = document.getElementById('offerCustomPerk').value.trim();
      if (customPerk) perks.push(customPerk);

      const durationHours = parseInt(document.getElementById('offerDurationInput').value, 10);
      let countdownEnd = null;
      if (durationHours > 0) {
        countdownEnd = Math.floor(Date.now() / 1000) + (durationHours * 3600);
      }

      const payload = {
        title: document.getElementById('offerTitleInput').value.trim(),
        badge: document.getElementById('offerBadgeInput').value.trim(),
        description: document.getElementById('offerDescriptionInput').value.trim(),
        original_price: parseFloat(document.getElementById('offerOriginalPrice').value) || null,
        offer_price: parseFloat(document.getElementById('offerFinalPrice').value) || 0,
        discount_type: document.getElementById('offerDiscountType').value,
        discount_value: parseFloat(document.getElementById('offerDiscountValue').value) || 0,
        countdown_end: countdownEnd,
        coupon_code: document.getElementById('offerCouponInput').value.trim().toUpperCase() || null,
        banner_style: document.getElementById('offerStyleInput').value,
        perks_list: perks
      };

      const btn = document.getElementById('btnSubmitOffer');
      btn.disabled = true;
      btn.textContent = 'Publishing...';

      try {
        const res = await fetch('/api/admin/offers/create', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Offer published live!');
          closeCreateOfferModal();
          loadOffers();
        } else {
          errBox.textContent = data.error || 'Failed to create offer.';
          errBox.classList.remove('hidden');
        }
      } catch (err) {
        errBox.textContent = 'Network error publishing offer.';
        errBox.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Publish Offer';
      }
    }

    async function toggleOfferActive(offerId, currentActive) {
      try {
        const res = await fetch('/api/admin/offers/toggle', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: offerId, is_active: currentActive ? 0 : 1 })
        });
        if (res.ok) {
          showToast(currentActive ? 'Offer paused.' : 'Offer activated!');
          loadOffers();
        } else {
          showToast('Failed to update offer state.');
        }
      } catch (err) {
        showToast('Network error updating offer.');
      }
    }

    async function deleteOffer(offerId) {
      if (!confirm('Are you sure you want to permanently delete this offer?')) return;
      try {
        const res = await fetch('/api/admin/offers/delete', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: offerId })
        });
        if (res.ok) {
          showToast('Offer deleted.');
          loadOffers();
        } else {
          showToast('Failed to delete offer.');
        }
      } catch (err) {
        showToast('Network error deleting offer.');
      }
    }

    // ── Coupons ──
    async function loadDiscounts() {
      const container = document.getElementById('couponsList');
      try {
        const res = await fetch('/api/admin/discounts', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (!res.ok) {
          container.innerHTML = '<p class="text-xs text-slate-500 py-3 italic col-span-full text-center">Unable to load coupons from server.</p>';
          return;
        }
        const data = await res.json();
        const discounts = data.discounts || [];

        if (discounts.length === 0) {
          container.innerHTML = '<p class="text-xs text-slate-500 py-3 italic col-span-full text-center">No active coupons. Click "+ New Coupon" to create one!</p>';
          return;
        }

        container.innerHTML = discounts.map(d => {
          const discountVal = d.amount_type === 'percent' ? d.amount + '% OFF' : '₹' + d.amount + ' OFF';
          const expiryStr = d.expires_at 
            ? new Date(d.expires_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'Never';
          const usageStr = d.is_limited_redemptions && d.max_redemptions 
            ? 'Limit: ' + d.max_redemptions
            : 'Unlimited';

          return \`
            <div class="p-2.5 rounded-xl bg-slate-900/80 border border-slate-700/70 hover:border-indigo-500/50 transition-all flex flex-col justify-between gap-1.5">
              <div class="flex items-start justify-between gap-1.5">
                <div>
                  <span class="mono text-xs font-bold text-indigo-400 tracking-wider">\${d.code}</span>
                  <div class="text-[10px] text-emerald-400 font-semibold mt-0.5">\${discountVal}</div>
                </div>
                <button onclick="copyToClipboard('\${d.code}')" class="text-slate-400 hover:text-indigo-400 text-xs p-1" title="Copy">📋</button>
              </div>
              <div class="flex items-center justify-between text-[9px] text-slate-400 border-t border-slate-800/80 pt-1.5">
                <div class="flex flex-col">
                  <span>👥 \${usageStr}</span>
                  <span>⏳ \${expiryStr}</span>
                </div>
                <button onclick="handleDeleteCoupon('\${d.id}', '\${d.code}')" class="px-1.5 py-0.5 rounded bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-medium text-[9px]">
                  Delete
                </button>
              </div>
            </div>
          \`;
        }).join('');
      } catch (err) {
        container.innerHTML = '<p class="text-xs text-rose-400 py-3 italic col-span-full text-center">Failed to fetch coupons.</p>';
      }
    }

    function openCreateCouponModal() {
      document.getElementById('createCouponModal').classList.remove('hidden');
    }

    function closeCreateCouponModal() {
      document.getElementById('createCouponModal').classList.add('hidden');
      document.getElementById('createCouponForm').reset();
      document.getElementById('couponCreateError').classList.add('hidden');
    }

    async function handleCreateCoupon(e) {
      e.preventDefault();
      const code = document.getElementById('couponCodeInput').value.trim().toUpperCase();
      const amount = parseFloat(document.getElementById('couponAmountInput').value);
      const amountType = document.getElementById('couponTypeInput').value;
      const limit = parseInt(document.getElementById('couponLimitInput').value, 10) || 0;
      const durationDays = parseInt(document.getElementById('couponDurationInput').value, 10) || 0;

      const btn = document.getElementById('btnSubmitCoupon');
      const errBox = document.getElementById('couponCreateError');
      btn.disabled = true;
      btn.textContent = 'Creating...';
      errBox.classList.add('hidden');

      let expiresAt = null;
      if (durationDays > 0) {
        const d = new Date();
        d.setDate(d.getDate() + durationDays);
        expiresAt = d.toISOString();
      }

      try {
        const res = await fetch('/api/admin/discounts/create', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            code: code,
            amount: amount,
            amount_type: amountType,
            max_redemptions: limit > 0 ? limit : null,
            expires_at: expiresAt
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Coupon ' + code + ' created!');
          closeCreateCouponModal();
          loadDiscounts();
        } else {
          errBox.textContent = data.error || 'Failed to create coupon.';
          errBox.classList.remove('hidden');
        }
      } catch (err) {
        errBox.textContent = 'Network error while creating coupon.';
        errBox.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Create Coupon';
      }
    }

    async function handleDeleteCoupon(discountId, code) {
      if (!confirm('Are you sure you want to delete coupon ' + code + '?')) return;
      try {
        const res = await fetch('/api/admin/discounts/delete', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: discountId })
        });
        if (res.ok) {
          showToast('Coupon deleted.');
          loadDiscounts();
        } else {
          showToast('Failed to delete coupon.');
        }
      } catch (err) {
        showToast('Network error while deleting coupon.');
      }
    }

    // ── Refer & Earn Controller ──
    async function loadReferralSettings() {
      try {
        const res = await fetch('/api/admin/referrals/settings', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (!res.ok) return;
        const data = await res.json();

        document.getElementById('inputReferralEnabled').value = data.enabled ? '1' : '0';
        document.getElementById('inputReferralRewardType').value = data.reward_type || 'fixed';
        document.getElementById('inputReferralRewardValue').value = data.reward_value || 50;
        document.getElementById('inputReferralFriendDiscount').value = data.friend_discount_percent || 10;
        document.getElementById('inputReferralMinPayout').value = data.min_payout_amount || 100;

        const valStr = data.reward_type === 'percent' ? data.reward_value + '%' : '₹' + data.reward_value;
        document.getElementById('displayReferralReward').textContent = valStr + ' / Sale';
        document.getElementById('referralStatusBadge').textContent = data.enabled ? '🟢 Active: ' + valStr + ' / Sale' : '🔴 Disabled';
      } catch (err) {
        console.error('Failed to load referral settings:', err);
      }
    }

    async function handleUpdateReferralSettings(e) {
      e.preventDefault();
      const btn = document.getElementById('btnSaveReferralSettings');
      const msgBox = document.getElementById('referralUpdateMsg');
      btn.disabled = true;
      btn.textContent = 'Saving...';
      msgBox.classList.add('hidden');

      const payload = {
        enabled: document.getElementById('inputReferralEnabled').value === '1',
        reward_type: document.getElementById('inputReferralRewardType').value,
        reward_value: parseFloat(document.getElementById('inputReferralRewardValue').value) || 50,
        friend_discount_percent: parseFloat(document.getElementById('inputReferralFriendDiscount').value) || 10,
        min_payout_amount: parseFloat(document.getElementById('inputReferralMinPayout').value) || 100
      };

      try {
        const res = await fetch('/api/admin/referrals/settings', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload)
        });
        const data = await res.json();
        if (res.ok && data.success) {
          msgBox.className = 'mt-2 text-xs p-2 rounded-xl text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          msgBox.textContent = 'Referral program settings updated live!';
          msgBox.classList.remove('hidden');
          showToast('Referral program settings saved!');
          loadReferralSettings();
        } else {
          msgBox.className = 'mt-2 text-xs p-2 rounded-xl text-center bg-rose-500/10 text-rose-400 border border-rose-500/20';
          msgBox.textContent = data.error || 'Failed to update referral settings.';
          msgBox.classList.remove('hidden');
        }
      } catch (err) {
        msgBox.className = 'mt-2 text-xs p-2 rounded-xl text-center bg-rose-500/10 text-rose-400 border border-rose-500/20';
        msgBox.textContent = 'Network error while updating referral settings.';
        msgBox.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Save Settings';
      }
    }

    // ── Withdrawal & Payout Requests ──
    async function loadPayoutRequests(statusFilter = 'pending', btnEl = null) {
      if (btnEl) {
        document.querySelectorAll('.payout-filter-btn').forEach(b => {
          b.className = 'payout-filter-btn px-2 py-1 rounded text-slate-400 hover:text-white font-semibold';
        });
        btnEl.className = 'payout-filter-btn px-2 py-1 rounded bg-cyan-500 text-slate-950 font-bold';
      }

      const tbody = document.getElementById('payoutsTableBody');
      tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Loading payout requests...</td></tr>';

      try {
        const res = await fetch('/api/admin/referrals/payouts?status=' + encodeURIComponent(statusFilter), {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (!res.ok) {
          tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-rose-400">Failed to load payouts.</td></tr>';
          return;
        }
        const data = await res.json();
        const payouts = data.payouts || [];

        const pendingCount = payouts.filter(p => p.status === 'pending').length;
        document.getElementById('pendingPayoutBadge').textContent = pendingCount + ' Pending';

        if (!payouts.length) {
          tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500 italic">No withdrawal requests found for this filter.</td></tr>';
          return;
        }

        tbody.innerHTML = payouts.map(p => {
          const dateStr = new Date(p.created_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
          
          let statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">PENDING</span>';
          if (p.status === 'completed') {
            statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">PAID</span>';
          } else if (p.status === 'rejected') {
            statusBadge = '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">REJECTED</span>';
          }

          let detailsStr = '';
          if (p.payout_method === 'upi') {
            detailsStr = '<strong>UPI:</strong> ' + (p.upi_id || 'N/A');
          } else {
            detailsStr = '<strong>Bank:</strong> ' + (p.bank_name || '') + ' | Acc: ' + (p.bank_account || '') + ' | IFSC: ' + (p.bank_ifsc || '');
          }

          let actionsHtml = '';
          if (p.status === 'pending') {
            actionsHtml = \`
              <button onclick="openProcessPayoutModal('\${p.id}', '\${p.user_email}', \${p.amount}, '\${p.payout_method}', '\${encodeURIComponent(detailsStr)}')" class="px-2.5 py-1 rounded bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-[11px] shadow-sm cursor-pointer">
                Process
              </button>
            \`;
          } else if (p.status === 'completed' && p.utr_number) {
            actionsHtml = '<span class="font-mono text-[10px] text-slate-400">UTR: ' + p.utr_number + '</span>';
          } else if (p.status === 'rejected' && p.admin_notes) {
            actionsHtml = '<span class="text-[10px] text-rose-400 italic">' + p.admin_notes + '</span>';
          }

          return \`
            <tr class="hover:bg-slate-900/50 transition-colors">
              <td class="card-header-cell px-3 py-2">
                <div class="flex items-center justify-between">
                  <div>
                    <div class="font-bold text-white text-xs">\${p.user_name || 'Partner'}</div>
                    <div class="text-[11px] text-slate-400">\${p.user_email}</div>
                    <div class="font-mono text-[10px] text-cyan-400 mt-0.5">\${p.referral_code}</div>
                  </div>
                  <div class="sm:hidden">\${statusBadge}</div>
                </div>
              </td>
              <td class="px-3 py-1 sm:py-2 font-mono font-black text-emerald-400 text-xs flex items-center justify-between">
                <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Amount:</span>
                <span>₹\${p.amount.toFixed(2)}</span>
              </td>
              <td class="px-3 py-1 sm:py-2 text-[11px] text-slate-300 max-w-xs flex items-center justify-between">
                <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Destination:</span>
                <span>\${detailsStr}</span>
              </td>
              <td class="px-3 py-1 sm:py-2 text-[11px] text-slate-400 whitespace-nowrap flex items-center justify-between">
                <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Date:</span>
                <span>\${dateStr}</span>
              </td>
              <td class="px-3 py-1 sm:py-2 whitespace-nowrap hidden sm:table-cell">\${statusBadge}</td>
              <td class="card-actions-cell px-3 py-2 text-right whitespace-nowrap">
                \${actionsHtml}
              </td>
            </tr>
          \`;
        }).join('');
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-rose-400">Network error loading payouts.</td></tr>';
      }
    }

    function openProcessPayoutModal(id, userEmail, amount, method, encDetails) {
      document.getElementById('modalPayoutId').value = id;
      document.getElementById('modalPayoutUser').textContent = userEmail;
      document.getElementById('modalPayoutAmount').textContent = '₹' + amount.toFixed(2);
      document.getElementById('modalPayoutMethod').textContent = method;
      document.getElementById('modalPayoutDetails').innerHTML = decodeURIComponent(encDetails);
      document.getElementById('processPayoutModal').classList.remove('hidden');
    }

    function closeProcessPayoutModal() {
      document.getElementById('processPayoutModal').classList.add('hidden');
      document.getElementById('processPayoutForm').reset();
    }

    function togglePayoutActionFields() {
      const action = document.getElementById('modalPayoutAction').value;
      if (action === 'completed') {
        document.getElementById('fieldUtr').classList.remove('hidden');
        document.getElementById('fieldRejectReason').classList.add('hidden');
      } else {
        document.getElementById('fieldUtr').classList.add('hidden');
        document.getElementById('fieldRejectReason').classList.remove('hidden');
      }
    }

    async function handleProcessPayoutSubmit(e) {
      e.preventDefault();
      const id = document.getElementById('modalPayoutId').value;
      const action = document.getElementById('modalPayoutAction').value;
      const utr = document.getElementById('modalPayoutUtr').value.trim();
      const reason = document.getElementById('modalPayoutReason').value.trim();

      const btn = document.getElementById('btnSubmitProcessPayout');
      btn.disabled = true;
      btn.textContent = 'Processing...';

      try {
        const res = await fetch('/api/admin/referrals/payouts/process', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            payout_id: id,
            action: action,
            utr_number: utr,
            admin_notes: reason
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          showToast('Payout processed successfully!');
          closeProcessPayoutModal();
          loadPayoutRequests('pending');
        } else {
          showToast(data.error || 'Failed to process payout.');
        }
      } catch (err) {
        showToast('Network error processing payout.');
      } finally {
        btn.disabled = false;
        btn.textContent = 'Confirm';
      }
    }

    // ── Leaderboard ──
    async function loadTopReferrers() {
      const container = document.getElementById('topReferrersList');
      try {
        const res = await fetch('/api/admin/referrals/leaderboard', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (!res.ok) return;
        const data = await res.json();
        const referrers = data.leaderboard || [];

        if (!referrers.length) {
          container.innerHTML = '<p class="text-xs text-slate-500 py-3 italic col-span-full text-center">No referrers active yet.</p>';
          return;
        }

        container.innerHTML = referrers.map((r, idx) => {
          let medal = '⭐';
          if (idx === 0) medal = '🥇';
          else if (idx === 1) medal = '🥈';
          else if (idx === 2) medal = '🥉';

          return \`
            <div class="p-2.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-sm">\${medal}</span>
                <div>
                  <div class="text-xs font-bold text-white truncate max-w-[120px]">\${r.user_name || 'Partner'}</div>
                  <div class="text-[10px] text-cyan-400 font-mono">\${r.referral_code}</div>
                </div>
              </div>
              <div class="text-right">
                <div class="text-xs font-black text-emerald-400 font-mono">₹\${(r.total_earnings || 0).toFixed(2)}</div>
                <div class="text-[9px] text-slate-400">\${r.total_referrals || 0} sales</div>
              </div>
            </div>
          \`;
        }).join('');
      } catch (err) {
        container.innerHTML = '<p class="text-xs text-rose-400 py-3 italic col-span-full text-center">Failed to load leaderboard.</p>';
      }
    }

    // ── Crash Diagnostics ──
    let cachedCrashReports = [];

    async function loadCrashReports() {
      const tbody = document.getElementById('crashReportsTableBody');
      try {
        const res = await fetch('/api/admin/crash-reports', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (res.status === 401) {
          logout();
          return;
        }
        if (!res.ok) {
          tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-rose-400">Failed to load crash reports.</td></tr>';
          return;
        }
        const data = await res.json();
        cachedCrashReports = data.reports || [];

        const statEl = document.getElementById('statCrashReports');
        if (statEl) {
          statEl.textContent = cachedCrashReports.length;
        }

        renderCrashReports(cachedCrashReports);
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="6" class="px-4 py-8 text-center text-rose-400">Network error fetching crash reports.</td></tr>';
      }
    }

    function renderCrashReports(reports) {
      const tbody = document.getElementById('crashReportsTableBody');
      if (!reports.length) {
        tbody.innerHTML = \`
          <tr>
            <td colspan="6" class="px-4 py-8 text-center">
              <div class="inline-flex items-center justify-center w-9 h-9 rounded-full bg-emerald-500/10 text-emerald-400 text-base mb-1 border border-emerald-500/20">✓</div>
              <div class="text-xs font-semibold text-white">No Crashes Recorded</div>
              <p class="text-[10px] text-slate-400 mt-0.5">Application builds are currently running healthy and crash-free!</p>
            </td>
          </tr>
        \`;
        return;
      }

      tbody.innerHTML = reports.map(r => {
        const dateStr = r.occurred_at
          ? new Date(r.occurred_at).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
          : new Date(r.created_at * 1000).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });

        let sourceBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">REACT</span>';
        if (r.source === 'window') sourceBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">WINDOW</span>';
        if (r.source === 'promise') sourceBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-purple-500/10 text-purple-400 border border-purple-500/20">PROMISE</span>';

        return \`
          <tr class="hover:bg-slate-800/40 transition-colors">
            <td class="card-header-cell px-3 py-2">
              <div class="flex items-center justify-between">
                <span class="mono font-bold text-rose-400 text-xs bg-rose-500/10 border border-rose-500/20 px-2 py-0.5 rounded">\${escapeHtml(r.error_type)}</span>
                <span class="sm:hidden">\${sourceBadge}</span>
              </div>
            </td>
            <td class="px-3 py-1 sm:py-2 hidden sm:table-cell">\${sourceBadge}</td>
            <td class="px-3 py-1 sm:py-2 font-mono font-semibold text-white text-xs flex items-center justify-between">
              <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Version:</span>
              <span>v\${escapeHtml(r.app_version)}</span>
            </td>
            <td class="px-3 py-1 sm:py-2 text-slate-300 text-xs flex items-center justify-between">
              <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Platform:</span>
              <span>\${escapeHtml(r.platform)}</span>
            </td>
            <td class="px-3 py-1 sm:py-2 text-slate-400 text-xs font-mono whitespace-nowrap flex items-center justify-between">
              <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Date:</span>
              <span>\${dateStr}</span>
            </td>
            <td class="card-actions-cell px-3 py-2 text-right">
              <div class="flex items-center justify-end gap-1">
                <button onclick="openCrashInspectModal('\${r.id}')" class="px-2 py-1 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 text-xs font-semibold transition-colors flex items-center gap-1">
                  <span>🔍</span> Inspect
                </button>
                <button onclick="handleDeleteCrash('\${r.id}')" class="p-1 rounded-lg hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 text-xs transition-colors" title="Delete">
                  ✕
                </button>
              </div>
            </td>
          </tr>
        \`;
      }).join('');
    }

    function openCrashInspectModal(reportId) {
      const report = cachedCrashReports.find(r => r.id === reportId);
      if (!report) return;

      document.getElementById('inspectErrorType').textContent = report.error_type || 'Unknown';
      document.getElementById('inspectSource').textContent = report.source || 'react';
      document.getElementById('inspectVersion').textContent = 'v' + (report.app_version || 'unknown');
      document.getElementById('inspectPlatform').textContent = report.platform || 'unknown';
      document.getElementById('inspectOccurredAt').textContent = report.occurred_at || new Date(report.created_at * 1000).toISOString();

      const framesBox = document.getElementById('inspectFrames');
      let frames = [];
      try {
        if (typeof report.stack_frames === 'string') {
          frames = JSON.parse(report.stack_frames);
        } else if (Array.isArray(report.stack_frames)) {
          frames = report.stack_frames;
        }
      } catch (err) {
        frames = [];
      }

      if (frames.length > 0) {
        framesBox.innerHTML = frames.map((f, idx) => \`
          <div class="text-[11px] leading-relaxed border-b border-slate-900 pb-1">
            <span class="text-slate-500">#\${idx}</span>
            <span class="text-cyan-300 font-semibold">\${escapeHtml(f.fn || f.function || 'anonymous')}</span>
            <span class="text-slate-400">at \${escapeHtml(f.file || 'unknown')}:\${f.line || '?'}:\${f.col || '?'}</span>
          </div>
        \`).join('');
      } else {
        framesBox.innerHTML = '<span class="text-slate-500 italic text-xs">No stack call frames captured.</span>';
      }

      document.getElementById('crashInspectModal').classList.remove('hidden');
    }

    function closeCrashInspectModal() {
      document.getElementById('crashInspectModal').classList.add('hidden');
    }

    async function handleDeleteCrash(reportId) {
      if (!confirm('Delete this crash report log?')) return;
      try {
        const res = await fetch('/api/admin/crash-reports/delete', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ id: reportId })
        });
        if (res.ok) {
          showToast('Crash report deleted');
          loadCrashReports();
          loadStats();
        } else {
          showToast('Failed to delete crash log');
        }
      } catch (err) {
        showToast('Network error deleting crash log');
      }
    }

    async function handleClearAllCrashes() {
      if (!cachedCrashReports.length) {
        showToast('No crash reports to clear');
        return;
      }
      if (!confirm('Are you sure you want to permanently clear all recorded crash reports?')) {
        return;
      }
      try {
        const res = await fetch('/api/admin/crash-reports/clear', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (res.ok) {
          showToast('All crash reports cleared successfully!');
          loadCrashReports();
          loadStats();
        } else {
          showToast('Failed to clear crash reports');
        }
      } catch (err) {
        showToast('Network error clearing crash reports');
      }
    }

    // ── Bot Broadcast ──
    async function loadBotSubscribers() {
      try {
        const res = await fetch('/api/admin/broadcast/subscribers', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (res.ok) {
          const data = await res.json();
          document.getElementById('botSubscriberCountBadge').textContent = \`\${data.total_subscribers || 0} Active Subscribers\`;
        }
      } catch (err) {}
    }

    async function handleSendBroadcast(e) {
      e.preventDefault();
      const text = document.getElementById('broadcastMessageInput').value.trim();
      const btnText = document.getElementById('broadcastButtonTextInput').value.trim();
      const btnUrl = document.getElementById('broadcastButtonUrlInput').value.trim();
      const statusBox = document.getElementById('broadcastStatusMsg');
      const btn = document.getElementById('btnSendBroadcast');

      if (!confirm('Are you sure you want to broadcast this message to ALL active bot users?')) return;

      btn.disabled = true;
      btn.textContent = 'Sending...';
      statusBox.classList.add('hidden');

      try {
        const res = await fetch('/api/admin/broadcast/send', {
          method: 'POST',
          headers: { 'Authorization': 'Bearer ' + adminToken, 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: text,
            button_text: btnText || undefined,
            button_url: btnUrl || undefined
          })
        });
        const data = await res.json();
        if (res.ok && data.success) {
          statusBox.className = 'text-xs p-2 rounded-xl text-center bg-emerald-500/10 text-emerald-400 border border-emerald-500/20';
          statusBox.textContent = \`Broadcast completed! Delivered: \${data.delivered || 0}, Failed: \${data.failed || 0}\`;
          statusBox.classList.remove('hidden');
          showToast('Broadcast sent successfully!');
        } else {
          statusBox.className = 'text-xs p-2 rounded-xl text-center bg-rose-500/10 text-rose-400 border border-rose-500/20';
          statusBox.textContent = data.error || 'Failed to dispatch broadcast';
          statusBox.classList.remove('hidden');
        }
      } catch (err) {
        statusBox.className = 'text-xs p-2 rounded-xl text-center bg-rose-500/10 text-rose-400 border border-rose-500/20';
        statusBox.textContent = 'Network error while broadcasting';
        statusBox.classList.remove('hidden');
      } finally {
        btn.disabled = false;
        btn.textContent = '🚀 Send Broadcast';
      }
    }

    // ── Legacy Software License Keys ──
    let cachedLicenses = [];

    async function loadLicenses() {
      const tbody = document.getElementById('licensesTableBody');
      try {
        const res = await fetch('/api/admin/licenses', {
          headers: { 'Authorization': 'Bearer ' + adminToken }
        });
        if (res.status === 401) {
          logout();
          return;
        }
        if (!res.ok) {
          tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-rose-400">Failed to load licenses.</td></tr>';
          return;
        }
        const data = await res.json();
        cachedLicenses = data.licenses || [];
        renderLicenses(cachedLicenses);
      } catch (err) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-rose-400">Failed to load licenses.</td></tr>';
      }
    }

    function renderLicenses(licenses) {
      const tbody = document.getElementById('licensesTableBody');
      if (!licenses.length) {
        tbody.innerHTML = '<tr><td colspan="7" class="px-6 py-8 text-center text-slate-500">No licenses found.</td></tr>';
        return;
      }

      tbody.innerHTML = licenses.map(l => {
        const createdDate = new Date(l.created_at * 1000).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        const isBanned = l.is_banned === 1;
        
        let planBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">LIFETIME</span>';
        if (l.plan_type === 'annual') planBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ANNUAL</span>';
        if (l.plan_type === 'monthly') planBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">MONTHLY</span>';
        if (l.plan_type === 'trial') planBadge = '<span class="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/10 text-slate-400 border border-slate-500/20">TRIAL</span>';

        const statusBadge = isBanned 
          ? '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">BANNED</span>'
          : '<span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">ACTIVE</span>';

        return \`
          <tr class="hover:bg-slate-800/40 transition-colors">
            <td class="card-header-cell px-3 py-2">
              <div class="flex items-center justify-between">
                <div class="flex items-center gap-1.5">
                  <span class="mono font-bold text-white text-xs tracking-wider select-all">\${l.license_key}</span>
                  <button onclick="copyToClipboard('\${l.license_key}')" class="text-slate-400 hover:text-cyan-400 text-xs p-1" title="Copy">📋</button>
                </div>
                <div class="sm:hidden">\${statusBadge}</div>
              </div>
            </td>
            <td class="px-3 py-1 sm:py-2 text-xs flex items-center justify-between">
              <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Customer:</span>
              <div class="text-right sm:text-left">
                <div class="font-semibold text-white">\${l.customer_name || '—'}</div>
                <div class="text-[10px] text-slate-400">\${l.customer_email || l.notes || ''}</div>
              </div>
            </td>
            <td class="px-3 py-1 sm:py-2 flex items-center justify-between">
              <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Plan:</span>
              <span>\${planBadge}</span>
            </td>
            <td class="px-3 py-1 sm:py-2 text-xs font-semibold text-slate-200 flex items-center justify-between">
              <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Devices:</span>
              <span>\${l.active_devices_count || 0} / \${l.max_devices}</span>
            </td>
            <td class="px-3 py-1 sm:py-2 hidden sm:table-cell">\${statusBadge}</td>
            <td class="px-3 py-1 sm:py-2 text-xs text-slate-400 flex items-center justify-between">
              <span class="text-[10px] text-slate-500 uppercase font-sans sm:hidden">Created:</span>
              <span>\${createdDate}</span>
            </td>
            <td class="card-actions-cell px-3 py-2 text-right">
              <div class="flex items-center justify-end gap-1">
                <button onclick="resetDevices('\${l.license_key}')" class="px-2 py-1 rounded text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-300">
                  Reset Devs
                </button>
                \${isBanned 
                  ? \`<button onclick="unbanKey('\${l.license_key}')" class="px-2 py-1 rounded text-xs font-semibold bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">Unban</button>\`
                  : \`<button onclick="banKey('\${l.license_key}')" class="px-2 py-1 rounded text-xs font-semibold bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/30">Ban</button>\`
                }
              </div>
            </td>
          </tr>
        \`;
      }).join('');
    }

    function handleSearch() {
      const q = document.getElementById('searchInput').value.toLowerCase().trim();
      if (!q) {
        renderLicenses(cachedLicenses);
        return;
      }
      const filtered = cachedLicenses.filter(l => 
        l.license_key.toLowerCase().includes(q) ||
        (l.customer_name && l.customer_name.toLowerCase().includes(q)) ||
        (l.customer_email && l.customer_email.toLowerCase().includes(q)) ||
        (l.telegram_user_id && l.telegram_user_id.toLowerCase().includes(q)) ||
        (l.notes && l.notes.toLowerCase().includes(q))
      );
      renderLicenses(filtered);
    }

    function openCreateModal() {
      document.getElementById('createModal').classList.remove('hidden');
    }

    function closeCreateModal() {
      document.getElementById('createModal').classList.add('hidden');
      document.getElementById('createLicenseForm').reset();
    }

    async function handleCreateLicense(e) {
      e.preventDefault();
      const planType = document.getElementById('planTypeSelect').value;
      const maxDevices = parseInt(document.getElementById('maxDevicesSelect').value, 10);
      const customerName = document.getElementById('customerNameInput').value.trim();
      const customerEmail = document.getElementById('customerEmailInput').value.trim();
      const telegramUserId = document.getElementById('telegramUserIdInput').value.trim();
      const phoneNumber = document.getElementById('phoneNumberInput').value.trim();
      const notes = document.getElementById('notesInput').value.trim();

      try {
        const res = await fetch('/api/admin/licenses/create', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            plan_type: planType,
            max_devices: maxDevices,
            customer_name: customerName,
            customer_email: customerEmail,
            telegram_user_id: telegramUserId,
            phone_number: phoneNumber,
            notes: notes
          })
        });
        const data = await res.json();
        if (res.ok && data.license_key) {
          closeCreateModal();
          document.getElementById('generatedKeyDisplay').textContent = data.license_key;
          document.getElementById('successModal').classList.remove('hidden');
          loadLicenses();
          loadStats();
        } else {
          showToast(data.error || 'Failed to create license');
        }
      } catch (err) {
        showToast('Network error');
      }
    }

    function copyGeneratedKey() {
      const key = document.getElementById('generatedKeyDisplay').textContent;
      copyToClipboard(key);
    }

    function closeSuccessModal() {
      document.getElementById('successModal').classList.add('hidden');
    }

    function copyToClipboard(text) {
      navigator.clipboard.writeText(text).then(() => {
        showToast('Copied to clipboard!');
      });
    }

    async function resetDevices(key) {
      if (!confirm('Are you sure you want to reset all bound devices for this key?')) return;
      try {
        const res = await fetch('/api/admin/licenses/reset-devices', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ license_key: key })
        });
        if (res.ok) {
          showToast('Devices reset successfully');
          loadLicenses();
          loadStats();
        } else {
          showToast('Failed to reset devices');
        }
      } catch (err) {
        showToast('Network error');
      }
    }

    async function banKey(key) {
      if (!confirm('Are you sure you want to BAN this license key? All active devices will lose pro access.')) return;
      try {
        const res = await fetch('/api/admin/licenses/ban', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ license_key: key })
        });
        if (res.ok) {
          showToast('License key banned');
          loadLicenses();
          loadStats();
        } else {
          showToast('Failed to ban key');
        }
      } catch (err) {
        showToast('Network error');
      }
    }

    async function unbanKey(key) {
      try {
        const res = await fetch('/api/admin/licenses/unban', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer ' + adminToken,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ license_key: key })
        });
        if (res.ok) {
          showToast('License key unbanned');
          loadLicenses();
          loadStats();
        } else {
          showToast('Failed to unban key');
        }
      } catch (err) {
        showToast('Network error');
      }
    }
  </script>
</body>
</html>`;
}
