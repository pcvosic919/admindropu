import { createContext, useContext, useState, ReactNode } from 'react'

export type Locale = 'zh-TW' | 'en'

const translations = {
  'zh-TW': {
    // Nav
    nav: {
      dashboard: '儀表板',
      reports: '報表',
      alerts: '告警',
      identity: '身分識別',
      security: '安全態勢',
      accountAudit: '帳號清查',
      settings: '設定',
    },
    // TopBar
    topBar: {
      notifications: '通知',
    },
    // Settings page
    settings: {
      title: '設定',
      subtitle: '平台偏好設定與系統組態',
      sections: {
        appearance: '外觀設定',
        language: '語系設定',
        notifications: '通知設定',
        security: '安全性',
        about: '關於',
      },
      language: {
        label: '介面語言',
        desc: '選擇平台顯示語言',
        zhTW: '繁體中文',
        en: 'English',
      },
      theme: {
        label: '主題',
        desc: '選擇介面主題模式',
        light: '淺色',
        dark: '深色（即將推出）',
      },
      notifications: {
        email: '電子郵件告警通知',
        emailDesc: '收到 Critical/High 告警時寄送 Email',
        teams: 'Microsoft Teams 通知',
        teamsDesc: '透過 Teams Webhook 傳送告警',
        digest: '每週安全摘要報告',
        digestDesc: '每週一早上 09:00 自動寄送',
      },
      security: {
        mfa: '啟用管理員 MFA',
        mfaDesc: '所有管理員帳號必須啟用 MFA',
        session: 'Session 逾時',
        sessionDesc: '閒置 30 分鐘後自動登出',
        audit: '稽核日誌保留',
        auditDesc: '管理員操作保留 10 年',
      },
      about: {
        product: '產品名稱',
        version: '版本',
        build: '建置日期',
        vendor: '開發商',
        license: '授權方案',
      },
      m365: {
        sectionTitle: 'Microsoft 365 API 設定',
        tenantId: 'Tenant ID',
        clientId: 'Client ID（應用程式識別碼）',
        clientSecret: 'Client Secret',
        redirectUri: '重新導向 URI',
        testConnection: '測試連線',
        saveApi: '儲存 API 設定',
        connectionSuccess: '連線成功',
        connectionFailed: '連線失敗',
        hint: '在 Azure AD 應用程式註冊取得以上資訊',
      },
      save: '儲存設定',
      saved: '設定已儲存',
      cancel: '取消',
    },
    // Dashboard
    dashboard: {
      title: '安全概覽',
      lastUpdated: '最後更新：',
      refresh: '重新整理',
      totalUsers: '使用者總數',
      activeAlerts: '活躍告警',
      secureScore: '安全評分',
      licenseUtil: '授權使用率',
      ofLicenses: '授權使用率',
      trend: '7 天活動趨勢',
      quickStats: '快速統計',
      signIns: '登入次數',
      guestActivity: '來賓活動',
      mfaEnabled: 'MFA 啟用率',
      guestUsers: '來賓使用者',
      disabledAccounts: '停用帳號',
      inactive90: '停用 90+ 天',
      activeUsers: '活躍使用者',
      recentAlerts: '最近告警',
      viewAll: '查看所有告警 →',
      moduleStatus: '模組狀態',
      activeModule: '運行中',
      monitorModule: '監控中',
      alertsCount: '個活躍告警',
      critical: '嚴重',
      guests: '來賓',
      disabled: '停用',
      thisWeek: '本週',
    },
    // Alerts
    alerts: {
      title: '告警管理',
      allSeverities: '全部嚴重度',
      allServices: '全部服務',
      severity: '嚴重度',
      service: '服務',
      time: '時間',
      status: '狀態',
      details: '告警詳情',
      affectedUser: '受影響使用者',
      location: '位置',
      selectAlert: '選擇告警以查看詳細資訊',
      acknowledge: '確認',
      investigate: '調查',
      closeAlert: '關閉告警',
      open: '開啟',
      investigating: '調查中',
      closed: '已關閉',
    },
    // Reports
    reports: {
      title: '報表',
      search: '搜尋報表...',
      total: '報表總數',
      scheduled: '已排程',
      generated: '本月已產生',
      generate: '產生',
      schedule: '排程',
      scheduleTitle: '設定報表排程',
      frequency: '頻率',
      time: '時間 (UTC+8)',
      recipients: '收件人（逗號分隔）',
      format: '格式',
      cancel: '取消',
      scheduled_badge: '已排程',
      success_title: '排程已設定！',
      success_desc_will: '將於',
      success_desc_run: '執行，格式為',
      done: '完成',
      daily: '每天',
      weekly: '每週',
      monthly: '每月',
      generating: '產生中...',
      download: '下載報表',
    },
    // Common
    common: {
      loading: '載入中...',
      error: '發生錯誤',
      retry: '重試',
      search: '搜尋',
      filter: '篩選',
      export: '匯出',
      refresh: '重新整理',
      close: '關閉',
      confirm: '確認',
      cancel: '取消',
      save: '儲存',
      delete: '刪除',
      edit: '編輯',
      view: '檢視',
      status: '狀態',
      actions: '操作',
      all: '全部',
    },
  },
  en: {
    nav: {
      dashboard: 'Dashboard',
      reports: 'Reports',
      alerts: 'Alerts',
      identity: 'Identity',
      security: 'Security',
      accountAudit: 'Account Audit',
      settings: 'Settings',
    },
    topBar: {
      notifications: 'Notifications',
    },
    settings: {
      title: 'Settings',
      subtitle: 'Platform preferences and system configuration',
      sections: {
        appearance: 'Appearance',
        language: 'Language',
        notifications: 'Notifications',
        security: 'Security',
        about: 'About',
      },
      language: {
        label: 'Interface Language',
        desc: 'Choose the display language for the platform',
        zhTW: '繁體中文',
        en: 'English',
      },
      theme: {
        label: 'Theme',
        desc: 'Choose the interface theme mode',
        light: 'Light',
        dark: 'Dark (Coming Soon)',
      },
      notifications: {
        email: 'Email Alert Notifications',
        emailDesc: 'Send email when Critical/High alerts trigger',
        teams: 'Microsoft Teams Notifications',
        teamsDesc: 'Send alerts via Teams Webhook',
        digest: 'Weekly Security Digest',
        digestDesc: 'Auto-send every Monday at 09:00',
      },
      security: {
        mfa: 'Enforce Admin MFA',
        mfaDesc: 'All admin accounts must have MFA enabled',
        session: 'Session Timeout',
        sessionDesc: 'Auto logout after 30 minutes idle',
        audit: 'Audit Log Retention',
        auditDesc: 'Admin operations retained for 10 years',
      },
      about: {
        product: 'Product',
        version: 'Version',
        build: 'Build Date',
        vendor: 'Vendor',
        license: 'License Plan',
      },
      m365: {
        sectionTitle: 'Microsoft 365 API Configuration',
        tenantId: 'Tenant ID',
        clientId: 'Client ID (Application ID)',
        clientSecret: 'Client Secret',
        redirectUri: 'Redirect URI',
        testConnection: 'Test Connection',
        saveApi: 'Save API Settings',
        connectionSuccess: 'Connection Successful',
        connectionFailed: 'Connection Failed',
        hint: 'Find these values in your Azure AD App Registration',
      },
      save: 'Save Settings',
      saved: 'Settings Saved',
      cancel: 'Cancel',
    },
    dashboard: {
      title: 'Security Overview',
      lastUpdated: 'Last updated: ',
      refresh: 'Refresh',
      totalUsers: 'Total Users',
      activeAlerts: 'Active Alerts',
      secureScore: 'Secure Score',
      licenseUtil: 'License Utilization',
      ofLicenses: 'Of total licenses',
      trend: '7-Day Activity Trend',
      quickStats: 'Quick Stats',
      signIns: 'Sign-ins',
      guestActivity: 'Guest Activity',
      mfaEnabled: 'MFA Enabled',
      guestUsers: 'Guest Users',
      disabledAccounts: 'Disabled Accounts',
      inactive90: 'Inactive 90+ Days',
      activeUsers: 'Active Users',
      recentAlerts: 'Recent Alerts',
      viewAll: 'View all alerts →',
      moduleStatus: 'Module Status',
      activeModule: 'Active',
      monitorModule: 'Monitor',
      alertsCount: ' active alerts',
      critical: 'critical',
      guests: 'guests',
      disabled: 'disabled',
      thisWeek: 'this week',
    },
    alerts: {
      title: 'Alert Management',
      allSeverities: 'All Severities',
      allServices: 'All Services',
      severity: 'Severity',
      service: 'Service',
      time: 'Time',
      status: 'Status',
      details: 'Alert Details',
      affectedUser: 'Affected User',
      location: 'Location',
      selectAlert: 'Select an alert to view details',
      acknowledge: 'Acknowledge',
      investigate: 'Investigate',
      closeAlert: 'Close Alert',
      open: 'Open',
      investigating: 'Investigating',
      closed: 'Closed',
    },
    reports: {
      title: 'Reports',
      search: 'Search reports...',
      total: 'Total Reports',
      scheduled: 'Scheduled',
      generated: 'Generated This Month',
      generate: 'Generate',
      schedule: 'Schedule',
      scheduleTitle: 'Schedule Report',
      frequency: 'Frequency',
      time: 'Time (UTC+8)',
      recipients: 'Recipients (comma separated)',
      format: 'Format',
      cancel: 'Cancel',
      scheduled_badge: 'Scheduled',
      success_title: 'Report Scheduled!',
      success_desc_will: 'will run',
      success_desc_run: 'and delivered as',
      done: 'Done',
      daily: 'Daily',
      weekly: 'Weekly',
      monthly: 'Monthly',
      generating: 'Generating...',
      download: 'Download Report',
    },
    common: {
      loading: 'Loading...',
      error: 'An error occurred',
      retry: 'Retry',
      search: 'Search',
      filter: 'Filter',
      export: 'Export',
      refresh: 'Refresh',
      close: 'Close',
      confirm: 'Confirm',
      cancel: 'Cancel',
      save: 'Save',
      delete: 'Delete',
      edit: 'Edit',
      view: 'View',
      status: 'Status',
      actions: 'Actions',
      all: 'All',
    },
  },
}

type Translations = typeof translations['en']

interface LanguageContextType {
  locale: Locale
  setLocale: (locale: Locale) => void
  t: Translations
}

const LanguageContext = createContext<LanguageContextType | null>(null)

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(() => {
    return (localStorage.getItem('m365-locale') as Locale) || 'zh-TW'
  })

  const setLocale = (l: Locale) => {
    setLocaleState(l)
    localStorage.setItem('m365-locale', l)
  }

  return (
    <LanguageContext.Provider value={{ locale, setLocale, t: translations[locale] }}>
      {children}
    </LanguageContext.Provider>
  )
}

export function useLanguage() {
  const ctx = useContext(LanguageContext)
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider')
  return ctx
}
