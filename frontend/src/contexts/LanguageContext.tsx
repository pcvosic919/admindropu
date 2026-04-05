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
